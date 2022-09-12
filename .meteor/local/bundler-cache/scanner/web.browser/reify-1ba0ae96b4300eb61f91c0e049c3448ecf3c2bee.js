module.export({DayParser:()=>DayParser});let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},0);let setUTCDay;module.link("../../../_lib/setUTCDay/index.js",{default(v){setUTCDay=v}},1);function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }


 // Day of week

class DayParser extends Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 90);

    _defineProperty(this, "incompatibleTokens", ['D', 'i', 'e', 'c', 't', 'T']);
  }

  parse(dateString, token, match) {
    switch (token) {
      // Tue
      case 'E':
      case 'EE':
      case 'EEE':
        return match.day(dateString, {
          width: 'abbreviated',
          context: 'formatting'
        }) || match.day(dateString, {
          width: 'short',
          context: 'formatting'
        }) || match.day(dateString, {
          width: 'narrow',
          context: 'formatting'
        });
      // T

      case 'EEEEE':
        return match.day(dateString, {
          width: 'narrow',
          context: 'formatting'
        });
      // Tu

      case 'EEEEEE':
        return match.day(dateString, {
          width: 'short',
          context: 'formatting'
        }) || match.day(dateString, {
          width: 'narrow',
          context: 'formatting'
        });
      // Tuesday

      case 'EEEE':
      default:
        return match.day(dateString, {
          width: 'wide',
          context: 'formatting'
        }) || match.day(dateString, {
          width: 'abbreviated',
          context: 'formatting'
        }) || match.day(dateString, {
          width: 'short',
          context: 'formatting'
        }) || match.day(dateString, {
          width: 'narrow',
          context: 'formatting'
        });
    }
  }

  validate(_date, value) {
    return value >= 0 && value <= 6;
  }

  set(date, _flags, value, options) {
    date = setUTCDay(date, value, options);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

}