module.export({ISODayParser:()=>ISODayParser});let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},0);let mapValue,parseNDigits;module.link("../utils.js",{mapValue(v){mapValue=v},parseNDigits(v){parseNDigits=v}},1);let setUTCISODay;module.link("../../../_lib/setUTCISODay/index.js",{default(v){setUTCISODay=v}},2);function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



 // ISO day of week

class ISODayParser extends Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 90);

    _defineProperty(this, "incompatibleTokens", ['y', 'Y', 'u', 'q', 'Q', 'M', 'L', 'w', 'd', 'D', 'E', 'e', 'c', 't', 'T']);
  }

  parse(dateString, token, match) {
    var valueCallback = function (value) {
      if (value === 0) {
        return 7;
      }

      return value;
    };

    switch (token) {
      // 2
      case 'i':
      case 'ii':
        // 02
        return parseNDigits(token.length, dateString);
      // 2nd

      case 'io':
        return match.ordinalNumber(dateString, {
          unit: 'day'
        });
      // Tue

      case 'iii':
        return mapValue(match.day(dateString, {
          width: 'abbreviated',
          context: 'formatting'
        }) || match.day(dateString, {
          width: 'short',
          context: 'formatting'
        }) || match.day(dateString, {
          width: 'narrow',
          context: 'formatting'
        }), valueCallback);
      // T

      case 'iiiii':
        return mapValue(match.day(dateString, {
          width: 'narrow',
          context: 'formatting'
        }), valueCallback);
      // Tu

      case 'iiiiii':
        return mapValue(match.day(dateString, {
          width: 'short',
          context: 'formatting'
        }) || match.day(dateString, {
          width: 'narrow',
          context: 'formatting'
        }), valueCallback);
      // Tuesday

      case 'iiii':
      default:
        return mapValue(match.day(dateString, {
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
        }), valueCallback);
    }
  }

  validate(_date, value) {
    return value >= 1 && value <= 7;
  }

  set(date, _flags, value) {
    date = setUTCISODay(date, value);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

}