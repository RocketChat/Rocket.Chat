'use strict'
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./react-spring_shared.production.min.cjs')
} else {
  module.exports = require('./react-spring_shared.development.cjs')
}