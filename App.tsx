/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/contexts/AuthContext';
import Navigation from './src/navigation';
import { configureAmplify } from './src/services/aws-config';

// Initialize Amplify explicitly here as well
configureAmplify();

const App = () => {
  // Make sure Amplify is initialized on component mount
  useEffect(() => {
    configureAmplify();
  }, []);

  return (
    <AuthProvider>
      <AppProvider>
        <Navigation />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
