'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var PropTypes = _interopDefault(require('prop-types'));
var reactMotion = require('react-motion');
var core = require('@nivo/core');
var isNumber = _interopDefault(require('lodash/isNumber'));
var d3Time = require('d3-time');
var d3TimeFormat = require('d3-time-format');
var d3Format = require('d3-format');

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var centerScale = function centerScale(scale) {
  var bandwidth = scale.bandwidth();
  if (bandwidth === 0) return scale;
  var offset = bandwidth / 2;
  if (scale.round()) {
    offset = Math.round(offset);
  }
  return function (d) {
    return scale(d) + offset;
  };
};
var timeByType = {
  millisecond: [d3Time.timeMillisecond, d3Time.utcMillisecond],
  second: [d3Time.timeSecond, d3Time.utcSecond],
  minute: [d3Time.timeMinute, d3Time.utcMinute],
  hour: [d3Time.timeHour, d3Time.utcHour],
  day: [d3Time.timeDay, d3Time.utcDay],
  week: [d3Time.timeWeek, d3Time.utcWeek],
  sunday: [d3Time.timeSunday, d3Time.utcSunday],
  monday: [d3Time.timeMonday, d3Time.utcMonday],
  tuesday: [d3Time.timeTuesday, d3Time.utcTuesday],
  wednesday: [d3Time.timeWednesday, d3Time.utcWednesday],
  thursday: [d3Time.timeThursday, d3Time.utcThursday],
  friday: [d3Time.timeFriday, d3Time.utcFriday],
  saturday: [d3Time.timeSaturday, d3Time.utcSaturday],
  month: [d3Time.timeMonth, d3Time.utcMonth],
  year: [d3Time.timeYear, d3Time.utcYear]
};
var timeTypes = Object.keys(timeByType);
var timeIntervalRegexp = new RegExp("^every\\s*(\\d+)?\\s*(".concat(timeTypes.join('|'), ")s?$"), 'i');
var getScaleTicks = function getScaleTicks(scale, spec) {
  if (Array.isArray(spec)) {
    return spec;
  }
  if (scale.ticks) {
    if (spec === undefined) {
      return scale.ticks();
    }
    if (isNumber(spec)) {
      return scale.ticks(spec);
    }
    if (typeof spec === 'string') {
      var matches = spec.match(timeIntervalRegexp);
      if (matches) {
        var timeType = timeByType[matches[2]][scale.useUTC ? 1 : 0];
        if (matches[1] === undefined) {
          return scale.ticks(timeType);
        }
        return scale.ticks(timeType.every(Number(matches[1])));
      }
      throw new Error("Invalid tickValues: ".concat(spec));
    }
  }
  return scale.domain();
};
var computeCartesianTicks = function computeCartesianTicks(_ref) {
  var axis = _ref.axis,
      scale = _ref.scale,
      ticksPosition = _ref.ticksPosition,
      tickValues = _ref.tickValues,
      tickSize = _ref.tickSize,
      tickPadding = _ref.tickPadding,
      tickRotation = _ref.tickRotation,
      _ref$engine = _ref.engine,
      engine = _ref$engine === void 0 ? 'svg' : _ref$engine;
  var values = getScaleTicks(scale, tickValues);
  var textProps = core.textPropsByEngine[engine];
  var position = scale.bandwidth ? centerScale(scale) : scale;
  var line = {
    lineX: 0,
    lineY: 0
  };
  var text = {
    textX: 0,
    textY: 0
  };
  var translate;
  var textAlign = textProps.align.center;
  var textBaseline = textProps.baseline.center;
  if (axis === 'x') {
    translate = function translate(d) {
      return {
        x: position(d),
        y: 0
      };
    };
    line.lineY = tickSize * (ticksPosition === 'after' ? 1 : -1);
    text.textY = (tickSize + tickPadding) * (ticksPosition === 'after' ? 1 : -1);
    if (ticksPosition === 'after') {
      textBaseline = textProps.baseline.top;
    } else {
      textBaseline = textProps.baseline.bottom;
    }
    if (tickRotation === 0) {
      textAlign = textProps.align.center;
    } else if (ticksPosition === 'after' && tickRotation < 0 || ticksPosition === 'before' && tickRotation > 0) {
      textAlign = textProps.align.right;
      textBaseline = textProps.baseline.center;
    } else if (ticksPosition === 'after' && tickRotation > 0 || ticksPosition === 'before' && tickRotation < 0) {
      textAlign = textProps.align.left;
      textBaseline = textProps.baseline.center;
    }
  } else {
    translate = function translate(d) {
      return {
        x: 0,
        y: position(d)
      };
    };
    line.lineX = tickSize * (ticksPosition === 'after' ? 1 : -1);
    text.textX = (tickSize + tickPadding) * (ticksPosition === 'after' ? 1 : -1);
    if (ticksPosition === 'after') {
      textAlign = textProps.align.left;
    } else {
      textAlign = textProps.align.right;
    }
  }
  var ticks = values.map(function (value) {
    return _objectSpread({
      key: value,
      value: value
    }, translate(value), line, text);
  });
  return {
    ticks: ticks,
    textAlign: textAlign,
    textBaseline: textBaseline
  };
};
var getFormatter = function getFormatter(format, scale) {
  if (!format || typeof format === 'function') return format;
  if (scale.type === 'time') {
    var f = d3TimeFormat.timeFormat(format);
    return function (d) {
      return f(new Date(d));
    };
  }
  return d3Format.format(format);
};
var computeGridLines = function computeGridLines(_ref2) {
  var width = _ref2.width,
      height = _ref2.height,
      scale = _ref2.scale,
      axis = _ref2.axis,
      _values = _ref2.values;
  var lineValues = Array.isArray(_values) ? _values : undefined;
  var lineCount = isNumber(_values) ? _values : undefined;
  var values = lineValues || getScaleTicks(scale, lineCount);
  var position = scale.bandwidth ? centerScale(scale) : scale;
  var lines;
  if (axis === 'x') {
    lines = values.map(function (v) {
      return {
        key: "".concat(v),
        x1: position(v),
        x2: position(v),
        y1: 0,
        y2: height
      };
    });
  } else if (axis === 'y') {
    lines = values.map(function (v) {
      return {
        key: "".concat(v),
        x1: 0,
        x2: width,
        y1: position(v),
        y2: position(v)
      };
    });
  }
  return lines;
};

var axisPropTypes = {
  ticksPosition: PropTypes.oneOf(['before', 'after']),
  tickValues: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.instanceOf(Date)])), PropTypes.string]),
  tickSize: PropTypes.number,
  tickPadding: PropTypes.number,
  tickRotation: PropTypes.number,
  format: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  renderTick: PropTypes.func,
  legend: PropTypes.node,
  legendPosition: PropTypes.oneOf(['start', 'middle', 'end']),
  legendOffset: PropTypes.number
};
var axisPropType = PropTypes.shape(axisPropTypes);

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
var AxisTick = function AxisTick(_ref) {
  var _value = _ref.value,
      x = _ref.x,
      y = _ref.y,
      opacity = _ref.opacity,
      rotate = _ref.rotate,
      format = _ref.format,
      lineX = _ref.lineX,
      lineY = _ref.lineY,
      _onClick = _ref.onClick,
      textX = _ref.textX,
      textY = _ref.textY,
      textBaseline = _ref.textBaseline,
      textAnchor = _ref.textAnchor;
  var theme = core.useTheme();
  var value = _value;
  if (format !== undefined) {
    value = format(value);
  }
  var gStyle = {
    opacity: opacity
  };
  if (_onClick) {
    gStyle['cursor'] = 'pointer';
  }
  return React__default.createElement("g", _extends({
    transform: "translate(".concat(x, ",").concat(y, ")")
  }, _onClick ? {
    onClick: function onClick(e) {
      return _onClick(e, value);
    }
  } : {}, {
    style: gStyle
  }), React__default.createElement("line", {
    x1: 0,
    x2: lineX,
    y1: 0,
    y2: lineY,
    style: theme.axis.ticks.line
  }), React__default.createElement("text", {
    dominantBaseline: textBaseline,
    textAnchor: textAnchor,
    transform: "translate(".concat(textX, ",").concat(textY, ") rotate(").concat(rotate, ")"),
    style: theme.axis.ticks.text
  }, value));
};
AxisTick.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  format: PropTypes.func,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  lineX: PropTypes.number.isRequired,
  lineY: PropTypes.number.isRequired,
  textX: PropTypes.number.isRequired,
  textY: PropTypes.number.isRequired,
  textBaseline: PropTypes.string.isRequired,
  textAnchor: PropTypes.string.isRequired,
  opacity: PropTypes.number.isRequired,
  rotate: PropTypes.number.isRequired,
  onClick: PropTypes.func
};
AxisTick.defaultProps = {
  opacity: 1,
  rotate: 0
};
var AxisTick$1 = React.memo(AxisTick);

function _extends$1() { _extends$1 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends$1.apply(this, arguments); }
function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$1(target, key, source[key]); }); } return target; }
function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var willEnter = function willEnter() {
  return {
    rotate: 0,
    opacity: 0,
    x: 0,
    y: 0
  };
};
var willLeave = function willLeave(springConfig) {
  return function (_ref) {
    var _ref$style = _ref.style,
        x = _ref$style.x,
        y = _ref$style.y,
        rotate = _ref$style.rotate;
    return {
      rotate: rotate,
      opacity: reactMotion.spring(0, springConfig),
      x: reactMotion.spring(x.val, springConfig),
      y: reactMotion.spring(y.val, springConfig)
    };
  };
};
var defaultTickRenderer = function defaultTickRenderer(props) {
  return React__default.createElement(AxisTick$1, props);
};
var Axis = function Axis(_ref2) {
  var axis = _ref2.axis,
      scale = _ref2.scale,
      x = _ref2.x,
      y = _ref2.y,
      length = _ref2.length,
      ticksPosition = _ref2.ticksPosition,
      tickValues = _ref2.tickValues,
      tickSize = _ref2.tickSize,
      tickPadding = _ref2.tickPadding,
      tickRotation = _ref2.tickRotation,
      format = _ref2.format,
      renderTick = _ref2.renderTick,
      legend = _ref2.legend,
      legendPosition = _ref2.legendPosition,
      legendOffset = _ref2.legendOffset,
      onClick = _ref2.onClick;
  var theme = core.useTheme();
  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.springConfig;
  var formatValue = React.useMemo(function () {
    return getFormatter(format, scale);
  }, [format, scale]);
  var _computeCartesianTick = computeCartesianTicks({
    axis: axis,
    scale: scale,
    ticksPosition: ticksPosition,
    tickValues: tickValues,
    tickSize: tickSize,
    tickPadding: tickPadding,
    tickRotation: tickRotation
  }),
      ticks = _computeCartesianTick.ticks,
      textAlign = _computeCartesianTick.textAlign,
      textBaseline = _computeCartesianTick.textBaseline;
  var legendNode = null;
  if (legend !== undefined) {
    var legendX = 0;
    var legendY = 0;
    var legendRotation = 0;
    var textAnchor;
    if (axis === 'y') {
      legendRotation = -90;
      legendX = legendOffset;
      if (legendPosition === 'start') {
        textAnchor = 'start';
        legendY = length;
      } else if (legendPosition === 'middle') {
        textAnchor = 'middle';
        legendY = length / 2;
      } else if (legendPosition === 'end') {
        textAnchor = 'end';
      }
    } else {
      legendY = legendOffset;
      if (legendPosition === 'start') {
        textAnchor = 'start';
      } else if (legendPosition === 'middle') {
        textAnchor = 'middle';
        legendX = length / 2;
      } else if (legendPosition === 'end') {
        textAnchor = 'end';
        legendX = length;
      }
    }
    legendNode = React__default.createElement("text", {
      transform: "translate(".concat(legendX, ", ").concat(legendY, ") rotate(").concat(legendRotation, ")"),
      textAnchor: textAnchor,
      style: _objectSpread$1({
        dominantBaseline: 'central'
      }, theme.axis.legend.text)
    }, legend);
  }
  if (animate !== true) {
    return React__default.createElement("g", {
      transform: "translate(".concat(x, ",").concat(y, ")")
    }, ticks.map(function (tick, tickIndex) {
      return React__default.createElement(renderTick, _objectSpread$1({
        tickIndex: tickIndex,
        format: formatValue,
        rotate: tickRotation,
        textBaseline: textBaseline,
        textAnchor: textAlign
      }, tick, onClick ? {
        onClick: onClick
      } : {}));
    }), React__default.createElement("line", {
      style: theme.axis.domain.line,
      x1: 0,
      x2: axis === 'x' ? length : 0,
      y1: 0,
      y2: axis === 'x' ? 0 : length
    }), legendNode);
  }
  return React__default.createElement(reactMotion.Motion, {
    style: {
      x: reactMotion.spring(x, springConfig),
      y: reactMotion.spring(y, springConfig)
    }
  }, function (xy) {
    return React__default.createElement("g", {
      transform: "translate(".concat(xy.x, ",").concat(xy.y, ")")
    }, React__default.createElement(reactMotion.TransitionMotion, {
      willEnter: willEnter,
      willLeave: willLeave(springConfig),
      styles: ticks.map(function (tick) {
        return {
          key: "".concat(tick.key),
          data: tick,
          style: {
            opacity: reactMotion.spring(1, springConfig),
            x: reactMotion.spring(tick.x, springConfig),
            y: reactMotion.spring(tick.y, springConfig),
            rotate: reactMotion.spring(tickRotation, springConfig)
          }
        };
      })
    }, function (interpolatedStyles) {
      return React__default.createElement(React.Fragment, null, interpolatedStyles.map(function (_ref3, tickIndex) {
        var style = _ref3.style,
            tick = _ref3.data;
        return React__default.createElement(renderTick, _objectSpread$1({
          tickIndex: tickIndex,
          format: formatValue,
          textBaseline: textBaseline,
          textAnchor: textAlign
        }, tick, style, onClick ? {
          onClick: onClick
        } : {}));
      }));
    }), React__default.createElement(reactMotion.Motion, {
      style: {
        x2: reactMotion.spring(axis === 'x' ? length : 0, springConfig),
        y2: reactMotion.spring(axis === 'x' ? 0 : length, springConfig)
      }
    }, function (values) {
      return React__default.createElement("line", _extends$1({
        style: theme.axis.domain.line,
        x1: 0,
        y1: 0
      }, values));
    }), legendNode);
  });
};
Axis.propTypes = {
  axis: PropTypes.oneOf(['x', 'y']).isRequired,
  scale: PropTypes.func.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  length: PropTypes.number.isRequired,
  ticksPosition: PropTypes.oneOf(['before', 'after']).isRequired,
  tickValues: axisPropTypes.tickValues,
  tickSize: PropTypes.number.isRequired,
  tickPadding: PropTypes.number.isRequired,
  tickRotation: PropTypes.number.isRequired,
  format: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  renderTick: PropTypes.func.isRequired,
  legend: PropTypes.node,
  legendPosition: PropTypes.oneOf(['start', 'middle', 'end']).isRequired,
  legendOffset: PropTypes.number.isRequired,
  onClick: PropTypes.func
};
Axis.defaultProps = {
  x: 0,
  y: 0,
  tickSize: 5,
  tickPadding: 5,
  tickRotation: 0,
  renderTick: defaultTickRenderer,
  legendPosition: 'end',
  legendOffset: 0
};
var Axis$1 = React.memo(Axis);

function _extends$2() { _extends$2 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends$2.apply(this, arguments); }
var positions = ['top', 'right', 'bottom', 'left'];
var Axes = function Axes(_ref) {
  var xScale = _ref.xScale,
      yScale = _ref.yScale,
      width = _ref.width,
      height = _ref.height,
      top = _ref.top,
      right = _ref.right,
      bottom = _ref.bottom,
      left = _ref.left;
  var axes = {
    top: top,
    right: right,
    bottom: bottom,
    left: left
  };
  return positions.map(function (position) {
    var axis = axes[position];
    if (!axis) return null;
    var isXAxis = position === 'top' || position === 'bottom';
    var ticksPosition = position === 'top' || position === 'left' ? 'before' : 'after';
    return React__default.createElement(Axis$1, _extends$2({
      key: position
    }, axis, {
      axis: isXAxis ? 'x' : 'y',
      x: position === 'right' ? width : 0,
      y: position === 'bottom' ? height : 0,
      scale: isXAxis ? xScale : yScale,
      length: isXAxis ? width : height,
      ticksPosition: ticksPosition
    }));
  });
};
Axes.propTypes = {
  xScale: PropTypes.func,
  yScale: PropTypes.func,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  top: axisPropType,
  right: axisPropType,
  bottom: axisPropType,
  left: axisPropType
};
var Axes$1 = React.memo(Axes);

var GridLine = function GridLine(props) {
  return React__default.createElement("line", props);
};
GridLine.propTypes = {
  x1: PropTypes.number.isRequired,
  x2: PropTypes.number.isRequired,
  y1: PropTypes.number.isRequired,
  y2: PropTypes.number.isRequired
};
GridLine.defaultProps = {
  x1: 0,
  x2: 0,
  y1: 0,
  y2: 0
};
var GridLine$1 = React.memo(GridLine);

function _extends$3() { _extends$3 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends$3.apply(this, arguments); }
var GridLines = function GridLines(_ref) {
  var type = _ref.type,
      lines = _ref.lines;
  var theme = core.useTheme();
  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.springConfig;
  var lineWillEnter = React.useMemo(function () {
    return function (_ref2) {
      var style = _ref2.style;
      return {
        opacity: 0,
        x1: type === 'x' ? 0 : style.x1.val,
        x2: type === 'x' ? 0 : style.x2.val,
        y1: type === 'y' ? 0 : style.y1.val,
        y2: type === 'y' ? 0 : style.y2.val
      };
    };
  }, [type]);
  var lineWillLeave = React.useMemo(function () {
    return function (_ref3) {
      var style = _ref3.style;
      return {
        opacity: reactMotion.spring(0, springConfig),
        x1: reactMotion.spring(style.x1.val, springConfig),
        x2: reactMotion.spring(style.x2.val, springConfig),
        y1: reactMotion.spring(style.y1.val, springConfig),
        y2: reactMotion.spring(style.y2.val, springConfig)
      };
    };
  }, [springConfig]);
  if (!animate) {
    return React__default.createElement("g", null, lines.map(function (line) {
      return React__default.createElement(GridLine$1, _extends$3({
        key: line.key
      }, line, theme.grid.line));
    }));
  }
  return React__default.createElement(reactMotion.TransitionMotion, {
    willEnter: lineWillEnter,
    willLeave: lineWillLeave,
    styles: lines.map(function (line) {
      return {
        key: line.key,
        style: {
          opacity: reactMotion.spring(1, springConfig),
          x1: reactMotion.spring(line.x1 || 0, springConfig),
          x2: reactMotion.spring(line.x2 || 0, springConfig),
          y1: reactMotion.spring(line.y1 || 0, springConfig),
          y2: reactMotion.spring(line.y2 || 0, springConfig)
        }
      };
    })
  }, function (interpolatedStyles) {
    return React__default.createElement("g", null, interpolatedStyles.map(function (interpolatedStyle) {
      var key = interpolatedStyle.key,
          style = interpolatedStyle.style;
      return React__default.createElement(GridLine$1, _extends$3({
        key: key
      }, theme.grid.line, style));
    }));
  });
};
GridLines.propTypes = {
  type: PropTypes.oneOf(['x', 'y']).isRequired,
  lines: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    x1: PropTypes.number,
    x2: PropTypes.number,
    y1: PropTypes.number,
    y2: PropTypes.number
  })).isRequired
};
var GridLines$1 = React.memo(GridLines);

var Grid = function Grid(_ref) {
  var width = _ref.width,
      height = _ref.height,
      xScale = _ref.xScale,
      yScale = _ref.yScale,
      xValues = _ref.xValues,
      yValues = _ref.yValues;
  var xLines = React.useMemo(function () {
    if (!xScale) return false;
    return computeGridLines({
      width: width,
      height: height,
      scale: xScale,
      axis: 'x',
      values: xValues
    });
  }, [xScale, xValues]);
  var yLines = yScale ? computeGridLines({
    width: width,
    height: height,
    scale: yScale,
    axis: 'y',
    values: yValues
  }) : false;
  return React__default.createElement(React__default.Fragment, null, xLines && React__default.createElement(GridLines$1, {
    type: "x",
    lines: xLines
  }), yLines && React__default.createElement(GridLines$1, {
    type: "y",
    lines: yLines
  }));
};
Grid.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  xScale: PropTypes.func,
  yScale: PropTypes.func,
  xValues: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.instanceOf(Date)]))]),
  yValues: PropTypes.oneOfType([PropTypes.number, PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.instanceOf(Date)]))])
};
var Grid$1 = React.memo(Grid);

var degreesToRadians = function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
};

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$2(target, key, source[key]); }); } return target; }
function _defineProperty$2(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var renderAxisToCanvas = function renderAxisToCanvas(ctx, _ref) {
  var axis = _ref.axis,
      scale = _ref.scale,
      _ref$x = _ref.x,
      x = _ref$x === void 0 ? 0 : _ref$x,
      _ref$y = _ref.y,
      y = _ref$y === void 0 ? 0 : _ref$y,
      length = _ref.length,
      ticksPosition = _ref.ticksPosition,
      tickValues = _ref.tickValues,
      _ref$tickSize = _ref.tickSize,
      tickSize = _ref$tickSize === void 0 ? 5 : _ref$tickSize,
      _ref$tickPadding = _ref.tickPadding,
      tickPadding = _ref$tickPadding === void 0 ? 5 : _ref$tickPadding,
      _ref$tickRotation = _ref.tickRotation,
      tickRotation = _ref$tickRotation === void 0 ? 0 : _ref$tickRotation,
      format = _ref.format,
      legend = _ref.legend,
      _ref$legendPosition = _ref.legendPosition,
      legendPosition = _ref$legendPosition === void 0 ? 'end' : _ref$legendPosition,
      _ref$legendOffset = _ref.legendOffset,
      legendOffset = _ref$legendOffset === void 0 ? 0 : _ref$legendOffset,
      theme = _ref.theme;
  var _computeCartesianTick = computeCartesianTicks({
    axis: axis,
    scale: scale,
    ticksPosition: ticksPosition,
    tickValues: tickValues,
    tickSize: tickSize,
    tickPadding: tickPadding,
    tickRotation: tickRotation,
    engine: 'canvas'
  }),
      ticks = _computeCartesianTick.ticks,
      textAlign = _computeCartesianTick.textAlign,
      textBaseline = _computeCartesianTick.textBaseline;
  ctx.save();
  ctx.translate(x, y);
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;
  ctx.font = "".concat(theme.axis.ticks.text.fontSize, "px ").concat(theme.axis.ticks.text.fontFamily);
  if (theme.axis.domain.line.strokeWidth > 0) {
    ctx.lineWidth = theme.axis.domain.line.strokeWidth;
    ctx.lineCap = 'square';
    ctx.strokeStyle = theme.axis.domain.line.stroke;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(axis === 'x' ? length : 0, axis === 'x' ? 0 : length);
    ctx.stroke();
  }
  ticks.forEach(function (tick) {
    if (theme.axis.ticks.line.strokeWidth > 0) {
      ctx.lineWidth = theme.axis.ticks.line.strokeWidth;
      ctx.lineCap = 'square';
      ctx.strokeStyle = theme.axis.ticks.line.stroke;
      ctx.beginPath();
      ctx.moveTo(tick.x, tick.y);
      ctx.lineTo(tick.x + tick.lineX, tick.y + tick.lineY);
      ctx.stroke();
    }
    var value = format !== undefined ? format(tick.value) : tick.value;
    ctx.save();
    ctx.translate(tick.x + tick.textX, tick.y + tick.textY);
    ctx.rotate(degreesToRadians(tickRotation));
    ctx.fillStyle = theme.axis.ticks.text.fill;
    ctx.fillText(value, 0, 0);
    ctx.restore();
  });
  if (legend !== undefined) {
    var legendX = 0;
    var legendY = 0;
    var legendRotation = 0;
    var _textAlign;
    if (axis === 'y') {
      legendRotation = -90;
      legendX = legendOffset;
      if (legendPosition === 'start') {
        _textAlign = 'start';
        legendY = length;
      } else if (legendPosition === 'middle') {
        _textAlign = 'center';
        legendY = length / 2;
      } else if (legendPosition === 'end') {
        _textAlign = 'end';
      }
    } else {
      legendY = legendOffset;
      if (legendPosition === 'start') {
        _textAlign = 'start';
      } else if (legendPosition === 'middle') {
        _textAlign = 'center';
        legendX = length / 2;
      } else if (legendPosition === 'end') {
        _textAlign = 'end';
        legendX = length;
      }
    }
    ctx.translate(legendX, legendY);
    ctx.rotate(degreesToRadians(legendRotation));
    ctx.font = "".concat(theme.axis.legend.text.fontWeight ? "".concat(theme.axis.legend.text.fontWeight, " ") : '').concat(theme.axis.legend.text.fontSize, "px ").concat(theme.axis.legend.text.fontFamily);
    ctx.fillStyle = theme.axis.legend.text.fill;
    ctx.textAlign = _textAlign;
    ctx.textBaseline = 'middle';
    ctx.fillText(legend, 0, 0);
  }
  ctx.restore();
};
var positions$1 = ['top', 'right', 'bottom', 'left'];
var renderAxesToCanvas = function renderAxesToCanvas(ctx, _ref2) {
  var xScale = _ref2.xScale,
      yScale = _ref2.yScale,
      width = _ref2.width,
      height = _ref2.height,
      top = _ref2.top,
      right = _ref2.right,
      bottom = _ref2.bottom,
      left = _ref2.left,
      theme = _ref2.theme;
  var axes = {
    top: top,
    right: right,
    bottom: bottom,
    left: left
  };
  positions$1.forEach(function (position) {
    var axis = axes[position];
    if (!axis) return null;
    var isXAxis = position === 'top' || position === 'bottom';
    var ticksPosition = position === 'top' || position === 'left' ? 'before' : 'after';
    var scale = isXAxis ? xScale : yScale;
    var format = getFormatter(axis.format, scale);
    renderAxisToCanvas(ctx, _objectSpread$2({}, axis, {
      axis: isXAxis ? 'x' : 'y',
      x: position === 'right' ? width : 0,
      y: position === 'bottom' ? height : 0,
      scale: scale,
      format: format,
      length: isXAxis ? width : height,
      ticksPosition: ticksPosition,
      theme: theme
    }));
  });
};
var renderGridLinesToCanvas = function renderGridLinesToCanvas(ctx, _ref3) {
  var width = _ref3.width,
      height = _ref3.height,
      scale = _ref3.scale,
      axis = _ref3.axis,
      values = _ref3.values;
  var lines = computeGridLines({
    width: width,
    height: height,
    scale: scale,
    axis: axis,
    values: values
  });
  lines.forEach(function (line) {
    ctx.beginPath();
    ctx.moveTo(line.x1, line.y1);
    ctx.lineTo(line.x2, line.y2);
    ctx.stroke();
  });
};

exports.Axes = Axes$1;
exports.Axis = Axis$1;
exports.Grid = Grid$1;
exports.axisPropType = axisPropType;
exports.axisPropTypes = axisPropTypes;
exports.renderAxesToCanvas = renderAxesToCanvas;
exports.renderAxisToCanvas = renderAxisToCanvas;
exports.renderGridLinesToCanvas = renderGridLinesToCanvas;
