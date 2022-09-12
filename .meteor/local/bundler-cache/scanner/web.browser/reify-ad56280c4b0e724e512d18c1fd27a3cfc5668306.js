module.export({TimestampMillisecondsParser:()=>TimestampMillisecondsParser});let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},0);let parseAnyDigitsSigned;module.link("../utils.js",{parseAnyDigitsSigned(v){parseAnyDigitsSigned=v}},1);function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



class TimestampMillisecondsParser extends Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 20);

    _defineProperty(this, "incompatibleTokens", '*');
  }

  parse(dateString) {
    return parseAnyDigitsSigned(dateString);
  }

  set(_date, _flags, value) {
    return [new Date(value), {
      timestampIsSet: true
    }];
  }

}