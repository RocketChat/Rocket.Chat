"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _setStatic = _interopRequireDefault(require("./setStatic"));

var setPropTypes = function setPropTypes(propTypes) {
  return (0, _setStatic.default)('propTypes', propTypes);
};

var _default = setPropTypes;
exports.default = _default;