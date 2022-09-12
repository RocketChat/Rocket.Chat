'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var core = require('@nivo/core');
var jsxRuntime = require('react/jsx-runtime');
var PropTypes = _interopDefault(require('prop-types'));

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }
  return target;
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;
  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

var isObject = function isObject(item) {
  return typeof item === 'object' && !Array.isArray(item) && item !== null;
};

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

  if (typeof _padding !== 'number' && !isObject(_padding)) {
    throw new Error('Invalid property padding, must be one of: number, object');
  }

  var padding = typeof _padding === 'number' ? {
    top: _padding,
    right: _padding,
    bottom: _padding,
    left: _padding
  } : _objectSpread2(_objectSpread2({}, zeroPadding), _padding);
  var horizontalPadding = padding.left + padding.right;
  var verticalPadding = padding.top + padding.bottom;
  var width = itemWidth + horizontalPadding;
  var height = itemHeight + verticalPadding;
  var spacing = (itemCount - 1) * itemsSpacing;

  if (direction === 'row') {
    width = itemWidth * itemCount + spacing + horizontalPadding;
  } else if (direction === 'column') {
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
    case 'top':
      x += (containerWidth - width) / 2;
      break;

    case 'top-right':
      x += containerWidth - width;
      break;

    case 'right':
      x += containerWidth - width;
      y += (containerHeight - height) / 2;
      break;

    case 'bottom-right':
      x += containerWidth - width;
      y += containerHeight - height;
      break;

    case 'bottom':
      x += (containerWidth - width) / 2;
      y += containerHeight - height;
      break;

    case 'bottom-left':
      y += containerHeight - height;
      break;

    case 'left':
      y += (containerHeight - height) / 2;
      break;

    case 'center':
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
    case 'left-to-right':
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

    case 'right-to-left':
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

    case 'top-to-bottom':
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

    case 'bottom-to-top':
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

var SymbolCircle = function SymbolCircle(_ref) {
  var x = _ref.x,
      y = _ref.y,
      size = _ref.size,
      fill = _ref.fill,
      _ref$opacity = _ref.opacity,
      opacity = _ref$opacity === void 0 ? 1 : _ref$opacity,
      _ref$borderWidth = _ref.borderWidth,
      borderWidth = _ref$borderWidth === void 0 ? 0 : _ref$borderWidth,
      _ref$borderColor = _ref.borderColor,
      borderColor = _ref$borderColor === void 0 ? 'transparent' : _ref$borderColor;
  return jsxRuntime.jsx("circle", {
    r: size / 2,
    cx: x + size / 2,
    cy: y + size / 2,
    fill: fill,
    opacity: opacity,
    strokeWidth: borderWidth,
    stroke: borderColor,
    style: {
      pointerEvents: 'none'
    }
  });
};

var SymbolDiamond = function SymbolDiamond(_ref) {
  var x = _ref.x,
      y = _ref.y,
      size = _ref.size,
      fill = _ref.fill,
      _ref$opacity = _ref.opacity,
      opacity = _ref$opacity === void 0 ? 1 : _ref$opacity,
      _ref$borderWidth = _ref.borderWidth,
      borderWidth = _ref$borderWidth === void 0 ? 0 : _ref$borderWidth,
      _ref$borderColor = _ref.borderColor,
      borderColor = _ref$borderColor === void 0 ? 'transparent' : _ref$borderColor;
  return jsxRuntime.jsx("g", {
    transform: "translate(".concat(x, ",").concat(y, ")"),
    children: jsxRuntime.jsx("path", {
      d: "\n                    M".concat(size / 2, " 0\n                    L").concat(size * 0.8, " ").concat(size / 2, "\n                    L").concat(size / 2, " ").concat(size, "\n                    L").concat(size * 0.2, " ").concat(size / 2, "\n                    L").concat(size / 2, " 0\n                "),
      fill: fill,
      opacity: opacity,
      strokeWidth: borderWidth,
      stroke: borderColor,
      style: {
        pointerEvents: 'none'
      }
    })
  });
};

var SymbolSquare = function SymbolSquare(_ref) {
  var x = _ref.x,
      y = _ref.y,
      size = _ref.size,
      fill = _ref.fill,
      _ref$opacity = _ref.opacity,
      opacity = _ref$opacity === void 0 ? 1 : _ref$opacity,
      _ref$borderWidth = _ref.borderWidth,
      borderWidth = _ref$borderWidth === void 0 ? 0 : _ref$borderWidth,
      _ref$borderColor = _ref.borderColor,
      borderColor = _ref$borderColor === void 0 ? 'transparent' : _ref$borderColor;
  return jsxRuntime.jsx("rect", {
    x: x,
    y: y,
    fill: fill,
    opacity: opacity,
    strokeWidth: borderWidth,
    stroke: borderColor,
    width: size,
    height: size,
    style: {
      pointerEvents: 'none'
    }
  });
};

var SymbolTriangle = function SymbolTriangle(_ref) {
  var x = _ref.x,
      y = _ref.y,
      size = _ref.size,
      fill = _ref.fill,
      _ref$opacity = _ref.opacity,
      opacity = _ref$opacity === void 0 ? 1 : _ref$opacity,
      _ref$borderWidth = _ref.borderWidth,
      borderWidth = _ref$borderWidth === void 0 ? 0 : _ref$borderWidth,
      _ref$borderColor = _ref.borderColor,
      borderColor = _ref$borderColor === void 0 ? 'transparent' : _ref$borderColor;
  return jsxRuntime.jsx("g", {
    transform: "translate(".concat(x, ",").concat(y, ")"),
    children: jsxRuntime.jsx("path", {
      d: "\n                M".concat(size / 2, " 0\n                L").concat(size, " ").concat(size, "\n                L0 ").concat(size, "\n                L").concat(size / 2, " 0\n            "),
      fill: fill,
      opacity: opacity,
      strokeWidth: borderWidth,
      stroke: borderColor,
      style: {
        pointerEvents: 'none'
      }
    })
  });
};

var symbolByShape = {
  circle: SymbolCircle,
  diamond: SymbolDiamond,
  square: SymbolSquare,
  triangle: SymbolTriangle
};
var LegendSvgItem = function LegendSvgItem(_ref) {
  var _style$symbolSize, _style$itemOpacity, _style$itemBackground, _style$symbolSize2, _ref4, _data$fill, _style$symbolBorderWi, _style$symbolBorderCo, _ref5, _ref6, _style$itemTextColor;

  var x = _ref.x,
      y = _ref.y,
      width = _ref.width,
      height = _ref.height,
      data = _ref.data,
      _ref$direction = _ref.direction,
      direction = _ref$direction === void 0 ? 'left-to-right' : _ref$direction,
      _ref$justify = _ref.justify,
      justify = _ref$justify === void 0 ? false : _ref$justify,
      textColor = _ref.textColor,
      _ref$background = _ref.background,
      background = _ref$background === void 0 ? 'transparent' : _ref$background,
      _ref$opacity = _ref.opacity,
      opacity = _ref$opacity === void 0 ? 1 : _ref$opacity,
      _ref$symbolShape = _ref.symbolShape,
      symbolShape = _ref$symbolShape === void 0 ? 'square' : _ref$symbolShape,
      _ref$symbolSize = _ref.symbolSize,
      symbolSize = _ref$symbolSize === void 0 ? 16 : _ref$symbolSize,
      _ref$symbolSpacing = _ref.symbolSpacing,
      symbolSpacing = _ref$symbolSpacing === void 0 ? 8 : _ref$symbolSpacing,
      _ref$symbolBorderWidt = _ref.symbolBorderWidth,
      symbolBorderWidth = _ref$symbolBorderWidt === void 0 ? 0 : _ref$symbolBorderWidt,
      _ref$symbolBorderColo = _ref.symbolBorderColor,
      symbolBorderColor = _ref$symbolBorderColo === void 0 ? 'transparent' : _ref$symbolBorderColo,
      _onClick = _ref.onClick,
      onMouseEnter = _ref.onMouseEnter,
      onMouseLeave = _ref.onMouseLeave,
      toggleSerie = _ref.toggleSerie,
      effects = _ref.effects;

  var _useState = React.useState({}),
      _useState2 = _slicedToArray(_useState, 2),
      style = _useState2[0],
      setStyle = _useState2[1];

  var theme = core.useTheme();
  var handleMouseEnter = React.useCallback(function (event) {
    if (effects) {
      var applyEffects = effects.filter(function (_ref2) {
        var on = _ref2.on;
        return on === 'hover';
      });

      var _style = applyEffects.reduce(function (acc, effect) {
        return _objectSpread2(_objectSpread2({}, acc), effect.style);
      }, {});

      setStyle(_style);
    }

    onMouseEnter === null || onMouseEnter === void 0 ? void 0 : onMouseEnter(data, event);
  }, [onMouseEnter, data, effects]);
  var handleMouseLeave = React.useCallback(function (event) {
    if (effects) {
      var applyEffects = effects.filter(function (_ref3) {
        var on = _ref3.on;
        return on !== 'hover';
      });

      var _style2 = applyEffects.reduce(function (acc, effect) {
        return _objectSpread2(_objectSpread2({}, acc), effect.style);
      }, {});

      setStyle(_style2);
    }

    onMouseLeave === null || onMouseLeave === void 0 ? void 0 : onMouseLeave(data, event);
  }, [onMouseLeave, data, effects]);

  var _computeItemLayout = computeItemLayout({
    direction: direction,
    justify: justify,
    symbolSize: (_style$symbolSize = style.symbolSize) !== null && _style$symbolSize !== void 0 ? _style$symbolSize : symbolSize,
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

  var isInteractive = [_onClick, onMouseEnter, onMouseLeave, toggleSerie].some(function (handler) {
    return handler !== undefined;
  });
  var SymbolShape = typeof symbolShape === 'function' ? symbolShape : symbolByShape[symbolShape];
  return jsxRuntime.jsxs("g", {
    transform: "translate(".concat(x, ",").concat(y, ")"),
    style: {
      opacity: (_style$itemOpacity = style.itemOpacity) !== null && _style$itemOpacity !== void 0 ? _style$itemOpacity : opacity
    },
    children: [jsxRuntime.jsx("rect", {
      width: width,
      height: height,
      fill: (_style$itemBackground = style.itemBackground) !== null && _style$itemBackground !== void 0 ? _style$itemBackground : background,
      style: {
        cursor: isInteractive ? 'pointer' : 'auto'
      },
      onClick: function onClick(event) {
        _onClick === null || _onClick === void 0 ? void 0 : _onClick(data, event);
        toggleSerie === null || toggleSerie === void 0 ? void 0 : toggleSerie(data.id);
      },
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave
    }), React.createElement(SymbolShape, _objectSpread2({
      id: data.id,
      x: symbolX,
      y: symbolY,
      size: (_style$symbolSize2 = style.symbolSize) !== null && _style$symbolSize2 !== void 0 ? _style$symbolSize2 : symbolSize,
      fill: (_ref4 = (_data$fill = data.fill) !== null && _data$fill !== void 0 ? _data$fill : data.color) !== null && _ref4 !== void 0 ? _ref4 : 'black',
      borderWidth: (_style$symbolBorderWi = style.symbolBorderWidth) !== null && _style$symbolBorderWi !== void 0 ? _style$symbolBorderWi : symbolBorderWidth,
      borderColor: (_style$symbolBorderCo = style.symbolBorderColor) !== null && _style$symbolBorderCo !== void 0 ? _style$symbolBorderCo : symbolBorderColor
    }, data.hidden ? theme.legends.hidden.symbol : undefined)), jsxRuntime.jsx("text", {
      textAnchor: labelAnchor,
      style: _objectSpread2(_objectSpread2({}, theme.legends.text), {}, {
        fill: (_ref5 = (_ref6 = (_style$itemTextColor = style.itemTextColor) !== null && _style$itemTextColor !== void 0 ? _style$itemTextColor : textColor) !== null && _ref6 !== void 0 ? _ref6 : theme.legends.text.fill) !== null && _ref5 !== void 0 ? _ref5 : 'black',
        dominantBaseline: labelAlignment,
        pointerEvents: 'none',
        userSelect: 'none'
      }, data.hidden ? theme.legends.hidden.text : undefined),
      x: labelX,
      y: labelY,
      children: data.label
    })]
  });
};

var LegendSvg = function LegendSvg(_ref) {
  var data = _ref.data,
      x = _ref.x,
      y = _ref.y,
      direction = _ref.direction,
      _ref$padding = _ref.padding,
      _padding = _ref$padding === void 0 ? 0 : _ref$padding,
      justify = _ref.justify,
      effects = _ref.effects,
      itemWidth = _ref.itemWidth,
      itemHeight = _ref.itemHeight,
      _ref$itemDirection = _ref.itemDirection,
      itemDirection = _ref$itemDirection === void 0 ? 'left-to-right' : _ref$itemDirection,
      _ref$itemsSpacing = _ref.itemsSpacing,
      itemsSpacing = _ref$itemsSpacing === void 0 ? 0 : _ref$itemsSpacing,
      itemTextColor = _ref.itemTextColor,
      _ref$itemBackground = _ref.itemBackground,
      itemBackground = _ref$itemBackground === void 0 ? 'transparent' : _ref$itemBackground,
      _ref$itemOpacity = _ref.itemOpacity,
      itemOpacity = _ref$itemOpacity === void 0 ? 1 : _ref$itemOpacity,
      symbolShape = _ref.symbolShape,
      symbolSize = _ref.symbolSize,
      symbolSpacing = _ref.symbolSpacing,
      symbolBorderWidth = _ref.symbolBorderWidth,
      symbolBorderColor = _ref.symbolBorderColor,
      onClick = _ref.onClick,
      onMouseEnter = _ref.onMouseEnter,
      onMouseLeave = _ref.onMouseLeave,
      toggleSerie = _ref.toggleSerie;

  var _computeDimensions = computeDimensions({
    itemCount: data.length,
    itemWidth: itemWidth,
    itemHeight: itemHeight,
    itemsSpacing: itemsSpacing,
    direction: direction,
    padding: _padding
  }),
      padding = _computeDimensions.padding;

  var xStep = direction === 'row' ? itemWidth + itemsSpacing : 0;
  var yStep = direction === 'column' ? itemHeight + itemsSpacing : 0;
  return jsxRuntime.jsx("g", {
    transform: "translate(".concat(x, ",").concat(y, ")"),
    children: data.map(function (data, i) {
      return jsxRuntime.jsx(LegendSvgItem, {
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
        onMouseLeave: onMouseLeave,
        toggleSerie: toggleSerie
      }, i);
    })
  });
};

var BoxLegendSvg = function BoxLegendSvg(_ref) {
  var data = _ref.data,
      containerWidth = _ref.containerWidth,
      containerHeight = _ref.containerHeight,
      _ref$translateX = _ref.translateX,
      translateX = _ref$translateX === void 0 ? 0 : _ref$translateX,
      _ref$translateY = _ref.translateY,
      translateY = _ref$translateY === void 0 ? 0 : _ref$translateY,
      anchor = _ref.anchor,
      direction = _ref.direction,
      _ref$padding = _ref.padding,
      padding = _ref$padding === void 0 ? 0 : _ref$padding,
      justify = _ref.justify,
      _ref$itemsSpacing = _ref.itemsSpacing,
      itemsSpacing = _ref$itemsSpacing === void 0 ? 0 : _ref$itemsSpacing,
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
      toggleSerie = _ref.toggleSerie,
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

  return jsxRuntime.jsx(LegendSvg, {
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
    onMouseLeave: onMouseLeave,
    toggleSerie: typeof toggleSerie === 'boolean' ? undefined : toggleSerie
  });
};

var textAlignMapping = {
  start: 'left',
  middle: 'center',
  end: 'right'
};
var renderLegendToCanvas = function renderLegendToCanvas(ctx, _ref) {
  var data = _ref.data,
      containerWidth = _ref.containerWidth,
      containerHeight = _ref.containerHeight,
      _ref$translateX = _ref.translateX,
      translateX = _ref$translateX === void 0 ? 0 : _ref$translateX,
      _ref$translateY = _ref.translateY,
      translateY = _ref$translateY === void 0 ? 0 : _ref$translateY,
      anchor = _ref.anchor,
      direction = _ref.direction,
      _ref$padding = _ref.padding,
      _padding = _ref$padding === void 0 ? 0 : _ref$padding,
      _ref$justify = _ref.justify,
      justify = _ref$justify === void 0 ? false : _ref$justify,
      _ref$itemsSpacing = _ref.itemsSpacing,
      itemsSpacing = _ref$itemsSpacing === void 0 ? 0 : _ref$itemsSpacing,
      itemWidth = _ref.itemWidth,
      itemHeight = _ref.itemHeight,
      _ref$itemDirection = _ref.itemDirection,
      itemDirection = _ref$itemDirection === void 0 ? 'left-to-right' : _ref$itemDirection,
      itemTextColor = _ref.itemTextColor,
      _ref$symbolSize = _ref.symbolSize,
      symbolSize = _ref$symbolSize === void 0 ? 16 : _ref$symbolSize,
      _ref$symbolSpacing = _ref.symbolSpacing,
      symbolSpacing = _ref$symbolSpacing === void 0 ? 8 : _ref$symbolSpacing,
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

  var xStep = direction === 'row' ? itemWidth + itemsSpacing : 0;
  var yStep = direction === 'column' ? itemHeight + itemsSpacing : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.font = "".concat(theme.legends.text.fontSize, "px ").concat(theme.legends.text.fontFamily || 'sans-serif');
  data.forEach(function (d, i) {
    var _d$color, _ref2;

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

    ctx.fillStyle = (_d$color = d.color) !== null && _d$color !== void 0 ? _d$color : 'black';
    ctx.fillRect(itemX + symbolX, itemY + symbolY, symbolSize, symbolSize);
    ctx.textAlign = textAlignMapping[labelAnchor];

    if (labelAlignment === 'central') {
      ctx.textBaseline = 'middle';
    }

    ctx.fillStyle = (_ref2 = itemTextColor !== null && itemTextColor !== void 0 ? itemTextColor : theme.legends.text.fill) !== null && _ref2 !== void 0 ? _ref2 : 'black';
    ctx.fillText(String(d.label), itemX + labelX, itemY + labelY);
  });
  ctx.restore();
};

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
    var domain = overriddenDomain !== null && overriddenDomain !== void 0 ? overriddenDomain : scale.range();
    var items = domain.map(function (domainValue, index) {
      var _scale$invertExtent = scale.invertExtent(domainValue),
          _scale$invertExtent2 = _slicedToArray(_scale$invertExtent, 2),
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

var LegendPropShape = {
  data: PropTypes.arrayOf(PropTypes.object),
  anchor: PropTypes.oneOf(['top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left', 'top-left', 'center']).isRequired,
  translateX: PropTypes.number,
  translateY: PropTypes.number,
  direction: PropTypes.oneOf(['row', 'column']).isRequired,
  itemsSpacing: PropTypes.number,
  itemWidth: PropTypes.number.isRequired,
  itemHeight: PropTypes.number.isRequired,
  itemDirection: PropTypes.oneOf(['left-to-right', 'right-to-left', 'top-to-bottom', 'bottom-to-top']),
  itemTextColor: PropTypes.string,
  itemBackground: PropTypes.string,
  itemOpacity: PropTypes.number,
  symbolShape: PropTypes.oneOfType([PropTypes.oneOf(['circle', 'diamond', 'square', 'triangle']), PropTypes.func]),
  symbolSize: PropTypes.number,
  symbolSpacing: PropTypes.number,
  symbolBorderWidth: PropTypes.number,
  symbolBorderColor: PropTypes.string,
  onClick: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  effects: PropTypes.arrayOf(PropTypes.shape({
    on: PropTypes.oneOfType([PropTypes.oneOf(['hover'])]).isRequired,
    style: PropTypes.shape({
      itemTextColor: PropTypes.string,
      itemBackground: PropTypes.string,
      itemOpacity: PropTypes.number,
      symbolSize: PropTypes.number,
      symbolBorderWidth: PropTypes.number,
      symbolBorderColor: PropTypes.string
    }).isRequired
  }))
};

exports.BoxLegendSvg = BoxLegendSvg;
exports.LegendPropShape = LegendPropShape;
exports.LegendSvg = LegendSvg;
exports.LegendSvgItem = LegendSvgItem;
exports.renderLegendToCanvas = renderLegendToCanvas;
exports.useQuantizeColorScaleLegendData = useQuantizeColorScaleLegendData;
//# sourceMappingURL=nivo-legends.cjs.js.map
