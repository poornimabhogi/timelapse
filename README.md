This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

# Timelapse App

A fitness tracking and wellness rewards app built with React Native.

## Cross-Platform Compatibility

This app is designed to run on both iOS and Android platforms with platform-specific optimizations:

### Platform Detection

The app uses React Native's Platform API to detect the operating system and adjust UI elements accordingly:

```javascript
import { Platform } from 'react-native';

// Check if running on iOS
if (Platform.OS === 'android') {
  // Android-specific code
} else {
  // iOS-specific code
}
```

### Android Version Detection

The app includes code to detect specific Android versions, including Android 15:

```javascript
// Check if the device is running Android 15 (API level 35)
if (Platform.OS === 'android' && Platform.Version === 35) {
  // Android 15 specific code
  console.log('This is Android 15 specific code');
  ToastAndroid.show('Running on Android 15', ToastAndroid.SHORT);
}
```

### Platform-Specific Styling

Different styling approaches are used for each platform, particularly for shadows:

```javascript
// Platform-specific styling
...Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  android: {
    elevation: 2,
  },
}),
```

### Safe Area Handling

The app handles safe areas differently on each platform to account for notches, status bars, and home indicators:

- iOS uses SafeAreaView for top and bottom insets
- Android uses manual padding based on StatusBar.currentHeight

### Feature Flags

Feature flags are implemented to show or hide features based on platform or version:

```javascript
{isAndroid15 && (
  <View style={styles.android15Badge}>
    <Text style={styles.android15Text}>Android 15</Text>
  </View>
)}
```

## Running the App

### iOS

```
npx react-native run-ios
```

### Android

```
npx react-native run-android
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Install pods for iOS:
   ```
   cd ios && pod install && cd ..
   ```
4. Start the Metro bundler:
   ```
   npx react-native start
   ```
5. Run on a specific platform (in a separate terminal):
   ```
   npx react-native run-ios
   ```
   or
   ```
   npx react-native run-android
   ```
