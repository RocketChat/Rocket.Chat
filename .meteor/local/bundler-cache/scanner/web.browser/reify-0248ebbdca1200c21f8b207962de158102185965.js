module.export({ISOWeekYearParser:()=>ISOWeekYearParser});let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},0);let parseNDigitsSigned;module.link("../utils.js",{parseNDigitsSigned(v){parseNDigitsSigned=v}},1);let startOfUTCISOWeek;module.link("../../../_lib/startOfUTCISOWeek/index.js",{default(v){startOfUTCISOWeek=v}},2);function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



 // ISO week-numbering year

class ISOWeekYearParser extends Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 130);

    _defineProperty(this, "incompatibleTokens", ['G', 'y', 'Y', 'u', 'Q', 'q', 'M', 'L', 'w', 'd', 'D', 'e', 'c', 't', 'T']);
  }

  parse(dateString, token) {
    if (token === 'R') {
      return parseNDigitsSigned(4, dateString);
    }

    return parseNDigitsSigned(token.length, dateString);
  }

  set(_date, _flags, value) {
    var firstWeekOfYear = new Date(0);
    firstWeekOfYear.setUTCFullYear(value, 0, 4);
    firstWeekOfYear.setUTCHours(0, 0, 0, 0);
    return startOfUTCISOWeek(firstWeekOfYear);
  }

}