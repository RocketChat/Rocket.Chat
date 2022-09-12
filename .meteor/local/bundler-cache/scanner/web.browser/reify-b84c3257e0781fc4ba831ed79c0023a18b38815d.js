module.export({YearParser:()=>YearParser});let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},0);let mapValue,normalizeTwoDigitYear,parseNDigits;module.link("../utils.js",{mapValue(v){mapValue=v},normalizeTwoDigitYear(v){normalizeTwoDigitYear=v},parseNDigits(v){parseNDigits=v}},1);function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



// From http://www.unicode.org/reports/tr35/tr35-31/tr35-dates.html#Date_Format_Patterns
// | Year     |     y | yy |   yyy |  yyyy | yyyyy |
// |----------|-------|----|-------|-------|-------|
// | AD 1     |     1 | 01 |   001 |  0001 | 00001 |
// | AD 12    |    12 | 12 |   012 |  0012 | 00012 |
// | AD 123   |   123 | 23 |   123 |  0123 | 00123 |
// | AD 1234  |  1234 | 34 |  1234 |  1234 | 01234 |
// | AD 12345 | 12345 | 45 | 12345 | 12345 | 12345 |
class YearParser extends Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 130);

    _defineProperty(this, "incompatibleTokens", ['Y', 'R', 'u', 'w', 'I', 'i', 'e', 'c', 't', 'T']);
  }

  parse(dateString, token, match) {
    var valueCallback = function (year) {
      return {
        year: year,
        isTwoDigitYear: token === 'yy'
      };
    };

    switch (token) {
      case 'y':
        return mapValue(parseNDigits(4, dateString), valueCallback);

      case 'yo':
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

  set(date, flags, value) {
    var currentYear = date.getUTCFullYear();

    if (value.isTwoDigitYear) {
      var normalizedTwoDigitYear = normalizeTwoDigitYear(value.year, currentYear);
      date.setUTCFullYear(normalizedTwoDigitYear, 0, 1);
      date.setUTCHours(0, 0, 0, 0);
      return date;
    }

    var year = !('era' in flags) || flags.era === 1 ? value.year : 1 - value.year;
    date.setUTCFullYear(year, 0, 1);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

}