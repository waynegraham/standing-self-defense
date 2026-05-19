module.exports = ({ env }) => ({
  plugins: {
    'postcss-nested': {},
    '@tailwindcss/postcss': {},
    cssnano:
      env === 'production'
        ? {
            preset: ['default', { discardComments: { removeAll: true } }],
          }
        : false,
  },
});
