"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MinuteParser = void 0;

var _Parser = require("../Parser.js");

var _constants = require("../constants.js");

var _utils = require("../utils.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class MinuteParser extends _Parser.Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 60);

    _defineProperty(this, "incompatibleTokens", ['t', 'T']);
  }

  parse(dateString, token, match) {
    switch (token) {
      case 'm':
        return (0, _utils.parseNumericPattern)(_constants.numericPatterns.minute, dateString);

      case 'mo':
        return match.ordinalNumber(dateString, {
          unit: 'minute'
        });

      default:
        return (0, _utils.parseNDigits)(token.length, dateString);
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 59;
  }

  set(date, _flags, value) {
    date.setUTCMinutes(value, 0, 0);
    return date;
  }

}

exports.MinuteParser = MinuteParser;