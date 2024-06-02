const path = require('path');

module.exports = {
  coverageReporters: [],
  transform: {
    '\\.pegjs$': path.resolve(__dirname, './loaders/pegtransform.js'),
  },
  preset: 'ts-jest',
  errorOnDeprecated: true,
  testMatch: ['<rootDir>/tests/**/*.(spec|test).ts'],
  moduleFileExtensions: ['js', 'ts', 'pegjs'],
};
