import { ReactNode } from 'react';

// Navigation prop types
export interface NavigationProps {
  onChangeScreen: (screen: string) => void;
}

// Product data interface
export interface ProductData {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  isNew?: boolean;
  quantity?: number;
}

// Goal data interface
export interface GoalData {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  progress: number;
  icon: string;
}

// Category data interface
export interface CategoryData {
  id: string;
  name: string;
}

// HomeScreen props
export interface HomeScreenProps {
  onChangeScreen: (screen: string) => void;
  wishlistItems: ProductData[];
}

// ShopScreen props
export interface ShopScreenProps {
  onChangeScreen: (screen: string) => void;
  onToggleWishlist: (product: ProductData) => void;
  wishlistItems: ProductData[];
  onAddToCart: (product: ProductData) => void;
  onRemoveFromCart: (product: ProductData) => void;
  cartItems: ProductData[];
  cartCount: number;
}

// HealthScreen props
export interface HealthScreenProps {
  onChangeScreen: (screen: string) => void;
}

export interface SocialScreenProps {
  onChangeScreen: (screen: string) => void;
}

export interface GamesScreenProps {
  onChangeScreen: (screen: string) => void;
}

export interface ProfileScreenProps {
  onChangeScreen: (screen: string) => void;
}

// Component Props
export interface BottomTabBarProps {
  currentScreen: string;
  onChangeScreen: (screen: string) => void;
}

// Context
export interface AppContextProps {
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
  wishlistItems: ProductData[];
  toggleWishlistItem: (product: ProductData) => void;
  cartItems: ProductData[];
  addToCart: (product: ProductData) => void;
  removeFromCart: (product: ProductData) => void;
  cartCount: number;
} 