import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Amplify } from 'aws-amplify';
import { signIn, signUp, confirmSignUp, signOut, fetchUserAttributes, getCurrentUser, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import { configureAmplify } from '../services/aws-config';
import { Platform, AppState, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeUserInDynamoDB } from '../services/dynamodbService';

// Force reconfigure Amplify when context is used
configureAmplify();

interface User {
  uid: string;
  username: string;
  name?: string;
  bio?: string;
  avatar?: string;
  following?: string[];
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
  setPhotoPickerActive: (active: boolean) => void;
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
  setPhotoPickerActive: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [forceRender, setForceRender] = useState(0);
  // Add a ref to track if app background state is due to photo picker
  const photoPickerActive = useRef<boolean>(false);
  const lastAppState = useRef<string>(AppState.currentState);

  // Export the photo picker flag setter function so it can be called from other components
  const setPhotoPickerActive = (active: boolean) => {
    console.log(`Photo picker active: ${active}`);
    photoPickerActive.current = active;
  };

  useEffect(() => {
    // Check current authenticated user
    checkUser();

    // For Android, listen to app state changes to refresh auth state
    if (Platform.OS === 'android') {
      const subscription = AppState.addEventListener('change', nextAppState => {
        console.log(`App state changed from ${lastAppState.current} to ${nextAppState}`);
        
        // Only handle auth refresh if returning to active state from background
        if (nextAppState === 'active' && 
            (lastAppState.current === 'background' || lastAppState.current === 'inactive')) {
          
          // Check if this is returning from photo picker
          if (photoPickerActive.current) {
            console.log('Returning from photo picker, not refreshing auth');
            photoPickerActive.current = false;
          } else {
            console.log('App returned to foreground, refreshing auth state');
            checkUser();
          }
        }
        
        lastAppState.current = nextAppState;
      });

      return () => {
        subscription.remove();
      };
    }
  }, [forceRender]);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      console.log('Current user:', currentUser);
      console.log('User attributes:', attributes);
      
      // Ensure we have a valid username
      let username = attributes.name || attributes.preferred_username || '';
      if (!username && attributes.email) {
        // Use part before @ in email if no name is provided
        username = attributes.email.split('@')[0];
      }
      
      // Ensure username is not empty
      if (!username && currentUser.username) {
        username = currentUser.username;
      }
      
      // Default fallback
      if (!username) {
        username = `user_${attributes.sub?.substring(0, 8) || Date.now()}`;
      }
      
      const userInfo: User = {
        uid: attributes.sub || currentUser.userId,
        username: username,
        name: attributes.name,
        bio: attributes.bio,
        avatar: attributes.picture,
        following: undefined, // Will be populated later after fetching from DynamoDB
        attributes: attributes
      };
      
      setUser(userInfo);
      
      // Initialize user in DynamoDB
      try {
        console.log('Initializing user in DynamoDB during checkUser:', userInfo.uid);
        console.log('Using username:', username);
        
        // Retry user initialization up to 3 times
        let attempts = 0;
        let success = false;
        while (attempts < 3 && !success) {
          attempts++;
          try {
            const result = await initializeUserInDynamoDB(
              userInfo.uid,
              username,
              attributes.email || ''
            );
            if (result) {
              console.log(`User initialized successfully on attempt ${attempts}:`, result);
              success = true;
            } else {
              console.log(`User initialization returned null on attempt ${attempts}`);
              // Wait a short time before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (attemptError) {
            console.error(`Error on initialization attempt ${attempts}:`, attemptError);
            // Wait longer between retries
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }
        
        if (!success) {
          console.warn('Failed to initialize user after multiple attempts, but continuing app flow');
        }
      } catch (dbError) {
        console.error('Error initializing user in DynamoDB during checkUser:', dbError);
        // Continue anyway, as this shouldn't prevent app usage
      }
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
        
        // Ensure we have a valid username
        let displayUsername = attributes.name || attributes.preferred_username || '';
        if (!displayUsername && attributes.email) {
          // Use part before @ in email if no name is provided
          displayUsername = attributes.email.split('@')[0];
        }
        
        // Ensure username is not empty
        if (!displayUsername && currentUser.username) {
          displayUsername = currentUser.username;
        }
        
        // Default fallback
        if (!displayUsername) {
          displayUsername = `user_${attributes.sub?.substring(0, 8) || Date.now()}`;
        }
        
        const userInfo: User = {
          uid: attributes.sub || currentUser.userId,
          username: displayUsername,
          name: attributes.name,
          bio: attributes.bio,
          avatar: attributes.picture,
          following: undefined, // Will be populated later after fetching from DynamoDB
          attributes: attributes
        };
        
        setUser(userInfo);
        
        // Initialize user in DynamoDB
        try {
          console.log('Initializing user in DynamoDB:', userInfo.uid);
          console.log('Using username:', displayUsername);
          await initializeUserInDynamoDB(
            userInfo.uid,
            displayUsername,
            attributes.email || ''
          );
        } catch (dbError) {
          console.error('Error initializing user in DynamoDB:', dbError);
          // Continue anyway, as this shouldn't prevent app usage
        }
        
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
      console.log('Starting sign up process for:', username);
      
      // Use email as username for Cognito since it's configured to expect email addresses
      const result = await signUp({
        username: email,
        password: password,
        options: {
          userAttributes: {
            email: email,
            name: username,
            // Add preferred_username attribute to ensure username is saved in Cognito
            preferred_username: username,
          },
        },
      });
      
      console.log('Sign up successful:', result);
      return result;
    } catch (error) {
      console.error('Error signing up:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Check for specific error types
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      throw error;
    }
  }

  // Confirm sign up with code
  async function handleConfirmSignUp(username: string, code: string) {
    try {
      // In our Cognito setup, the actual username is the email
      const result = await confirmSignUp({ username, confirmationCode: code });
      
      if (result.isSignUpComplete) {
        // Try to auto sign in if confirmation is successful
        try {
          // We'd need the password here, but we don't have it at this point
          // Instead, we can try to initialize the DynamoDB record
          // based on what we know
          
          // Get the userId from the signup result if available
          // or construct a temporary ID to be corrected on next login
          const tempUserId = `temp-${Date.now()}`;
          const extractedUsername = username.split('@')[0]; // Use part before @ in email
          
          console.log('Initializing user in DynamoDB after confirmation');
          await initializeUserInDynamoDB(
            tempUserId,
            extractedUsername,
            username
          );
        } catch (initError) {
          console.error('Error initializing user after confirmation:', initError);
          // Continue anyway
        }
      }
      
      return result;
    } catch (error) {
      console.log('Error confirming sign up', error);
      throw error;
    }
  }

  // Sign out
  async function handleSignOut() {
    try {
      // Set loading state immediately
      setLoading(true);
      console.log('Signing out user...');
      
      if (Platform.OS === 'android') {
        console.log('AGGRESSIVE Android-specific logout handling');
        
        try {
          // 1. Call AWS Amplify signOut
          await signOut();
        } catch (signOutError) {
          console.log('Error during signOut, continuing with forced logout:', signOutError);
        }
        
        // 2. Force clear user immediately
        setUser(null);
        
        // 3. Clear all auth-related AsyncStorage keys
        try {
          console.log('Clearing AsyncStorage auth data');
          const keys = await AsyncStorage.getAllKeys();
          const authKeys = keys.filter(key => 
            key.includes('auth') || 
            key.includes('CognitoIdentityId') || 
            key.includes('token') || 
            key.includes('amplify') ||
            key.includes('user') ||
            key.includes('accessToken') ||
            key.includes('idToken') ||
            key.includes('refreshToken')
          );
          
          if (authKeys.length > 0) {
            console.log('Removing auth keys:', authKeys);
            await AsyncStorage.multiRemove(authKeys);
          }
        } catch (storageError) {
          console.log('Error clearing AsyncStorage:', storageError);
        }
        
        // 4. Use multiple state updates with delays to ensure Android UI updates
        setTimeout(() => {
          console.log('Forcing complete app state reset');
          // Force a complete re-render of the component tree with two consecutive updates
          setForceRender(prev => prev + 1);
          
          setTimeout(() => {
            console.log('Setting loading to false');
            // Complete the loading state
            setLoading(false);
            
            // Force another render after a short delay
            setTimeout(() => {
              console.log('Final forced render');
              setForceRender(prev => prev + 2);
            }, 300);
          }, 300);
        }, 300);
      } else {
        // iOS handling (already working)
        try {
          await signOut();
        } catch (error) {
          console.log('Error signing out on iOS, forcing logout anyway:', error);
        }
        
        setTimeout(() => {
          setUser(null);
          setLoading(false);
          console.log('User signed out successfully on iOS');
        }, 100);
      }
    } catch (error) {
      console.log('Error in handleSignOut:', error);
      
      // Even on error, force sign out on UI
      setUser(null);
      setLoading(false);
      
      if (Platform.OS === 'android') {
        // Force a complete re-render on Android even if there was an error
        setTimeout(() => {
          setForceRender(prev => prev + 1);
        }, 100);
      }
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

  // Continue as guest mode - revert back to original minimal implementation
  function continueAsGuest() {
    // Set a guest user with minimal functionality
    setUser({
      uid: 'guest-' + Date.now(),
      username: 'Guest',
      name: 'Guest',
      bio: 'This is a guest account. No personal information is stored.',
      avatar: 'https://example.com/guest-avatar.jpg',
      following: [],
    });
    setLoading(false);
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
        continueAsGuest: continueAsGuest,
        setPhotoPickerActive
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}; 