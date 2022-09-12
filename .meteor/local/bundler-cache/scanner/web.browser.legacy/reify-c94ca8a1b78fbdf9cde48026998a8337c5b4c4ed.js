"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ISOWeekYearParser = void 0;

var _Parser = require("../Parser.js");

var _utils = require("../utils.js");

var _index = _interopRequireDefault(require("../../../_lib/startOfUTCISOWeek/index.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// ISO week-numbering year
class ISOWeekYearParser extends _Parser.Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 130);

    _defineProperty(this, "incompatibleTokens", ['G', 'y', 'Y', 'u', 'Q', 'q', 'M', 'L', 'w', 'd', 'D', 'e', 'c', 't', 'T']);
  }

  parse(dateString, token) {
    if (token === 'R') {
      return (0, _utils.parseNDigitsSigned)(4, dateString);
    }

    return (0, _utils.parseNDigitsSigned)(token.length, dateString);
  }

  set(_date, _flags, value) {
    var firstWeekOfYear = new Date(0);
    firstWeekOfYear.setUTCFullYear(value, 0, 4);
    firstWeekOfYear.setUTCHours(0, 0, 0, 0);
    return (0, _index.default)(firstWeekOfYear);
  }

}

exports.ISOWeekYearParser = ISOWeekYearParser;