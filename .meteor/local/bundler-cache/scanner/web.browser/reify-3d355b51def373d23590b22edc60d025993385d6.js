"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _shouldUpdate = _interopRequireDefault(require("./shouldUpdate"));

var _shallowEqual = _interopRequireDefault(require("./shallowEqual"));

var _setDisplayName = _interopRequireDefault(require("./setDisplayName"));

var _wrapDisplayName = _interopRequireDefault(require("./wrapDisplayName"));

var pure = function pure(BaseComponent) {
  var hoc = (0, _shouldUpdate.default)(function (props, nextProps) {
    return !(0, _shallowEqual.default)(props, nextProps);
  });

  if (process.env.NODE_ENV !== 'production') {
    return (0, _setDisplayName.default)((0, _wrapDisplayName.default)(BaseComponent, 'pure'))(hoc(BaseComponent));
  }

  return hoc(BaseComponent);
};

var _default = pure;
exports.default = _default;