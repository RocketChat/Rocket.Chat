"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ISODayParser = void 0;

var _Parser = require("../Parser.js");

var _utils = require("../utils.js");

var _index = _interopRequireDefault(require("../../../_lib/setUTCISODay/index.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// ISO day of week
class ISODayParser extends _Parser.Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 90);

    _defineProperty(this, "incompatibleTokens", ['y', 'Y', 'u', 'q', 'Q', 'M', 'L', 'w', 'd', 'D', 'E', 'e', 'c', 't', 'T']);
  }

  parse(dateString, token, match) {
    var valueCallback = function (value) {
      if (value === 0) {
        return 7;
      }

      return value;
    };

    switch (token) {
      // 2
      case 'i':
      case 'ii':
        // 02
        return (0, _utils.parseNDigits)(token.length, dateString);
      // 2nd

      case 'io':
        return match.ordinalNumber(dateString, {
          unit: 'day'
        });
      // Tue

      case 'iii':
        return (0, _utils.mapValue)(match.day(dateString, {
          width: 'abbreviated',
          context: 'formatting'
        }) || match.day(dateString, {
          width: 'short',
          context: 'formatting'
        }) || match.day(dateString, {
          width: 'narrow',
          context: 'formatting'
        }), valueCallback);
      // T

      case 'iiiii':
        return (0, _utils.mapValue)(match.day(dateString, {
          width: 'narrow',
          context: 'formatting'
        }), valueCallback);
      // Tu

      case 'iiiiii':
        return (0, _utils.mapValue)(match.day(dateString, {
          width: 'short',
          context: 'formatting'
        }) || match.day(dateString, {
          width: 'narrow',
          context: 'formatting'
        }), valueCallback);
      // Tuesday

      case 'iiii':
      default:
        return (0, _utils.mapValue)(match.day(dateString, {
          width: 'wide',
          context: 'formatting'
        }) || match.day(dateString, {
          width: 'abbreviated',
          context: 'formatting'
        }) || match.day(dateString, {
          width: 'short',
          context: 'formatting'
        }) || match.day(dateString, {
          width: 'narrow',
          context: 'formatting'
        }), valueCallback);
    }
  }

  validate(_date, value) {
    return value >= 1 && value <= 7;
  }

  set(date, _flags, value) {
    date = (0, _index.default)(date, value);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

}

exports.ISODayParser = ISODayParser;