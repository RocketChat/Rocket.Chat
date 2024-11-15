module.export({ISOWeekYearParser:()=>ISOWeekYearParser});let _classCallCheck;module.link("@babel/runtime/helpers/esm/classCallCheck",{default(v){_classCallCheck=v}},0);let _createClass;module.link("@babel/runtime/helpers/esm/createClass",{default(v){_createClass=v}},1);let _assertThisInitialized;module.link("@babel/runtime/helpers/esm/assertThisInitialized",{default(v){_assertThisInitialized=v}},2);let _inherits;module.link("@babel/runtime/helpers/esm/inherits",{default(v){_inherits=v}},3);let _createSuper;module.link("@babel/runtime/helpers/esm/createSuper",{default(v){_createSuper=v}},4);let _defineProperty;module.link("@babel/runtime/helpers/esm/defineProperty",{default(v){_defineProperty=v}},5);let Parser;module.link("../Parser.js",{Parser(v){Parser=v}},6);let parseNDigitsSigned;module.link("../utils.js",{parseNDigitsSigned(v){parseNDigitsSigned=v}},7);let startOfUTCISOWeek;module.link("../../../_lib/startOfUTCISOWeek/index.js",{default(v){startOfUTCISOWeek=v}},8);







 // ISO week-numbering year
var ISOWeekYearParser = /*#__PURE__*/function (_Parser) {
  _inherits(ISOWeekYearParser, _Parser);
  var _super = _createSuper(ISOWeekYearParser);
  function ISOWeekYearParser() {
    var _this;
    _classCallCheck(this, ISOWeekYearParser);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(args));
    _defineProperty(_assertThisInitialized(_this), "priority", 130);
    _defineProperty(_assertThisInitialized(_this), "incompatibleTokens", ['G', 'y', 'Y', 'u', 'Q', 'q', 'M', 'L', 'w', 'd', 'D', 'e', 'c', 't', 'T']);
    return _this;
  }
  _createClass(ISOWeekYearParser, [{
    key: "parse",
    value: function parse(dateString, token) {
      if (token === 'R') {
        return parseNDigitsSigned(4, dateString);
      }
      return parseNDigitsSigned(token.length, dateString);
    }
  }, {
    key: "set",
    value: function set(_date, _flags, value) {
      var firstWeekOfYear = new Date(0);
      firstWeekOfYear.setUTCFullYear(value, 0, 4);
      firstWeekOfYear.setUTCHours(0, 0, 0, 0);
      return startOfUTCISOWeek(firstWeekOfYear);
    }
  }]);
  return ISOWeekYearParser;
}(Parser);