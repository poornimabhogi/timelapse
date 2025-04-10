import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

interface SignUpScreenProps {
  onNavigateToLogin: () => void;
  onChangeScreen: (screen: string) => void;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ 
  onNavigateToLogin,
  onChangeScreen
}) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const { signUp, confirmSignUp } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleSignUp = async () => {
    // Validate inputs
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting to sign up user:', username);
      
      // Retry mechanism for Amplify operations
      const MAX_RETRIES = 3;
      let attempt = 0;
      let signUpResult = null;
      
      while (attempt < MAX_RETRIES && !signUpResult) {
        try {
          // Force Amplify reconfiguration before signup
          const { configureAmplify } = require('../../services/aws-config');
          configureAmplify();
          console.log(`Amplify configured for signup attempt ${attempt + 1}`);
          
          // Wait a bit between configuration and signup
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Try signup
          signUpResult = await signUp(username, password, email);
          console.log('Sign up successful on attempt', attempt + 1);
        } catch (retryError) {
          attempt++;
          console.error(`Signup attempt ${attempt} failed:`, retryError);
          
          if (attempt >= MAX_RETRIES) {
            throw retryError; // Rethrow the error if we've exhausted retries
          }
          
          // Wait before retrying (increasing delay with each attempt)
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
      }
      
      setSignupComplete(true);
      Alert.alert(
        'Verification Required',
        'A verification code has been sent to your email. Please enter it to complete registration.'
      );
    } catch (error) {
      console.error('Signup error:', error);
      
      // More detailed error handling
      let errorMessage = 'There was an error creating your account. Please try again.';
      
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        // Check for specific error types
        if (error.message.includes('Native module')) {
          errorMessage = 'Native module error. Please restart the app and try again.';
        } else if (error.message.includes('already exists')) {
          errorMessage = 'This username or email is already registered.';
        }
      }
      
      Alert.alert('Sign Up Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      await confirmSignUp(username, verificationCode);
      Alert.alert(
        'Success',
        'Your account has been verified successfully. You can now login.',
        [
          {
            text: 'OK',
            onPress: onNavigateToLogin
          }
        ]
      );
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Verification Failed', 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to scroll to input
  const scrollToInput = (y: number) => {
    scrollViewRef.current?.scrollTo({ y, animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          bounces={true}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onNavigateToLogin}
          >
            <Text style={styles.backButtonText}>← Back to Login</Text>
          </TouchableOpacity>

          <Text style={styles.headerText}>
            {signupComplete ? 'Verify Your Account' : 'Create Account'}
          </Text>
          <Text style={styles.subHeaderText}>
            {signupComplete 
              ? 'Enter the verification code sent to your email'
              : 'Sign up to start creating and sharing timelapses'
            }
          </Text>

          {signupComplete ? (
            // Verification Code Screen
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Verification Code</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter code from your email"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                />
              </View>

              <TouchableOpacity 
                style={[styles.signupButton, !verificationCode && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={loading || !verificationCode}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Verify Account</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            // Sign Up Form
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Choose a username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  onFocus={() => scrollToInput(0)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => scrollToInput(100)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Create a password (min. 8 characters)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  onFocus={() => scrollToInput(200)}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  onFocus={() => scrollToInput(300)}
                />
              </View>

              <TouchableOpacity 
                style={[
                  styles.signupButton, 
                  (!username || !email || !password || !confirmPassword) && styles.buttonDisabled
                ]}
                onPress={() => {
                  Keyboard.dismiss();
                  handleSignUp();
                }}
                disabled={loading || !username || !email || !password || !confirmPassword}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  backButton: {
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#666',
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  signupButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  buttonDisabled: {
    backgroundColor: '#A8A8A8',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 16,
    color: '#666',
  },
  loginLink: {
    fontSize: 16,
    color: '#6B4EFF',
    fontWeight: '600',
  },
});

export default SignUpScreen; 