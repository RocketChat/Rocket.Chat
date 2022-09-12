"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Hour0To11Parser = void 0;

var _Parser = require("../Parser.js");

var _constants = require("../constants.js");

var _utils = require("../utils.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Hour0To11Parser extends _Parser.Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 70);

    _defineProperty(this, "incompatibleTokens", ['h', 'H', 'k', 't', 'T']);
  }

  parse(dateString, token, match) {
    switch (token) {
      case 'K':
        return (0, _utils.parseNumericPattern)(_constants.numericPatterns.hour11h, dateString);

      case 'Ko':
        return match.ordinalNumber(dateString, {
          unit: 'hour'
        });

      default:
        return (0, _utils.parseNDigits)(token.length, dateString);
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 11;
  }

  set(date, _flags, value) {
    var isPM = date.getUTCHours() >= 12;

    if (isPM && value < 12) {
      date.setUTCHours(value + 12, 0, 0, 0);
    } else {
      date.setUTCHours(value, 0, 0, 0);
    }

    return date;
  }

}

exports.Hour0To11Parser = Hour0To11Parser;