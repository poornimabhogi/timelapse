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
  removeFromCart: (product: ProductData, removeAll?: boolean) => void;
  updateQuantity: (product: ProductData, quantity: number) => void;
  clearCart: () => void;
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
    if (['home', 'shop', 'health', 'profile', 'social', 'extras', 'luckyDraw', 'cart', 'localshop', 'addproduct'].includes(screen)) {
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

  const removeFromCart = useCallback((product: ProductData, removeAll: boolean = false) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (removeAll || (existingItem && existingItem.quantity && existingItem.quantity <= 1)) {
        // Remove item if quantity is 1 or undefined or removeAll is true
        const updatedItems = prevItems.filter(item => item.id !== product.id);
        
        // Update cart count
        const removedQuantity = existingItem?.quantity || 1;
        setCartCount(prevCount => Math.max(0, prevCount - removedQuantity));
        
        return updatedItems;
      } else {
        // Reduce quantity if more than 1
        const updatedItems = prevItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: (item.quantity || 0) - 1 }
            : item
        );
        
        // Update cart count
        setCartCount(prevCount => Math.max(0, prevCount - 1));
        
        return updatedItems;
      }
    });
  }, []);

  const updateQuantity = useCallback((product: ProductData, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity is zero or negative
      removeFromCart(product, true);
      return;
    }
    
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // Calculate difference in quantity for cart count
        const quantityDiff = quantity - (existingItem.quantity || 1);
        
        // Update cart count
        setCartCount(prevCount => Math.max(0, prevCount + quantityDiff));
        
        // Update the item's quantity
        return prevItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: quantity }
            : item
        );
      } else {
        // Add new item with the specified quantity
        setCartCount(prevCount => prevCount + quantity);
        return [...prevItems, { ...product, quantity }];
      }
    });
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setCartCount(0);
  }, []);

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
        updateQuantity,
        clearCart,
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