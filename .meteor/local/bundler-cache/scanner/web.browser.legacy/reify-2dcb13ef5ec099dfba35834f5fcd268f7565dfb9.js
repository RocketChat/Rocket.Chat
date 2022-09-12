'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var PropTypes = _interopDefault(require('prop-types'));
var isFunction = _interopDefault(require('lodash/isFunction'));
var core = require('@nivo/core');
var isNumber = _interopDefault(require('lodash/isNumber'));
var isPlainObject = _interopDefault(require('lodash/isPlainObject'));

var DIRECTION_ROW = 'row';
var DIRECTION_COLUMN = 'column';
var ANCHOR_TOP = 'top';
var ANCHOR_TOP_RIGHT = 'top-right';
var ANCHOR_RIGHT = 'right';
var ANCHOR_BOTTOM_RIGHT = 'bottom-right';
var ANCHOR_BOTTOM = 'bottom';
var ANCHOR_BOTTOM_LEFT = 'bottom-left';
var ANCHOR_LEFT = 'left';
var ANCHOR_TOP_LEFT = 'top-left';
var ANCHOR_CENTER = 'center';
var DIRECTION_LEFT_TO_RIGHT = 'left-to-right';
var DIRECTION_RIGHT_TO_LEFT = 'right-to-left';
var DIRECTION_TOP_TO_BOTTOM = 'top-to-bottom';
var DIRECTION_BOTTOM_TO_TOP = 'bottom-to-top';

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var legendEffectPropType = PropTypes.shape({
  on: PropTypes.oneOfType([PropTypes.oneOf(['hover'])]).isRequired,
  style: PropTypes.shape({
    itemTextColor: PropTypes.string,
    itemBackground: PropTypes.string,
    itemOpacity: PropTypes.number,
    symbolSize: PropTypes.number,
    symbolBorderWidth: PropTypes.number,
    symbolBorderColor: PropTypes.string
  }).isRequired
});
var symbolPropTypes = {
  symbolShape: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  symbolSize: PropTypes.number,
  symbolSpacing: PropTypes.number,
  symbolBorderWidth: PropTypes.number,
  symbolBorderColor: PropTypes.string
};
var interactivityPropTypes = {
  onClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func
};
var datumPropType = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  color: PropTypes.string.isRequired,
  fill: PropTypes.string
});
var LegendPropShape = _objectSpread({
  data: PropTypes.arrayOf(datumPropType),
  anchor: PropTypes.oneOf([ANCHOR_TOP, ANCHOR_TOP_RIGHT, ANCHOR_RIGHT, ANCHOR_BOTTOM_RIGHT, ANCHOR_BOTTOM, ANCHOR_BOTTOM_LEFT, ANCHOR_LEFT, ANCHOR_TOP_LEFT, ANCHOR_CENTER]).isRequired,
  translateX: PropTypes.number,
  translateY: PropTypes.number,
  direction: PropTypes.oneOf([DIRECTION_ROW, DIRECTION_COLUMN]).isRequired,
  itemsSpacing: PropTypes.number,
  itemWidth: PropTypes.number.isRequired,
  itemHeight: PropTypes.number.isRequired,
  itemDirection: PropTypes.oneOf([DIRECTION_LEFT_TO_RIGHT, DIRECTION_RIGHT_TO_LEFT, DIRECTION_TOP_TO_BOTTOM, DIRECTION_BOTTOM_TO_TOP]),
  itemTextColor: PropTypes.string,
  itemBackground: PropTypes.string,
  itemOpacity: PropTypes.number
}, symbolPropTypes, interactivityPropTypes, {
  effects: PropTypes.arrayOf(legendEffectPropType)
});

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$1(target, key, source[key]); }); } return target; }
function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var zeroPadding = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
};
var computeDimensions = function computeDimensions(_ref) {
  var direction = _ref.direction,
      itemsSpacing = _ref.itemsSpacing,
      _padding = _ref.padding,
      itemCount = _ref.itemCount,
      itemWidth = _ref.itemWidth,
      itemHeight = _ref.itemHeight;
  var padding;
  if (isNumber(_padding)) {
    padding = {
      top: _padding,
      right: _padding,
      bottom: _padding,
      left: _padding
    };
  } else if (isPlainObject(_padding)) {
    padding = _objectSpread$1({}, zeroPadding, _padding);
  } else {
    throw new TypeError("Invalid property padding, must be one of: number, object");
  }
  var horizontalPadding = padding.left + padding.right;
  var verticalPadding = padding.top + padding.bottom;
  var width = itemWidth + horizontalPadding;
  var height = itemHeight + verticalPadding;
  var spacing = (itemCount - 1) * itemsSpacing;
  if (direction === DIRECTION_ROW) {
    width = itemWidth * itemCount + spacing + horizontalPadding;
  } else if (direction === DIRECTION_COLUMN) {
    height = itemHeight * itemCount + spacing + verticalPadding;
  }
  return {
    width: width,
    height: height,
    padding: padding
  };
};
var computePositionFromAnchor = function computePositionFromAnchor(_ref2) {
  var anchor = _ref2.anchor,
      translateX = _ref2.translateX,
      translateY = _ref2.translateY,
      containerWidth = _ref2.containerWidth,
      containerHeight = _ref2.containerHeight,
      width = _ref2.width,
      height = _ref2.height;
  var x = translateX;
  var y = translateY;
  switch (anchor) {
    case ANCHOR_TOP:
      x += (containerWidth - width) / 2;
      break;
    case ANCHOR_TOP_RIGHT:
      x += containerWidth - width;
      break;
    case ANCHOR_RIGHT:
      x += containerWidth - width;
      y += (containerHeight - height) / 2;
      break;
    case ANCHOR_BOTTOM_RIGHT:
      x += containerWidth - width;
      y += containerHeight - height;
      break;
    case ANCHOR_BOTTOM:
      x += (containerWidth - width) / 2;
      y += containerHeight - height;
      break;
    case ANCHOR_BOTTOM_LEFT:
      y += containerHeight - height;
      break;
    case ANCHOR_LEFT:
      y += (containerHeight - height) / 2;
      break;
    case ANCHOR_CENTER:
      x += (containerWidth - width) / 2;
      y += (containerHeight - height) / 2;
      break;
  }
  return {
    x: x,
    y: y
  };
};
var computeItemLayout = function computeItemLayout(_ref3) {
  var direction = _ref3.direction,
      justify = _ref3.justify,
      symbolSize = _ref3.symbolSize,
      symbolSpacing = _ref3.symbolSpacing,
      width = _ref3.width,
      height = _ref3.height;
  var symbolX;
  var symbolY;
  var labelX;
  var labelY;
  var labelAnchor;
  var labelAlignment;
  switch (direction) {
    case DIRECTION_LEFT_TO_RIGHT:
      symbolX = 0;
      symbolY = (height - symbolSize) / 2;
      labelY = height / 2;
      labelAlignment = 'central';
      if (justify === true) {
        labelX = width;
        labelAnchor = 'end';
      } else {
        labelX = symbolSize + symbolSpacing;
        labelAnchor = 'start';
      }
      break;
    case DIRECTION_RIGHT_TO_LEFT:
      symbolX = width - symbolSize;
      symbolY = (height - symbolSize) / 2;
      labelY = height / 2;
      labelAlignment = 'central';
      if (justify === true) {
        labelX = 0;
        labelAnchor = 'start';
      } else {
        labelX = width - symbolSize - symbolSpacing;
        labelAnchor = 'end';
      }
      break;
    case DIRECTION_TOP_TO_BOTTOM:
      symbolX = (width - symbolSize) / 2;
      symbolY = 0;
      labelX = width / 2;
      labelAnchor = 'middle';
      if (justify === true) {
        labelY = height;
        labelAlignment = 'alphabetic';
      } else {
        labelY = symbolSize + symbolSpacing;
        labelAlignment = 'text-before-edge';
      }
      break;
    case DIRECTION_BOTTOM_TO_TOP:
      symbolX = (width - symbolSize) / 2;
      symbolY = height - symbolSize;
      labelX = width / 2;
      labelAnchor = 'middle';
      if (justify === true) {
        labelY = 0;
        labelAlignment = 'text-before-edge';
      } else {
        labelY = height - symbolSize - symbolSpacing;
        labelAlignment = 'alphabetic';
      }
      break;
  }
  return {
    symbolX: symbolX,
    symbolY: symbolY,
    labelX: labelX,
    labelY: labelY,
    labelAnchor: labelAnchor,
    labelAlignment: labelAlignment
  };
};

var symbolPropTypes$1 = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  size: PropTypes.number.isRequired,
  fill: PropTypes.string.isRequired,
  borderWidth: PropTypes.number.isRequired,
  borderColor: PropTypes.string.isRequired
};
var symbolDefaultProps = {
  borderWidth: 0,
  borderColor: 'transparent'
};

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$2(target, key, source[key]); }); } return target; }
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _defineProperty$2(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var SymbolCircle =
function (_PureComponent) {
  _inherits(SymbolCircle, _PureComponent);
  function SymbolCircle() {
    _classCallCheck(this, SymbolCircle);
    return _possibleConstructorReturn(this, _getPrototypeOf(SymbolCircle).apply(this, arguments));
  }
  _createClass(SymbolCircle, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
          x = _this$props.x,
          y = _this$props.y,
          size = _this$props.size,
          fill = _this$props.fill,
          borderWidth = _this$props.borderWidth,
          borderColor = _this$props.borderColor;
      return React__default.createElement("circle", {
        r: size / 2,
        cx: x + size / 2,
        cy: y + size / 2,
        fill: fill,
        strokeWidth: borderWidth,
        stroke: borderColor,
        style: {
          pointerEvents: 'none'
        }
      });
    }
  }]);
  return SymbolCircle;
}(React.PureComponent);
_defineProperty$2(SymbolCircle, "propTypes", _objectSpread$2({}, symbolPropTypes$1));
_defineProperty$2(SymbolCircle, "defaultProps", _objectSpread$2({}, symbolDefaultProps));

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$3(target, key, source[key]); }); } return target; }
function _typeof$1(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$1 = function _typeof(obj) { return typeof obj; }; } else { _typeof$1 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$1(obj); }
function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties$1(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
function _createClass$1(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$1(Constructor.prototype, protoProps); if (staticProps) _defineProperties$1(Constructor, staticProps); return Constructor; }
function _possibleConstructorReturn$1(self, call) { if (call && (_typeof$1(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized$1(self); }
function _assertThisInitialized$1(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _getPrototypeOf$1(o) { _getPrototypeOf$1 = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf$1(o); }
function _inherits$1(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf$1(subClass, superClass); }
function _setPrototypeOf$1(o, p) { _setPrototypeOf$1 = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf$1(o, p); }
function _defineProperty$3(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var SymbolDiamond =
function (_PureComponent) {
  _inherits$1(SymbolDiamond, _PureComponent);
  function SymbolDiamond() {
    _classCallCheck$1(this, SymbolDiamond);
    return _possibleConstructorReturn$1(this, _getPrototypeOf$1(SymbolDiamond).apply(this, arguments));
  }
  _createClass$1(SymbolDiamond, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
          x = _this$props.x,
          y = _this$props.y,
          size = _this$props.size,
          fill = _this$props.fill,
          borderWidth = _this$props.borderWidth,
          borderColor = _this$props.borderColor;
      return React__default.createElement("g", {
        transform: "translate(".concat(x, ",").concat(y, ")")
      }, React__default.createElement("path", {
        d: "\n                    M".concat(size / 2, " 0\n                    L").concat(size * 0.8, " ").concat(size / 2, "\n                    L").concat(size / 2, " ").concat(size, "\n                    L").concat(size * 0.2, " ").concat(size / 2, "\n                    L").concat(size / 2, " 0\n                "),
        fill: fill,
        strokeWidth: borderWidth,
        stroke: borderColor,
        style: {
          pointerEvents: 'none'
        }
      }));
    }
  }]);
  return SymbolDiamond;
}(React.PureComponent);
_defineProperty$3(SymbolDiamond, "propTypes", _objectSpread$3({}, symbolPropTypes$1));
_defineProperty$3(SymbolDiamond, "defaultProps", _objectSpread$3({}, symbolDefaultProps));

function _objectSpread$4(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$4(target, key, source[key]); }); } return target; }
function _typeof$2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$2 = function _typeof(obj) { return typeof obj; }; } else { _typeof$2 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$2(obj); }
function _classCallCheck$2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties$2(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
function _createClass$2(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$2(Constructor.prototype, protoProps); if (staticProps) _defineProperties$2(Constructor, staticProps); return Constructor; }
function _possibleConstructorReturn$2(self, call) { if (call && (_typeof$2(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized$2(self); }
function _assertThisInitialized$2(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _getPrototypeOf$2(o) { _getPrototypeOf$2 = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf$2(o); }
function _inherits$2(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf$2(subClass, superClass); }
function _setPrototypeOf$2(o, p) { _setPrototypeOf$2 = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf$2(o, p); }
function _defineProperty$4(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var SymbolSquare =
function (_PureComponent) {
  _inherits$2(SymbolSquare, _PureComponent);
  function SymbolSquare() {
    _classCallCheck$2(this, SymbolSquare);
    return _possibleConstructorReturn$2(this, _getPrototypeOf$2(SymbolSquare).apply(this, arguments));
  }
  _createClass$2(SymbolSquare, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
          x = _this$props.x,
          y = _this$props.y,
          size = _this$props.size,
          fill = _this$props.fill,
          borderWidth = _this$props.borderWidth,
          borderColor = _this$props.borderColor;
      return React__default.createElement("rect", {
        x: x,
        y: y,
        fill: fill,
        strokeWidth: borderWidth,
        stroke: borderColor,
        width: size,
        height: size,
        style: {
          pointerEvents: 'none'
        }
      });
    }
  }]);
  return SymbolSquare;
}(React.PureComponent);
_defineProperty$4(SymbolSquare, "propTypes", _objectSpread$4({}, symbolPropTypes$1));
_defineProperty$4(SymbolSquare, "defaultProps", _objectSpread$4({}, symbolDefaultProps));

function _objectSpread$5(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$5(target, key, source[key]); }); } return target; }
function _typeof$3(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$3 = function _typeof(obj) { return typeof obj; }; } else { _typeof$3 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$3(obj); }
function _classCallCheck$3(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties$3(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
function _createClass$3(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$3(Constructor.prototype, protoProps); if (staticProps) _defineProperties$3(Constructor, staticProps); return Constructor; }
function _possibleConstructorReturn$3(self, call) { if (call && (_typeof$3(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized$3(self); }
function _assertThisInitialized$3(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _getPrototypeOf$3(o) { _getPrototypeOf$3 = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf$3(o); }
function _inherits$3(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf$3(subClass, superClass); }
function _setPrototypeOf$3(o, p) { _setPrototypeOf$3 = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf$3(o, p); }
function _defineProperty$5(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var SymbolTriangle =
function (_PureComponent) {
  _inherits$3(SymbolTriangle, _PureComponent);
  function SymbolTriangle() {
    _classCallCheck$3(this, SymbolTriangle);
    return _possibleConstructorReturn$3(this, _getPrototypeOf$3(SymbolTriangle).apply(this, arguments));
  }
  _createClass$3(SymbolTriangle, [{
    key: "render",
    value: function render() {
      var _this$props = this.props,
          x = _this$props.x,
          y = _this$props.y,
          size = _this$props.size,
          fill = _this$props.fill,
          borderWidth = _this$props.borderWidth,
          borderColor = _this$props.borderColor;
      return React__default.createElement("g", {
        transform: "translate(".concat(x, ",").concat(y, ")")
      }, React__default.createElement("path", {
        d: "\n                M".concat(size / 2, " 0\n                L").concat(size, " ").concat(size, "\n                L0 ").concat(size, "\n                L").concat(size / 2, " 0\n            "),
        fill: fill,
        strokeWidth: borderWidth,
        stroke: borderColor,
        style: {
          pointerEvents: 'none'
        }
      }));
    }
  }]);
  return SymbolTriangle;
}(React.PureComponent);
_defineProperty$5(SymbolTriangle, "propTypes", _objectSpread$5({}, symbolPropTypes$1));
_defineProperty$5(SymbolTriangle, "defaultProps", _objectSpread$5({}, symbolDefaultProps));

function _objectSpread$6(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$6(target, key, source[key]); }); } return target; }
function _defineProperty$6(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }
function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
var symbolByShape = {
  circle: SymbolCircle,
  diamond: SymbolDiamond,
  square: SymbolSquare,
  triangle: SymbolTriangle
};
var LegendSvgItem = function LegendSvgItem(_ref) {
  var x = _ref.x,
      y = _ref.y,
      width = _ref.width,
      height = _ref.height,
      data = _ref.data,
      direction = _ref.direction,
      justify = _ref.justify,
      textColor = _ref.textColor,
      background = _ref.background,
      opacity = _ref.opacity,
      symbolShape = _ref.symbolShape,
      symbolSize = _ref.symbolSize,
      symbolSpacing = _ref.symbolSpacing,
      symbolBorderWidth = _ref.symbolBorderWidth,
      symbolBorderColor = _ref.symbolBorderColor,
      onClick = _ref.onClick,
      onMouseEnter = _ref.onMouseEnter,
      onMouseLeave = _ref.onMouseLeave,
      effects = _ref.effects;
  var _useState = React.useState({}),
      _useState2 = _slicedToArray(_useState, 2),
      style = _useState2[0],
      setStyle = _useState2[1];
  var theme = core.useTheme();
  var handleClick = React.useCallback(function (event) {
    return onClick && onClick(data, event);
  }, [onClick, data]);
  var handleMouseEnter = React.useCallback(function (event) {
    if (effects.length > 0) {
      var applyEffects = effects.filter(function (_ref2) {
        var on = _ref2.on;
        return on === 'hover';
      });
      var _style = applyEffects.reduce(function (acc, effect) {
        return _objectSpread$6({}, acc, effect.style);
      }, {});
      setStyle(_style);
    }
    if (onMouseEnter === undefined) return;
    onMouseEnter(data, event);
  }, [onMouseEnter, data, effects]);
  var handleMouseLeave = React.useCallback(function () {
    if (effects.length > 0) {
      var applyEffects = effects.filter(function (_ref3) {
        var on = _ref3.on;
        return on !== 'hover';
      });
      var _style2 = applyEffects.reduce(function (acc, effect) {
        return _objectSpread$6({}, acc, effect.style);
      }, {});
      setStyle(_style2);
    }
    if (onMouseLeave === undefined) return;
    onMouseLeave(data, event);
  }, [onMouseLeave, data, effects]);
  var _computeItemLayout = computeItemLayout({
    direction: direction,
    justify: justify,
    symbolSize: style.symbolSize || symbolSize,
    symbolSpacing: symbolSpacing,
    width: width,
    height: height
  }),
      symbolX = _computeItemLayout.symbolX,
      symbolY = _computeItemLayout.symbolY,
      labelX = _computeItemLayout.labelX,
      labelY = _computeItemLayout.labelY,
      labelAnchor = _computeItemLayout.labelAnchor,
      labelAlignment = _computeItemLayout.labelAlignment;
  var isInteractive = [onClick, onMouseEnter, onMouseLeave].some(function (handler) {
    return handler !== undefined;
  });
  var _Symbol;
  if (isFunction(symbolShape)) {
    _Symbol = symbolShape;
  } else {
    _Symbol = symbolByShape[symbolShape];
  }
  return React__default.createElement("g", {
    transform: "translate(".concat(x, ",").concat(y, ")"),
    style: {
      opacity: style.itemOpacity !== undefined ? style.itemOpacity : opacity
    }
  }, React__default.createElement("rect", {
    width: width,
    height: height,
    fill: style.itemBackground || background,
    style: {
      cursor: isInteractive ? 'pointer' : 'auto'
    },
    onClick: handleClick,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave
  }), React__default.createElement(_Symbol, {
    id: data.id,
    x: symbolX,
    y: symbolY,
    size: style.symbolSize || symbolSize,
    fill: data.fill || data.color,
    borderWidth: style.symbolBorderWidth !== undefined ? style.symbolBorderWidth : symbolBorderWidth,
    borderColor: style.symbolBorderColor || symbolBorderColor
  }), React__default.createElement("text", {
    textAnchor: labelAnchor,
    style: _objectSpread$6({}, theme.legends.text, {
      fill: style.itemTextColor || textColor,
      dominantBaseline: labelAlignment,
      pointerEvents: 'none',
      userSelect: 'none'
    }),
    x: labelX,
    y: labelY
  }, data.label));
};
LegendSvgItem.displayName = 'LegendSvgItem';
LegendSvgItem.propTypes = _objectSpread$6({
  data: datumPropType.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  textColor: PropTypes.string,
  background: PropTypes.string,
  opacity: PropTypes.number,
  direction: PropTypes.oneOf(['left-to-right', 'right-to-left', 'top-to-bottom', 'bottom-to-top']).isRequired,
  justify: PropTypes.bool.isRequired
}, symbolPropTypes, interactivityPropTypes);
LegendSvgItem.defaultProps = {
  direction: 'left-to-right',
  justify: false,
  textColor: 'black',
  background: 'transparent',
  opacity: 1,
  symbolShape: 'square',
  symbolSize: 16,
  symbolSpacing: 8,
  symbolBorderWidth: 0,
  symbolBorderColor: 'transparent',
  effects: []
};

function _objectSpread$7(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$7(target, key, source[key]); }); } return target; }
function _defineProperty$7(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var LegendSvg = function LegendSvg(_ref) {
  var data = _ref.data,
      x = _ref.x,
      y = _ref.y,
      direction = _ref.direction,
      _padding = _ref.padding,
      justify = _ref.justify,
      effects = _ref.effects,
      itemWidth = _ref.itemWidth,
      itemHeight = _ref.itemHeight,
      itemDirection = _ref.itemDirection,
      itemsSpacing = _ref.itemsSpacing,
      itemTextColor = _ref.itemTextColor,
      itemBackground = _ref.itemBackground,
      itemOpacity = _ref.itemOpacity,
      symbolShape = _ref.symbolShape,
      symbolSize = _ref.symbolSize,
      symbolSpacing = _ref.symbolSpacing,
      symbolBorderWidth = _ref.symbolBorderWidth,
      symbolBorderColor = _ref.symbolBorderColor,
      onClick = _ref.onClick,
      onMouseEnter = _ref.onMouseEnter,
      onMouseLeave = _ref.onMouseLeave;
  var _computeDimensions = computeDimensions({
    itemCount: data.length,
    itemWidth: itemWidth,
    itemHeight: itemHeight,
    itemsSpacing: itemsSpacing,
    direction: direction,
    padding: _padding
  }),
      padding = _computeDimensions.padding;
  var xStep = 0;
  var yStep = 0;
  if (direction === 'row') {
    xStep = itemWidth + itemsSpacing;
  } else if (direction === 'column') {
    yStep = itemHeight + itemsSpacing;
  }
  return React__default.createElement("g", {
    transform: "translate(".concat(x, ",").concat(y, ")")
  }, data.map(function (data, i) {
    return React__default.createElement(LegendSvgItem, {
      key: i,
      data: data,
      x: i * xStep + padding.left,
      y: i * yStep + padding.top,
      width: itemWidth,
      height: itemHeight,
      direction: itemDirection,
      justify: justify,
      effects: effects,
      textColor: itemTextColor,
      background: itemBackground,
      opacity: itemOpacity,
      symbolShape: symbolShape,
      symbolSize: symbolSize,
      symbolSpacing: symbolSpacing,
      symbolBorderWidth: symbolBorderWidth,
      symbolBorderColor: symbolBorderColor,
      onClick: onClick,
      onMouseEnter: onMouseEnter,
      onMouseLeave: onMouseLeave
    });
  }));
};
LegendSvg.propTypes = _objectSpread$7({
  data: PropTypes.arrayOf(datumPropType).isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  direction: PropTypes.oneOf(['row', 'column']).isRequired,
  padding: PropTypes.oneOfType([PropTypes.number, PropTypes.shape({
    top: PropTypes.number,
    right: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number
  })]).isRequired,
  justify: PropTypes.bool.isRequired,
  itemsSpacing: PropTypes.number.isRequired,
  itemWidth: PropTypes.number.isRequired,
  itemHeight: PropTypes.number.isRequired,
  itemDirection: PropTypes.oneOf([DIRECTION_LEFT_TO_RIGHT, DIRECTION_RIGHT_TO_LEFT, DIRECTION_TOP_TO_BOTTOM, DIRECTION_BOTTOM_TO_TOP]).isRequired,
  itemTextColor: PropTypes.string.isRequired,
  itemBackground: PropTypes.string.isRequired,
  itemOpacity: PropTypes.number.isRequired
}, symbolPropTypes, interactivityPropTypes);
LegendSvg.defaultProps = {
  padding: 0,
  justify: false,
  itemsSpacing: 0,
  itemDirection: 'left-to-right',
  itemTextColor: 'black',
  itemBackground: 'transparent',
  itemOpacity: 1
};

function _objectSpread$8(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$8(target, key, source[key]); }); } return target; }
function _defineProperty$8(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var BoxLegendSvg = function BoxLegendSvg(_ref) {
  var data = _ref.data,
      containerWidth = _ref.containerWidth,
      containerHeight = _ref.containerHeight,
      translateX = _ref.translateX,
      translateY = _ref.translateY,
      anchor = _ref.anchor,
      direction = _ref.direction,
      padding = _ref.padding,
      justify = _ref.justify,
      itemsSpacing = _ref.itemsSpacing,
      itemWidth = _ref.itemWidth,
      itemHeight = _ref.itemHeight,
      itemDirection = _ref.itemDirection,
      itemTextColor = _ref.itemTextColor,
      itemBackground = _ref.itemBackground,
      itemOpacity = _ref.itemOpacity,
      symbolShape = _ref.symbolShape,
      symbolSize = _ref.symbolSize,
      symbolSpacing = _ref.symbolSpacing,
      symbolBorderWidth = _ref.symbolBorderWidth,
      symbolBorderColor = _ref.symbolBorderColor,
      onClick = _ref.onClick,
      onMouseEnter = _ref.onMouseEnter,
      onMouseLeave = _ref.onMouseLeave,
      effects = _ref.effects;
  var _computeDimensions = computeDimensions({
    itemCount: data.length,
    itemsSpacing: itemsSpacing,
    itemWidth: itemWidth,
    itemHeight: itemHeight,
    direction: direction,
    padding: padding
  }),
      width = _computeDimensions.width,
      height = _computeDimensions.height;
  var _computePositionFromA = computePositionFromAnchor({
    anchor: anchor,
    translateX: translateX,
    translateY: translateY,
    containerWidth: containerWidth,
    containerHeight: containerHeight,
    width: width,
    height: height
  }),
      x = _computePositionFromA.x,
      y = _computePositionFromA.y;
  return React__default.createElement(LegendSvg, {
    data: data,
    x: x,
    y: y,
    direction: direction,
    padding: padding,
    justify: justify,
    effects: effects,
    itemsSpacing: itemsSpacing,
    itemWidth: itemWidth,
    itemHeight: itemHeight,
    itemDirection: itemDirection,
    itemTextColor: itemTextColor,
    itemBackground: itemBackground,
    itemOpacity: itemOpacity,
    symbolShape: symbolShape,
    symbolSize: symbolSize,
    symbolSpacing: symbolSpacing,
    symbolBorderWidth: symbolBorderWidth,
    symbolBorderColor: symbolBorderColor,
    onClick: onClick,
    onMouseEnter: onMouseEnter,
    onMouseLeave: onMouseLeave
  });
};
BoxLegendSvg.propTypes = _objectSpread$8({
  data: PropTypes.arrayOf(datumPropType).isRequired,
  containerWidth: PropTypes.number.isRequired,
  containerHeight: PropTypes.number.isRequired,
  translateX: PropTypes.number.isRequired,
  translateY: PropTypes.number.isRequired,
  anchor: PropTypes.oneOf([ANCHOR_TOP, ANCHOR_TOP_RIGHT, ANCHOR_RIGHT, ANCHOR_BOTTOM_RIGHT, ANCHOR_BOTTOM, ANCHOR_BOTTOM_LEFT, ANCHOR_LEFT, ANCHOR_TOP_LEFT, ANCHOR_CENTER]).isRequired,
  direction: PropTypes.oneOf([DIRECTION_ROW, DIRECTION_COLUMN]).isRequired,
  padding: PropTypes.oneOfType([PropTypes.number, PropTypes.shape({
    top: PropTypes.number,
    right: PropTypes.number,
    bottom: PropTypes.number,
    left: PropTypes.number
  })]).isRequired,
  justify: PropTypes.bool,
  itemWidth: PropTypes.number.isRequired,
  itemHeight: PropTypes.number.isRequired,
  itemDirection: PropTypes.oneOf([DIRECTION_LEFT_TO_RIGHT, DIRECTION_RIGHT_TO_LEFT, DIRECTION_TOP_TO_BOTTOM, DIRECTION_BOTTOM_TO_TOP]),
  itemsSpacing: PropTypes.number.isRequired,
  itemTextColor: PropTypes.string,
  itemBackground: PropTypes.string,
  itemOpacity: PropTypes.number
}, symbolPropTypes, interactivityPropTypes);
BoxLegendSvg.defaultProps = {
  translateX: 0,
  translateY: 0,
  itemsSpacing: LegendSvg.defaultProps.itemsSpacing,
  padding: LegendSvg.defaultProps.padding
};

var textPropsMapping = {
  align: {
    start: 'left',
    middle: 'center',
    end: 'right'
  },
  baseline: {
    hanging: 'top',
    middle: 'middle',
    central: 'middle',
    baseline: 'bottom'
  }
};
var renderLegendToCanvas = function renderLegendToCanvas(ctx, _ref) {
  var data = _ref.data,
      containerWidth = _ref.containerWidth,
      containerHeight = _ref.containerHeight,
      _ref$translateX = _ref.translateX,
      translateX = _ref$translateX === void 0 ? BoxLegendSvg.defaultProps.translateX : _ref$translateX,
      _ref$translateY = _ref.translateY,
      translateY = _ref$translateY === void 0 ? BoxLegendSvg.defaultProps.translateY : _ref$translateY,
      anchor = _ref.anchor,
      direction = _ref.direction,
      _ref$padding = _ref.padding,
      _padding = _ref$padding === void 0 ? LegendSvg.defaultProps.padding : _ref$padding,
      _ref$justify = _ref.justify,
      justify = _ref$justify === void 0 ? LegendSvgItem.defaultProps.justify : _ref$justify,
      _ref$itemsSpacing = _ref.itemsSpacing,
      itemsSpacing = _ref$itemsSpacing === void 0 ? LegendSvg.defaultProps.itemsSpacing : _ref$itemsSpacing,
      itemWidth = _ref.itemWidth,
      itemHeight = _ref.itemHeight,
      _ref$itemDirection = _ref.itemDirection,
      itemDirection = _ref$itemDirection === void 0 ? LegendSvgItem.defaultProps.direction : _ref$itemDirection,
      _ref$itemTextColor = _ref.itemTextColor,
      itemTextColor = _ref$itemTextColor === void 0 ? LegendSvg.defaultProps.textColor : _ref$itemTextColor,
      _ref$symbolSize = _ref.symbolSize,
      symbolSize = _ref$symbolSize === void 0 ? LegendSvgItem.defaultProps.symbolSize : _ref$symbolSize,
      _ref$symbolSpacing = _ref.symbolSpacing,
      symbolSpacing = _ref$symbolSpacing === void 0 ? LegendSvgItem.defaultProps.symbolSpacing : _ref$symbolSpacing,
      theme = _ref.theme;
  var _computeDimensions = computeDimensions({
    itemCount: data.length,
    itemWidth: itemWidth,
    itemHeight: itemHeight,
    itemsSpacing: itemsSpacing,
    direction: direction,
    padding: _padding
  }),
      width = _computeDimensions.width,
      height = _computeDimensions.height,
      padding = _computeDimensions.padding;
  var _computePositionFromA = computePositionFromAnchor({
    anchor: anchor,
    translateX: translateX,
    translateY: translateY,
    containerWidth: containerWidth,
    containerHeight: containerHeight,
    width: width,
    height: height
  }),
      x = _computePositionFromA.x,
      y = _computePositionFromA.y;
  var xStep = 0;
  var yStep = 0;
  if (direction === DIRECTION_ROW) {
    xStep = itemWidth + itemsSpacing;
  } else if (direction === DIRECTION_COLUMN) {
    yStep = itemHeight + itemsSpacing;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.font = "".concat(theme.legends.text.fontSize, "px ").concat(theme.legends.text.fontFamily || 'sans-serif');
  data.forEach(function (d, i) {
    var itemX = i * xStep + padding.left;
    var itemY = i * yStep + padding.top;
    var _computeItemLayout = computeItemLayout({
      direction: itemDirection,
      justify: justify,
      symbolSize: symbolSize,
      symbolSpacing: symbolSpacing,
      width: itemWidth,
      height: itemHeight
    }),
        symbolX = _computeItemLayout.symbolX,
        symbolY = _computeItemLayout.symbolY,
        labelX = _computeItemLayout.labelX,
        labelY = _computeItemLayout.labelY,
        labelAnchor = _computeItemLayout.labelAnchor,
        labelAlignment = _computeItemLayout.labelAlignment;
    ctx.fillStyle = d.color;
    ctx.fillRect(itemX + symbolX, itemY + symbolY, symbolSize, symbolSize);
    ctx.textAlign = textPropsMapping.align[labelAnchor];
    ctx.textBaseline = textPropsMapping.baseline[labelAlignment];
    ctx.fillStyle = itemTextColor || theme.legends.text.fill;
    ctx.fillText(d.label, itemX + labelX, itemY + labelY);
  });
  ctx.restore();
};

function _slicedToArray$1(arr, i) { return _arrayWithHoles$1(arr) || _iterableToArrayLimit$1(arr, i) || _nonIterableRest$1(); }
function _nonIterableRest$1() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }
function _iterableToArrayLimit$1(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles$1(arr) { if (Array.isArray(arr)) return arr; }
var useQuantizeColorScaleLegendData = function useQuantizeColorScaleLegendData(_ref) {
  var scale = _ref.scale,
      overriddenDomain = _ref.domain,
      _ref$reverse = _ref.reverse,
      reverse = _ref$reverse === void 0 ? false : _ref$reverse,
      _ref$valueFormat = _ref.valueFormat,
      valueFormat = _ref$valueFormat === void 0 ? function (v) {
    return v;
  } : _ref$valueFormat,
      _ref$separator = _ref.separator,
      separator = _ref$separator === void 0 ? ' - ' : _ref$separator;
  return React.useMemo(function () {
    var domain = overriddenDomain || scale.range();
    var items = domain.map(function (domainValue, index) {
      var _scale$invertExtent = scale.invertExtent(domainValue),
          _scale$invertExtent2 = _slicedToArray$1(_scale$invertExtent, 2),
          start = _scale$invertExtent2[0],
          end = _scale$invertExtent2[1];
      return {
        id: domainValue,
        index: index,
        extent: [start, end],
        label: "".concat(valueFormat(start)).concat(separator).concat(valueFormat(end)),
        value: scale(start),
        color: domainValue
      };
    });
    if (reverse === true) items.reverse();
    return items;
  }, [overriddenDomain, scale, reverse]);
};

exports.ANCHOR_BOTTOM = ANCHOR_BOTTOM;
exports.ANCHOR_BOTTOM_LEFT = ANCHOR_BOTTOM_LEFT;
exports.ANCHOR_BOTTOM_RIGHT = ANCHOR_BOTTOM_RIGHT;
exports.ANCHOR_CENTER = ANCHOR_CENTER;
exports.ANCHOR_LEFT = ANCHOR_LEFT;
exports.ANCHOR_RIGHT = ANCHOR_RIGHT;
exports.ANCHOR_TOP = ANCHOR_TOP;
exports.ANCHOR_TOP_LEFT = ANCHOR_TOP_LEFT;
exports.ANCHOR_TOP_RIGHT = ANCHOR_TOP_RIGHT;
exports.BoxLegendSvg = BoxLegendSvg;
exports.DIRECTION_BOTTOM_TO_TOP = DIRECTION_BOTTOM_TO_TOP;
exports.DIRECTION_COLUMN = DIRECTION_COLUMN;
exports.DIRECTION_LEFT_TO_RIGHT = DIRECTION_LEFT_TO_RIGHT;
exports.DIRECTION_RIGHT_TO_LEFT = DIRECTION_RIGHT_TO_LEFT;
exports.DIRECTION_ROW = DIRECTION_ROW;
exports.DIRECTION_TOP_TO_BOTTOM = DIRECTION_TOP_TO_BOTTOM;
exports.LegendPropShape = LegendPropShape;
exports.LegendSvg = LegendSvg;
exports.LegendSvgItem = LegendSvgItem;
exports.datumPropType = datumPropType;
exports.interactivityPropTypes = interactivityPropTypes;
exports.legendEffectPropType = legendEffectPropType;
exports.renderLegendToCanvas = renderLegendToCanvas;
exports.symbolPropTypes = symbolPropTypes;
exports.useQuantizeColorScaleLegendData = useQuantizeColorScaleLegendData;
