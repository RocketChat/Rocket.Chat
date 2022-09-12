module.export({FractionOfSecondParser:()=>FractionOfSecondParser});let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},0);let mapValue,parseNDigits;module.link("../utils.js",{mapValue(v){mapValue=v},parseNDigits(v){parseNDigits=v}},1);function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }



class FractionOfSecondParser extends Parser {
  constructor() {
    super(...arguments);

    _defineProperty(this, "priority", 30);

    _defineProperty(this, "incompatibleTokens", ['t', 'T']);
  }

  parse(dateString, token) {
    var valueCallback = function (value) {
      return Math.floor(value * Math.pow(10, -token.length + 3));
    };

    return mapValue(parseNDigits(token.length, dateString), valueCallback);
  }

  set(date, _flags, value) {
    date.setUTCMilliseconds(value);
    return date;
  }

}