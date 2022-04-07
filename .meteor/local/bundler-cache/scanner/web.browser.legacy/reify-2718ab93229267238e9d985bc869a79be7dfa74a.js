'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var core = require('@nivo/core');
var colors = require('@nivo/colors');
var axes = require('@nivo/axes');
var legends = require('@nivo/legends');
var tooltip = require('@nivo/tooltip');
var d3Shape = require('d3-shape');
var scales = require('@nivo/scales');
var PropTypes = _interopDefault(require('prop-types'));
var reactMotion = require('react-motion');
var voronoi = require('@nivo/voronoi');

var LinePointTooltip = function LinePointTooltip(_ref) {
  var point = _ref.point;
  return React__default.createElement(tooltip.BasicTooltip, {
    id: React__default.createElement("span", null, "x: ", React__default.createElement("strong", null, point.data.xFormatted), ", y:", ' ', React__default.createElement("strong", null, point.data.yFormatted)),
    enableChip: true,
    color: point.serieColor
  });
};
LinePointTooltip.propTypes = {
  point: PropTypes.object.isRequired
};
var PointTooltip = React.memo(LinePointTooltip);

var Chip = function Chip(_ref) {
  var color = _ref.color;
  return React__default.createElement("span", {
    style: {
      display: 'block',
      width: '12px',
      height: '12px',
      background: color
    }
  });
};
Chip.propTypes = {
  color: PropTypes.string.isRequired
};
var SliceTooltip = function SliceTooltip(_ref2) {
  var slice = _ref2.slice,
      axis = _ref2.axis;
  var otherAxis = axis === 'x' ? 'y' : 'x';
  return React__default.createElement(tooltip.TableTooltip, {
    rows: slice.points.map(function (point) {
      return [React__default.createElement(Chip, {
        key: "chip",
        color: point.serieColor
      }), point.serieId, React__default.createElement("strong", {
        key: "value"
      }, point.data["".concat(otherAxis, "Formatted")])];
    })
  });
};
SliceTooltip.propTypes = {
  slice: PropTypes.object.isRequired,
  axis: PropTypes.oneOf(['x', 'y']).isRequired
};
var SliceTooltip$1 = React.memo(SliceTooltip);

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var commonPropTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    data: PropTypes.arrayOf(PropTypes.shape({
      x: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.instanceOf(Date)]),
      y: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.instanceOf(Date)])
    })).isRequired
  })).isRequired,
  xScale: scales.scalePropType.isRequired,
  xFormat: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  yScale: scales.scalePropType.isRequired,
  yFormat: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  layers: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.oneOf(['grid', 'markers', 'axes', 'areas', 'crosshair', 'lines', 'slices', 'points', 'mesh', 'legends']), PropTypes.func])).isRequired,
  curve: core.lineCurvePropType.isRequired,
  axisTop: axes.axisPropType,
  axisRight: axes.axisPropType,
  axisBottom: axes.axisPropType,
  axisLeft: axes.axisPropType,
  enableGridX: PropTypes.bool.isRequired,
  enableGridY: PropTypes.bool.isRequired,
  gridXValues: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.instanceOf(Date)]))]),
  gridYValues: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.instanceOf(Date)]))]),
  enablePoints: PropTypes.bool.isRequired,
  pointSymbol: PropTypes.func,
  pointSize: PropTypes.number.isRequired,
  pointColor: PropTypes.any.isRequired,
  pointBorderWidth: PropTypes.number.isRequired,
  pointBorderColor: PropTypes.any.isRequired,
  markers: PropTypes.arrayOf(PropTypes.shape({
    axis: PropTypes.oneOf(['x', 'y']).isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    style: PropTypes.object
  })),
  colors: colors.ordinalColorsPropType.isRequired,
  enableArea: PropTypes.bool.isRequired,
  areaOpacity: PropTypes.number.isRequired,
  areaBlendMode: core.blendModePropType.isRequired,
  areaBaselineValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  lineWidth: PropTypes.number.isRequired,
  legends: PropTypes.arrayOf(PropTypes.shape(legends.LegendPropShape)).isRequired,
  isInteractive: PropTypes.bool.isRequired,
  debugMesh: PropTypes.bool.isRequired,
  tooltip: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
  tooltipFormat: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  enableSlices: PropTypes.oneOf(['x', 'y', false]).isRequired,
  debugSlices: PropTypes.bool.isRequired,
  sliceTooltip: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
  enableCrosshair: PropTypes.bool.isRequired,
  crosshairType: tooltip.crosshairPropTypes.type.isRequired
};
var LinePropTypes = _objectSpread({}, commonPropTypes, {
  enablePointLabel: PropTypes.bool.isRequired,
  useMesh: PropTypes.bool.isRequired
}, core.motionPropTypes, core.defsPropTypes);
var LineCanvasPropTypes = _objectSpread({
  pixelRatio: PropTypes.number.isRequired
}, commonPropTypes);
var commonDefaultProps = {
  curve: 'linear',
  xScale: {
    type: 'point'
  },
  yScale: {
    type: 'linear',
    min: 0,
    max: 'auto'
  },
  layers: ['grid', 'markers', 'axes', 'areas', 'crosshair', 'lines', 'points', 'slices', 'mesh', 'legends'],
  axisBottom: {},
  axisLeft: {},
  enableGridX: true,
  enableGridY: true,
  enablePoints: true,
  pointSize: 6,
  pointColor: {
    from: 'color'
  },
  pointBorderWidth: 0,
  pointBorderColor: {
    theme: 'background'
  },
  colors: {
    scheme: 'nivo'
  },
  enableArea: false,
  areaBaselineValue: 0,
  areaOpacity: 0.2,
  areaBlendMode: 'normal',
  lineWidth: 2,
  legends: [],
  isInteractive: true,
  tooltip: PointTooltip,
  enableSlices: false,
  debugSlices: false,
  sliceTooltip: SliceTooltip$1,
  debugMesh: false,
  enableCrosshair: true,
  crosshairType: 'bottom-left'
};
var LineDefaultProps = _objectSpread({}, commonDefaultProps, {
  enablePointLabel: false,
  useMesh: false,
  animate: true,
  motionStiffness: 90,
  motionDamping: 15,
  defs: [],
  fill: []
});
var LineCanvasDefaultProps = _objectSpread({}, commonDefaultProps, {
  pixelRatio: global.window && global.window.devicePixelRatio ? global.window.devicePixelRatio : 1
});

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }
function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$1(target, key, source[key]); }); } return target; }
function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }
function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }
var useLineGenerator = function useLineGenerator(_ref) {
  var curve = _ref.curve;
  return React.useMemo(function () {
    return d3Shape.line().defined(function (d) {
      return d.x !== null && d.y !== null;
    }).x(function (d) {
      return d.x;
    }).y(function (d) {
      return d.y;
    }).curve(core.curveFromProp(curve));
  }, [curve]);
};
var useAreaGenerator = function useAreaGenerator(_ref2) {
  var curve = _ref2.curve,
      yScale = _ref2.yScale,
      areaBaselineValue = _ref2.areaBaselineValue;
  return React.useMemo(function () {
    return d3Shape.area().defined(function (d) {
      return d.x !== null && d.y !== null;
    }).x(function (d) {
      return d.x;
    }).y1(function (d) {
      return d.y;
    }).curve(core.curveFromProp(curve)).y0(yScale(areaBaselineValue));
  }, [curve, yScale, areaBaselineValue]);
};
var usePoints = function usePoints(_ref3) {
  var series = _ref3.series,
      getPointColor = _ref3.getPointColor,
      getPointBorderColor = _ref3.getPointBorderColor,
      formatX = _ref3.formatX,
      formatY = _ref3.formatY;
  return React.useMemo(function () {
    return series.reduce(function (acc, serie) {
      return [].concat(_toConsumableArray(acc), _toConsumableArray(serie.data.filter(function (datum) {
        return datum.position.x !== null && datum.position.y !== null;
      }).map(function (datum, i) {
        var point = {
          id: "".concat(serie.id, ".").concat(i),
          index: acc.length + i,
          serieId: serie.id,
          serieColor: serie.color,
          x: datum.position.x,
          y: datum.position.y
        };
        point.color = getPointColor(serie);
        point.borderColor = getPointBorderColor(point);
        point.data = _objectSpread$1({}, datum.data, {
          xFormatted: formatX(datum.data.x),
          yFormatted: formatY(datum.data.y)
        });
        return point;
      })));
    }, []);
  }, [series, getPointColor, getPointBorderColor, formatX, formatY]);
};
var useSlices = function useSlices(_ref4) {
  var enableSlices = _ref4.enableSlices,
      points = _ref4.points,
      width = _ref4.width,
      height = _ref4.height;
  return React.useMemo(function () {
    if (enableSlices === false) return [];
    if (enableSlices === 'x') {
      var map = new Map();
      points.forEach(function (point) {
        if (point.data.x === null || point.data.y === null) return;
        if (!map.has(point.x)) map.set(point.x, [point]);else map.get(point.x).push(point);
      });
      return Array.from(map.entries()).sort(function (a, b) {
        return a[0] - b[0];
      }).map(function (_ref5, i, slices) {
        var _ref6 = _slicedToArray(_ref5, 2),
            x = _ref6[0],
            slicePoints = _ref6[1];
        var prevSlice = slices[i - 1];
        var nextSlice = slices[i + 1];
        var x0;
        if (!prevSlice) x0 = x;else x0 = x - (x - prevSlice[0]) / 2;
        var sliceWidth;
        if (!nextSlice) sliceWidth = width - x0;else sliceWidth = x - x0 + (nextSlice[0] - x) / 2;
        return {
          id: x,
          x0: x0,
          x: x,
          y0: 0,
          y: 0,
          width: sliceWidth,
          height: height,
          points: slicePoints.reverse()
        };
      });
    } else if (enableSlices === 'y') {
      var _map = new Map();
      points.forEach(function (point) {
        if (point.data.x === null || point.data.y === null) return;
        if (!_map.has(point.y)) _map.set(point.y, [point]);else _map.get(point.y).push(point);
      });
      return Array.from(_map.entries()).sort(function (a, b) {
        return a[0] - b[0];
      }).map(function (_ref7, i, slices) {
        var _ref8 = _slicedToArray(_ref7, 2),
            y = _ref8[0],
            slicePoints = _ref8[1];
        var prevSlice = slices[i - 1];
        var nextSlice = slices[i + 1];
        var y0;
        if (!prevSlice) y0 = y;else y0 = y - (y - prevSlice[0]) / 2;
        var sliceHeight;
        if (!nextSlice) sliceHeight = height - y0;else sliceHeight = y - y0 + (nextSlice[0] - y) / 2;
        return {
          id: y,
          x0: 0,
          x: 0,
          y0: y0,
          y: y,
          width: width,
          height: sliceHeight,
          points: slicePoints.reverse()
        };
      });
    }
  }, [enableSlices, points]);
};
var useLine = function useLine(_ref9) {
  var data = _ref9.data,
      _ref9$xScale = _ref9.xScale,
      xScaleSpec = _ref9$xScale === void 0 ? LineDefaultProps.xScale : _ref9$xScale,
      xFormat = _ref9.xFormat,
      _ref9$yScale = _ref9.yScale,
      yScaleSpec = _ref9$yScale === void 0 ? LineDefaultProps.yScale : _ref9$yScale,
      yFormat = _ref9.yFormat,
      width = _ref9.width,
      height = _ref9.height,
      _ref9$colors = _ref9.colors,
      colors$1 = _ref9$colors === void 0 ? LineDefaultProps.colors : _ref9$colors,
      _ref9$curve = _ref9.curve,
      curve = _ref9$curve === void 0 ? LineDefaultProps.curve : _ref9$curve,
      _ref9$areaBaselineVal = _ref9.areaBaselineValue,
      areaBaselineValue = _ref9$areaBaselineVal === void 0 ? LineDefaultProps.areaBaselineValue : _ref9$areaBaselineVal,
      _ref9$pointColor = _ref9.pointColor,
      pointColor = _ref9$pointColor === void 0 ? LineDefaultProps.pointColor : _ref9$pointColor,
      _ref9$pointBorderColo = _ref9.pointBorderColor,
      pointBorderColor = _ref9$pointBorderColo === void 0 ? LineDefaultProps.pointBorderColor : _ref9$pointBorderColo,
      _ref9$enableSlices = _ref9.enableSlices,
      enableSlices = _ref9$enableSlices === void 0 ? LineDefaultProps.enableSlicesTooltip : _ref9$enableSlices;
  var formatX = core.useValueFormatter(xFormat);
  var formatY = core.useValueFormatter(yFormat);
  var getColor = colors.useOrdinalColorScale(colors$1, 'id');
  var theme = core.useTheme();
  var getPointColor = colors.useInheritedColor(pointColor, theme);
  var getPointBorderColor = colors.useInheritedColor(pointBorderColor, theme);
  var _useMemo = React.useMemo(function () {
    return scales.computeXYScalesForSeries(data, xScaleSpec, yScaleSpec, width, height);
  }, [data, xScaleSpec, yScaleSpec, width, height]),
      xScale = _useMemo.xScale,
      yScale = _useMemo.yScale,
      rawSeries = _useMemo.series;
  var series = React.useMemo(function () {
    return rawSeries.map(function (serie) {
      return _objectSpread$1({}, serie, {
        color: getColor(serie)
      });
    });
  }, [rawSeries, getColor]);
  var points = usePoints({
    series: series,
    getPointColor: getPointColor,
    getPointBorderColor: getPointBorderColor,
    formatX: formatX,
    formatY: formatY
  });
  var slices = useSlices({
    enableSlices: enableSlices,
    points: points,
    width: width,
    height: height
  });
  var lineGenerator = useLineGenerator({
    curve: curve
  });
  var areaGenerator = useAreaGenerator({
    curve: curve,
    yScale: yScale,
    areaBaselineValue: areaBaselineValue
  });
  return {
    lineGenerator: lineGenerator,
    areaGenerator: areaGenerator,
    getColor: getColor,
    series: series,
    xScale: xScale,
    yScale: yScale,
    slices: slices,
    points: points
  };
};

var Areas = function Areas(_ref) {
  var areaGenerator = _ref.areaGenerator,
      areaOpacity = _ref.areaOpacity,
      areaBlendMode = _ref.areaBlendMode,
      lines = _ref.lines;
  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.springConfig;
  if (animate !== true) {
    return React__default.createElement("g", null, lines.slice(0).reverse().map(function (_ref2) {
      var id = _ref2.id,
          data = _ref2.data,
          areaColor = _ref2.color,
          fill = _ref2.fill;
      return React__default.createElement("path", {
        key: id,
        d: areaGenerator(data.map(function (d) {
          return d.position;
        })),
        fill: fill ? fill : areaColor,
        fillOpacity: areaOpacity,
        strokeWidth: 0,
        style: {
          mixBlendMode: areaBlendMode
        }
      });
    }));
  }
  return React__default.createElement("g", null, lines.slice(0).reverse().map(function (_ref3) {
    var id = _ref3.id,
        data = _ref3.data,
        areaColor = _ref3.color,
        fill = _ref3.fill;
    return React__default.createElement(core.SmartMotion, {
      key: id,
      style: function style(spring) {
        return {
          d: spring(areaGenerator(data.map(function (d) {
            return d.position;
          })), springConfig),
          fill: spring(areaColor, springConfig)
        };
      }
    }, function (style) {
      return React__default.createElement("path", {
        key: id,
        d: style.d,
        fill: fill ? fill : areaColor,
        fillOpacity: areaOpacity,
        strokeWidth: 0,
        style: {
          mixBlendMode: areaBlendMode
        }
      });
    });
  }));
};
Areas.propTypes = {
  areaGenerator: PropTypes.func.isRequired,
  areaOpacity: PropTypes.number.isRequired,
  areaBlendMode: core.blendModePropType.isRequired,
  lines: PropTypes.arrayOf(PropTypes.object).isRequired
};
var Areas$1 = React.memo(Areas);

var LinesItem = function LinesItem(_ref) {
  var lineGenerator = _ref.lineGenerator,
      id = _ref.id,
      points = _ref.points,
      color = _ref.color,
      thickness = _ref.thickness;
  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.springConfig;
  if (animate !== true) {
    return React__default.createElement("path", {
      key: id,
      d: lineGenerator(points),
      fill: "none",
      strokeWidth: thickness,
      stroke: color
    });
  }
  return React__default.createElement(core.SmartMotion, {
    key: id,
    style: function style(spring) {
      return {
        d: spring(lineGenerator(points), springConfig),
        stroke: spring(color, springConfig)
      };
    }
  }, function (style) {
    return React__default.createElement("path", {
      key: id,
      d: style.d,
      fill: "none",
      strokeWidth: thickness,
      stroke: style.stroke
    });
  });
};
LinesItem.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  points: PropTypes.arrayOf(PropTypes.shape({
    x: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    y: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })),
  lineGenerator: PropTypes.func.isRequired,
  color: PropTypes.string.isRequired,
  thickness: PropTypes.number.isRequired
};
var LinesItem$1 = React.memo(LinesItem);

var Lines = function Lines(_ref) {
  var lines = _ref.lines,
      lineGenerator = _ref.lineGenerator,
      lineWidth = _ref.lineWidth;
  return lines.map(function (_ref2) {
    var id = _ref2.id,
        data = _ref2.data,
        color = _ref2.color;
    return React__default.createElement(LinesItem$1, {
      key: id,
      id: id,
      points: data.map(function (d) {
        return d.position;
      }),
      lineGenerator: lineGenerator,
      color: color,
      thickness: lineWidth
    });
  });
};
Lines.propTypes = {
  lines: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    color: PropTypes.string.isRequired,
    data: PropTypes.arrayOf(PropTypes.shape({
      data: PropTypes.shape({
        x: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
        y: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)])
      }).isRequired,
      position: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number
      }).isRequired
    })).isRequired
  })).isRequired,
  lineWidth: PropTypes.number.isRequired,
  lineGenerator: PropTypes.func.isRequired
};
var Lines$1 = React.memo(Lines);

var SlicesItem = function SlicesItem(_ref) {
  var slice = _ref.slice,
      axis = _ref.axis,
      debug = _ref.debug,
      tooltip$1 = _ref.tooltip,
      isCurrent = _ref.isCurrent,
      setCurrent = _ref.setCurrent;
  var _useTooltip = tooltip.useTooltip(),
      showTooltipFromEvent = _useTooltip.showTooltipFromEvent,
      hideTooltip = _useTooltip.hideTooltip;
  var handleMouseEnter = React.useCallback(function (event) {
    showTooltipFromEvent(React__default.createElement(tooltip$1, {
      slice: slice,
      axis: axis
    }), event, 'right');
    setCurrent(slice);
  }, [showTooltipFromEvent, tooltip$1, slice]);
  var handleMouseMove = React.useCallback(function (event) {
    showTooltipFromEvent(React__default.createElement(tooltip$1, {
      slice: slice,
      axis: axis
    }), event, 'right');
  }, [showTooltipFromEvent, tooltip$1, slice]);
  var handleMouseLeave = React.useCallback(function () {
    hideTooltip();
    setCurrent(null);
  }, [hideTooltip]);
  return React__default.createElement("rect", {
    x: slice.x0,
    y: slice.y0,
    width: slice.width,
    height: slice.height,
    stroke: "red",
    strokeWidth: debug ? 1 : 0,
    strokeOpacity: 0.75,
    fill: "red",
    fillOpacity: isCurrent && debug ? 0.35 : 0,
    onMouseEnter: handleMouseEnter,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave
  });
};
SlicesItem.propTypes = {
  slice: PropTypes.object.isRequired,
  axis: PropTypes.oneOf(['x', 'y']).isRequired,
  debug: PropTypes.bool.isRequired,
  height: PropTypes.number.isRequired,
  tooltip: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  isCurrent: PropTypes.bool.isRequired,
  setCurrent: PropTypes.func.isRequired
};
var SlicesItem$1 = React.memo(SlicesItem);

var Slices = function Slices(_ref) {
  var slices = _ref.slices,
      axis = _ref.axis,
      debug = _ref.debug,
      height = _ref.height,
      tooltip = _ref.tooltip,
      current = _ref.current,
      setCurrent = _ref.setCurrent;
  return slices.map(function (slice) {
    return React__default.createElement(SlicesItem$1, {
      key: slice.id,
      slice: slice,
      axis: axis,
      debug: debug,
      height: height,
      tooltip: tooltip,
      setCurrent: setCurrent,
      isCurrent: current !== null && current.id === slice.id
    });
  });
};
Slices.propTypes = {
  slices: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    points: PropTypes.arrayOf(PropTypes.object).isRequired
  })).isRequired,
  axis: PropTypes.oneOf(['x', 'y']).isRequired,
  debug: PropTypes.bool.isRequired,
  height: PropTypes.number.isRequired,
  tooltip: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
  current: PropTypes.object,
  setCurrent: PropTypes.func.isRequired
};
var Slices$1 = React.memo(Slices);

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
var Points = function Points(_ref) {
  var points = _ref.points,
      symbol = _ref.symbol,
      size = _ref.size,
      borderWidth = _ref.borderWidth,
      enableLabel = _ref.enableLabel,
      label = _ref.label,
      labelYOffset = _ref.labelYOffset;
  var theme = core.useTheme();
  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.springConfig;
  var getLabel = core.getLabelGenerator(label);
  var mappedPoints = points.map(function (point) {
    var mappedPoint = {
      id: point.id,
      x: point.x,
      y: point.y,
      datum: point.data,
      fill: point.color,
      stroke: point.borderColor,
      label: enableLabel ? getLabel(point.data) : null
    };
    return mappedPoint;
  });
  if (animate !== true) {
    return React__default.createElement("g", null, mappedPoints.map(function (point) {
      return React__default.createElement(core.DotsItem, {
        key: point.id,
        x: point.x,
        y: point.y,
        datum: point.datum,
        symbol: symbol,
        size: size,
        color: point.fill,
        borderWidth: borderWidth,
        borderColor: point.stroke,
        label: point.label,
        labelYOffset: labelYOffset,
        theme: theme
      });
    }));
  }
  return React__default.createElement(reactMotion.TransitionMotion, {
    styles: mappedPoints.map(function (point) {
      return {
        key: point.id,
        data: point,
        style: {
          x: reactMotion.spring(point.x, springConfig),
          y: reactMotion.spring(point.y, springConfig),
          size: reactMotion.spring(size, springConfig)
        }
      };
    })
  }, function (interpolatedStyles) {
    return React__default.createElement("g", null, interpolatedStyles.map(function (_ref2) {
      var key = _ref2.key,
          style = _ref2.style,
          point = _ref2.data;
      return React__default.createElement(core.DotsItem, _extends({
        key: key
      }, style, {
        symbol: symbol,
        datum: point.datum,
        color: point.fill,
        borderWidth: borderWidth,
        borderColor: point.stroke,
        label: point.label,
        labelYOffset: labelYOffset,
        theme: theme
      }));
    }));
  });
};
Points.propTypes = {
  points: PropTypes.arrayOf(PropTypes.object),
  symbol: PropTypes.func,
  size: PropTypes.number.isRequired,
  color: PropTypes.func.isRequired,
  borderWidth: PropTypes.number.isRequired,
  borderColor: PropTypes.func.isRequired,
  enableLabel: PropTypes.bool.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
  labelYOffset: PropTypes.number
};
Points.defaultProps = {
  enableLabel: false,
  label: 'yFormatted'
};
var Points$1 = React.memo(Points);

var Mesh = function Mesh(_ref) {
  var points = _ref.points,
      width = _ref.width,
      height = _ref.height,
      margin = _ref.margin,
      setCurrent = _ref.setCurrent,
      onMouseEnter = _ref.onMouseEnter,
      onMouseMove = _ref.onMouseMove,
      onMouseLeave = _ref.onMouseLeave,
      onClick = _ref.onClick,
      tooltip$1 = _ref.tooltip,
      debug = _ref.debug;
  var _useTooltip = tooltip.useTooltip(),
      showTooltipAt = _useTooltip.showTooltipAt,
      hideTooltip = _useTooltip.hideTooltip;
  var handleMouseEnter = React.useCallback(function (point, event) {
    showTooltipAt(React__default.createElement(tooltip$1, {
      point: point
    }), [point.x + margin.left, point.y + margin.top], 'top');
    setCurrent(point);
    onMouseEnter && onMouseEnter(point, event);
  }, [setCurrent, showTooltipAt, tooltip$1, onMouseEnter, margin]);
  var handleMouseMove = React.useCallback(function (point, event) {
    showTooltipAt(React__default.createElement(tooltip$1, {
      point: point
    }), [point.x + margin.left, point.y + margin.top], 'top');
    setCurrent(point);
    onMouseMove && onMouseMove(point, event);
  }, [setCurrent, showTooltipAt, tooltip$1, onMouseMove]);
  var handleMouseLeave = React.useCallback(function (point, event) {
    hideTooltip();
    setCurrent(null);
    onMouseLeave && onMouseLeave(point, event);
  }, [hideTooltip, setCurrent, onMouseLeave]);
  var handleClick = React.useCallback(function (point, event) {
    onClick && onClick(point, event);
  }, [onClick]);
  return React__default.createElement(voronoi.Mesh, {
    nodes: points,
    width: width,
    height: height,
    onMouseEnter: handleMouseEnter,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    onClick: handleClick,
    debug: debug
  });
};
Mesh.propTypes = {
  points: PropTypes.arrayOf(PropTypes.object).isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  margin: PropTypes.object.isRequired,
  setCurrent: PropTypes.func.isRequired,
  onMouseEnter: PropTypes.func,
  onMouseMove: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onClick: PropTypes.func,
  tooltip: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
  debug: PropTypes.bool.isRequired
};
var Mesh$1 = React.memo(Mesh);

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$2(target, key, source[key]); }); } return target; }
function _defineProperty$2(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _extends$1() { _extends$1 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends$1.apply(this, arguments); }
function _slicedToArray$1(arr, i) { return _arrayWithHoles$1(arr) || _iterableToArrayLimit$1(arr, i) || _nonIterableRest$1(); }
function _nonIterableRest$1() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }
function _iterableToArrayLimit$1(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles$1(arr) { if (Array.isArray(arr)) return arr; }
var Line = function Line(props) {
  var data = props.data,
      xScaleSpec = props.xScale,
      xFormat = props.xFormat,
      yScaleSpec = props.yScale,
      yFormat = props.yFormat,
      layers = props.layers,
      curve = props.curve,
      areaBaselineValue = props.areaBaselineValue,
      colors$1 = props.colors,
      partialMargin = props.margin,
      width = props.width,
      height = props.height,
      axisTop = props.axisTop,
      axisRight = props.axisRight,
      axisBottom = props.axisBottom,
      axisLeft = props.axisLeft,
      enableGridX = props.enableGridX,
      enableGridY = props.enableGridY,
      gridXValues = props.gridXValues,
      gridYValues = props.gridYValues,
      lineWidth = props.lineWidth,
      enableArea = props.enableArea,
      areaOpacity = props.areaOpacity,
      areaBlendMode = props.areaBlendMode,
      enablePoints = props.enablePoints,
      pointSymbol = props.pointSymbol,
      pointSize = props.pointSize,
      pointColor = props.pointColor,
      pointBorderWidth = props.pointBorderWidth,
      pointBorderColor = props.pointBorderColor,
      enablePointLabel = props.enablePointLabel,
      pointLabel = props.pointLabel,
      pointLabelFormat = props.pointLabelFormat,
      pointLabelYOffset = props.pointLabelYOffset,
      defs = props.defs,
      fill = props.fill,
      markers = props.markers,
      legends$1 = props.legends,
      isInteractive = props.isInteractive,
      useMesh = props.useMesh,
      debugMesh = props.debugMesh,
      onMouseEnter = props.onMouseEnter,
      onMouseMove = props.onMouseMove,
      onMouseLeave = props.onMouseLeave,
      onClick = props.onClick,
      tooltip$1 = props.tooltip,
      enableSlices = props.enableSlices,
      debugSlices = props.debugSlices,
      sliceTooltip = props.sliceTooltip,
      enableCrosshair = props.enableCrosshair,
      crosshairType = props.crosshairType;
  var _useDimensions = core.useDimensions(width, height, partialMargin),
      margin = _useDimensions.margin,
      innerWidth = _useDimensions.innerWidth,
      innerHeight = _useDimensions.innerHeight,
      outerWidth = _useDimensions.outerWidth,
      outerHeight = _useDimensions.outerHeight;
  var _useLine = useLine({
    data: data,
    xScale: xScaleSpec,
    xFormat: xFormat,
    yScale: yScaleSpec,
    yFormat: yFormat,
    width: innerWidth,
    height: innerHeight,
    colors: colors$1,
    curve: curve,
    areaBaselineValue: areaBaselineValue,
    pointColor: pointColor,
    pointBorderColor: pointBorderColor,
    enableSlices: enableSlices
  }),
      lineGenerator = _useLine.lineGenerator,
      areaGenerator = _useLine.areaGenerator,
      series = _useLine.series,
      xScale = _useLine.xScale,
      yScale = _useLine.yScale,
      slices = _useLine.slices,
      points = _useLine.points;
  var theme = core.useTheme();
  var getPointColor = colors.useInheritedColor(pointColor, theme);
  var getPointBorderColor = colors.useInheritedColor(pointBorderColor, theme);
  var _useState = React.useState(null),
      _useState2 = _slicedToArray$1(_useState, 2),
      currentPoint = _useState2[0],
      setCurrentPoint = _useState2[1];
  var _useState3 = React.useState(null),
      _useState4 = _slicedToArray$1(_useState3, 2),
      currentSlice = _useState4[0],
      setCurrentSlice = _useState4[1];
  var legendData = React.useMemo(function () {
    return series.map(function (line) {
      return {
        id: line.id,
        label: line.id,
        color: line.color
      };
    }).reverse();
  }, [series]);
  var layerById = {
    grid: React__default.createElement(axes.Grid, {
      key: "grid",
      theme: theme,
      width: innerWidth,
      height: innerHeight,
      xScale: enableGridX ? xScale : null,
      yScale: enableGridY ? yScale : null,
      xValues: gridXValues,
      yValues: gridYValues
    }),
    markers: React__default.createElement(core.CartesianMarkers, {
      key: "markers",
      markers: markers,
      width: innerWidth,
      height: innerHeight,
      xScale: xScale,
      yScale: yScale,
      theme: theme
    }),
    axes: React__default.createElement(axes.Axes, {
      key: "axes",
      xScale: xScale,
      yScale: yScale,
      width: innerWidth,
      height: innerHeight,
      theme: theme,
      top: axisTop,
      right: axisRight,
      bottom: axisBottom,
      left: axisLeft
    }),
    areas: null,
    lines: React__default.createElement(Lines$1, {
      key: "lines",
      lines: series,
      lineGenerator: lineGenerator,
      lineWidth: lineWidth
    }),
    slices: null,
    points: null,
    crosshair: null,
    mesh: null,
    legends: legends$1.map(function (legend, i) {
      return React__default.createElement(legends.BoxLegendSvg, _extends$1({
        key: "legend.".concat(i)
      }, legend, {
        containerWidth: innerWidth,
        containerHeight: innerHeight,
        data: legend.data || legendData,
        theme: theme
      }));
    })
  };
  var boundDefs = core.bindDefs(defs, series, fill);
  if (enableArea) {
    layerById.areas = React__default.createElement(Areas$1, {
      key: "areas",
      areaGenerator: areaGenerator,
      areaOpacity: areaOpacity,
      areaBlendMode: areaBlendMode,
      lines: series
    });
  }
  if (isInteractive && enableSlices !== false) {
    layerById.slices = React__default.createElement(Slices$1, {
      key: "slices",
      slices: slices,
      axis: enableSlices,
      debug: debugSlices,
      height: innerHeight,
      tooltip: sliceTooltip,
      current: currentSlice,
      setCurrent: setCurrentSlice
    });
  }
  if (enablePoints) {
    layerById.points = React__default.createElement(Points$1, {
      key: "points",
      points: points,
      symbol: pointSymbol,
      size: pointSize,
      color: getPointColor,
      borderWidth: pointBorderWidth,
      borderColor: getPointBorderColor,
      enableLabel: enablePointLabel,
      label: pointLabel,
      labelFormat: pointLabelFormat,
      labelYOffset: pointLabelYOffset
    });
  }
  if (isInteractive && enableCrosshair) {
    if (currentPoint !== null) {
      layerById.crosshair = React__default.createElement(tooltip.Crosshair, {
        key: "crosshair",
        width: innerWidth,
        height: innerHeight,
        x: currentPoint.x,
        y: currentPoint.y,
        type: crosshairType
      });
    }
    if (currentSlice !== null) {
      layerById.crosshair = React__default.createElement(tooltip.Crosshair, {
        key: "crosshair",
        width: innerWidth,
        height: innerHeight,
        x: currentSlice.x,
        y: currentSlice.y,
        type: enableSlices
      });
    }
  }
  if (isInteractive && useMesh && enableSlices === false) {
    layerById.mesh = React__default.createElement(Mesh$1, {
      key: "mesh",
      points: points,
      width: innerWidth,
      height: innerHeight,
      margin: margin,
      current: currentPoint,
      setCurrent: setCurrentPoint,
      onMouseEnter: onMouseEnter,
      onMouseMove: onMouseMove,
      onMouseLeave: onMouseLeave,
      onClick: onClick,
      tooltip: tooltip$1,
      debug: debugMesh
    });
  }
  return React__default.createElement(core.SvgWrapper, {
    defs: boundDefs,
    width: outerWidth,
    height: outerHeight,
    margin: margin
  }, layers.map(function (layer, i) {
    if (typeof layer === 'function') {
      return React__default.createElement(React.Fragment, {
        key: i
      }, layer(_objectSpread$2({}, props, {
        innerWidth: innerWidth,
        innerHeight: innerHeight,
        series: series,
        slices: slices,
        points: points,
        xScale: xScale,
        yScale: yScale,
        lineGenerator: lineGenerator,
        areaGenerator: areaGenerator,
        currentPoint: currentPoint,
        setCurrentPoint: setCurrentPoint,
        currentSlice: currentSlice,
        setCurrentSlice: setCurrentSlice
      })));
    }
    return layerById[layer];
  }));
};
Line.propTypes = LinePropTypes;
Line.defaultProps = LineDefaultProps;
var Line$1 = core.withContainer(Line);

function _extends$2() { _extends$2 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends$2.apply(this, arguments); }
var ResponsiveLine = function ResponsiveLine(props) {
  return React__default.createElement(core.ResponsiveWrapper, null, function (_ref) {
    var width = _ref.width,
        height = _ref.height;
    return React__default.createElement(Line$1, _extends$2({
      width: width,
      height: height
    }, props));
  });
};

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$3(target, key, source[key]); }); } return target; }
function _defineProperty$3(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _slicedToArray$2(arr, i) { return _arrayWithHoles$2(arr) || _iterableToArrayLimit$2(arr, i) || _nonIterableRest$2(); }
function _nonIterableRest$2() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }
function _iterableToArrayLimit$2(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles$2(arr) { if (Array.isArray(arr)) return arr; }
var LineCanvas = function LineCanvas(_ref) {
  var width = _ref.width,
      height = _ref.height,
      partialMargin = _ref.margin,
      pixelRatio = _ref.pixelRatio,
      data = _ref.data,
      xScaleSpec = _ref.xScale,
      xFormat = _ref.xFormat,
      yScaleSpec = _ref.yScale,
      yFormat = _ref.yFormat,
      curve = _ref.curve,
      layers = _ref.layers,
      colors = _ref.colors,
      lineWidth = _ref.lineWidth,
      enableArea = _ref.enableArea,
      areaBaselineValue = _ref.areaBaselineValue,
      areaOpacity = _ref.areaOpacity,
      enablePoints = _ref.enablePoints,
      pointSize = _ref.pointSize,
      pointColor = _ref.pointColor,
      pointBorderWidth = _ref.pointBorderWidth,
      pointBorderColor = _ref.pointBorderColor,
      enableGridX = _ref.enableGridX,
      gridXValues = _ref.gridXValues,
      enableGridY = _ref.enableGridY,
      gridYValues = _ref.gridYValues,
      axisTop = _ref.axisTop,
      axisRight = _ref.axisRight,
      axisBottom = _ref.axisBottom,
      axisLeft = _ref.axisLeft,
      legends$1 = _ref.legends,
      isInteractive = _ref.isInteractive,
      debugMesh = _ref.debugMesh,
      onMouseLeave = _ref.onMouseLeave,
      onClick = _ref.onClick,
      tooltip$1 = _ref.tooltip;
  var canvasEl = React.useRef(null);
  var _useDimensions = core.useDimensions(width, height, partialMargin),
      margin = _useDimensions.margin,
      innerWidth = _useDimensions.innerWidth,
      innerHeight = _useDimensions.innerHeight,
      outerWidth = _useDimensions.outerWidth,
      outerHeight = _useDimensions.outerHeight;
  var theme = core.useTheme();
  var _useState = React.useState(null),
      _useState2 = _slicedToArray$2(_useState, 2),
      currentPoint = _useState2[0],
      setCurrentPoint = _useState2[1];
  var _useLine = useLine({
    data: data,
    xScale: xScaleSpec,
    xFormat: xFormat,
    yScale: yScaleSpec,
    yFormat: yFormat,
    width: innerWidth,
    height: innerHeight,
    colors: colors,
    curve: curve,
    areaBaselineValue: areaBaselineValue,
    pointColor: pointColor,
    pointBorderColor: pointBorderColor
  }),
      lineGenerator = _useLine.lineGenerator,
      areaGenerator = _useLine.areaGenerator,
      series = _useLine.series,
      xScale = _useLine.xScale,
      yScale = _useLine.yScale,
      points = _useLine.points;
  var _useVoronoiMesh = voronoi.useVoronoiMesh({
    points: points,
    width: innerWidth,
    height: innerHeight,
    debug: debugMesh
  }),
      delaunay = _useVoronoiMesh.delaunay,
      voronoi$1 = _useVoronoiMesh.voronoi;
  React.useEffect(function () {
    canvasEl.current.width = outerWidth * pixelRatio;
    canvasEl.current.height = outerHeight * pixelRatio;
    var ctx = canvasEl.current.getContext('2d');
    ctx.scale(pixelRatio, pixelRatio);
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, outerWidth, outerHeight);
    ctx.translate(margin.left, margin.top);
    layers.forEach(function (layer) {
      if (layer === 'grid' && theme.grid.line.strokeWidth > 0) {
        ctx.lineWidth = theme.grid.line.strokeWidth;
        ctx.strokeStyle = theme.grid.line.stroke;
        enableGridX && axes.renderGridLinesToCanvas(ctx, {
          width: innerWidth,
          height: innerHeight,
          scale: xScale,
          axis: 'x',
          values: gridXValues
        });
        enableGridY && axes.renderGridLinesToCanvas(ctx, {
          width: innerWidth,
          height: innerHeight,
          scale: yScale,
          axis: 'y',
          values: gridYValues
        });
      }
      if (layer === 'axes') {
        axes.renderAxesToCanvas(ctx, {
          xScale: xScale,
          yScale: yScale,
          width: innerWidth,
          height: innerHeight,
          top: axisTop,
          right: axisRight,
          bottom: axisBottom,
          left: axisLeft,
          theme: theme
        });
      }
      if (layer === 'areas' && enableArea === true) {
        ctx.save();
        ctx.globalAlpha = areaOpacity;
        areaGenerator.context(ctx);
        series.forEach(function (serie) {
          ctx.fillStyle = serie.color;
          ctx.beginPath();
          areaGenerator(serie.data.map(function (d) {
            return d.position;
          }));
          ctx.fill();
        });
        ctx.restore();
      }
      if (layer === 'lines') {
        lineGenerator.context(ctx);
        series.forEach(function (serie) {
          ctx.strokeStyle = serie.color;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
          lineGenerator(serie.data.map(function (d) {
            return d.position;
          }));
          ctx.stroke();
        });
      }
      if (layer === 'points' && enablePoints === true && pointSize > 0) {
        points.forEach(function (point) {
          ctx.fillStyle = point.color;
          ctx.beginPath();
          ctx.arc(point.x, point.y, pointSize / 2, 0, 2 * Math.PI);
          ctx.fill();
          if (pointBorderWidth > 0) {
            ctx.strokeStyle = point.borderColor;
            ctx.lineWidth = pointBorderWidth;
            ctx.stroke();
          }
        });
      }
      if (layer === 'mesh' && debugMesh === true) {
        voronoi.renderVoronoiToCanvas(ctx, voronoi$1);
        if (currentPoint) {
          voronoi.renderVoronoiCellToCanvas(ctx, voronoi$1, currentPoint.index);
        }
      }
      if (layer === 'legends') {
        var legendData = series.map(function (serie) {
          return {
            id: serie.id,
            label: serie.id,
            color: serie.color
          };
        }).reverse();
        legends$1.forEach(function (legend) {
          legends.renderLegendToCanvas(ctx, _objectSpread$3({}, legend, {
            data: legend.data || legendData,
            containerWidth: innerWidth,
            containerHeight: innerHeight,
            theme: theme
          }));
        });
      }
    });
  }, [canvasEl, outerWidth, outerHeight, layers, theme, lineGenerator, series, xScale, yScale, enableGridX, gridXValues, enableGridY, gridYValues, axisTop, axisRight, axisBottom, axisLeft, legends$1, points, enablePoints, pointSize, currentPoint]);
  var getPointFromMouseEvent = React.useCallback(function (event) {
    var _getRelativeCursor = core.getRelativeCursor(canvasEl.current, event),
        _getRelativeCursor2 = _slicedToArray$2(_getRelativeCursor, 2),
        x = _getRelativeCursor2[0],
        y = _getRelativeCursor2[1];
    if (!core.isCursorInRect(margin.left, margin.top, innerWidth, innerHeight, x, y)) return null;
    var pointIndex = delaunay.find(x - margin.left, y - margin.top);
    return points[pointIndex];
  }, [canvasEl, margin, innerWidth, innerHeight, delaunay]);
  var _useTooltip = tooltip.useTooltip(),
      showTooltipFromEvent = _useTooltip.showTooltipFromEvent,
      hideTooltip = _useTooltip.hideTooltip;
  var handleMouseHover = React.useCallback(function (event) {
    var point = getPointFromMouseEvent(event);
    setCurrentPoint(point);
    if (point) {
      showTooltipFromEvent(React__default.createElement(tooltip$1, {
        point: point
      }), event);
    } else {
      hideTooltip();
    }
  }, [getPointFromMouseEvent, setCurrentPoint, showTooltipFromEvent, hideTooltip, tooltip$1]);
  var handleMouseLeave = React.useCallback(function (event) {
    hideTooltip();
    setCurrentPoint(null);
    currentPoint && onMouseLeave && onMouseLeave(currentPoint, event);
  }, [hideTooltip, setCurrentPoint, onMouseLeave]);
  var handleClick = React.useCallback(function (event) {
    if (onClick) {
      var point = getPointFromMouseEvent(event);
      point && onClick(point, event);
    }
  }, [getPointFromMouseEvent, onClick]);
  return React__default.createElement("canvas", {
    ref: canvasEl,
    width: outerWidth * pixelRatio,
    height: outerHeight * pixelRatio,
    style: {
      width: outerWidth,
      height: outerHeight,
      cursor: isInteractive ? 'auto' : 'normal'
    },
    onMouseEnter: isInteractive ? handleMouseHover : undefined,
    onMouseMove: isInteractive ? handleMouseHover : undefined,
    onMouseLeave: isInteractive ? handleMouseLeave : undefined,
    onClick: isInteractive ? handleClick : undefined
  });
};
LineCanvas.propTypes = LineCanvasPropTypes;
LineCanvas.defaultProps = LineCanvasDefaultProps;
var LineCanvas$1 = core.withContainer(LineCanvas);

function _extends$3() { _extends$3 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends$3.apply(this, arguments); }
var ResponsiveLineCanvas = function ResponsiveLineCanvas(props) {
  return React__default.createElement(core.ResponsiveWrapper, null, function (_ref) {
    var width = _ref.width,
        height = _ref.height;
    return React__default.createElement(LineCanvas$1, _extends$3({
      width: width,
      height: height
    }, props));
  });
};

exports.Line = Line$1;
exports.LineCanvas = LineCanvas$1;
exports.LineCanvasDefaultProps = LineCanvasDefaultProps;
exports.LineCanvasPropTypes = LineCanvasPropTypes;
exports.LineDefaultProps = LineDefaultProps;
exports.LinePropTypes = LinePropTypes;
exports.ResponsiveLine = ResponsiveLine;
exports.ResponsiveLineCanvas = ResponsiveLineCanvas;
exports.useAreaGenerator = useAreaGenerator;
exports.useLine = useLine;
exports.useLineGenerator = useLineGenerator;
exports.useSlices = useSlices;
