'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var web = require('@react-spring/web');
var core = require('@nivo/core');
var d3Time = require('d3-time');
var d3TimeFormat = require('d3-time-format');
var d3Format = require('d3-format');
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

var centerScale = function centerScale(scale) {
  var bandwidth = scale.bandwidth();
  if (bandwidth === 0) return scale;
  var offset = bandwidth / 2;

  if (scale.round()) {
    offset = Math.round(offset);
  }

  return function (d) {
    var _scale;

    return ((_scale = scale(d)) !== null && _scale !== void 0 ? _scale : 0) + offset;
  };
};
var timeDay = d3Time.timeInterval(function (date) {
  return date.setHours(0, 0, 0, 0);
}, function (date, step) {
  return date.setDate(date.getDate() + step);
}, function (start, end) {
  return (end.getTime() - start.getTime()) / 864e5;
}, function (date) {
  return Math.floor(date.getTime() / 864e5);
});
var utcDay = d3Time.timeInterval(function (date) {
  return date.setUTCHours(0, 0, 0, 0);
}, function (date, step) {
  return date.setUTCDate(date.getUTCDate() + step);
}, function (start, end) {
  return (end.getTime() - start.getTime()) / 864e5;
}, function (date) {
  return Math.floor(date.getTime() / 864e5);
});
var timeByType = {
  millisecond: [d3Time.timeMillisecond, d3Time.utcMillisecond],
  second: [d3Time.timeSecond, d3Time.utcSecond],
  minute: [d3Time.timeMinute, d3Time.utcMinute],
  hour: [d3Time.timeHour, d3Time.utcHour],
  day: [timeDay, utcDay],
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

var isInteger = function isInteger(value) {
  return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
};

var isArray = function isArray(value) {
  return Array.isArray(value);
};

var getScaleTicks = function getScaleTicks(scale, spec) {
  if (Array.isArray(spec)) {
    return spec;
  }

  if (typeof spec === 'string' && 'useUTC' in scale) {
    var matches = spec.match(timeIntervalRegexp);

    if (matches) {
      var _matches = _slicedToArray(matches, 3),
          amount = _matches[1],
          type = _matches[2];

      var timeType = timeByType[type][scale.useUTC ? 1 : 0];

      if (type === 'day') {
        var _timeType$every$range, _timeType$every;

        var _scale$domain = scale.domain(),
            _scale$domain2 = _slicedToArray(_scale$domain, 2),
            start = _scale$domain2[0],
            originalStop = _scale$domain2[1];

        var stop = new Date(originalStop);
        stop.setDate(stop.getDate() + 1);
        return (_timeType$every$range = (_timeType$every = timeType.every(Number(amount !== null && amount !== void 0 ? amount : 1))) === null || _timeType$every === void 0 ? void 0 : _timeType$every.range(start, stop)) !== null && _timeType$every$range !== void 0 ? _timeType$every$range : [];
      }

      if (amount === undefined) {
        return scale.ticks(timeType);
      }

      var interval = timeType.every(Number(amount));

      if (interval) {
        return scale.ticks(interval);
      }
    }

    throw new Error("Invalid tickValues: ".concat(spec));
  }

  if ('ticks' in scale) {
    if (spec === undefined) {
      return scale.ticks();
    }

    if (isInteger(spec)) {
      return scale.ticks(spec);
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
  var position = 'bandwidth' in scale ? centerScale(scale) : scale;
  var line = {
    lineX: 0,
    lineY: 0
  };
  var text = {
    textX: 0,
    textY: 0
  };
  var isRTL = typeof document === 'object' ? document.dir === 'rtl' : false;
  var translate;
  var textAlign = textProps.align.center;
  var textBaseline = textProps.baseline.center;

  if (axis === 'x') {
    translate = function translate(d) {
      var _position;

      return {
        x: (_position = position(d)) !== null && _position !== void 0 ? _position : 0,
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
      textAlign = textProps.align[isRTL ? 'left' : 'right'];
      textBaseline = textProps.baseline.center;
    } else if (ticksPosition === 'after' && tickRotation > 0 || ticksPosition === 'before' && tickRotation < 0) {
      textAlign = textProps.align[isRTL ? 'right' : 'left'];
      textBaseline = textProps.baseline.center;
    }
  } else {
    translate = function translate(d) {
      var _position2;

      return {
        x: 0,
        y: (_position2 = position(d)) !== null && _position2 !== void 0 ? _position2 : 0
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
    return _objectSpread2(_objectSpread2(_objectSpread2({
      key: typeof value === 'number' || typeof value === 'string' ? value : "".concat(value),
      value: value
    }, translate(value)), line), text);
  });
  return {
    ticks: ticks,
    textAlign: textAlign,
    textBaseline: textBaseline
  };
};
var getFormatter = function getFormatter(format, scale) {
  if (typeof format === 'undefined' || typeof format === 'function') return format;

  if (scale.type === 'time') {
    var formatter = d3TimeFormat.timeFormat(format);
    return function (d) {
      return formatter(d instanceof Date ? d : new Date(d));
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
  var lineValues = isArray(_values) ? _values : undefined;
  var values = lineValues || getScaleTicks(scale, _values);
  var position = 'bandwidth' in scale ? centerScale(scale) : scale;
  var lines = axis === 'x' ? values.map(function (value) {
    var _position3, _position4;

    return {
      key: "".concat(value),
      x1: (_position3 = position(value)) !== null && _position3 !== void 0 ? _position3 : 0,
      x2: (_position4 = position(value)) !== null && _position4 !== void 0 ? _position4 : 0,
      y1: 0,
      y2: height
    };
  }) : values.map(function (value) {
    var _position5, _position6;

    return {
      key: "".concat(value),
      x1: 0,
      x2: width,
      y1: (_position5 = position(value)) !== null && _position5 !== void 0 ? _position5 : 0,
      y2: (_position6 = position(value)) !== null && _position6 !== void 0 ? _position6 : 0
    };
  });
  return lines;
};

var AxisTick = function AxisTick(_ref) {
  var _format;

  var _value = _ref.value,
      format = _ref.format,
      lineX = _ref.lineX,
      lineY = _ref.lineY,
      _onClick = _ref.onClick,
      textBaseline = _ref.textBaseline,
      textAnchor = _ref.textAnchor,
      animatedProps = _ref.animatedProps;
  var theme = core.useTheme();
  var value = (_format = format === null || format === void 0 ? void 0 : format(_value)) !== null && _format !== void 0 ? _format : _value;
  var props = React.useMemo(function () {
    var style = {
      opacity: animatedProps.opacity
    };

    if (!_onClick) {
      return {
        style: style
      };
    }

    return {
      style: _objectSpread2(_objectSpread2({}, style), {}, {
        cursor: 'pointer'
      }),
      onClick: function onClick(event) {
        return _onClick(event, value);
      }
    };
  }, [animatedProps.opacity, _onClick, value]);
  return jsxRuntime.jsxs(web.animated.g, _objectSpread2(_objectSpread2({
    transform: animatedProps.transform
  }, props), {}, {
    children: [jsxRuntime.jsx("line", {
      x1: 0,
      x2: lineX,
      y1: 0,
      y2: lineY,
      style: theme.axis.ticks.line
    }), jsxRuntime.jsx(web.animated.text, {
      dominantBaseline: textBaseline,
      textAnchor: textAnchor,
      transform: animatedProps.textTransform,
      style: theme.axis.ticks.text,
      children: value
    })]
  }));
};

var memoizedAxisTick = React.memo(AxisTick);

var Axis = function Axis(_ref) {
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
      _ref$renderTick = _ref.renderTick,
      renderTick = _ref$renderTick === void 0 ? memoizedAxisTick : _ref$renderTick,
      legend = _ref.legend,
      _ref$legendPosition = _ref.legendPosition,
      legendPosition = _ref$legendPosition === void 0 ? 'end' : _ref$legendPosition,
      _ref$legendOffset = _ref.legendOffset,
      legendOffset = _ref$legendOffset === void 0 ? 0 : _ref$legendOffset,
      onClick = _ref.onClick,
      ariaHidden = _ref.ariaHidden;
  var theme = core.useTheme();
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

    legendNode = jsxRuntime.jsx("text", {
      transform: "translate(".concat(legendX, ", ").concat(legendY, ") rotate(").concat(legendRotation, ")"),
      textAnchor: textAnchor,
      style: _objectSpread2({
        dominantBaseline: 'central'
      }, theme.axis.legend.text),
      children: legend
    });
  }

  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.config;

  var animatedProps = web.useSpring({
    transform: "translate(".concat(x, ",").concat(y, ")"),
    lineX2: axis === 'x' ? length : 0,
    lineY2: axis === 'x' ? 0 : length,
    config: springConfig,
    immediate: !animate
  });
  var transition = web.useTransition(ticks, {
    keys: function keys(tick) {
      return tick.key;
    },
    initial: function initial(tick) {
      return {
        opacity: 1,
        transform: "translate(".concat(tick.x, ",").concat(tick.y, ")"),
        textTransform: "translate(".concat(tick.textX, ",").concat(tick.textY, ") rotate(").concat(tickRotation, ")")
      };
    },
    from: function from(tick) {
      return {
        opacity: 0,
        transform: "translate(".concat(tick.x, ",").concat(tick.y, ")"),
        textTransform: "translate(".concat(tick.textX, ",").concat(tick.textY, ") rotate(").concat(tickRotation, ")")
      };
    },
    enter: function enter(tick) {
      return {
        opacity: 1,
        transform: "translate(".concat(tick.x, ",").concat(tick.y, ")"),
        textTransform: "translate(".concat(tick.textX, ",").concat(tick.textY, ") rotate(").concat(tickRotation, ")")
      };
    },
    update: function update(tick) {
      return {
        opacity: 1,
        transform: "translate(".concat(tick.x, ",").concat(tick.y, ")"),
        textTransform: "translate(".concat(tick.textX, ",").concat(tick.textY, ") rotate(").concat(tickRotation, ")")
      };
    },
    leave: {
      opacity: 0
    },
    config: springConfig,
    immediate: !animate
  });
  return jsxRuntime.jsxs(web.animated.g, {
    transform: animatedProps.transform,
    "aria-hidden": ariaHidden,
    children: [transition(function (transitionProps, tick, _state, tickIndex) {
      return React.createElement(renderTick, _objectSpread2(_objectSpread2({
        tickIndex: tickIndex,
        format: formatValue,
        rotate: tickRotation,
        textBaseline: textBaseline,
        textAnchor: textAlign,
        animatedProps: transitionProps
      }, tick), onClick ? {
        onClick: onClick
      } : {}));
    }), jsxRuntime.jsx(web.animated.line, {
      style: theme.axis.domain.line,
      x1: 0,
      x2: animatedProps.lineX2,
      y1: 0,
      y2: animatedProps.lineY2
    }), legendNode]
  });
};

var memoizedAxis = React.memo(Axis);

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
  legendOffset: PropTypes.number,
  ariaHidden: PropTypes.bool
};
var axisPropType = PropTypes.shape(axisPropTypes);
var positions = ['top', 'right', 'bottom', 'left'];

var Axes = React.memo(function (_ref) {
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
  return jsxRuntime.jsx(jsxRuntime.Fragment, {
    children: positions.map(function (position) {
      var axis = axes[position];
      if (!axis) return null;
      var isXAxis = position === 'top' || position === 'bottom';
      var ticksPosition = position === 'top' || position === 'left' ? 'before' : 'after';
      return jsxRuntime.jsx(memoizedAxis, _objectSpread2(_objectSpread2({}, axis), {}, {
        axis: isXAxis ? 'x' : 'y',
        x: position === 'right' ? width : 0,
        y: position === 'bottom' ? height : 0,
        scale: isXAxis ? xScale : yScale,
        length: isXAxis ? width : height,
        ticksPosition: ticksPosition
      }), position);
    })
  });
});

var GridLine = React.memo(function (_ref) {
  var animatedProps = _ref.animatedProps;
  var theme = core.useTheme();
  return jsxRuntime.jsx(web.animated.line, _objectSpread2(_objectSpread2({}, animatedProps), theme.grid.line));
});

var GridLines = React.memo(function (_ref) {
  var lines = _ref.lines;

  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.config;

  var transition = web.useTransition(lines, {
    keys: function keys(line) {
      return line.key;
    },
    initial: function initial(line) {
      return {
        opacity: 1,
        x1: line.x1,
        x2: line.x2,
        y1: line.y1,
        y2: line.y2
      };
    },
    from: function from(line) {
      return {
        opacity: 0,
        x1: line.x1,
        x2: line.x2,
        y1: line.y1,
        y2: line.y2
      };
    },
    enter: function enter(line) {
      return {
        opacity: 1,
        x1: line.x1,
        x2: line.x2,
        y1: line.y1,
        y2: line.y2
      };
    },
    update: function update(line) {
      return {
        opacity: 1,
        x1: line.x1,
        x2: line.x2,
        y1: line.y1,
        y2: line.y2
      };
    },
    leave: {
      opacity: 0
    },
    config: springConfig,
    immediate: !animate
  });
  return jsxRuntime.jsx("g", {
    children: transition(function (animatedProps, line) {
      return React.createElement(GridLine, _objectSpread2(_objectSpread2({}, line), {}, {
        key: line.key,
        animatedProps: animatedProps
      }));
    })
  });
});

var Grid = React.memo(function (_ref) {
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
  }, [xScale, xValues, width, height]);
  var yLines = React.useMemo(function () {
    if (!yScale) return false;
    return computeGridLines({
      width: width,
      height: height,
      scale: yScale,
      axis: 'y',
      values: yValues
    });
  }, [height, width, yScale, yValues]);
  return jsxRuntime.jsxs(jsxRuntime.Fragment, {
    children: [xLines && jsxRuntime.jsx(GridLines, {
      lines: xLines
    }), yLines && jsxRuntime.jsx(GridLines, {
      lines: yLines
    })]
  });
});

var renderAxisToCanvas = function renderAxisToCanvas(ctx, _ref) {
  var _theme$axis$domain$li;

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
      _format = _ref.format,
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

  if (((_theme$axis$domain$li = theme.axis.domain.line.strokeWidth) !== null && _theme$axis$domain$li !== void 0 ? _theme$axis$domain$li : 0) > 0) {
    ctx.lineWidth = Number(theme.axis.domain.line.strokeWidth);
    ctx.lineCap = 'square';

    if (theme.axis.domain.line.stroke) {
      ctx.strokeStyle = theme.axis.domain.line.stroke;
    }

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(axis === 'x' ? length : 0, axis === 'x' ? 0 : length);
    ctx.stroke();
  }

  var format = typeof _format === 'function' ? _format : function (value) {
    return "".concat(value);
  };
  ticks.forEach(function (tick) {
    var _theme$axis$ticks$lin;

    if (((_theme$axis$ticks$lin = theme.axis.ticks.line.strokeWidth) !== null && _theme$axis$ticks$lin !== void 0 ? _theme$axis$ticks$lin : 0) > 0) {
      ctx.lineWidth = Number(theme.axis.ticks.line.strokeWidth);
      ctx.lineCap = 'square';

      if (theme.axis.ticks.line.stroke) {
        ctx.strokeStyle = theme.axis.ticks.line.stroke;
      }

      ctx.beginPath();
      ctx.moveTo(tick.x, tick.y);
      ctx.lineTo(tick.x + tick.lineX, tick.y + tick.lineY);
      ctx.stroke();
    }

    var value = format(tick.value);
    ctx.save();
    ctx.translate(tick.x + tick.textX, tick.y + tick.textY);
    ctx.rotate(core.degreesToRadians(tickRotation));

    if (theme.axis.ticks.text.fill) {
      ctx.fillStyle = theme.axis.ticks.text.fill;
    }

    ctx.fillText(String(value), 0, 0);
    ctx.restore();
  });

  if (legend !== undefined) {
    var legendX = 0;
    var legendY = 0;
    var legendRotation = 0;
    var _textAlign = 'center';

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
    ctx.rotate(core.degreesToRadians(legendRotation));
    ctx.font = "".concat(theme.axis.legend.text.fontWeight ? "".concat(theme.axis.legend.text.fontWeight, " ") : '').concat(theme.axis.legend.text.fontSize, "px ").concat(theme.axis.legend.text.fontFamily);

    if (theme.axis.legend.text.fill) {
      ctx.fillStyle = theme.axis.legend.text.fill;
    }

    ctx.textAlign = _textAlign;
    ctx.textBaseline = 'middle';
    ctx.fillText(legend, 0, 0);
  }

  ctx.restore();
};
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
  positions.forEach(function (position) {
    var axis = axes[position];
    if (!axis) return null;
    var isXAxis = position === 'top' || position === 'bottom';
    var ticksPosition = position === 'top' || position === 'left' ? 'before' : 'after';
    var scale = isXAxis ? xScale : yScale;
    var format = getFormatter(axis.format, scale);
    renderAxisToCanvas(ctx, _objectSpread2(_objectSpread2({}, axis), {}, {
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

exports.Axes = Axes;
exports.Axis = memoizedAxis;
exports.AxisTick = memoizedAxisTick;
exports.Grid = Grid;
exports.GridLine = GridLine;
exports.GridLines = GridLines;
exports.axisPropType = axisPropType;
exports.axisPropTypes = axisPropTypes;
exports.positions = positions;
exports.renderAxesToCanvas = renderAxesToCanvas;
exports.renderAxisToCanvas = renderAxisToCanvas;
exports.renderGridLinesToCanvas = renderGridLinesToCanvas;
//# sourceMappingURL=nivo-axes.cjs.js.map
