"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ISOTimezoneParser = void 0;

var _Parser = require("../Parser.js");

var _constants = require("../constants.js");

var _utils = require("../utils.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Timezone (ISO-8601)
class ISOTimezoneParser extends _Parser.Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 10);

    _defineProperty(this, "incompatibleTokens", ['t', 'T', 'X']);
  }

  parse(dateString, token) {
    switch (token) {
      case 'x':
        return (0, _utils.parseTimezonePattern)(_constants.timezonePatterns.basicOptionalMinutes, dateString);

      case 'xx':
        return (0, _utils.parseTimezonePattern)(_constants.timezonePatterns.basic, dateString);

      case 'xxxx':
        return (0, _utils.parseTimezonePattern)(_constants.timezonePatterns.basicOptionalSeconds, dateString);

      case 'xxxxx':
        return (0, _utils.parseTimezonePattern)(_constants.timezonePatterns.extendedOptionalSeconds, dateString);

      case 'xxx':
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

exports.ISOTimezoneParser = ISOTimezoneParser;