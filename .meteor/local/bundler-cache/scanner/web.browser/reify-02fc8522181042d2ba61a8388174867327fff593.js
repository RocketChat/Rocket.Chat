module.export({MonthParser:()=>MonthParser});let mapValue,parseNDigits,parseNumericPattern;module.link("../utils.js",{mapValue(v){mapValue=v},parseNDigits(v){parseNDigits=v},parseNumericPattern(v){parseNumericPattern=v}},0);let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},1);let numericPatterns;module.link("../constants.js",{numericPatterns(v){numericPatterns=v}},2);function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }




class MonthParser extends Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "incompatibleTokens", ['Y', 'R', 'q', 'Q', 'L', 'w', 'I', 'D', 'i', 'e', 'c', 't', 'T']);

    _defineProperty(this, "priority", 110);
  }

  parse(dateString, token, match) {
    var valueCallback = function (value) {
      return value - 1;
    };

    switch (token) {
      // 1, 2, ..., 12
      case 'M':
        return mapValue(parseNumericPattern(numericPatterns.month, dateString), valueCallback);
      // 01, 02, ..., 12

      case 'MM':
        return mapValue(parseNDigits(2, dateString), valueCallback);
      // 1st, 2nd, ..., 12th

      case 'Mo':
        return mapValue(match.ordinalNumber(dateString, {
          unit: 'month'
        }), valueCallback);
      // Jan, Feb, ..., Dec

      case 'MMM':
        return match.month(dateString, {
          width: 'abbreviated',
          context: 'formatting'
        }) || match.month(dateString, {
          width: 'narrow',
          context: 'formatting'
        });
      // J, F, ..., D

      case 'MMMMM':
        return match.month(dateString, {
          width: 'narrow',
          context: 'formatting'
        });
      // January, February, ..., December

      case 'MMMM':
      default:
        return match.month(dateString, {
          width: 'wide',
          context: 'formatting'
        }) || match.month(dateString, {
          width: 'abbreviated',
          context: 'formatting'
        }) || match.month(dateString, {
          width: 'narrow',
          context: 'formatting'
        });
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 11;
  }

  set(date, _flags, value) {
    date.setUTCMonth(value, 1);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

}