module.export({ISOWeekParser:()=>ISOWeekParser});let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},0);let numericPatterns;module.link("../constants.js",{numericPatterns(v){numericPatterns=v}},1);let parseNumericPattern,parseNDigits;module.link("../utils.js",{parseNumericPattern(v){parseNumericPattern=v},parseNDigits(v){parseNDigits=v}},2);let setUTCISOWeek;module.link("../../../_lib/setUTCISOWeek/index.js",{default(v){setUTCISOWeek=v}},3);let startOfUTCISOWeek;module.link("../../../_lib/startOfUTCISOWeek/index.js",{default(v){startOfUTCISOWeek=v}},4);function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }





 // ISO week of year

class ISOWeekParser extends Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 100);

    _defineProperty(this, "incompatibleTokens", ['y', 'Y', 'u', 'q', 'Q', 'M', 'L', 'w', 'd', 'D', 'e', 'c', 't', 'T']);
  }

  parse(dateString, token, match) {
    switch (token) {
      case 'I':
        return parseNumericPattern(numericPatterns.week, dateString);

      case 'Io':
        return match.ordinalNumber(dateString, {
          unit: 'week'
        });

      default:
        return parseNDigits(token.length, dateString);
    }
  }

  validate(_date, value) {
    return value >= 1 && value <= 53;
  }

  set(date, _flags, value) {
    return startOfUTCISOWeek(setUTCISOWeek(date, value));
  }

}