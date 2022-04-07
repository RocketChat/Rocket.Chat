"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _react = require("react");

var _setDisplayName = _interopRequireDefault(require("./setDisplayName"));

var _wrapDisplayName = _interopRequireDefault(require("./wrapDisplayName"));

var mapProps = function mapProps(propsMapper) {
  return function (BaseComponent) {
    var factory = (0, _react.createFactory)(BaseComponent);

    var MapProps = function MapProps(props) {
      return factory(propsMapper(props));
    };

    if (process.env.NODE_ENV !== 'production') {
      return (0, _setDisplayName.default)((0, _wrapDisplayName.default)(BaseComponent, 'mapProps'))(MapProps);
    }

    return MapProps;
  };
};

var _default = mapProps;
exports.default = _default;