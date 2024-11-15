"use strict";
exports.TimestampMillisecondsParser = void 0;
var _index = require("../../../constructFrom.js");
var _Parser = require("../Parser.js");

var _utils = require("../utils.js");

class TimestampMillisecondsParser extends _Parser.Parser {
  priority = 20;

  parse(dateString) {
    return (0, _utils.parseAnyDigitsSigned)(dateString);
  }

  set(date, _flags, value) {
    return [(0, _index.constructFrom)(date, value), { timestampIsSet: true }];
  }

  incompatibleTokens = "*";
}
exports.TimestampMillisecondsParser = TimestampMillisecondsParser;
