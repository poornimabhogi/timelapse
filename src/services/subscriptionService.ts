import { graphqlClient } from './aws-config';
import { gql } from '@apollo/client';
import {
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onProductsByCategory,
  onSellerProducts,
  onInventoryUpdate,
  onFollowedSellerProducts,
  onFollowedSellerInventory,
  updateProductInventory as updateInventoryMutation,
  getFollowedSellers,
  isFollowing,
  OnCreateProductSubscription,
  OnUpdateProductSubscription,
  OnDeleteProductSubscription,
  OnInventoryUpdateSubscription,
  OnFollowedSellerProductsSubscription,
  OnFollowedSellerInventorySubscription,
  UpdateInventoryMutation,
  GetFollowedSellersQuery,
  IsFollowingQuery
} from '../graphql/queries';

export interface ProductSubscriptionCallbacks {
  onProductCreated?: (product: any) => void;
  onProductUpdated?: (product: any) => void;
  onProductDeleted?: (product: any) => void;
  onInventoryChanged?: (update: any) => void;
  onError?: (error: Error) => void;
}

export interface SubscriptionManager {
  subscriptions: Map<string, () => void>;
  addSubscription: (key: string, unsubscribe: () => void) => void;
  removeSubscription: (key: string) => void;
  removeAllSubscriptions: () => void;
  getActiveSubscriptions: () => string[];
}

// Global subscription manager
export const subscriptionManager: SubscriptionManager = {
  subscriptions: new Map<string, () => void>(),
  
  addSubscription(key: string, unsubscribe: () => void) {
    // Remove existing subscription with same key
    this.removeSubscription(key);
    this.subscriptions.set(key, unsubscribe);
    console.log(`Added subscription: ${key}, total active: ${this.subscriptions.size}`);
  },
  
  removeSubscription(key: string) {
    const unsubscribe = this.subscriptions.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(key);
      console.log(`Removed subscription: ${key}, remaining: ${this.subscriptions.size}`);
    }
  },
  
  removeAllSubscriptions() {
    console.log(`Removing all ${this.subscriptions.size} subscriptions`);
    this.subscriptions.forEach((unsubscribe, key) => {
      try {
        unsubscribe();
        console.log(`Unsubscribed from: ${key}`);
      } catch (error) {
        console.error(`Error unsubscribing from ${key}:`, error);
      }
    });
    this.subscriptions.clear();
  },
  
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }
};

/**
 * Get list of sellers that the user follows
 */
export const getFollowedSellersList = async (userId: string): Promise<string[]> => {
  try {
    const response = await graphqlClient.query({
      query: gql`${getFollowedSellers}`,
      variables: { userId },
      fetchPolicy: 'no-cache'
    }) as { data: GetFollowedSellersQuery };

    if (response?.data?.getFollowedSellers) {
      return response.data.getFollowedSellers.map(seller => seller.id);
    }
    return [];
  } catch (error) {
    console.error('Error fetching followed sellers:', error);
    return [];
  }
};

/**
 * Check if user follows a specific seller
 */
export const checkIsFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  try {
    const response = await graphqlClient.query({
      query: gql`${isFollowing}`,
      variables: { followerId, followingId },
      fetchPolicy: 'no-cache'
    }) as { data: IsFollowingQuery };

    return response?.data?.isFollowing || false;
  } catch (error) {
    console.error('Error checking following status:', error);
    return false;
  }
};

/**
 * Subscribe to product updates from followed sellers only (personalized marketplace)
 */
export const subscribeToFollowedSellersUpdates = (userId: string, callbacks: ProductSubscriptionCallbacks): string => {
  const subscriptionKey = `followed-sellers-${userId}`;
  
  try {
    console.log(`Setting up personalized subscriptions for user: ${userId}`);
    
    // Subscribe to followed seller products
    const productSub = graphqlClient.subscribe({
      query: gql`${onFollowedSellerProducts}`,
      variables: { followerId: userId },
      fetchPolicy: 'no-cache'
    }).subscribe({
      next: ({ data }: { data: OnFollowedSellerProductsSubscription }) => {
        if (data?.onFollowedSellerProducts) {
          const product = data.onFollowedSellerProducts;
          console.log(`📱 PERSONALIZED: Product update from followed seller:`, product.name);
          
          // Determine update type based on product data
          if (product.isActive === false) {
            callbacks.onProductDeleted?.(product);
          } else {
            callbacks.onProductUpdated?.(product);
          }
        }
      },
      error: (error) => {
        console.error('Followed sellers product subscription error:', error);
        callbacks.onError?.(error);
      }
    });

    // Subscribe to followed seller inventory updates
    const inventorySub = graphqlClient.subscribe({
      query: gql`${onFollowedSellerInventory}`,
      variables: { followerId: userId },
      fetchPolicy: 'no-cache'
    }).subscribe({
      next: ({ data }: { data: OnFollowedSellerInventorySubscription }) => {
        if (data?.onFollowedSellerInventory) {
          console.log(`📦 PERSONALIZED: Inventory update from followed seller:`, data.onFollowedSellerInventory);
          callbacks.onInventoryChanged?.(data.onFollowedSellerInventory);
        }
      },
      error: (error) => {
        console.error('Followed sellers inventory subscription error:', error);
        callbacks.onError?.(error);
      }
    });

    // Combined unsubscribe function
    const unsubscribe = () => {
      productSub.unsubscribe();
      inventorySub.unsubscribe();
    };

    subscriptionManager.addSubscription(subscriptionKey, unsubscribe);
    return subscriptionKey;

  } catch (error) {
    console.error('Error setting up followed sellers subscriptions:', error);
    callbacks.onError?.(error as Error);
    return '';
  }
};

/**
 * Subscribe to all product updates for the global marketplace
 */
export const subscribeToMarketplaceUpdates = (callbacks: ProductSubscriptionCallbacks): string => {
  const subscriptionKey = 'marketplace-updates';
  
  try {
    console.log('Setting up marketplace subscriptions...');
    
    // Subscribe to new products
    const createSub = graphqlClient.subscribe({
      query: gql`${onCreateProduct}`,
      fetchPolicy: 'no-cache'
    }).subscribe({
      next: ({ data }: { data: OnCreateProductSubscription }) => {
        if (data?.onCreateProduct) {
          console.log('New product created:', data.onCreateProduct.name);
          callbacks.onProductCreated?.(data.onCreateProduct);
        }
      },
      error: (error) => {
        console.error('Create product subscription error:', error);
        callbacks.onError?.(error);
      }
    });

    // Subscribe to product updates
    const updateSub = graphqlClient.subscribe({
      query: gql`${onUpdateProduct}`,
      fetchPolicy: 'no-cache'
    }).subscribe({
      next: ({ data }: { data: OnUpdateProductSubscription }) => {
        if (data?.onUpdateProduct) {
          console.log('Product updated:', data.onUpdateProduct.name);
          callbacks.onProductUpdated?.(data.onUpdateProduct);
        }
      },
      error: (error) => {
        console.error('Update product subscription error:', error);
        callbacks.onError?.(error);
      }
    });

    // Subscribe to product deletions
    const deleteSub = graphqlClient.subscribe({
      query: gql`${onDeleteProduct}`,
      fetchPolicy: 'no-cache'
    }).subscribe({
      next: ({ data }: { data: OnDeleteProductSubscription }) => {
        if (data?.onDeleteProduct) {
          console.log('Product deleted:', data.onDeleteProduct.id);
          callbacks.onProductDeleted?.(data.onDeleteProduct);
        }
      },
      error: (error) => {
        console.error('Delete product subscription error:', error);
        callbacks.onError?.(error);
      }
    });

    // Subscribe to inventory updates
    const inventorySub = graphqlClient.subscribe({
      query: gql`${onInventoryUpdate}`,
      fetchPolicy: 'no-cache'
    }).subscribe({
      next: ({ data }: { data: OnInventoryUpdateSubscription }) => {
        if (data?.onInventoryUpdate) {
          console.log(`Inventory updated for product ${data.onInventoryUpdate.productId}: ${data.onInventoryUpdate.oldInventory} → ${data.onInventoryUpdate.newInventory}`);
          callbacks.onInventoryChanged?.(data.onInventoryUpdate);
        }
      },
      error: (error) => {
        console.error('Inventory subscription error:', error);
        callbacks.onError?.(error);
      }
    });

    // Combined unsubscribe function
    const unsubscribe = () => {
      createSub.unsubscribe();
      updateSub.unsubscribe();
      deleteSub.unsubscribe();
      inventorySub.unsubscribe();
    };

    subscriptionManager.addSubscription(subscriptionKey, unsubscribe);
    return subscriptionKey;

  } catch (error) {
    console.error('Error setting up marketplace subscriptions:', error);
    callbacks.onError?.(error as Error);
    return '';
  }
};

/**
 * Subscribe to updates for a specific seller's products (Local Shop)
 */
export const subscribeToSellerUpdates = (sellerId: string, callbacks: ProductSubscriptionCallbacks): string => {
  const subscriptionKey = `seller-${sellerId}`;
  
  try {
    console.log(`Setting up seller subscriptions for: ${sellerId}`);
    
    const subscription = graphqlClient.subscribe({
      query: gql`${onSellerProducts}`,
      variables: { sellerId },
      fetchPolicy: 'no-cache'
    }).subscribe({
      next: ({ data }: { data: { onSellerProducts: any } }) => {
        if (data?.onSellerProducts) {
          const product = data.onSellerProducts;
          console.log(`Seller product update: ${product.name}`);
          
          // Determine the type of update based on the product data
          if (product.isActive === false) {
            callbacks.onProductDeleted?.(product);
          } else {
            callbacks.onProductUpdated?.(product);
          }
        }
      },
      error: (error) => {
        console.error('Seller subscription error:', error);
        callbacks.onError?.(error);
      }
    });

    const unsubscribe = () => subscription.unsubscribe();
    subscriptionManager.addSubscription(subscriptionKey, unsubscribe);
    return subscriptionKey;

  } catch (error) {
    console.error('Error setting up seller subscriptions:', error);
    callbacks.onError?.(error as Error);
    return '';
  }
};

/**
 * Subscribe to category-specific product updates
 */
export const subscribeToCategoryUpdates = (category: string, callbacks: ProductSubscriptionCallbacks): string => {
  const subscriptionKey = `category-${category}`;
  
  try {
    console.log(`Setting up category subscriptions for: ${category}`);
    
    const subscription = graphqlClient.subscribe({
      query: gql`${onProductsByCategory}`,
      variables: { category },
      fetchPolicy: 'no-cache'
    }).subscribe({
      next: ({ data }: { data: { onProductsByCategory: any } }) => {
        if (data?.onProductsByCategory) {
          console.log(`Category update for ${category}:`, data.onProductsByCategory.name);
          callbacks.onProductUpdated?.(data.onProductsByCategory);
        }
      },
      error: (error) => {
        console.error('Category subscription error:', error);
        callbacks.onError?.(error);
      }
    });

    const unsubscribe = () => subscription.unsubscribe();
    subscriptionManager.addSubscription(subscriptionKey, unsubscribe);
    return subscriptionKey;

  } catch (error) {
    console.error('Error setting up category subscriptions:', error);
    callbacks.onError?.(error as Error);
    return '';
  }
};

/**
 * Update product inventory with real-time notification
 */
export const updateInventory = async (
  productId: string, 
  newInventory: number, 
  reason?: string
): Promise<boolean> => {
  try {
    console.log(`Updating inventory for product ${productId} to ${newInventory}`);
    
    // Calculate the change (we'll need to fetch current inventory or pass it)
    const change = 0; // This should be calculated based on current inventory
    
    const response = await graphqlClient.mutate({
      mutation: gql`${updateInventoryMutation}`,
      variables: {
        input: {
          productId,
          newInventory,
          change,
          reason: reason || 'Manual update'
        }
      }
    }) as { data: UpdateInventoryMutation };

    if (response?.data?.updateProductInventory) {
      console.log('Inventory updated successfully');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  }
};

/**
 * Utility function to unsubscribe from specific subscription
 */
export const unsubscribeFrom = (subscriptionKey: string): void => {
  subscriptionManager.removeSubscription(subscriptionKey);
};

/**
 * Utility function to unsubscribe from all subscriptions
 */
export const unsubscribeFromAll = (): void => {
  subscriptionManager.removeAllSubscriptions();
};

/**
 * Get list of active subscriptions for debugging
 */
export const getActiveSubscriptions = (): string[] => {
  return subscriptionManager.getActiveSubscriptions();
};

/**
 * Real-time inventory monitoring for specific products
 */
export const monitorProductInventory = (
  productIds: string[], 
  onInventoryChange: (update: any) => void
): string => {
  const subscriptionKey = `inventory-monitor-${productIds.join('-')}`;
  
  try {
    console.log(`Monitoring inventory for products: ${productIds.join(', ')}`);
    
    const subscriptions = productIds.map(productId => 
      graphqlClient.subscribe({
        query: gql`${onInventoryUpdate}`,
        variables: { productId },
        fetchPolicy: 'no-cache'
      }).subscribe({
        next: ({ data }: { data: OnInventoryUpdateSubscription }) => {
          if (data?.onInventoryUpdate) {
            onInventoryChange(data.onInventoryUpdate);
          }
        },
        error: (error) => {
          console.error(`Inventory monitoring error for ${productId}:`, error);
        }
      })
    );

    const unsubscribe = () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };

    subscriptionManager.addSubscription(subscriptionKey, unsubscribe);
    return subscriptionKey;

  } catch (error) {
    console.error('Error setting up inventory monitoring:', error);
    return '';
  }
}; 