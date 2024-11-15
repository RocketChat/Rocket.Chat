'use strict'

var defineProperty = require('util-ex/lib/defineProperty')
var db = require('mime-db')
var MimeType = require('./lib/mime-type')

module.exports = MimeType(db)
defineProperty(module.exports, 'default', module.exports)

