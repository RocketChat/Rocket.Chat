module.export({ExtendedYearParser:()=>ExtendedYearParser});let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},0);let parseNDigitsSigned;module.link("../utils.js",{parseNDigitsSigned(v){parseNDigitsSigned=v}},1);function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



class ExtendedYearParser extends Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 130);

    _defineProperty(this, "incompatibleTokens", ['G', 'y', 'Y', 'R', 'w', 'I', 'i', 'e', 'c', 't', 'T']);
  }

  parse(dateString, token) {
    if (token === 'u') {
      return parseNDigitsSigned(4, dateString);
    }

    return parseNDigitsSigned(token.length, dateString);
  }

  set(date, _flags, value) {
    date.setUTCFullYear(value, 0, 1);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

}