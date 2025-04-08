import React, { useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../contexts/AuthContext';
import HomeScreen from '../screens/HomeScreen/index';
import ShopScreen from '../screens/ShopScreen/index';
import HealthScreen from '../screens/HealthScreen/index';
import LuckyDrawScreen from '../screens/LuckyDrawScreen/index';
import CartScreen from '../screens/CartScreen/index';
import SocialScreen from '../screens/SocialScreen/index';
import ProfileScreen from '../screens/ProfileScreen/index';
import LocalShop from '../screens/LocalShop/index';
import AddProduct from '../screens/AddProduct/index';
import AuthNavigator from './AuthNavigator';

const Navigation: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    wishlistItems,
    cartItems,
    cartCount,
    toggleWishlist,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  } = useAppContext();
  
  const { user, loading } = useAuth();

  // Memoized screen change handler to prevent unnecessary re-renders
  const handleChangeScreen = useCallback((screen: string) => {
    console.log(`Navigation: changing screen to ${screen}`);
    
    // Use a consistent delay to ensure state updates properly across all screens
    setTimeout(() => {
      setCurrentScreen(screen);
    }, 50);
  }, [setCurrentScreen]);

  // Log when screens change for debugging
  useEffect(() => {
    console.log(`Current screen changed to: ${currentScreen}`);
  }, [currentScreen]);

  // If auth is loading, don't render anything yet
  if (loading) {
    return null;
  }

  // If user is not authenticated, show the auth screens
  if (!user) {
    return <AuthNavigator onChangeScreen={handleChangeScreen} />;
  }

  try {
    // Render the appropriate screen based on current selection
    switch (currentScreen) {
      case 'health':
        return <HealthScreen onChangeScreen={handleChangeScreen} />;
      case 'shop':
        return (
          <ShopScreen 
            onChangeScreen={handleChangeScreen} 
            onToggleWishlist={toggleWishlist}
            wishlistItems={wishlistItems}
            onAddToCart={addToCart}
            onRemoveFromCart={removeFromCart}
            cartItems={cartItems}
            cartCount={cartCount}
          />
        );
      case 'luckyDraw':
        return <LuckyDrawScreen onChangeScreen={handleChangeScreen} />;
      case 'cart':
        return (
          <CartScreen 
            onChangeScreen={handleChangeScreen}
            cartItems={cartItems}
            onRemoveFromCart={removeFromCart}
            onUpdateQuantity={updateQuantity}
            onClearCart={clearCart}
          />
        );
      case 'localshop':
        return <LocalShop onChangeScreen={handleChangeScreen} />;
      case 'social':
        return <SocialScreen onChangeScreen={handleChangeScreen} />;
      case 'profile':
        return <ProfileScreen onChangeScreen={handleChangeScreen} />;
      case 'extras':
        return <SocialScreen onChangeScreen={handleChangeScreen} />;
      case 'addproduct':
        return <AddProduct onChangeScreen={handleChangeScreen} />;
      case 'home':
      default:
        return (
          <HomeScreen 
            onChangeScreen={handleChangeScreen} 
            wishlistItems={wishlistItems}
          />
        );
    }
  } catch (error) {
    console.error('Error rendering screen:', error);
    // Fallback to HomeScreen if there's an error
    return (
      <HomeScreen 
        onChangeScreen={handleChangeScreen} 
        wishlistItems={wishlistItems}
      />
    );
  }
};

export default Navigation; 