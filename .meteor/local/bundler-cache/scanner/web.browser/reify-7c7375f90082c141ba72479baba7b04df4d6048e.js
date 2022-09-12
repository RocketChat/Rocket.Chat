module.export({StandAloneQuarterParser:()=>StandAloneQuarterParser});let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},0);let parseNDigits;module.link("../utils.js",{parseNDigits(v){parseNDigits=v}},1);function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



class StandAloneQuarterParser extends Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 120);

    _defineProperty(this, "incompatibleTokens", ['Y', 'R', 'Q', 'M', 'L', 'w', 'I', 'd', 'D', 'i', 'e', 'c', 't', 'T']);
  }

  parse(dateString, token, match) {
    switch (token) {
      // 1, 2, 3, 4
      case 'q':
      case 'qq':
        // 01, 02, 03, 04
        return parseNDigits(token.length, dateString);
      // 1st, 2nd, 3rd, 4th

      case 'qo':
        return match.ordinalNumber(dateString, {
          unit: 'quarter'
        });
      // Q1, Q2, Q3, Q4

      case 'qqq':
        return match.quarter(dateString, {
          width: 'abbreviated',
          context: 'standalone'
        }) || match.quarter(dateString, {
          width: 'narrow',
          context: 'standalone'
        });
      // 1, 2, 3, 4 (narrow quarter; could be not numerical)

      case 'qqqqq':
        return match.quarter(dateString, {
          width: 'narrow',
          context: 'standalone'
        });
      // 1st quarter, 2nd quarter, ...

      case 'qqqq':
      default:
        return match.quarter(dateString, {
          width: 'wide',
          context: 'standalone'
        }) || match.quarter(dateString, {
          width: 'abbreviated',
          context: 'standalone'
        }) || match.quarter(dateString, {
          width: 'narrow',
          context: 'standalone'
        });
    }
  }

  validate(_date, value) {
    return value >= 1 && value <= 4;
  }

  set(date, _flags, value) {
    date.setUTCMonth((value - 1) * 3, 1);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

}