module.export({EraParser:()=>EraParser});let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},0);function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }


class EraParser extends Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 140);

    _defineProperty(this, "incompatibleTokens", ['R', 'u', 't', 'T']);
  }

  parse(dateString, token, match) {
    switch (token) {
      // AD, BC
      case 'G':
      case 'GG':
      case 'GGG':
        return match.era(dateString, {
          width: 'abbreviated'
        }) || match.era(dateString, {
          width: 'narrow'
        });
      // A, B

      case 'GGGGG':
        return match.era(dateString, {
          width: 'narrow'
        });
      // Anno Domini, Before Christ

      case 'GGGG':
      default:
        return match.era(dateString, {
          width: 'wide'
        }) || match.era(dateString, {
          width: 'abbreviated'
        }) || match.era(dateString, {
          width: 'narrow'
        });
    }
  }

  set(date, flags, value) {
    flags.era = value;
    date.setUTCFullYear(value, 0, 1);
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

}