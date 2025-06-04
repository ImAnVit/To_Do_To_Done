module.exports = {
  presets: [
    ['@babel/preset-env', {
      modules: 'commonjs',
      targets: {
        browsers: ['> 1%', 'last 2 versions']
      }
    }]
  ],
  plugins: [
    ['@babel/plugin-transform-runtime', {
      corejs: false,
      helpers: true,
      regenerator: true,
      useESModules: false
    }]
  ]
};
