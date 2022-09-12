module.export({AMPMParser:()=>AMPMParser});let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},0);let dayPeriodEnumToHours;module.link("../utils.js",{dayPeriodEnumToHours(v){dayPeriodEnumToHours=v}},1);function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



class AMPMParser extends Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 80);

    _defineProperty(this, "incompatibleTokens", ['b', 'B', 'H', 'k', 't', 'T']);
  }

  parse(dateString, token, match) {
    switch (token) {
      case 'a':
      case 'aa':
      case 'aaa':
        return match.dayPeriod(dateString, {
          width: 'abbreviated',
          context: 'formatting'
        }) || match.dayPeriod(dateString, {
          width: 'narrow',
          context: 'formatting'
        });

      case 'aaaaa':
        return match.dayPeriod(dateString, {
          width: 'narrow',
          context: 'formatting'
        });

      case 'aaaa':
      default:
        return match.dayPeriod(dateString, {
          width: 'wide',
          context: 'formatting'
        }) || match.dayPeriod(dateString, {
          width: 'abbreviated',
          context: 'formatting'
        }) || match.dayPeriod(dateString, {
          width: 'narrow',
          context: 'formatting'
        });
    }
  }

  set(date, _flags, value) {
    date.setUTCHours(dayPeriodEnumToHours(value), 0, 0, 0);
    return date;
  }

}