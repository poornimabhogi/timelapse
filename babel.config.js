module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Add these plugins to help with AWS SDK compatibility
    '@babel/plugin-transform-export-namespace-from',
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-transform-object-rest-spread',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-transform-class-static-block',
    '@babel/plugin-transform-flow-strip-types'
  ],
};
