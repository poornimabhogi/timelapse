/**
 * @format
 */
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-safe-area-context';
import 'react-native-screens';
import 'react-native-safe-area-context';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-screens';
import 'react-native-get-random-values';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { configureAmplify } from './src/services/aws-config';

// Initialize AWS Amplify at the app entry point with error handling
try {
  console.log('Initializing Amplify from index.js');
  configureAmplify();
  console.log('Amplify initialization complete in index.js');
} catch (error) {
  console.error('Failed to initialize Amplify in index.js:', error);
}

AppRegistry.registerComponent(appName, () => App);
