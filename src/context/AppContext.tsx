import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { ProductData } from '../types/interfaces';

interface AppContextProps {
  currentScreen: string;
  wishlistItems: ProductData[];
  cartItems: ProductData[];
  cartCount: number;
  setCurrentScreen: (screen: string) => void;
  toggleWishlist: (product: ProductData) => void;
  addToCart: (product: ProductData) => void;
  removeFromCart: (product: ProductData) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [wishlistItems, setWishlistItems] = useState<ProductData[]>([]);
  const [cartItems, setCartItems] = useState<ProductData[]>([]);
  const [cartCount, setCartCount] = useState(0);

  // Optimized screen change handler to prevent navigation issues
  const handleScreenChange = useCallback((screen: string) => {
    console.log(`AppContext: setting current screen to ${screen}`);
    // Ensure screen value is valid
    if (['home', 'shop', 'health', 'profile', 'social', 'games', 'luckyDraw'].includes(screen)) {
      setCurrentScreen(screen);
    } else {
      console.warn(`Invalid screen name: ${screen}, defaulting to home`);
      setCurrentScreen('home');
    }
  }, []);

  const toggleWishlist = useCallback((product: ProductData) => {
    setWishlistItems(prevItems => {
      const isAlreadyInWishlist = prevItems.some(item => item.id === product.id);
      if (isAlreadyInWishlist) {
        return prevItems.filter(item => item.id !== product.id);
      } else {
        return [...prevItems, product];
      }
    });
  }, []);

  const addToCart = useCallback((product: ProductData) => {
    // Check if product already exists in cart
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      // Update quantity if already in cart
      const updatedItems = cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: (item.quantity || 1) + 1 } 
          : item
      );
      setCartItems(updatedItems);
    } else {
      // Add new item to cart
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
    
    // Update cart count
    setCartCount(prevCount => prevCount + 1);
  }, [cartItems]);

  const removeFromCart = (product: ProductData) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem && existingItem.quantity && existingItem.quantity > 1) {
        // Reduce quantity if more than 1
        return prevItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: (item.quantity || 0) - 1 }
            : item
        );
      } else {
        // Remove item if quantity is 1 or undefined
        return prevItems.filter(item => item.id !== product.id);
      }
    });
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        wishlistItems,
        cartItems,
        cartCount,
        setCurrentScreen: handleScreenChange,
        toggleWishlist,
        addToCart,
        removeFromCart,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 