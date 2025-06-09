// .eslintrc.js

module.exports = {
  root: true, // Stop ESLint from looking for config files in parent folders
  env: {
    browser: true, // For general browser APIs (even though RN, some JS patterns apply)
    es2021: true, // Enable ES2021 global variables
    node: true, // Enable Node.js global variables and Node.js scoping
    'react-native/react-native': true, // Specific environment for React Native globals
    jest: true, // Enable Jest global variables and rules
  },
  // --- Parser Configuration ---
  // If you are using TypeScript:
  parser: '@typescript-eslint/parser',
  // If you are only using JavaScript (ESNext + JSX) without TypeScript:
  // parser: '@babel/eslint-parser', // Make sure you have @babel/core and @babel/eslint-parser installed

  parserOptions: {
    ecmaVersion: 'latest', // Allow parsing of modern ECMAScript features
    sourceType: 'module', // Allow use of import/export statements
    ecmaFeatures: {
      jsx: true, // Enable JSX parsing
    },
    // REQUIRED for @typescript-eslint/parser to understand your TypeScript project
    // This path should point to your tsconfig.json that includes your source files.
    project: './tsconfig.json',
    // For @babel/eslint-parser, specify the Babel config file if needed
    // babelOptions: {
    //   configFile: './babel.config.js',
    // },
  },
  // --- Plugins ---
  plugins: [
    'react',
    'react-native', // ESLint plugin for React Native specific rules
    '@typescript-eslint', // ESLint plugin for TypeScript specific rules
    'jest', // ESLint plugin for Jest specific rules
    // 'prettier', // If you're using Prettier for formatting
  ],
  // --- Extended Configurations ---
  extends: [
    'eslint:recommended', // ESLint's recommended rules
    'plugin:react/recommended', // Recommended rules for React
    'plugin:react-native/all', // All recommended rules for React Native
    'plugin:@typescript-eslint/recommended', // Recommended rules for TypeScript
    'plugin:jest/recommended', // Recommended rules for Jest
    // 'plugin:prettier/recommended', // Integrates Prettier with ESLint
  ],
  // --- Custom Rules ---
  rules: {
    // Example custom rules (adjust as per your team's preferences)
    'indent': ['error', 2, { SwitchCase: 1 }],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-empty-function': 'off', // Allow empty functions (e.g., placeholder callbacks)
    'react/react-in-jsx-scope': 'off', // Not needed for React 17+ and new JSX transform
    'react/prop-types': 'off', // Often turned off in TypeScript projects as types handle it
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Can be noisy, good for early stages
    '@typescript-eslint/no-explicit-any': 'warn', // Warn on 'any', but allow for flexibility
    // Add other rules as needed
  },
  // --- Settings for Plugins ---
  settings: {
    react: {
      version: 'detect', // Automatically detect the React version
    },
  },
  // --- Ignore Files/Folders ---
  ignorePatterns: [
    'node_modules/',
    'android/',
    'ios/',
    'build/',
    'dist/',
    '.expo/', // If you are using Expo
  ],
};
