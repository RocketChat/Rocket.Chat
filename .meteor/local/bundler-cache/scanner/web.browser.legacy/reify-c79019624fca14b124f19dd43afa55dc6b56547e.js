"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TimestampSecondsParser = void 0;

var _Parser = require("../Parser.js");

var _utils = require("../utils.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class TimestampSecondsParser extends _Parser.Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 40);

    _defineProperty(this, "incompatibleTokens", '*');
  }

  parse(dateString) {
    return (0, _utils.parseAnyDigitsSigned)(dateString);
  }

  set(_date, _flags, value) {
    return [new Date(value * 1000), {
      timestampIsSet: true
    }];
  }

}

exports.TimestampSecondsParser = TimestampSecondsParser;