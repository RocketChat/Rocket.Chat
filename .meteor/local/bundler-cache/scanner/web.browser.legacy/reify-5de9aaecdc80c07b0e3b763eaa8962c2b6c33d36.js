"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hour0to23Parser = void 0;

var _Parser = require("../Parser.js");

var _constants = require("../constants.js");

var _utils = require("../utils.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Hour0to23Parser extends _Parser.Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 70);

    _defineProperty(this, "incompatibleTokens", ['a', 'b', 'h', 'K', 'k', 't', 'T']);
  }

  parse(dateString, token, match) {
    switch (token) {
      case 'H':
        return (0, _utils.parseNumericPattern)(_constants.numericPatterns.hour23h, dateString);

      case 'Ho':
        return match.ordinalNumber(dateString, {
          unit: 'hour'
        });

      default:
        return (0, _utils.parseNDigits)(token.length, dateString);
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 23;
  }

  set(date, _flags, value) {
    date.setUTCHours(value, 0, 0, 0);
    return date;
  }

}

exports.Hour0to23Parser = Hour0to23Parser;