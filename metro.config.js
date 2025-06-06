/**
 * Metro configuration for React Native
 */
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    // Fix asset registry issues
    assetRegistryPath: '@react-native/assets-registry/registry',
  },
  resolver: {
    alias: {
      // Prevent problematic module resolution
      'missing-asset-registry-path': '@react-native/assets-registry/registry',
    },
    // CRITICAL FIX: Disable package exports to resolve Firebase/Hermes issues
    unstable_enablePackageExports: false,
    // Ensure proper file extensions are resolved
    sourceExts: ['js', 'ts', 'tsx', 'jsx', 'json', 'mjs', 'cjs'],
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'mp4', 'webm', 'wav', 'mp3', 'aac', 'mov'],
  },
  // Reset cache and ensure clean builds
  resetCache: true,
};

module.exports = mergeConfig(defaultConfig, config);
