import React, { useState } from 'react';
import { View } from 'react-native';
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
  const { loading } = useAuth();

  if (loading) {
    // Show a loading screen while checking authentication status
    return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;
  }

  const navigateToLogin = () => setCurrentScreen(AuthScreens.LOGIN);
  const navigateToSignup = () => setCurrentScreen(AuthScreens.SIGNUP);
  const navigateToForgotPassword = () => setCurrentScreen(AuthScreens.FORGOT_PASSWORD);

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