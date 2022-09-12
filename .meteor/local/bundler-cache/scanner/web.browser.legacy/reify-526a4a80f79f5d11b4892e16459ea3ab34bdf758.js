"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DayOfYearParser = void 0;

var _Parser = require("../Parser.js");

var _constants = require("../constants.js");

var _utils = require("../utils.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class DayOfYearParser extends _Parser.Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 90);

    _defineProperty(this, "subpriority", 1);

    _defineProperty(this, "incompatibleTokens", ['Y', 'R', 'q', 'Q', 'M', 'L', 'w', 'I', 'd', 'E', 'i', 'e', 'c', 't', 'T']);
  }

  parse(dateString, token, match) {
    switch (token) {
      case 'D':
      case 'DD':
        return (0, _utils.parseNumericPattern)(_constants.numericPatterns.dayOfYear, dateString);

      case 'Do':
        return match.ordinalNumber(dateString, {
          unit: 'date'
        });

      default:
        return (0, _utils.parseNDigits)(token.length, dateString);
    }
  }

  validate(date, value) {
    var year = date.getUTCFullYear();
    var isLeapYear = (0, _utils.isLeapYearIndex)(year);

    if (isLeapYear) {
      return value >= 1 && value <= 366;
    } else {
      return value >= 1 && value <= 365;
    }
  }

  set(date, _flags, value) {
    date.setUTCMonth(0, value);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

}

exports.DayOfYearParser = DayOfYearParser;