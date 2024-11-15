module.export({DateParser:()=>DateParser});let _classCallCheck;module.link("@babel/runtime/helpers/esm/classCallCheck",{default(v){_classCallCheck=v}},0);let _createClass;module.link("@babel/runtime/helpers/esm/createClass",{default(v){_createClass=v}},1);let _assertThisInitialized;module.link("@babel/runtime/helpers/esm/assertThisInitialized",{default(v){_assertThisInitialized=v}},2);let _inherits;module.link("@babel/runtime/helpers/esm/inherits",{default(v){_inherits=v}},3);let _createSuper;module.link("@babel/runtime/helpers/esm/createSuper",{default(v){_createSuper=v}},4);let _defineProperty;module.link("@babel/runtime/helpers/esm/defineProperty",{default(v){_defineProperty=v}},5);let isLeapYearIndex,parseNDigits,parseNumericPattern;module.link("../utils.js",{isLeapYearIndex(v){isLeapYearIndex=v},parseNDigits(v){parseNDigits=v},parseNumericPattern(v){parseNumericPattern=v}},6);let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},7);let numericPatterns;module.link("../constants.js",{numericPatterns(v){numericPatterns=v}},8);








var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var DAYS_IN_MONTH_LEAP_YEAR = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Day of the month
var DateParser = /*#__PURE__*/function (_Parser) {
  _inherits(DateParser, _Parser);
  var _super = _createSuper(DateParser);
  function DateParser() {
    var _this;
    _classCallCheck(this, DateParser);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _defineProperty(_assertThisInitialized(_this), "priority", 90);
    _defineProperty(_assertThisInitialized(_this), "subPriority", 1);
    _defineProperty(_assertThisInitialized(_this), "incompatibleTokens", ['Y', 'R', 'q', 'Q', 'w', 'I', 'D', 'i', 'e', 'c', 't', 'T']);
    return _this;
  }
  _createClass(DateParser, [{
    key: "parse",
    value: function parse(dateString, token, match) {
      switch (token) {
        case 'd':
          return parseNumericPattern(numericPatterns.date, dateString);
        case 'do':
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
      var month = date.getUTCMonth();
      if (isLeapYear) {
        return value >= 1 && value <= DAYS_IN_MONTH_LEAP_YEAR[month];
      } else {
        return value >= 1 && value <= DAYS_IN_MONTH[month];
      }
    }
  }, {
    key: "set",
    value: function set(date, _flags, value) {
      date.setUTCDate(value);
      date.setUTCHours(0, 0, 0, 0);
      return date;
    }
  }]);
  return DateParser;
}(Parser);