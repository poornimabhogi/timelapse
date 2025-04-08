import React, { createContext, useContext, useState, useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import { signIn, signUp, confirmSignUp, signOut, fetchUserAttributes, getCurrentUser, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { configureAmplify } from '../services/aws-config';

// Configure Amplify when the context is used
configureAmplify();

interface User {
  uid: string;
  username: string;
  email: string;
  attributes?: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<any>;
  signUp: (username: string, password: string, email: string) => Promise<any>;
  confirmSignUp: (username: string, code: string) => Promise<any>;
  signOut: () => Promise<any>;
  resetPassword: (username: string) => Promise<any>;
  confirmResetPassword: (username: string, code: string, newPassword: string) => Promise<any>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  confirmSignUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  confirmResetPassword: async () => {},
  continueAsGuest: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current authenticated user
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      const userInfo: User = {
        uid: attributes.sub || currentUser.userId,
        username: currentUser.username,
        email: attributes.email || '',
        attributes: attributes
      };
      
      setUser(userInfo);
    } catch (error) {
      console.log('User not authenticated', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  // Sign in with username and password
  async function handleSignIn(username: string, password: string) {
    try {
      const { isSignedIn } = await signIn({ username, password });
      
      if (isSignedIn) {
        // Fetch user attributes after successful sign in
        const currentUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        
        const userInfo: User = {
          uid: attributes.sub || currentUser.userId,
          username: currentUser.username,
          email: attributes.email || '',
          attributes: attributes
        };
        
        setUser(userInfo);
        return userInfo;
      }
    } catch (error) {
      console.log('Error signing in', error);
      throw error;
    }
  }

  // Sign up new user
  async function handleSignUp(username: string, password: string, email: string) {
    try {
      const result = await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });
      return result;
    } catch (error) {
      console.log('Error signing up', error);
      throw error;
    }
  }

  // Confirm sign up with code
  async function handleConfirmSignUp(username: string, code: string) {
    try {
      return await confirmSignUp({ username, confirmationCode: code });
    } catch (error) {
      console.log('Error confirming sign up', error);
      throw error;
    }
  }

  // Sign out
  async function handleSignOut() {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.log('Error signing out', error);
      throw error;
    }
  }

  // Reset password
  async function handleResetPassword(username: string) {
    try {
      return await resetPassword({ username });
    } catch (error) {
      console.log('Error resetting password', error);
      throw error;
    }
  }

  // Confirm reset password with code
  async function handleConfirmResetPassword(username: string, code: string, newPassword: string) {
    try {
      return await confirmResetPassword({
        username,
        confirmationCode: code,
        newPassword
      });
    } catch (error) {
      console.log('Error confirming reset password', error);
      throw error;
    }
  }

  // Continue as guest
  function handleContinueAsGuest() {
    // Set a guest user
    setUser({
      uid: 'guest-' + Date.now(),
      username: 'Guest',
      email: 'guest@example.com'
    });
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        signIn: handleSignIn, 
        signUp: handleSignUp, 
        confirmSignUp: handleConfirmSignUp, 
        signOut: handleSignOut, 
        resetPassword: handleResetPassword, 
        confirmResetPassword: handleConfirmResetPassword,
        continueAsGuest: handleContinueAsGuest
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}; 