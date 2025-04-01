import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  FlatList,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

// Define interface for the component props
interface ShopScreenProps {
  onChangeScreen: (screen: string) => void;
  onToggleWishlist: (product: ProductData) => void;
  wishlistItems: ProductData[];
}

// Define interfaces for our data structures
interface ProductData {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  isFavorite: boolean;
}

interface CategoryData {
  id: string;
  name: string;
}

const ShopScreen: React.FC<ShopScreenProps> = ({ 
  onChangeScreen, 
  onToggleWishlist,
  wishlistItems
}) => {
  // State for selected category
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Mock data for categories
  const categories: CategoryData[] = [
    { id: 'all', name: 'All' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'fashion', name: 'Fashion' },
    { id: 'health', name: 'Health & Beauty' },
    { id: 'home', name: 'Home' },
  ];
  
  // Mock data for products
  const products: ProductData[] = [
    { 
      id: '1', 
      name: 'Premium Headphones', 
      price: 299, 
      stock: 10, 
      image: 'headphones.jpg',
      isFavorite: wishlistItems.some(item => item.id === '1'),
    },
    { 
      id: '2', 
      name: 'Smart Watch', 
      price: 199, 
      stock: 15, 
      image: 'watch.jpg',
      isFavorite: wishlistItems.some(item => item.id === '2'),
    },
    { 
      id: '3', 
      name: 'Wireless Earbuds', 
      price: 129, 
      stock: 25, 
      image: 'earbuds.jpg',
      isFavorite: wishlistItems.some(item => item.id === '3'),
    },
    { 
      id: '4', 
      name: 'Fitness Tracker', 
      price: 89, 
      stock: 30, 
      image: 'tracker.jpg',
      isFavorite: wishlistItems.some(item => item.id === '4'),
    },
  ];
  
  // Function to toggle favorite status
  const toggleFavorite = (product: ProductData) => {
    // Call the parent handler to manage wishlist
    onToggleWishlist(product);
  };
  
  // Function to add product to cart
  const addToCart = (productId: string) => {
    // In a real app, this would add the product to the cart
    console.log(`Added product ${productId} to cart`);
  };
  
  // Render category tab
  const renderCategoryTab = (category: CategoryData) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryTab,
        selectedCategory === category.id && styles.selectedCategoryTab,
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === category.id && styles.selectedCategoryText,
        ]}
      >
        {category.name}
      </Text>
    </TouchableOpacity>
  );
  
  // Check if a product is in the wishlist
  const isProductInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.id === productId);
  };
  
  // Render product card
  const renderProductCard = (product: ProductData) => (
    <View key={product.id} style={styles.productCard}>
      <View style={styles.productImageContainer}>
        <View style={styles.productImage}>
          {/* Placeholder for product image */}
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>{product.name.charAt(0)}</Text>
          </View>
          
          {/* Favorite button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(product)}
          >
            <Svg width="20" height="20" viewBox="0 0 24 24">
              <Path
                fill={isProductInWishlist(product.id) ? "#FF4081" : "#FFF"}
                stroke={isProductInWishlist(product.id) ? "none" : "#999"}
                strokeWidth="1.5"
                d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"
              />
            </Svg>
          </TouchableOpacity>
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>${product.price}</Text>
          <Text style={styles.productStock}>{product.stock} items left</Text>
          
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={() => addToCart(product.id)}
          >
            <Text style={styles.addToCartText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={Platform.OS === 'android' ? '#F5F7FA' : undefined}
        translucent={Platform.OS === 'android'}
      />
      <View style={Platform.OS === 'android' ? styles.androidSafeTop : null} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton} onPress={() => onChangeScreen('home')}>
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path
                fill={wishlistItems.length > 0 ? "#FF4081" : "#333"}
                d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z"
              />
            </Svg>
            {wishlistItems.length > 0 && (
              <View style={styles.wishlistBadge}>
                <Text style={styles.wishlistBadgeText}>{wishlistItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24">
              <Path
                fill="#333"
                d="M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5.5C20.95,5.34 21,5.17 21,5A1,1 0 0,0 20,4H5.21L4.27,2M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map(renderCategoryTab)}
      </ScrollView>
      
      {/* Products */}
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.productsGrid}>
          {products.map(renderProductCard)}
        </View>
        
        {/* Space for bottom navigation */}
        <View style={[styles.bottomNavSpacer, Platform.OS === 'ios' ? styles.iosSpacer : null]} />
      </ScrollView>
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => onChangeScreen('home')}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path fill="#999" d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z" />
          </Svg>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path fill="#1E88E5" d="M17,18C15.89,18 15,18.89 15,20A2,2 0 0,0 17,22A2,2 0 0,0 19,20C19,18.89 18.1,18 17,18M1,2V4H3L6.6,11.59L5.24,14.04C5.09,14.32 5,14.65 5,15A2,2 0 0,0 7,17H19V15H7.42A0.25,0.25 0 0,1 7.17,14.75C7.17,14.7 7.18,14.66 7.2,14.63L8.1,13H15.55C16.3,13 16.96,12.58 17.3,11.97L20.88,5.5C20.95,5.34 21,5.17 21,5A1,1 0 0,0 20,4H5.21L4.27,2M7,18C5.89,18 5,18.89 5,20A2,2 0 0,0 7,22A2,2 0 0,0 9,20C9,18.89 8.1,18 7,18Z" />
          </Svg>
          <Text style={[styles.navText, styles.activeNavText]}>Shop</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path fill="#999" d="M16,13C15.71,13 15.38,13 15.03,13.05C16.19,13.89 17,15 17,16.5V19H23V16.5C23,14.17 18.33,13 16,13M8,13C5.67,13 1,14.17 1,16.5V19H15V16.5C15,14.17 10.33,13 8,13M8,11A3,3 0 0,0 11,8A3,3 0 0,0 8,5A3,3 0 0,0 5,8A3,3 0 0,0 8,11M16,11A3,3 0 0,0 19,8A3,3 0 0,0 16,5A3,3 0 0,0 13,8A3,3 0 0,0 16,11Z" />
          </Svg>
          <Text style={styles.navText}>Social</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path fill="#999" d="M6,16.5L3,19.44V11H6M11,14.66L9.43,13.32L8,14.64V7H11M16,13L13,16V3H16M18.81,12.81L17,11H22V16L18.81,12.81Z" />
          </Svg>
          <Text style={styles.navText}>Games</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => onChangeScreen('health')}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path fill="#999" d="M12,3A9,9 0 0,0 3,12H7.5L10,8H14L16.5,12H21A9,9 0 0,0 12,3M7.5,18A1.5,1.5 0 0,1 6,16.5A1.5,1.5 0 0,1 7.5,15A1.5,1.5 0 0,1 9,16.5A1.5,1.5 0 0,1 7.5,18M16.5,18A1.5,1.5 0 0,1 15,16.5A1.5,1.5 0 0,1 16.5,15A1.5,1.5 0 0,1 18,16.5A1.5,1.5 0 0,1 16.5,18Z" />
          </Svg>
          <Text style={styles.navText}>Health</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Svg width="24" height="24" viewBox="0 0 24 24">
            <Path fill="#999" d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z" />
          </Svg>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  androidSafeTop: {
    paddingTop: StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 20,
    position: 'relative',
  },
  wishlistBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4081',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryContent: {
    paddingHorizontal: 15,
  },
  categoryTab: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
  },
  selectedCategoryTab: {
    backgroundColor: '#1E88E5',
  },
  categoryText: {
    fontSize: 16,
    color: '#666',
  },
  selectedCategoryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingBottom: 80,
  },
  productsGrid: {
    paddingHorizontal: 15,
    paddingTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  productImageContainer: {
    width: '100%',
  },
  productImage: {
    height: 130,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#999',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  productInfo: {
    padding: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 5,
  },
  productStock: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  addToCartButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  addToCartText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bottomNavSpacer: {
    height: 80,
  },
  iosSpacer: {
    height: 100, // Extra padding for iOS devices with home indicator
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  activeNavText: {
    color: '#1E88E5',
  },
});

export default ShopScreen; 