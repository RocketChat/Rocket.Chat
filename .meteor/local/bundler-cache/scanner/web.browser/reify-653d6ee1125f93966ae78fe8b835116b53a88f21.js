module.export({DayOfYearParser:()=>DayOfYearParser});let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},0);let numericPatterns;module.link("../constants.js",{numericPatterns(v){numericPatterns=v}},1);let parseNumericPattern,parseNDigits,isLeapYearIndex;module.link("../utils.js",{parseNumericPattern(v){parseNumericPattern=v},parseNDigits(v){parseNDigits=v},isLeapYearIndex(v){isLeapYearIndex=v}},2);function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }




class DayOfYearParser extends Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 90);

    _defineProperty(this, "subpriority", 1);

    _defineProperty(this, "incompatibleTokens", ['Y', 'R', 'q', 'Q', 'M', 'L', 'w', 'I', 'd', 'E', 'i', 'e', 'c', 't', 'T']);
  }

  parse(dateString, token, match) {
    switch (token) {
      case 'D':
      case 'DD':
        return parseNumericPattern(numericPatterns.dayOfYear, dateString);

      case 'Do':
        return match.ordinalNumber(dateString, {
          unit: 'date'
        });

      default:
        return parseNDigits(token.length, dateString);
    }
  }

  validate(date, value) {
    var year = date.getUTCFullYear();
    var isLeapYear = isLeapYearIndex(year);

    if (isLeapYear) {
      return value >= 1 && value <= 366;
    } else {
      return value >= 1 && value <= 365;
    }
  }

  set(date, _flags, value) {
    date.setUTCMonth(0, value);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

}