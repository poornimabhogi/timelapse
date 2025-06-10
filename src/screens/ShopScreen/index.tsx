import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { styles } from './styles';
import { ShopScreenProps, ProductData } from '../../types/interfaces';
import BottomTabBar from '../../components/common/BottomTabBar';
import { getAllProducts, Product } from '../../services/productService';
import { 
  subscribeToMarketplaceUpdates,
  subscribeToCategoryUpdates,
  unsubscribeFromAll,
  ProductSubscriptionCallbacks 
} from '../../services/subscriptionService';
import { useAuth } from '../../contexts/AuthContext';

const ShopScreen: React.FC<ShopScreenProps> = ({
  onChangeScreen,
  onToggleWishlist,
  wishlistItems,
  onAddToCart,
  onRemoveFromCart,
  cartItems,
  cartCount,
}) => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const screenWidth = Dimensions.get('window').width;
  
  useEffect(() => {
    console.log('ShopScreen mounted');
    fetchAllProducts();
    setupRealtimeUpdates();
    
    return () => {
      console.log('ShopScreen unmounted - cleaning up subscriptions');
      unsubscribeFromAll();
    };
  }, []);

  // Set up category-specific subscriptions when category changes
  useEffect(() => {
    if (selectedCategory !== 'all') {
      setupCategorySubscription(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      console.log('Global Shop: Fetching products from all verified sellers...');
      
      const allProducts = await getAllProducts();
      console.log(`Found ${allProducts.length} products from verified sellers`);
      
      // Convert Product interface to ProductData interface for compatibility
      const convertedProducts = allProducts.map(product => ({
        id: product.id,
        title: product.name,
        price: product.price,
        image: product.images[0] || 'https://via.placeholder.com/150',
        category: product.category,
        isNew: new Date(product.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // New if created within 7 days
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        sellerVerified: product.sellerVerified,
        inventory: product.inventory
      }));
      
      setProducts(convertedProducts);
      
    } catch (error) {
      console.error('Error fetching marketplace products:', error);
      Alert.alert(
        'Marketplace Connection',
        'Unable to load marketplace products at this time. Please try again later.',
        [{ text: 'OK' }]
      );
      // Set empty array on error
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeUpdates = () => {
    console.log('Setting up real-time marketplace updates...');
    
    const callbacks: ProductSubscriptionCallbacks = {
      onProductCreated: (product) => {
        console.log('🆕 NEW: Product added to marketplace:', product.name);
        
        // Convert to ProductData format and add to products
        const newProduct = {
          id: product.id,
          title: product.name,
          price: product.price,
          image: product.images[0] || 'https://via.placeholder.com/150',
          category: product.category,
          isNew: true, // Mark as new for highlighting
          sellerId: product.sellerId,
          sellerName: product.sellerName,
          sellerVerified: true, // Only verified sellers can create products
          inventory: product.inventory
        };
        
        setProducts(prevProducts => [newProduct, ...prevProducts]);
        
        // Show marketplace notification
        Alert.alert(
          '🆕 New Product!', 
          `${product.name} just added to marketplace`,
          [{ text: 'Check it out!' }]
        );
      },
      
      onProductUpdated: (product) => {
        console.log('🟡 UPDATED: Product updated in marketplace:', product.name);
        
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === product.id 
              ? {
                  ...p,
                  title: product.name,
                  price: product.price,
                  image: product.images[0] || p.image,
                  category: product.category,
                  inventory: product.inventory
                }
              : p
          )
        );
      },
      
      onProductDeleted: (product) => {
        console.log('🗑️ REMOVED: Product removed from marketplace:', product.id);
        
        setProducts(prevProducts => 
          prevProducts.filter(p => p.id !== product.id)
        );
      },
      
      onInventoryChanged: (update) => {
        console.log(`📦 INVENTORY: Stock updated for ${update.productId}: ${update.oldInventory} → ${update.newInventory}`);
        
        // Update product inventory in real-time
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === update.productId 
              ? { ...p, inventory: update.newInventory }
              : p
          )
        );
      },
      
      onError: (error) => {
        console.error('Subscription error:', error);
        // Don't show error to user unless it's critical
      }
    };
    
    // Subscribe to global marketplace updates
    subscribeToMarketplaceUpdates(callbacks);
  };

  const setupCategorySubscription = (category: string) => {
    console.log(`Setting up real-time updates for category: ${category}`);
    
    const callbacks: ProductSubscriptionCallbacks = {
      onProductUpdated: (product) => {
        console.log(`🏷️ LIVE: ${category} product updated:`, product.name);
        
        // Only update if the product matches current filter
        if (product.category === category) {
          setProducts(prevProducts => 
            prevProducts.map(p => 
              p.id === product.id 
                ? {
                    ...p,
                    title: product.name,
                    price: product.price,
                    image: product.images[0] || p.image
                  }
                : p
            )
          );
        }
      },
      
      onError: (error) => {
        console.error(`Category ${category} subscription error:`, error);
      }
    };
    
    subscribeToCategoryUpdates(category, callbacks);
  };

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'equipment', name: 'Equipment' },
    { id: 'nutrition', name: 'Nutrition' },
    { id: 'supplements', name: 'Supplements' },
  ];

  // Products are now fetched from all verified sellers via getAllProducts()

  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.some(item => item.id === productId);
  };

  const getProductQuantity = (productId: string): number => {
    const cartItem = cartItems.find(item => item.id === productId);
    return cartItem && cartItem.quantity ? cartItem.quantity : 0;
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(product => product.category === selectedCategory);

  const renderCategoryTab = (category: { id: string; name: string }) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryTab,
        selectedCategory === category.id && styles.selectedCategoryTab
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Text
        style={[
          styles.categoryTabText,
          selectedCategory === category.id && styles.selectedCategoryTabText
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  const renderProductCard = ({ item }: { item: any }) => {
    const quantity = getProductQuantity(item.id);
    const isOutOfStock = item.inventory === 0;
    const isLowStock = item.inventory > 0 && item.inventory < 5;
    
    return (
      <View style={[
        styles.productCard, 
        item.sellerVerified && styles.verifiedSellerProduct,
        item.isNew && styles.newProductHighlight
      ]}>
        {/* Live Update Badges */}
        {item.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>🔴 LIVE NEW!</Text>
          </View>
        )}
        
        {/* Verified Seller Badge */}
        {item.sellerVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
          </View>
        )}
        
        {/* Real-time Inventory Status */}
        {item.inventory !== undefined && (
          <View style={[
            styles.inventoryBadge,
            isOutOfStock ? styles.outOfStockBadge : 
            isLowStock ? styles.lowStockBadge : styles.inStockBadge
          ]}>
            <Text style={styles.inventoryText}>
              {isOutOfStock ? '❌ OUT OF STOCK' : 
               isLowStock ? `⚠️ ${item.inventory} LEFT` : '✅ IN STOCK'}
            </Text>
          </View>
        )}
        
        <Image source={{ uri: item.image }} style={[
          styles.productImage,
          isOutOfStock && styles.outOfStockImage
        ]} />
        
        <View style={styles.productDetails}>
          <Text style={[
            styles.productTitle,
            isOutOfStock && styles.outOfStockText
          ]}>
            {item.title}
          </Text>
          <Text style={[
            styles.productPrice,
            isOutOfStock && styles.outOfStockText
          ]}>
            ${item.price}
          </Text>
          
                  {/* Show seller name for verified sellers */}
        {item.sellerVerified && item.sellerName && (
          <Text style={styles.sellerName}>By: {item.sellerName}</Text>
        )}
          
          <View style={styles.productActions}>
            {quantity > 0 ? (
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={[styles.quantityButton, isOutOfStock && styles.disabledButton]}
                  onPress={() => !isOutOfStock && onRemoveFromCart(item)}
                  disabled={isOutOfStock}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={[styles.quantityButton, isOutOfStock && styles.disabledButton]}
                  onPress={() => !isOutOfStock && onAddToCart(item)}
                  disabled={isOutOfStock}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.addToCartButton, 
                  isOutOfStock && styles.disabledButton
                ]}
                onPress={() => !isOutOfStock && onAddToCart(item)}
                disabled={isOutOfStock}
              >
                <Text style={styles.addToCartButtonText}>
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.wishlistButton}
              onPress={() => onToggleWishlist(item)}
            >
              <Text style={[
                styles.productWishlistIcon,
                isInWishlist(item.id) && styles.activeWishlistIcon
              ]}>♥</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyMarketplace = () => (
    <View style={styles.emptyMarketplace}>
      <Text style={styles.emptyMarketplaceIcon}>🏪</Text>
      <Text style={styles.emptyMarketplaceTitle}>Global Marketplace</Text>
      <Text style={styles.emptyMarketplaceText}>
        Welcome to the global marketplace! This marketplace shows products from all sellers.
      </Text>
      <View style={styles.marketplaceInfo}>
        <Text style={styles.marketplaceInfoTitle}>How it works:</Text>
        <Text style={styles.marketplaceInfoItem}>👥 Browse products from all sellers</Text>
        <Text style={styles.marketplaceInfoItem}>📱 Get live updates when products are added</Text>
        <Text style={styles.marketplaceInfoItem}>📦 See real-time inventory changes</Text>
        <Text style={styles.marketplaceInfoItem}>🎯 Explore a wide range of products</Text>
      </View>
              <Text style={styles.emptyMarketplaceFooter}>
        Check back later for new products from our sellers!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[
      styles.container,
      Platform.OS === 'android' && styles.androidSafeTop
    ]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => onChangeScreen('home')}
          >
            <Text style={styles.wishlistIcon}>♥</Text>
            {wishlistItems.length > 0 && (
              <View style={styles.wishlistBadge}>
                <Text style={styles.wishlistBadgeText}>{wishlistItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => onChangeScreen('cart')}
            activeOpacity={0.7}
          >
            <Text style={styles.cartIcon}>🛒</Text>
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollView}
        >
          {categories.map(renderCategoryTab)}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: '#666' }}>Loading marketplace...</Text>
        </View>
      ) : filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsContainer}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={Platform.OS === 'ios' ? styles.iosSpacer : styles.bottomNavSpacer} />}
        />
      ) : (
        renderEmptyMarketplace()
      )}
      
      <BottomTabBar currentScreen="shop" onChangeScreen={onChangeScreen} />
    </SafeAreaView>
  );
};

export default ShopScreen; 