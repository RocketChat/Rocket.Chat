
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./urx.cjs.production.min.js')
} else {
  module.exports = require('./urx.cjs.development.js')
}
