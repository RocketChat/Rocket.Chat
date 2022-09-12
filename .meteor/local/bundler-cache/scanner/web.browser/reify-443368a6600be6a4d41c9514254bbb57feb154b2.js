module.export({DayPeriodParser:()=>DayPeriodParser});let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},0);let dayPeriodEnumToHours;module.link("../utils.js",{dayPeriodEnumToHours(v){dayPeriodEnumToHours=v}},1);function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }


 // in the morning, in the afternoon, in the evening, at night

class DayPeriodParser extends Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 80);

    _defineProperty(this, "incompatibleTokens", ['a', 'b', 't', 'T']);
  }

  parse(dateString, token, match) {
    switch (token) {
      case 'B':
      case 'BB':
      case 'BBB':
        return match.dayPeriod(dateString, {
          width: 'abbreviated',
          context: 'formatting'
        }) || match.dayPeriod(dateString, {
          width: 'narrow',
          context: 'formatting'
        });

      case 'BBBBB':
        return match.dayPeriod(dateString, {
          width: 'narrow',
          context: 'formatting'
        });

      case 'BBBB':
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