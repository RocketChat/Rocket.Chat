"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SecondParser = void 0;

var _Parser = require("../Parser.js");

var _constants = require("../constants.js");

var _utils = require("../utils.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class SecondParser extends _Parser.Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 50);

    _defineProperty(this, "incompatibleTokens", ['t', 'T']);
  }

  parse(dateString, token, match) {
    switch (token) {
      case 's':
        return (0, _utils.parseNumericPattern)(_constants.numericPatterns.second, dateString);

      case 'so':
        return match.ordinalNumber(dateString, {
          unit: 'second'
        });

      default:
        return (0, _utils.parseNDigits)(token.length, dateString);
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 59;
  }

  set(date, _flags, value) {
    date.setUTCSeconds(value, 0);
    return date;
  }

}

exports.SecondParser = SecondParser;