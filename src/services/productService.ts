// Product service for fetching marketplace products from all verified sellers
import { apolloClient, getCurrentUser } from './aws-config';
import { gql } from '@apollo/client';
import { 
  getAllProducts as getAllProductsQuery,
  getVerifiedSellersProducts as getVerifiedSellersProductsQuery,
  getSellerDetails as getSellerDetailsQuery,
  getUserProducts as getUserProductsQuery,
  getSellerVerification as getSellerVerificationQuery,
  createProduct as createProductMutation,
  updateProduct as updateProductMutation,
  deleteProduct as deleteProductMutation,
  GetAllProductsQuery,
  GetVerifiedSellersProductsQuery,
  GetSellerDetailsQuery,
  GetUserProductsQuery,
  GetSellerVerificationQuery,
  CreateProductMutation,
  UpdateProductMutation,
  DeleteProductMutation
} from '../graphql/queries';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  sellerId: string;
  sellerName?: string;
  sellerVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
  inventory?: number;
}

export interface SellerInfo {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  businessName?: string;
  businessType?: string;
  status?: string;
}

/**
 * Fetch all products from all verified sellers for global marketplace
 */
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    console.log('Fetching all products from verified sellers...');
    
    // First try to get verified sellers products (optimized query)
    try {
      const response = await apolloClient.query({
        query: gql`${getVerifiedSellersProductsQuery}`,
        variables: { limit: 100 },
        fetchPolicy: 'network-only'
      }) as { data: GetVerifiedSellersProductsQuery };

      if (response?.data?.getVerifiedSellersProducts?.items) {
        const products = response.data.getVerifiedSellersProducts.items;
        console.log(`Found ${products.length} products from verified sellers`);
        
        // Transform the data to match our Product interface
        return products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          images: product.images,
          category: product.category,
          sellerId: product.sellerId,
          sellerName: product.sellerName || product.businessName,
          sellerVerified: product.sellerVerified,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          isActive: product.isActive,
          inventory: product.inventory
        }));
      }
    } catch (optimizedError) {
      console.log('Optimized query not available, falling back to regular query');
    }

    // Fallback: Get all products and filter by verification status
    const response = await apolloClient.query({
      query: gql`${getAllProductsQuery}`,
      variables: { limit: 100 },
      fetchPolicy: 'network-only'
    }) as { data: GetAllProductsQuery };

    if (!response?.data?.getAllProducts?.items) {
      console.log('No products found in marketplace');
      return [];
    }

    const allProducts = response.data.getAllProducts.items;
    console.log(`Found ${allProducts.length} total products, checking seller verification...`);

    // Enhance products with seller verification info
    const enhancedProducts = await Promise.all(
      allProducts.map(async (product) => {
        try {
          const sellerInfo = await getSellerDetails(product.sellerId);
          return {
            ...product,
            sellerName: sellerInfo?.businessName || sellerInfo?.name || 'Unknown Seller',
            sellerVerified: sellerInfo?.verified || false
          };
        } catch (error) {
          console.log(`Could not get seller info for ${product.sellerId}:`, error);
          return {
            ...product,
            sellerName: 'Unknown Seller',
            sellerVerified: false
          };
        }
      })
    );

    // Filter to only show products from verified sellers
    const verifiedSellerProducts = enhancedProducts.filter(product => product.sellerVerified);
    
    console.log(`Filtered to ${verifiedSellerProducts.length} products from verified sellers`);
    return verifiedSellerProducts;

  } catch (error) {
    console.log('Product fetching not available (backend not deployed)');
    return [];
  }
};

/**
 * Get seller verification details
 */
export const getSellerDetails = async (sellerId: string): Promise<SellerInfo | null> => {
  try {
    console.log(`Fetching seller details for ${sellerId}...`);
    
    const response = await apolloClient.query({
      query: gql`${getSellerDetailsQuery}`,
      variables: { sellerId },
      fetchPolicy: 'network-only'
    }) as { data: GetSellerDetailsQuery };

    if (response?.data?.getSellerDetails) {
      return response.data.getSellerDetails;
    }

    return null;
  } catch (error) {
    console.log(`Seller details not available for ${sellerId} (backend not deployed)`);
    return null;
  }
};

/**
 * Get current user's products only (for Local Shop)
 */
export const getUserProducts = async (sellerId?: string): Promise<Product[]> => {
  try {
    console.log('Fetching current user products...');
    
    if (!sellerId) {
      // Get current user if sellerId not provided
      const currentUser = await getCurrentUser();
      if (!currentUser?.user?.uid) {
        throw new Error('User not authenticated');
      }
      sellerId = currentUser.user.uid;
    }

    const response = await apolloClient.query({
      query: gql`${getUserProductsQuery}`,
      variables: { sellerId },
      fetchPolicy: 'network-only'
    }) as { data: GetUserProductsQuery };

    if (response?.data?.getUserProducts) {
      return response.data.getUserProducts.map(product => ({
        ...product,
        sellerVerified: true, // User's own products are from verified seller (themselves)
        sellerName: 'You'
      }));
    }

    return [];
  } catch (error) {
    console.log('User products not available (backend not deployed)');
    return [];
  }
};

/**
 * Create a new product (for verified sellers only)
 */
export const createProduct = async (productData: {
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  inventory?: number;
}): Promise<Product | null> => {
  try {
    console.log('Creating new product...');
    
    // Get current user
    const currentUser = await getCurrentUser();
    if (!currentUser?.user?.uid) {
      throw new Error('User not authenticated');
    }

    const response = await apolloClient.mutate({
      mutation: gql`${createProductMutation}`,
      variables: {
        input: {
          ...productData,
          sellerId: currentUser.user.uid,
          inventory: productData.inventory || 0
        }
      }
    }) as { data: CreateProductMutation };

    if (response?.data?.createProduct) {
      console.log('Product created successfully:', response.data.createProduct.id);
      return {
        ...response.data.createProduct,
        sellerVerified: true,
        sellerName: 'You'
      };
    }

    return null;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

/**
 * Update an existing product
 */
export const updateProduct = async (productId: string, updates: {
  name?: string;
  description?: string;
  price?: number;
  images?: string[];
  category?: string;
  inventory?: number;
  isActive?: boolean;
}): Promise<Product | null> => {
  try {
    console.log(`Updating product ${productId}...`);

    const response = await apolloClient.mutate({
      mutation: gql`${updateProductMutation}`,
      variables: {
        input: {
          id: productId,
          ...updates
        }
      }
    }) as { data: UpdateProductMutation };

    if (response?.data?.updateProduct) {
      console.log('Product updated successfully');
      return response.data.updateProduct;
    }

    return null;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId: string): Promise<boolean> => {
  try {
    console.log(`Deleting product ${productId}...`);

    const response = await apolloClient.mutate({
      mutation: gql`${deleteProductMutation}`,
      variables: { id: productId }
    }) as { data: DeleteProductMutation };

    if (response?.data?.deleteProduct) {
      console.log('Product deleted successfully');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

/**
 * Search products across all verified sellers
 */
export const searchProducts = async (searchTerm: string, category?: string): Promise<Product[]> => {
  try {
    const allProducts = await getAllProducts();
    
    let filtered = allProducts;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (category && category !== 'all') {
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === category.toLowerCase()
      );
    }

    return filtered;
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}; 