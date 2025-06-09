// metro.config.js

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');


const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    babelTransformerPath:
      require.resolve('@react-native/metro-babel-transformer'),
    minifierConfig: {
      keep_fnames: true,
      mangle: {
        keep_fnames: true,
      },
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);