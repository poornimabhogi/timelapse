import React, { useEffect, useCallback, useState, useRef } from 'react';
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
import { Platform, View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';

// Use a key to force complete remount of navigation when needed
const NavigationRoot: React.FC = () => {
  const [resetKey, setResetKey] = useState(0);
  
  return (
    <View style={{ flex: 1 }} key={`navigation-root-${resetKey}`}>
      <NavigationContent onReset={() => setResetKey(prev => prev + 1)} />
    </View>
  );
};

const NavigationContent: React.FC<{ onReset: () => void }> = ({ onReset }) => {
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
  const [isAuthReady, setIsAuthReady] = useState(false);
  const prevUserState = useRef<boolean | null>(null);
  const [showDebugControls, setShowDebugControls] = useState(false);
  const resetTriesRef = useRef(0);
  // Add a timestamp to track when the last authentication state change happened
  const lastAuthChangeTime = useRef<number>(Date.now());

  // Force reset current screen to home when logging out
  useEffect(() => {
    const isAuthenticated = user !== null;
    const wasAuthenticated = prevUserState.current;
    const now = Date.now();
    
    console.log("Authentication state change:", 
      wasAuthenticated === null ? "initial" : wasAuthenticated ? "was logged in" : "was logged out",
      "->", 
      isAuthenticated ? "logged in" : "logged out"
    );
    
    // If user went from authenticated to not authenticated (logout)
    if (wasAuthenticated && !isAuthenticated) {
      // Check if this is a legitimate logout (not a false trigger from rapid state changes)
      // Ignore if less than 500ms have passed since the last change (debounce)
      if (now - lastAuthChangeTime.current > 500) {
        console.log("LOGOUT DETECTED: Resetting current screen to home");
        
        // Reset to home screen for next login
        setCurrentScreen('home');
        
        // For Android, trigger reset after a delay
        if (Platform.OS === 'android') {
          resetTriesRef.current = 0;
          setTimeout(() => {
            console.log("Showing debug controls after logout");
            setShowDebugControls(true);
          }, 1000);
        }
      } else {
        console.log("Ignoring rapid auth state change - likely a false trigger");
      }
    }
    
    prevUserState.current = isAuthenticated;
    lastAuthChangeTime.current = now;
  }, [user, setCurrentScreen, onReset]);

  // Auto reset attempt for Android
  useEffect(() => {
    if (Platform.OS === 'android' && !user && !loading && !isAuthReady) {
      // If we've been stuck in this state for more than 2 seconds, try a reset
      const timeoutId = setTimeout(() => {
        resetTriesRef.current += 1;
        if (resetTriesRef.current < 3) {
          console.log(`Auto-reset attempt ${resetTriesRef.current}`);
          setIsAuthReady(true); // Try to force ready state
          setTimeout(() => setIsAuthReady(false), 100); // Then force it back to reload
        } else if (resetTriesRef.current === 3) {
          // After 3 tries, show debug controls
          setShowDebugControls(true);
        }
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, loading, isAuthReady]);

  // Force state update on auth change, especially for Android
  useEffect(() => {
    console.log("Auth loading state:", loading, "User:", user ? "authenticated" : "not authenticated");
    
    if (!loading) {
      // Clear previous timeouts
      const timeoutId = setTimeout(() => {
        console.log("Setting auth ready state to true");
        setIsAuthReady(true);
      }, Platform.OS === 'android' ? 500 : 50);
      
      return () => clearTimeout(timeoutId);
    } else {
      // Reset ready state when loading changes to true
      setIsAuthReady(false);
    }
  }, [user, loading]);

  // Memoized screen change handler to prevent unnecessary re-renders
  const handleChangeScreen = useCallback((screen: string) => {
    console.log(`Navigation: changing screen to ${screen}`);
    setCurrentScreen(screen);
  }, [setCurrentScreen]);

  // Manual reset for Android debug
  const handleForceReset = useCallback(() => {
    console.log("Manual navigation reset triggered");
    setShowDebugControls(false);
    setIsAuthReady(false);
    resetTriesRef.current = 0;
    onReset(); // Trigger complete remount of navigation tree
  }, [onReset]);

  // Show a loading indicator during auth transitions
  if (loading || !isAuthReady) {
    console.log("Showing loading indicator, loading:", loading, "isAuthReady:", isAuthReady);
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#FFFFFF' 
      }}>
        <ActivityIndicator size="large" color="#6B4EFF" />
        <Text style={{ marginTop: 10, color: '#333' }}>
          {loading ? 'Checking authentication...' : 'Preparing app...'}
        </Text>
        
        {/* Debug controls for Android */}
        {Platform.OS === 'android' && showDebugControls && (
          <View style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: '#FF3B30', marginBottom: 10 }}>
              Having trouble logging out?
            </Text>
            <TouchableOpacity
              onPress={handleForceReset}
              style={{
                backgroundColor: '#FF3B30',
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Force Reset</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // If user is not authenticated, show the auth screens
  if (!user) {
    console.log("User not authenticated, showing AuthNavigator");
    return (
      <View style={{ flex: 1 }}>
        <AuthNavigator onChangeScreen={handleChangeScreen} />
      </View>
    );
  }

  console.log("User authenticated, showing app screens. Current screen:", currentScreen);
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
    // Improved error handling
    const errorMessage = typeof error === 'object' ? 
      (error && (error as any).message ? (error as any).message : JSON.stringify(error)) : 
      String(error);
    
    console.error('Error rendering screen:', errorMessage);
    
    // Fallback to HomeScreen if there's an error
    return (
      <HomeScreen 
        onChangeScreen={handleChangeScreen} 
        wishlistItems={wishlistItems}
      />
    );
  }
};

export default NavigationRoot; 