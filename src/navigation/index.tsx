import React, { useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import HomeScreen from '../screens/HomeScreen/index';
import ShopScreen from '../screens/ShopScreen/index';
import HealthScreen from '../screens/HealthScreen/index';
import LuckyDrawScreen from '../screens/LuckyDrawScreen/index';

const Navigation: React.FC = () => {
  const {
    currentScreen,
    setCurrentScreen,
    wishlistItems,
    cartItems,
    cartCount,
    toggleWishlist,
    addToCart,
    removeFromCart
  } = useAppContext();

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
    case 'home':
    default:
      return (
        <HomeScreen 
          onChangeScreen={handleChangeScreen} 
          wishlistItems={wishlistItems}
        />
      );
  }
};

export default Navigation; 