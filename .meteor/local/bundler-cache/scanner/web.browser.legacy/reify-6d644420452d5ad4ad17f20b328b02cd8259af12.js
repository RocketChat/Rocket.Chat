
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./react-virtuoso.cjs.production.min.js')
} else {
  module.exports = require('./react-virtuoso.cjs.development.js')
}
