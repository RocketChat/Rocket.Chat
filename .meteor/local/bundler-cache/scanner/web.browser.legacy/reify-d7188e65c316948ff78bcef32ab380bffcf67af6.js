"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ISOTimezoneWithZParser = void 0;

var _Parser = require("../Parser.js");

var _constants = require("../constants.js");

var _utils = require("../utils.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Timezone (ISO-8601. +00:00 is `'Z'`)
class ISOTimezoneWithZParser extends _Parser.Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 10);

    _defineProperty(this, "incompatibleTokens", ['t', 'T', 'x']);
  }

  parse(dateString, token) {
    switch (token) {
      case 'X':
        return (0, _utils.parseTimezonePattern)(_constants.timezonePatterns.basicOptionalMinutes, dateString);

      case 'XX':
        return (0, _utils.parseTimezonePattern)(_constants.timezonePatterns.basic, dateString);

      case 'XXXX':
        return (0, _utils.parseTimezonePattern)(_constants.timezonePatterns.basicOptionalSeconds, dateString);

      case 'XXXXX':
        return (0, _utils.parseTimezonePattern)(_constants.timezonePatterns.extendedOptionalSeconds, dateString);

      case 'XXX':
      default:
        return (0, _utils.parseTimezonePattern)(_constants.timezonePatterns.extended, dateString);
    }
  }

  set(date, flags, value) {
    if (flags.timestampIsSet) {
      return date;
    }

    return new Date(date.getTime() - value);
  }

}

exports.ISOTimezoneWithZParser = ISOTimezoneWithZParser;