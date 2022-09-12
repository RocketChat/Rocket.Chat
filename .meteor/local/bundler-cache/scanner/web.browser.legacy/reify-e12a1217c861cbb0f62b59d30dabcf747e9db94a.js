"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StandAloneLocalDayParser = void 0;

var _Parser = require("../Parser.js");

var _utils = require("../utils.js");

var _index = _interopRequireDefault(require("../../../_lib/setUTCDay/index.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Stand-alone local day of week
class StandAloneLocalDayParser extends _Parser.Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 90);

    _defineProperty(this, "incompatibleTokens", ['y', 'R', 'u', 'q', 'Q', 'M', 'L', 'I', 'd', 'D', 'E', 'i', 'e', 't', 'T']);
  }

  parse(dateString, token, match, options) {
    var valueCallback = function (value) {
      var wholeWeekDays = Math.floor((value - 1) / 7) * 7;
      return (value + options.weekStartsOn + 6) % 7 + wholeWeekDays;
    };

    switch (token) {
      // 3
      case 'c':
      case 'cc':
        // 03
        return (0, _utils.mapValue)((0, _utils.parseNDigits)(token.length, dateString), valueCallback);
      // 3rd

      case 'co':
        return (0, _utils.mapValue)(match.ordinalNumber(dateString, {
          unit: 'day'
        }), valueCallback);
      // Tue

      case 'ccc':
        return match.day(dateString, {
          width: 'abbreviated',
          context: 'standalone'
        }) || match.day(dateString, {
          width: 'short',
          context: 'standalone'
        }) || match.day(dateString, {
          width: 'narrow',
          context: 'standalone'
        });
      // T

      case 'ccccc':
        return match.day(dateString, {
          width: 'narrow',
          context: 'standalone'
        });
      // Tu

      case 'cccccc':
        return match.day(dateString, {
          width: 'short',
          context: 'standalone'
        }) || match.day(dateString, {
          width: 'narrow',
          context: 'standalone'
        });
      // Tuesday

      case 'cccc':
      default:
        return match.day(dateString, {
          width: 'wide',
          context: 'standalone'
        }) || match.day(dateString, {
          width: 'abbreviated',
          context: 'standalone'
        }) || match.day(dateString, {
          width: 'short',
          context: 'standalone'
        }) || match.day(dateString, {
          width: 'narrow',
          context: 'standalone'
        });
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 6;
  }

  set(date, _flags, value, options) {
    date = (0, _index.default)(date, value, options);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

}

exports.StandAloneLocalDayParser = StandAloneLocalDayParser;