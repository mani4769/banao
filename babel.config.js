module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',        // keep this if you're using expo
      '@babel/preset-flow',       // add this line
    ],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
      }],
    ],
  };
};
