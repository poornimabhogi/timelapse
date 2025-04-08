import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Platform, Text, TouchableOpacity } from 'react-native';
import LoginScreen from '../screens/AuthScreens/LoginScreen';
import SignUpScreen from '../screens/AuthScreens/SignUpScreen';
import ForgotPasswordScreen from '../screens/AuthScreens/ForgotPasswordScreen';
import { useAuth } from '../contexts/AuthContext';

interface AuthNavigatorProps {
  onChangeScreen: (screen: string) => void;
}

enum AuthScreens {
  LOGIN = 'login',
  SIGNUP = 'signup',
  FORGOT_PASSWORD = 'forgot-password'
}

const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onChangeScreen }) => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreens>(AuthScreens.LOGIN);
  const [isReady, setIsReady] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);
  const { loading } = useAuth();

  // Force component to be ready after a delay (longer on Android)
  useEffect(() => {
    console.log(`AuthNavigator: Mounting with reset counter ${resetCounter}, platform: ${Platform.OS}`);
    
    // Clear existing timeouts to prevent conflicts
    const timeoutId = setTimeout(() => {
      setIsReady(true);
      console.log("AuthNavigator: Component is now ready");
    }, Platform.OS === 'android' ? 500 : 100);
    
    return () => {
      clearTimeout(timeoutId);
      console.log("AuthNavigator: Cleanup called");
    };
  }, [resetCounter]);

  // Force a reset for Android if not ready after a timeout
  useEffect(() => {
    if (Platform.OS === 'android' && !isReady) {
      const timeout = setTimeout(() => {
        console.log("AuthNavigator: Force resetting component");
        setResetCounter(prev => prev + 1);
      }, 2000); // If not ready in 2 seconds, force reset
      
      return () => clearTimeout(timeout);
    }
  }, [isReady]);

  const handleAndroidReset = () => {
    console.log("Manual reset triggered");
    setIsReady(false);
    setResetCounter(prev => prev + 1);
  };

  if (loading || !isReady) {
    // Show a more detailed loading screen with reset option for Android
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <ActivityIndicator size="large" color="#6B4EFF" />
        <Text style={{ 
          marginTop: 16, 
          fontSize: 16, 
          color: '#333',
          textAlign: 'center',
          marginHorizontal: 20 
        }}>
          {loading ? 'Verifying authentication status...' : 'Preparing login screen...'}
        </Text>
        
        {/* Manual reset button for Android - helpful if the screen gets stuck */}
        {Platform.OS === 'android' && !isReady && (
          <TouchableOpacity 
            onPress={handleAndroidReset}
            style={{
              marginTop: 20,
              padding: 10,
              backgroundColor: '#f0f0f0',
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#333' }}>Reset Screen</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const navigateToLogin = () => {
    console.log("Navigating to login screen");
    setCurrentScreen(AuthScreens.LOGIN);
  };
  
  const navigateToSignup = () => {
    console.log("Navigating to signup screen");
    setCurrentScreen(AuthScreens.SIGNUP);
  };
  
  const navigateToForgotPassword = () => {
    console.log("Navigating to forgot password screen");
    setCurrentScreen(AuthScreens.FORGOT_PASSWORD);
  };

  console.log(`AuthNavigator: Rendering auth screen: ${currentScreen}`);
  
  switch (currentScreen) {
    case AuthScreens.SIGNUP:
      return (
        <SignUpScreen 
          onNavigateToLogin={navigateToLogin}
          onChangeScreen={onChangeScreen}
        />
      );
    case AuthScreens.FORGOT_PASSWORD:
      return (
        <ForgotPasswordScreen 
          onNavigateToLogin={navigateToLogin}
        />
      );
    case AuthScreens.LOGIN:
    default:
      return (
        <LoginScreen 
          onNavigateToSignup={navigateToSignup}
          onNavigateToForgotPassword={navigateToForgotPassword}
          onChangeScreen={onChangeScreen}
        />
      );
  }
};

export default AuthNavigator; 