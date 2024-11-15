"use strict";
exports.MinuteParser = void 0;
var _constants = require("../constants.js");
var _Parser = require("../Parser.js");

var _utils = require("../utils.js");

class MinuteParser extends _Parser.Parser {
  priority = 60;

  parse(dateString, token, match) {
    switch (token) {
      case "m":
        return (0, _utils.parseNumericPattern)(
          _constants.numericPatterns.minute,
          dateString,
        );
      case "mo":
        return match.ordinalNumber(dateString, { unit: "minute" });
      default:
        return (0, _utils.parseNDigits)(token.length, dateString);
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 59;
  }

  set(date, _flags, value) {
    date.setMinutes(value, 0, 0);
    return date;
  }

  incompatibleTokens = ["t", "T"];
}
exports.MinuteParser = MinuteParser;
