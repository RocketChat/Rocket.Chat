module.export({LocalWeekYearParser:()=>LocalWeekYearParser});let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},0);let parseNDigits,normalizeTwoDigitYear,mapValue;module.link("../utils.js",{parseNDigits(v){parseNDigits=v},normalizeTwoDigitYear(v){normalizeTwoDigitYear=v},mapValue(v){mapValue=v}},1);let getUTCWeekYear;module.link("../../../_lib/getUTCWeekYear/index.js",{default(v){getUTCWeekYear=v}},2);let startOfUTCWeek;module.link("../../../_lib/startOfUTCWeek/index.js",{default(v){startOfUTCWeek=v}},3);function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }





// Local week-numbering year
class LocalWeekYearParser extends Parser {
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
        return mapValue(parseNDigits(4, dateString), valueCallback);

      case 'Yo':
        return mapValue(match.ordinalNumber(dateString, {
          unit: 'year'
        }), valueCallback);

      default:
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
    }
  }

  validate(_date, value) {
    return value.isTwoDigitYear || value.year > 0;
  }

  set(date, flags, value, options) {
    var currentYear = getUTCWeekYear(date, options);

    if (value.isTwoDigitYear) {
      var normalizedTwoDigitYear = normalizeTwoDigitYear(value.year, currentYear);
      date.setUTCFullYear(normalizedTwoDigitYear, 0, options.firstWeekContainsDate);
      date.setUTCHours(0, 0, 0, 0);
      return startOfUTCWeek(date, options);
    }

    var year = !('era' in flags) || flags.era === 1 ? value.year : 1 - value.year;
    date.setUTCFullYear(year, 0, options.firstWeekContainsDate);
    date.setUTCHours(0, 0, 0, 0);
    return startOfUTCWeek(date, options);
  }

}