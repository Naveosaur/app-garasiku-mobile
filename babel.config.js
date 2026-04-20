module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins: [
      // NativeWind uses Reanimated in some cases, so keep the official plugin enabled.
      'react-native-reanimated/plugin',
      // Support TypeScript path aliases (@/*)
      [
        'module-resolver',
        {
          alias: {
            '@': '.',
          },
        },
      ],
    ],
  };
};

