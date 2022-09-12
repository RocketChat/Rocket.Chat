"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LocalWeekYearParser = void 0;

var _Parser = require("../Parser.js");

var _utils = require("../utils.js");

var _index = _interopRequireDefault(require("../../../_lib/getUTCWeekYear/index.js"));

var _index2 = _interopRequireDefault(require("../../../_lib/startOfUTCWeek/index.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// Local week-numbering year
class LocalWeekYearParser extends _Parser.Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 130);

    _defineProperty(this, "incompatibleTokens", ['y', 'R', 'u', 'Q', 'q', 'M', 'L', 'I', 'd', 'D', 'i', 't', 'T']);
  }

  parse(dateString, token, match) {
    var valueCallback = function (year) {
      return {
        year: year,
        isTwoDigitYear: token === 'YY'
      };
    };

    switch (token) {
      case 'Y':
        return (0, _utils.mapValue)((0, _utils.parseNDigits)(4, dateString), valueCallback);

      case 'Yo':
        return (0, _utils.mapValue)(match.ordinalNumber(dateString, {
          unit: 'year'
        }), valueCallback);

      default:
        return (0, _utils.mapValue)((0, _utils.parseNDigits)(token.length, dateString), valueCallback);
    }
  }

  validate(_date, value) {
    return value.isTwoDigitYear || value.year > 0;
  }

  set(date, flags, value, options) {
    var currentYear = (0, _index.default)(date, options);

    if (value.isTwoDigitYear) {
      var normalizedTwoDigitYear = (0, _utils.normalizeTwoDigitYear)(value.year, currentYear);
      date.setUTCFullYear(normalizedTwoDigitYear, 0, options.firstWeekContainsDate);
      date.setUTCHours(0, 0, 0, 0);
      return (0, _index2.default)(date, options);
    }

    var year = !('era' in flags) || flags.era === 1 ? value.year : 1 - value.year;
    date.setUTCFullYear(year, 0, options.firstWeekContainsDate);
    date.setUTCHours(0, 0, 0, 0);
    return (0, _index2.default)(date, options);
  }

}

exports.LocalWeekYearParser = LocalWeekYearParser;