// index.js

// -----------------------------------------------------------
// CRITICAL: GLOBAL POLYFILLS MUST BE AT THE ABSOLUTE TOP.
// No other imports or code should precede these.
// -----------------------------------------------------------

// 1. Polyfill for crypto.getRandomValues (used by many crypto libs)
//import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { encode, decode } from 'base-64';

// 2. Polyfill for Node.js 'Buffer' global
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// 3. Polyfill for Node.js 'process' global
import process from 'process/browser';
global.process = process;

// 4. Polyfill for Node.js 'crypto' module (removed - not needed for production config)
// import 'react-native-crypto'; // Commented out due to Hermes compatibility issues

// 5. Stream polyfills removed - not needed for production config

// 6. Polyfill for Node.js 'url' module (used by some network libs)


// 7. Ensure btoa/atob are globally available (for base64 encoding/decoding)

if (typeof global.btoa === 'undefined') {
  global.btoa = encode;
}
if (typeof global.atob === 'undefined') {
  global.atob = decode;
}


// -----------------------------------------------------------
// End of Global Polyfills
// -----------------------------------------------------------

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
