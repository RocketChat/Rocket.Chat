module.export({DayOfYearParser:()=>DayOfYearParser});let _classCallCheck;module.link("@babel/runtime/helpers/esm/classCallCheck",{default(v){_classCallCheck=v}},0);let _createClass;module.link("@babel/runtime/helpers/esm/createClass",{default(v){_createClass=v}},1);let _assertThisInitialized;module.link("@babel/runtime/helpers/esm/assertThisInitialized",{default(v){_assertThisInitialized=v}},2);let _inherits;module.link("@babel/runtime/helpers/esm/inherits",{default(v){_inherits=v}},3);let _createSuper;module.link("@babel/runtime/helpers/esm/createSuper",{default(v){_createSuper=v}},4);let _defineProperty;module.link("@babel/runtime/helpers/esm/defineProperty",{default(v){_defineProperty=v}},5);let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},6);let numericPatterns;module.link("../constants.js",{numericPatterns(v){numericPatterns=v}},7);let parseNumericPattern,parseNDigits,isLeapYearIndex;module.link("../utils.js",{parseNumericPattern(v){parseNumericPattern=v},parseNDigits(v){parseNDigits=v},isLeapYearIndex(v){isLeapYearIndex=v}},8);








var DayOfYearParser = /*#__PURE__*/function (_Parser) {
  _inherits(DayOfYearParser, _Parser);
  var _super = _createSuper(DayOfYearParser);
  function DayOfYearParser() {
    var _this;
    _classCallCheck(this, DayOfYearParser);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _defineProperty(_assertThisInitialized(_this), "priority", 90);
    _defineProperty(_assertThisInitialized(_this), "subpriority", 1);
    _defineProperty(_assertThisInitialized(_this), "incompatibleTokens", ['Y', 'R', 'q', 'Q', 'M', 'L', 'w', 'I', 'd', 'E', 'i', 'e', 'c', 't', 'T']);
    return _this;
  }
  _createClass(DayOfYearParser, [{
    key: "parse",
    value: function parse(dateString, token, match) {
      switch (token) {
        case 'D':
        case 'DD':
          return parseNumericPattern(numericPatterns.dayOfYear, dateString);
        case 'Do':
          return match.ordinalNumber(dateString, {
            unit: 'date'
          });
        default:
          return parseNDigits(token.length, dateString);
      }
    }
  }, {
    key: "validate",
    value: function validate(date, value) {
      var year = date.getUTCFullYear();
      var isLeapYear = isLeapYearIndex(year);
      if (isLeapYear) {
        return value >= 1 && value <= 366;
      } else {
        return value >= 1 && value <= 365;
      }
    }
  }, {
    key: "set",
    value: function set(date, _flags, value) {
      date.setUTCMonth(0, value);
      date.setUTCHours(0, 0, 0, 0);
      return date;
    }
  }]);
  return DayOfYearParser;
}(Parser);