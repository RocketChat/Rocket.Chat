'use strict'
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./react-spring_core.production.min.cjs')
} else {
  module.exports = require('./react-spring_core.development.cjs')
}