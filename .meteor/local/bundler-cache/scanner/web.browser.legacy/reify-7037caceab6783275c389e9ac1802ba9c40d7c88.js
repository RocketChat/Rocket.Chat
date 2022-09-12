"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DateParser = void 0;

var _utils = require("../utils.js");

var _Parser = require("../Parser.js");

var _constants = require("../constants.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var DAYS_IN_MONTH_LEAP_YEAR = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // Day of the month

class DateParser extends _Parser.Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 90);

    _defineProperty(this, "subPriority", 1);

    _defineProperty(this, "incompatibleTokens", ['Y', 'R', 'q', 'Q', 'w', 'I', 'D', 'i', 'e', 'c', 't', 'T']);
  }

  parse(dateString, token, match) {
    switch (token) {
      case 'd':
        return (0, _utils.parseNumericPattern)(_constants.numericPatterns.date, dateString);

      case 'do':
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
    var month = date.getUTCMonth();

    if (isLeapYear) {
      return value >= 1 && value <= DAYS_IN_MONTH_LEAP_YEAR[month];
    } else {
      return value >= 1 && value <= DAYS_IN_MONTH[month];
    }
  }

  set(date, _flags, value) {
    date.setUTCDate(value);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

}

exports.DateParser = DateParser;