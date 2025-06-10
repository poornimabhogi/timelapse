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

# TimeLapse App

A React Native application for creating and sharing time-lapse content with social features.

## Architecture

### AWS Services Integration

1. **Authentication & User Management**
   - AWS Cognito
     - User sign-up and sign-in
     - Social media authentication
     - JWT token management
     - User profile attributes

2. **Data Storage**
   - AWS DynamoDB Tables
     - Users Table: User profiles and settings
     - TimeLapses Table: Time-lapse content metadata
     - Posts Table: Social media posts and interactions

3. **Media Storage**
   - AWS S3 Buckets
     - `timelapse-media-${env}`: Time-lapse media files
     - `user-content-${env}`: Profile pictures and user media
     - `post-media-${env}`: Feature post media

4. **API Layer**
   - AWS AppSync (GraphQL)
     - Real-time subscriptions
     - CRUD operations
     - Authentication integration

5. **Media Processing**
   - AWS Lambda
     - S3 presigned URL generation
     - Image/video processing
     - Thumbnail generation

### Project Structure
```
timelapse/
├── src/
│   ├── screens/
│   │   ├── ProfileScreen/     # User profile management
│   │   ├── TimeLapseScreen/   # Time-lapse creation and viewing
│   │   └── PostScreen/        # Social media features
│   ├── components/            # Reusable UI components
│   ├── utils/
│   │   └── s3Upload.ts       # S3 upload utilities
│   ├── config/
│   │   └── aws-config.ts     # AWS configuration
│   └── contexts/
│       └── AuthContext.tsx   # Authentication context
├── terraform/                # Infrastructure as Code
│   ├── main.tf
│   ├── cognito.tf
│   ├── dynamodb.tf
│   ├── s3.tf
│   └── appsync.tf
└── env/                     # Environment configurations
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or later)
- React Native CLI
- AWS CLI
- Terraform
- Xcode (for iOS development)
- Android Studio (for Android development)

### Environment Setup
1. Clone the repository
```bash
git clone <repository-url>
cd timelapse
```

2. Install dependencies
```bash
npm install
```

3. Configure AWS credentials
```bash
aws configure
```

4. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your AWS configuration
```

### AWS Resources Setup
1. Initialize Terraform
```bash
cd terraform
terraform init
```

2. Apply infrastructure
```bash
terraform apply
```

```

### Development
1. Start Metro bundler
```bash
npm start
```

2. Run on iOS
```bash
npm run ios
```

3. Run on Android
```bash
npm run android
```

## Features

### TimeLapse Creation
- Capture time-lapse photos/videos
- Customize capture intervals
- Preview and edit time-lapse content
- Upload to S3 with progress tracking

### Social Features
- User profiles
- Follow/unfollow users
- Like and comment on posts
- Share time-lapse content
- Real-time updates using AppSync subscriptions

### Media Management
- Automatic media optimization
- Thumbnail generation
- Progress tracking for uploads
- Offline support

## Security

### Authentication
- JWT-based authentication with Cognito
- Secure token storage
- Session management
- Social sign-in support

### Data Protection
- S3 bucket encryption
- DynamoDB encryption at rest
- IAM roles and policies
- CORS configuration

### API Security
- AppSync authentication
- API key management
- Rate limiting
- Input validation

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Fixing Loading Issues

If you encounter loading issues in the SocialScreen component where the loading state gets stuck, follow these steps:

### 1. Ensure Error State Handling

Add error state handling to both screens to provide better user feedback:

```tsx
// Add error state
const [error, setError] = useState<string | null>(null);

// In the refreshAllData or fetchTimelapses function
try {
  // Existing code...
} catch (error) {
  console.error("Error fetching data:", error);
  setError("Failed to load content. Please try again.");
} finally {
  // Always reset loading and refreshing states
  setLoading(false);
  setRefreshing(false);
}

// In the render section
if (error && !refreshing) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 2. Add Safety Timeout

Implement a safety timeout to ensure the loading state is always eventually set to false:

```tsx
// At the beginning of data fetching functions
const safetyTimeout = setTimeout(() => {
  if (loading) {
    console.log("Safety timeout triggered: resetting loading state");
    setLoading(false);
  }
}, 10000); // 10-second safety timeout

// In finally block
clearTimeout(safetyTimeout);
setLoading(false);
```

### 3. Enhanced Debugging

Add verbose logging to track the component lifecycle and loading states:

```tsx
// At the beginning of component
useEffect(() => {
  console.log("Component mounted, loading:", loading);
  return () => {
    console.log("Component unmounting");
  };
}, []);

// When setting loading state
console.log("Setting loading state to:", true/false);
```

### 4. Update LoadingSpinner Component

Make sure the LoadingSpinner component shows feedback to the user:

```tsx
// Update call to LoadingSpinner
<LoadingSpinner message="Loading your content..." />

// In LoadingSpinner component
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6B4EFF" />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};
```

By implementing these changes, you'll improve the user experience when data is loading and provide better feedback in case of errors.
