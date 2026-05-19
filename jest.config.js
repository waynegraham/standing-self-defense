/**
 * Jest configuration
 */
module.exports = {
  cache: false,
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./tests/setup.js'],
  transformIgnorePatterns: ['/node_modules/(?!linkinator)'],
};
