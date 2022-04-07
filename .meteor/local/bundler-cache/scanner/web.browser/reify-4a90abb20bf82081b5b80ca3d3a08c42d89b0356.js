"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _wrapDisplayName = _interopRequireDefault(require("./wrapDisplayName"));

var _setDisplayName = _interopRequireDefault(require("./setDisplayName"));

var _mapProps = _interopRequireDefault(require("./mapProps"));

var withProps = function withProps(input) {
  var hoc = (0, _mapProps.default)(function (props) {
    return (0, _extends2.default)({}, props, typeof input === 'function' ? input(props) : input);
  });

  if (process.env.NODE_ENV !== 'production') {
    return function (BaseComponent) {
      return (0, _setDisplayName.default)((0, _wrapDisplayName.default)(BaseComponent, 'withProps'))(hoc(BaseComponent));
    };
  }

  return hoc;
};

var _default = withProps;
exports.default = _default;