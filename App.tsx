/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { AppProvider } from './src/context/AppContext';
import { AuthProvider } from './src/contexts/AuthContext';
import Navigation from './src/navigation';

const App = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <Navigation />
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
