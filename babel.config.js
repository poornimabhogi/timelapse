module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    '@babel/plugin-transform-object-rest-spread',
    '@babel/plugin-transform-class-static-block',
    '@babel/plugin-transform-runtime',
  ],
};
