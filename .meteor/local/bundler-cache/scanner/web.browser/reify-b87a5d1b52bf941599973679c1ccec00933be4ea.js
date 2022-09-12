module.export({LocalWeekParser:()=>LocalWeekParser});let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},0);let numericPatterns;module.link("../constants.js",{numericPatterns(v){numericPatterns=v}},1);let parseNumericPattern,parseNDigits;module.link("../utils.js",{parseNumericPattern(v){parseNumericPattern=v},parseNDigits(v){parseNDigits=v}},2);let setUTCWeek;module.link("../../../_lib/setUTCWeek/index.js",{default(v){setUTCWeek=v}},3);let startOfUTCWeek;module.link("../../../_lib/startOfUTCWeek/index.js",{default(v){startOfUTCWeek=v}},4);function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }





 // Local week of year

class LocalWeekParser extends Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 100);

    _defineProperty(this, "incompatibleTokens", ['y', 'R', 'u', 'q', 'Q', 'M', 'L', 'I', 'd', 'D', 'i', 't', 'T']);
  }

  parse(dateString, token, match) {
    switch (token) {
      case 'w':
        return parseNumericPattern(numericPatterns.week, dateString);

      case 'wo':
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

  set(date, _flags, value, options) {
    return startOfUTCWeek(setUTCWeek(date, value, options), options);
  }

}