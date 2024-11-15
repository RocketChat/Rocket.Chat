/* eslint-disable import/no-unresolved */

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/messageParser.production.js');
} else {
  module.exports = require('./dist/messageParser.development.js');
}
