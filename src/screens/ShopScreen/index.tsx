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
} from 'react-native';
import { styles } from './styles';
import { ShopScreenProps, ProductData } from '../../types/interfaces';
import BottomTabBar from '../../components/common/BottomTabBar';

const ShopScreen: React.FC<ShopScreenProps> = ({
  onChangeScreen,
  onToggleWishlist,
  wishlistItems,
  onAddToCart,
  onRemoveFromCart,
  cartItems,
  cartCount,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const screenWidth = Dimensions.get('window').width;
  
  useEffect(() => {
    console.log('ShopScreen mounted');
    return () => {
      console.log('ShopScreen unmounted');
    };
  }, []);

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'clothing', name: 'Clothing' },
    { id: 'equipment', name: 'Equipment' },
    { id: 'nutrition', name: 'Nutrition' },
    { id: 'supplements', name: 'Supplements' },
  ];

  const products: ProductData[] = [
    {
      id: '1',
      title: 'Athletic T-Shirt',
      price: 29.99,
      image: 'https://via.placeholder.com/150',
      category: 'clothing',
      isNew: true,
    },
    {
      id: '2',
      title: 'Running Shoes',
      price: 89.99,
      image: 'https://via.placeholder.com/150',
      category: 'clothing',
      isNew: false,
    },
    {
      id: '3',
      title: 'Yoga Mat',
      price: 39.99,
      image: 'https://via.placeholder.com/150',
      category: 'equipment',
      isNew: false,
    },
    {
      id: '4',
      title: 'Protein Powder',
      price: 49.99,
      image: 'https://via.placeholder.com/150',
      category: 'nutrition',
      isNew: true,
    },
    {
      id: '5',
      title: 'Dumbbells Set',
      price: 119.99,
      image: 'https://via.placeholder.com/150',
      category: 'equipment',
      isNew: false,
    },
    {
      id: '6',
      title: 'Smart Watch',
      price: 199.99,
      image: 'https://via.placeholder.com/150',
      category: 'equipment',
      isNew: true,
    },
  ];

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

  const renderProductCard = ({ item }: { item: ProductData }) => {
    const quantity = getProductQuantity(item.id);
    
    return (
      <View style={styles.productCard}>
        {item.isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
        <Image source={{ uri: item.image }} style={styles.productImage} />
        <View style={styles.productDetails}>
          <Text style={styles.productTitle}>{item.title}</Text>
          <Text style={styles.productPrice}>${item.price}</Text>
          <View style={styles.productActions}>
            {quantity > 0 ? (
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => onRemoveFromCart(item)}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => onAddToCart(item)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={() => onAddToCart(item)}
              >
                <Text style={styles.addToCartButtonText}>Add to Cart</Text>
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
          <TouchableOpacity style={styles.cartButton}>
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

      <FlatList
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsContainer}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={Platform.OS === 'ios' ? styles.iosSpacer : styles.bottomNavSpacer} />}
      />
      
      <BottomTabBar currentScreen="shop" onChangeScreen={onChangeScreen} />
    </SafeAreaView>
  );
};

export default ShopScreen; 