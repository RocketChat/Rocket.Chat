'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var react = require('react');
var core = require('@nivo/core');
var axes = require('@nivo/axes');
var tooltip = require('@nivo/tooltip');
var PropTypes = _interopDefault(require('prop-types'));
var colors = require('@nivo/colors');
var d3Scale = require('d3-scale');
var web = require('@react-spring/web');
var jsxRuntime = require('react/jsx-runtime');

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

var HeatMapPropTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  indexBy: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
  keys: PropTypes.arrayOf(PropTypes.string).isRequired,
  minValue: PropTypes.oneOfType([PropTypes.oneOf(['auto']), PropTypes.number]).isRequired,
  maxValue: PropTypes.oneOfType([PropTypes.oneOf(['auto']), PropTypes.number]).isRequired,
  forceSquare: PropTypes.bool.isRequired,
  sizeVariation: PropTypes.number.isRequired,
  padding: PropTypes.number.isRequired,
  cellShape: PropTypes.oneOfType([PropTypes.oneOf(['rect', 'circle']), PropTypes.func]).isRequired,
  cellOpacity: PropTypes.number.isRequired,
  cellBorderWidth: PropTypes.number.isRequired,
  cellBorderColor: colors.inheritedColorPropType.isRequired,
  axisTop: axes.axisPropType,
  axisRight: axes.axisPropType,
  axisBottom: axes.axisPropType,
  axisLeft: axes.axisPropType,
  enableGridX: PropTypes.bool.isRequired,
  enableGridY: PropTypes.bool.isRequired,
  enableLabels: PropTypes.bool.isRequired,
  label: PropTypes.func.isRequired,
  labelTextColor: colors.inheritedColorPropType.isRequired,
  colors: core.quantizeColorScalePropType.isRequired,
  nanColor: PropTypes.string,
  isInteractive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  hoverTarget: PropTypes.oneOf(['cell', 'row', 'column', 'rowColumn']).isRequired,
  cellHoverOpacity: PropTypes.number.isRequired,
  cellHoverOthersOpacity: PropTypes.number.isRequired,
  tooltipFormat: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  tooltip: PropTypes.func,
  pixelRatio: PropTypes.number.isRequired
};
var HeatMapSvgPropTypes = _objectSpread2(_objectSpread2({}, HeatMapPropTypes), {}, {
  role: PropTypes.string.isRequired
});
var HeatMapDefaultProps = {
  indexBy: 'id',
  minValue: 'auto',
  maxValue: 'auto',
  forceSquare: false,
  sizeVariation: 0,
  padding: 0,
  cellShape: 'rect',
  cellOpacity: 0.85,
  cellBorderWidth: 0,
  cellBorderColor: {
    from: 'color'
  },
  axisTop: {},
  axisLeft: {},
  enableGridX: false,
  enableGridY: false,
  enableLabels: true,
  label: function label(datum, key) {
    return datum[key];
  },
  labelTextColor: {
    from: 'color',
    modifiers: [['darker', 1.4]]
  },
  colors: 'nivo',
  nanColor: '#000000',
  isInteractive: true,
  onClick: core.noop,
  hoverTarget: 'rowColumn',
  cellHoverOpacity: 1,
  cellHoverOthersOpacity: 0.35,
  pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
};
var HeatMapSvgDefaultProps = _objectSpread2(_objectSpread2({}, HeatMapDefaultProps), {}, {
  role: 'img'
});

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
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

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

var computeX = function computeX(column, cellWidth, padding) {
  return column * cellWidth + cellWidth * 0.5 + padding * column + padding;
};
var computeY = function computeY(row, cellHeight, padding) {
  return row * cellHeight + cellHeight * 0.5 + padding * row + padding;
};
var isHoverTargetByType = {
  cell: function cell(_cell, current) {
    return _cell.xKey === current.xKey && _cell.yKey === current.yKey;
  },
  row: function row(cell, current) {
    return cell.yKey === current.yKey;
  },
  column: function column(cell, current) {
    return cell.xKey === current.xKey;
  },
  rowColumn: function rowColumn(cell, current) {
    return cell.xKey === current.xKey || cell.yKey === current.yKey;
  }
};
var computeCells = function computeCells(_ref) {
  var data = _ref.data,
      keys = _ref.keys,
      getIndex = _ref.getIndex,
      xScale = _ref.xScale,
      yScale = _ref.yScale,
      sizeScale = _ref.sizeScale,
      cellOpacity = _ref.cellOpacity,
      cellWidth = _ref.cellWidth,
      cellHeight = _ref.cellHeight,
      colorScale = _ref.colorScale,
      nanColor = _ref.nanColor,
      getLabel = _ref.getLabel,
      getLabelTextColor = _ref.getLabelTextColor;
  var cells = [];
  data.forEach(function (datum) {
    keys.forEach(function (key) {
      var value = datum[key];
      var label = getLabel(datum, key);
      var index = getIndex(datum);
      var sizeMultiplier = sizeScale ? sizeScale(value) : 1;
      var width = sizeMultiplier * cellWidth;
      var height = sizeMultiplier * cellHeight;
      var cell = {
        id: "".concat(key, ".").concat(index),
        xKey: key,
        yKey: index,
        x: xScale(key),
        y: yScale(index),
        width: width,
        height: height,
        value: value,
        label: label,
        color: isNaN(value) ? nanColor : colorScale(value),
        opacity: cellOpacity
      };
      cell.labelTextColor = getLabelTextColor(cell);
      cells.push(cell);
    });
  });
  return cells;
};
var useHeatMap = function useHeatMap(_ref2) {
  var data = _ref2.data,
      keys = _ref2.keys,
      indexBy = _ref2.indexBy,
      _ref2$minValue = _ref2.minValue,
      _minValue = _ref2$minValue === void 0 ? 'auto' : _ref2$minValue,
      _ref2$maxValue = _ref2.maxValue,
      _maxValue = _ref2$maxValue === void 0 ? 'auto' : _ref2$maxValue,
      width = _ref2.width,
      height = _ref2.height,
      padding = _ref2.padding,
      forceSquare = _ref2.forceSquare,
      sizeVariation = _ref2.sizeVariation,
      colors$1 = _ref2.colors,
      nanColor = _ref2.nanColor,
      cellOpacity = _ref2.cellOpacity,
      cellBorderColor = _ref2.cellBorderColor,
      label = _ref2.label,
      labelTextColor = _ref2.labelTextColor,
      hoverTarget = _ref2.hoverTarget,
      cellHoverOpacity = _ref2.cellHoverOpacity,
      cellHoverOthersOpacity = _ref2.cellHoverOthersOpacity;
  var _useState = react.useState(null),
      _useState2 = _slicedToArray(_useState, 2),
      currentCellId = _useState2[0],
      setCurrentCellId = _useState2[1];
  var getIndex = core.usePropertyAccessor(indexBy);
  var indices = react.useMemo(function () {
    return data.map(getIndex);
  }, [data, getIndex]);
  var getLabel = react.useMemo(function () {
    return core.getLabelGenerator(label);
  }, [label]);
  var layoutConfig = react.useMemo(function () {
    var columns = keys.length;
    var rows = data.length;
    var cellWidth = Math.max((width - padding * (columns + 1)) / columns, 0);
    var cellHeight = Math.max((height - padding * (rows + 1)) / rows, 0);
    var offsetX = 0;
    var offsetY = 0;
    if (forceSquare === true) {
      var cellSize = Math.min(cellWidth, cellHeight);
      cellWidth = cellSize;
      cellHeight = cellSize;
      offsetX = (width - ((cellWidth + padding) * columns + padding)) / 2;
      offsetY = (height - ((cellHeight + padding) * rows + padding)) / 2;
    }
    return {
      cellWidth: cellWidth,
      cellHeight: cellHeight,
      offsetX: offsetX,
      offsetY: offsetY
    };
  }, [data, keys, width, height, padding, forceSquare]);
  var scales = react.useMemo(function () {
    return {
      x: d3Scale.scaleOrdinal(keys.map(function (key, i) {
        return computeX(i, layoutConfig.cellWidth, padding);
      })).domain(keys),
      y: d3Scale.scaleOrdinal(indices.map(function (d, i) {
        return computeY(i, layoutConfig.cellHeight, padding);
      })).domain(indices)
    };
  }, [indices, keys, layoutConfig, padding]);
  var values = react.useMemo(function () {
    var minValue = _minValue;
    var maxValue = _maxValue;
    if (minValue === 'auto' || maxValue === 'auto') {
      var allValues = data.reduce(function (acc, row) {
        return acc.concat(keys.map(function (key) {
          return row[key];
        }));
      }, []);
      if (minValue === 'auto') minValue = Math.min.apply(Math, _toConsumableArray(allValues));
      if (maxValue === 'auto') maxValue = Math.max.apply(Math, _toConsumableArray(allValues));
    }
    return {
      min: Math.min(minValue, maxValue),
      max: Math.max(maxValue, minValue)
    };
  }, [data, keys, _minValue, _maxValue]);
  var sizeScale = react.useMemo(function () {
    if (sizeVariation > 0) {
      return d3Scale.scaleLinear().range([1 - sizeVariation, 1]).domain([values.min, values.max]);
    }
  }, [sizeVariation, values]);
  var colorScale = react.useMemo(function () {
    return core.guessQuantizeColorScale(colors$1).domain([values.min, values.max]);
  }, [colors$1, values]);
  var theme = core.useTheme();
  var getCellBorderColor = colors.useInheritedColor(cellBorderColor, theme);
  var getLabelTextColor = colors.useInheritedColor(labelTextColor, theme);
  var cells = react.useMemo(function () {
    return computeCells({
      data: data,
      keys: keys,
      getIndex: getIndex,
      xScale: scales.x,
      yScale: scales.y,
      sizeScale: sizeScale,
      cellOpacity: cellOpacity,
      cellWidth: layoutConfig.cellWidth,
      cellHeight: layoutConfig.cellHeight,
      colorScale: colorScale,
      nanColor: nanColor,
      getLabel: getLabel,
      getLabelTextColor: getLabelTextColor
    });
  }, [data, keys, getIndex, scales, sizeScale, cellOpacity, layoutConfig, colorScale, nanColor, getLabel, getLabelTextColor]);
  var cellsWithCurrent = react.useMemo(function () {
    if (currentCellId === null) return cells;
    var isHoverTarget = isHoverTargetByType[hoverTarget];
    var currentCell = cells.find(function (cell) {
      return cell.id === currentCellId;
    });
    return cells.map(function (cell) {
      var opacity = isHoverTarget(cell, currentCell) ? cellHoverOpacity : cellHoverOthersOpacity;
      if (opacity === cell.opacity) return cell;
      return _objectSpread2(_objectSpread2({}, cell), {}, {
        opacity: opacity
      });
    });
  }, [cells, currentCellId, hoverTarget, cellHoverOpacity, cellHoverOthersOpacity]);
  return _objectSpread2(_objectSpread2({
    cells: cellsWithCurrent,
    getIndex: getIndex,
    xScale: scales.x,
    yScale: scales.y
  }, layoutConfig), {}, {
    sizeScale: sizeScale,
    currentCellId: currentCellId,
    setCurrentCellId: setCurrentCellId,
    colorScale: colorScale,
    getCellBorderColor: getCellBorderColor,
    getLabelTextColor: getLabelTextColor
  });
};

var HeatMapCells = function HeatMapCells(_ref) {
  var cells = _ref.cells,
      cellComponent = _ref.cellComponent,
      cellBorderWidth = _ref.cellBorderWidth,
      getCellBorderColor = _ref.getCellBorderColor,
      enableLabels = _ref.enableLabels,
      getLabelTextColor = _ref.getLabelTextColor,
      handleCellHover = _ref.handleCellHover,
      handleCellLeave = _ref.handleCellLeave,
      onClick = _ref.onClick;
  return cells.map(function (cell) {
    return react.createElement(cellComponent, {
      key: cell.id,
      data: cell,
      label: cell.label,
      x: cell.x,
      y: cell.y,
      width: cell.width,
      height: cell.height,
      color: cell.color,
      opacity: cell.opacity,
      borderWidth: cellBorderWidth,
      borderColor: getCellBorderColor(cell),
      enableLabel: enableLabels,
      textColor: getLabelTextColor(cell),
      onHover: handleCellHover ? function (event) {
        return handleCellHover(cell, event);
      } : undefined,
      onLeave: handleCellLeave,
      onClick: onClick
    });
  });
};
HeatMapCells.propTypes = {};

var HeatMapCellRect = function HeatMapCellRect(_ref) {
  var data = _ref.data,
      label = _ref.label,
      x = _ref.x,
      y = _ref.y,
      width = _ref.width,
      height = _ref.height,
      color = _ref.color,
      opacity = _ref.opacity,
      borderWidth = _ref.borderWidth,
      borderColor = _ref.borderColor,
      enableLabel = _ref.enableLabel,
      textColor = _ref.textColor,
      onHover = _ref.onHover,
      onLeave = _ref.onLeave,
      onClick = _ref.onClick;
  var theme = core.useTheme();
  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.config;
  var animatedProps = web.useSpring({
    transform: "translate(".concat(x, ", ").concat(y, ")"),
    width: width,
    height: height,
    xOffset: width * -0.5,
    yOffset: height * -0.5,
    color: color,
    opacity: opacity,
    textColor: textColor,
    borderWidth: borderWidth,
    borderColor: borderColor,
    config: springConfig,
    immediate: !animate
  });
  return jsxRuntime.jsxs(web.animated.g, {
    transform: animatedProps.transform,
    style: {
      cursor: 'pointer'
    },
    onMouseEnter: onHover,
    onMouseMove: onHover,
    onMouseLeave: onLeave,
    onClick: onClick ? function (event) {
      return onClick(data, event);
    } : undefined,
    children: [jsxRuntime.jsx(web.animated.rect, {
      x: animatedProps.xOffset,
      y: animatedProps.yOffset,
      width: animatedProps.width,
      height: animatedProps.height,
      fill: animatedProps.color,
      fillOpacity: animatedProps.opacity,
      strokeWidth: animatedProps.borderWidth,
      stroke: animatedProps.borderColor,
      strokeOpacity: animatedProps.opacity
    }), enableLabel && jsxRuntime.jsx(web.animated.text, {
      dominantBaseline: "central",
      textAnchor: "middle",
      style: _objectSpread2(_objectSpread2({}, theme.labels.text), {}, {
        fill: animatedProps.textColor
      }),
      fillOpacity: animatedProps.opacity,
      children: label
    })]
  });
};
var HeatMapCellRect$1 = react.memo(HeatMapCellRect);

var HeatMapCellCircle = function HeatMapCellCircle(_ref) {
  var data = _ref.data,
      label = _ref.label,
      x = _ref.x,
      y = _ref.y,
      width = _ref.width,
      height = _ref.height,
      color = _ref.color,
      opacity = _ref.opacity,
      borderWidth = _ref.borderWidth,
      borderColor = _ref.borderColor,
      enableLabel = _ref.enableLabel,
      textColor = _ref.textColor,
      onHover = _ref.onHover,
      onLeave = _ref.onLeave,
      onClick = _ref.onClick;
  var theme = core.useTheme();
  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.config;
  var animatedProps = web.useSpring({
    transform: "translate(".concat(x, ", ").concat(y, ")"),
    radius: Math.min(width, height) / 2,
    color: color,
    opacity: opacity,
    textColor: textColor,
    borderWidth: borderWidth,
    borderColor: borderColor,
    config: springConfig,
    immediate: !animate
  });
  return jsxRuntime.jsxs(web.animated.g, {
    transform: animatedProps.transform,
    style: {
      cursor: 'pointer'
    },
    onMouseEnter: onHover,
    onMouseMove: onHover,
    onMouseLeave: onLeave,
    onClick: onClick ? function (event) {
      return onClick(data, event);
    } : undefined,
    children: [jsxRuntime.jsx(web.animated.circle, {
      r: animatedProps.radius,
      fill: animatedProps.color,
      fillOpacity: animatedProps.opacity,
      strokeWidth: animatedProps.borderWidth,
      stroke: animatedProps.borderColor,
      strokeOpacity: animatedProps.opacity
    }), enableLabel && jsxRuntime.jsx(web.animated.text, {
      dominantBaseline: "central",
      textAnchor: "middle",
      style: _objectSpread2(_objectSpread2({}, theme.labels.text), {}, {
        fill: animatedProps.textColor
      }),
      fillOpacity: animatedProps.opacity,
      children: label
    })]
  });
};
var HeatMapCellCircle$1 = react.memo(HeatMapCellCircle);

var HeatMapCellTooltip = function HeatMapCellTooltip(_ref) {
  var cell = _ref.cell,
      format = _ref.format,
      tooltip$1 = _ref.tooltip;
  return jsxRuntime.jsx(tooltip.BasicTooltip, {
    id: "".concat(cell.yKey, " - ").concat(cell.xKey),
    value: cell.value,
    enableChip: true,
    color: cell.color,
    format: format,
    renderContent: typeof tooltip$1 === 'function' ? tooltip$1.bind(null, _objectSpread2({}, cell)) : null
  });
};
var HeatMapCellTooltip$1 = react.memo(HeatMapCellTooltip);

var HeatMap = function HeatMap(_ref) {
  var data = _ref.data,
      keys = _ref.keys,
      indexBy = _ref.indexBy,
      minValue = _ref.minValue,
      maxValue = _ref.maxValue,
      width = _ref.width,
      height = _ref.height,
      partialMargin = _ref.margin,
      forceSquare = _ref.forceSquare,
      padding = _ref.padding,
      sizeVariation = _ref.sizeVariation,
      cellShape = _ref.cellShape,
      cellOpacity = _ref.cellOpacity,
      cellBorderWidth = _ref.cellBorderWidth,
      cellBorderColor = _ref.cellBorderColor,
      axisTop = _ref.axisTop,
      axisRight = _ref.axisRight,
      axisBottom = _ref.axisBottom,
      axisLeft = _ref.axisLeft,
      enableGridX = _ref.enableGridX,
      enableGridY = _ref.enableGridY,
      enableLabels = _ref.enableLabels,
      label = _ref.label,
      labelTextColor = _ref.labelTextColor,
      colors = _ref.colors,
      nanColor = _ref.nanColor,
      isInteractive = _ref.isInteractive,
      onClick = _ref.onClick,
      hoverTarget = _ref.hoverTarget,
      cellHoverOpacity = _ref.cellHoverOpacity,
      cellHoverOthersOpacity = _ref.cellHoverOthersOpacity,
      tooltipFormat = _ref.tooltipFormat,
      tooltip$1 = _ref.tooltip,
      role = _ref.role;
  var _useDimensions = core.useDimensions(width, height, partialMargin),
      margin = _useDimensions.margin,
      innerWidth = _useDimensions.innerWidth,
      innerHeight = _useDimensions.innerHeight,
      outerWidth = _useDimensions.outerWidth,
      outerHeight = _useDimensions.outerHeight;
  var _useHeatMap = useHeatMap({
    data: data,
    keys: keys,
    indexBy: indexBy,
    minValue: minValue,
    maxValue: maxValue,
    width: innerWidth,
    height: innerHeight,
    padding: padding,
    forceSquare: forceSquare,
    sizeVariation: sizeVariation,
    colors: colors,
    nanColor: nanColor,
    cellOpacity: cellOpacity,
    cellBorderColor: cellBorderColor,
    label: label,
    labelTextColor: labelTextColor,
    hoverTarget: hoverTarget,
    cellHoverOpacity: cellHoverOpacity,
    cellHoverOthersOpacity: cellHoverOthersOpacity
  }),
      cells = _useHeatMap.cells,
      xScale = _useHeatMap.xScale,
      yScale = _useHeatMap.yScale,
      offsetX = _useHeatMap.offsetX,
      offsetY = _useHeatMap.offsetY,
      setCurrentCellId = _useHeatMap.setCurrentCellId,
      getCellBorderColor = _useHeatMap.getCellBorderColor,
      getLabelTextColor = _useHeatMap.getLabelTextColor;
  var _useTooltip = tooltip.useTooltip(),
      showTooltipFromEvent = _useTooltip.showTooltipFromEvent,
      hideTooltip = _useTooltip.hideTooltip;
  var handleCellHover = react.useCallback(function (cell, event) {
    setCurrentCellId(cell.id);
    showTooltipFromEvent(jsxRuntime.jsx(HeatMapCellTooltip$1, {
      cell: cell,
      format: tooltipFormat,
      tooltip: tooltip$1
    }), event);
  }, [setCurrentCellId, showTooltipFromEvent, tooltipFormat, tooltip$1]);
  var handleCellLeave = react.useCallback(function () {
    setCurrentCellId(null);
    hideTooltip();
  }, [setCurrentCellId, hideTooltip]);
  var cellComponent;
  if (cellShape === 'rect') {
    cellComponent = HeatMapCellRect$1;
  } else if (cellShape === 'circle') {
    cellComponent = HeatMapCellCircle$1;
  } else {
    cellComponent = cellShape;
  }
  return jsxRuntime.jsxs(core.SvgWrapper, {
    width: outerWidth,
    height: outerHeight,
    margin: Object.assign({}, margin, {
      top: margin.top + offsetY,
      left: margin.left + offsetX
    }),
    role: role,
    children: [jsxRuntime.jsx(axes.Grid, {
      width: innerWidth - offsetX * 2,
      height: innerHeight - offsetY * 2,
      xScale: enableGridX ? xScale : null,
      yScale: enableGridY ? yScale : null
    }), jsxRuntime.jsx(axes.Axes, {
      xScale: xScale,
      yScale: yScale,
      width: innerWidth - offsetX * 2,
      height: innerHeight - offsetY * 2,
      top: axisTop,
      right: axisRight,
      bottom: axisBottom,
      left: axisLeft
    }), jsxRuntime.jsx(HeatMapCells, {
      cells: cells,
      cellComponent: cellComponent,
      cellBorderWidth: cellBorderWidth,
      getCellBorderColor: getCellBorderColor,
      enableLabels: enableLabels,
      getLabelTextColor: getLabelTextColor,
      handleCellHover: isInteractive ? handleCellHover : undefined,
      handleCellLeave: isInteractive ? handleCellLeave : undefined,
      onClick: isInteractive ? onClick : undefined
    })]
  });
};
var WrappedHeatMap = core.withContainer(HeatMap);
WrappedHeatMap.defaultProps = HeatMapSvgDefaultProps;

var renderRect = function renderRect(ctx, _ref, _ref2) {
  var enableLabels = _ref.enableLabels,
      theme = _ref.theme;
  var x = _ref2.x,
      y = _ref2.y,
      width = _ref2.width,
      height = _ref2.height,
      color = _ref2.color,
      opacity = _ref2.opacity,
      labelTextColor = _ref2.labelTextColor,
      label = _ref2.label;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.fillRect(x - width / 2, y - height / 2, width, height);
  if (enableLabels === true) {
    ctx.fillStyle = labelTextColor;
    ctx.font = "".concat(theme.labels.text.fontSize, "px ").concat(theme.labels.text.fontFamily);
    ctx.fillText(label, x, y);
  }
  ctx.restore();
};
var renderCircle = function renderCircle(ctx, _ref3, _ref4) {
  var enableLabels = _ref3.enableLabels,
      theme = _ref3.theme;
  var x = _ref4.x,
      y = _ref4.y,
      width = _ref4.width,
      height = _ref4.height,
      color = _ref4.color,
      opacity = _ref4.opacity,
      labelTextColor = _ref4.labelTextColor,
      label = _ref4.label;
  ctx.save();
  ctx.globalAlpha = opacity;
  var radius = Math.min(width, height) / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
  if (enableLabels === true) {
    ctx.fillStyle = labelTextColor;
    ctx.font = "".concat(theme.labels.text.fontSize, "px ").concat(theme.labels.text.fontFamily);
    ctx.fillText(label, x, y);
  }
  ctx.restore();
};

var HeatMapCanvas = function HeatMapCanvas(_ref) {
  var data = _ref.data,
      keys = _ref.keys,
      indexBy = _ref.indexBy,
      minValue = _ref.minValue,
      maxValue = _ref.maxValue,
      width = _ref.width,
      height = _ref.height,
      partialMargin = _ref.margin,
      forceSquare = _ref.forceSquare,
      padding = _ref.padding,
      sizeVariation = _ref.sizeVariation,
      cellShape = _ref.cellShape,
      cellOpacity = _ref.cellOpacity,
      cellBorderColor = _ref.cellBorderColor,
      axisTop = _ref.axisTop,
      axisRight = _ref.axisRight,
      axisBottom = _ref.axisBottom,
      axisLeft = _ref.axisLeft,
      enableLabels = _ref.enableLabels,
      label = _ref.label,
      labelTextColor = _ref.labelTextColor,
      colors = _ref.colors,
      nanColor = _ref.nanColor,
      isInteractive = _ref.isInteractive,
      onClick = _ref.onClick,
      hoverTarget = _ref.hoverTarget,
      cellHoverOpacity = _ref.cellHoverOpacity,
      cellHoverOthersOpacity = _ref.cellHoverOthersOpacity,
      tooltipFormat = _ref.tooltipFormat,
      tooltip$1 = _ref.tooltip,
      pixelRatio = _ref.pixelRatio;
  var canvasEl = react.useRef(null);
  var _useDimensions = core.useDimensions(width, height, partialMargin),
      margin = _useDimensions.margin,
      innerWidth = _useDimensions.innerWidth,
      innerHeight = _useDimensions.innerHeight,
      outerWidth = _useDimensions.outerWidth,
      outerHeight = _useDimensions.outerHeight;
  var _useHeatMap = useHeatMap({
    data: data,
    keys: keys,
    indexBy: indexBy,
    minValue: minValue,
    maxValue: maxValue,
    width: innerWidth,
    height: innerHeight,
    padding: padding,
    forceSquare: forceSquare,
    sizeVariation: sizeVariation,
    colors: colors,
    nanColor: nanColor,
    cellOpacity: cellOpacity,
    cellBorderColor: cellBorderColor,
    label: label,
    labelTextColor: labelTextColor,
    hoverTarget: hoverTarget,
    cellHoverOpacity: cellHoverOpacity,
    cellHoverOthersOpacity: cellHoverOthersOpacity
  }),
      cells = _useHeatMap.cells,
      xScale = _useHeatMap.xScale,
      yScale = _useHeatMap.yScale,
      offsetX = _useHeatMap.offsetX,
      offsetY = _useHeatMap.offsetY,
      currentCellId = _useHeatMap.currentCellId,
      setCurrentCellId = _useHeatMap.setCurrentCellId;
  var theme = core.useTheme();
  react.useEffect(function () {
    canvasEl.current.width = outerWidth * pixelRatio;
    canvasEl.current.height = outerHeight * pixelRatio;
    var ctx = canvasEl.current.getContext('2d');
    ctx.scale(pixelRatio, pixelRatio);
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, outerWidth, outerHeight);
    ctx.translate(margin.left + offsetX, margin.top + offsetY);
    axes.renderAxesToCanvas(ctx, {
      xScale: xScale,
      yScale: yScale,
      width: innerWidth - offsetX * 2,
      height: innerHeight - offsetY * 2,
      top: axisTop,
      right: axisRight,
      bottom: axisBottom,
      left: axisLeft,
      theme: theme
    });
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var renderCell;
    if (cellShape === 'rect') {
      renderCell = renderRect;
    } else {
      renderCell = renderCircle;
    }
    cells.forEach(function (cell) {
      renderCell(ctx, {
        enableLabels: enableLabels,
        theme: theme
      }, cell);
    });
  }, [canvasEl, cells, outerWidth, outerHeight, innerWidth, innerHeight, margin, offsetX, offsetY, cellShape, axisTop, axisRight, axisBottom, axisLeft, xScale, yScale, theme, enableLabels, pixelRatio]);
  var _useTooltip = tooltip.useTooltip(),
      showTooltipFromEvent = _useTooltip.showTooltipFromEvent,
      hideTooltip = _useTooltip.hideTooltip;
  var handleMouseHover = react.useCallback(function (event) {
    var _getRelativeCursor = core.getRelativeCursor(canvasEl.current, event),
        _getRelativeCursor2 = _slicedToArray(_getRelativeCursor, 2),
        x = _getRelativeCursor2[0],
        y = _getRelativeCursor2[1];
    var cell = cells.find(function (c) {
      return core.isCursorInRect(c.x + margin.left + offsetX - c.width / 2, c.y + margin.top + offsetY - c.height / 2, c.width, c.height, x, y);
    });
    if (cell !== undefined) {
      setCurrentCellId(cell.id);
      showTooltipFromEvent(jsxRuntime.jsx(HeatMapCellTooltip$1, {
        cell: cell,
        tooltip: tooltip$1,
        format: tooltipFormat
      }), event);
    } else {
      setCurrentCellId(null);
      hideTooltip();
    }
  }, [canvasEl, cells, margin, offsetX, offsetY, setCurrentCellId, showTooltipFromEvent, hideTooltip, tooltip$1, tooltipFormat]);
  var handleMouseLeave = react.useCallback(function () {
    setCurrentCellId(null);
    hideTooltip();
  }, [setCurrentCellId, hideTooltip]);
  var handleClick = react.useCallback(function (event) {
    if (currentCellId === null) return;
    var currentCell = cells.find(function (cell) {
      return cell.id === currentCellId;
    });
    currentCell && onClick(currentCell, event);
  }, [cells, currentCellId, onClick]);
  return jsxRuntime.jsx("canvas", {
    ref: canvasEl,
    width: outerWidth * pixelRatio,
    height: outerHeight * pixelRatio,
    style: {
      width: outerWidth,
      height: outerHeight
    },
    onMouseEnter: isInteractive ? handleMouseHover : undefined,
    onMouseMove: isInteractive ? handleMouseHover : undefined,
    onMouseLeave: isInteractive ? handleMouseLeave : undefined,
    onClick: isInteractive ? handleClick : undefined
  });
};
var WrappedHeatMapCanvas = core.withContainer(HeatMapCanvas);
WrappedHeatMapCanvas.defaultProps = HeatMapDefaultProps;

var ResponsiveHeatMap = function ResponsiveHeatMap(props) {
  return jsxRuntime.jsx(core.ResponsiveWrapper, {
    children: function children(_ref) {
      var width = _ref.width,
          height = _ref.height;
      return jsxRuntime.jsx(WrappedHeatMap, _objectSpread2({
        width: width,
        height: height
      }, props));
    }
  });
};

var ResponsiveHeatMapCanvas = function ResponsiveHeatMapCanvas(props) {
  return jsxRuntime.jsx(core.ResponsiveWrapper, {
    children: function children(_ref) {
      var width = _ref.width,
          height = _ref.height;
      return jsxRuntime.jsx(WrappedHeatMapCanvas, _objectSpread2({
        width: width,
        height: height
      }, props));
    }
  });
};

exports.HeatMap = WrappedHeatMap;
exports.HeatMapCanvas = WrappedHeatMapCanvas;
exports.HeatMapDefaultProps = HeatMapDefaultProps;
exports.HeatMapPropTypes = HeatMapPropTypes;
exports.HeatMapSvgDefaultProps = HeatMapSvgDefaultProps;
exports.HeatMapSvgPropTypes = HeatMapSvgPropTypes;
exports.ResponsiveHeatMap = ResponsiveHeatMap;
exports.ResponsiveHeatMapCanvas = ResponsiveHeatMapCanvas;
exports.useHeatMap = useHeatMap;
//# sourceMappingURL=nivo-heatmap.cjs.js.map
