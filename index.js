/**
 * @format
 */

import 'react-native-get-random-values'; // required for crypto support
import 'react-native-url-polyfill/auto'; // required for URL and fetch in AWS SDK
import { Buffer } from 'buffer';
import process from 'process';
import { decode as atob, encode as btoa } from 'base-64';

// Set up global polyfills for AWS SDK v3
global.Buffer = Buffer;
global.process = process;

if (!global.btoa) global.btoa = btoa;
if (!global.atob) global.atob = atob;

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
