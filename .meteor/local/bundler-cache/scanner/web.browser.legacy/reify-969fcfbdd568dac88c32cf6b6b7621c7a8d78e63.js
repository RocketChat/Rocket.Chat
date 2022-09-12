
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./react-urx.cjs.production.min.js')
} else {
  module.exports = require('./react-urx.cjs.development.js')
}
