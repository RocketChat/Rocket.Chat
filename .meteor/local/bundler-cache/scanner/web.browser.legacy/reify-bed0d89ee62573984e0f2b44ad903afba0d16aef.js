"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Parser = void 0;

var _Setter = require("./Setter.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Parser {
  constructor() {
    _defineProperty(this, "incompatibleTokens", void 0);

    _defineProperty(this, "priority", void 0);

    _defineProperty(this, "subPriority", void 0);
  }

  run(dateString, token, match, options) {
    var result = this.parse(dateString, token, match, options);

    if (!result) {
      return null;
    }

    return {
      setter: new _Setter.ValueSetter(result.value, this.validate, this.set, this.priority, this.subPriority),
      rest: result.rest
    };
  }

  validate(_utcDate, _value, _options) {
    return true;
  }

}

exports.Parser = Parser;