'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var uniq = _interopDefault(require('lodash/uniq'));
var uniqBy = _interopDefault(require('lodash/uniqBy'));
var sortBy = _interopDefault(require('lodash/sortBy'));
var last = _interopDefault(require('lodash/last'));
var isDate = _interopDefault(require('lodash/isDate'));
var d3TimeFormat = require('d3-time-format');
var d3Scale = require('d3-scale');

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

var timePrecisions = ['millisecond', 'second', 'minute', 'hour', 'day', 'month', 'year'];
var precisionCutOffs = [function (date) {
  return date.setMilliseconds(0);
}, function (date) {
  return date.setSeconds(0);
}, function (date) {
  return date.setMinutes(0);
}, function (date) {
  return date.setHours(0);
}, function (date) {
  return date.setDate(1);
}, function (date) {
  return date.setMonth(0);
}];
var precisionCutOffsByType = {
  millisecond: [],
  second: precisionCutOffs.slice(0, 1),
  minute: precisionCutOffs.slice(0, 2),
  hour: precisionCutOffs.slice(0, 3),
  day: precisionCutOffs.slice(0, 4),
  month: precisionCutOffs.slice(0, 5),
  year: precisionCutOffs.slice(0, 6)
};
var createPrecisionMethod = function createPrecisionMethod(precision) {
  return function (date) {
    precisionCutOffsByType[precision].forEach(function (cutOff) {
      cutOff(date);
    });
    return date;
  };
};
var createDateNormalizer = function createDateNormalizer(_ref) {
  var _ref$format = _ref.format,
      format = _ref$format === void 0 ? 'native' : _ref$format,
      _ref$precision = _ref.precision,
      precision = _ref$precision === void 0 ? 'millisecond' : _ref$precision,
      _ref$useUTC = _ref.useUTC,
      useUTC = _ref$useUTC === void 0 ? true : _ref$useUTC;
  var precisionFn = createPrecisionMethod(precision);
  return function (value) {
    if (value === undefined) {
      return value;
    }

    if (format === 'native' || value instanceof Date) {
      return precisionFn(value);
    }

    var parseTime = useUTC ? d3TimeFormat.utcParse(format) : d3TimeFormat.timeParse(format);
    return precisionFn(parseTime(value));
  };
};

var createLinearScale = function createLinearScale(_ref, data, size, axis) {
  var _ref$min = _ref.min,
      min = _ref$min === void 0 ? 0 : _ref$min,
      _ref$max = _ref.max,
      max = _ref$max === void 0 ? 'auto' : _ref$max,
      _ref$stacked = _ref.stacked,
      stacked = _ref$stacked === void 0 ? false : _ref$stacked,
      _ref$reverse = _ref.reverse,
      reverse = _ref$reverse === void 0 ? false : _ref$reverse,
      _ref$clamp = _ref.clamp,
      clamp = _ref$clamp === void 0 ? false : _ref$clamp,
      _ref$nice = _ref.nice,
      nice = _ref$nice === void 0 ? false : _ref$nice;
  var minValue;

  if (min === 'auto') {
    var _data$minStacked;

    minValue = stacked === true ? (_data$minStacked = data.minStacked) !== null && _data$minStacked !== void 0 ? _data$minStacked : 0 : data.min;
  } else {
    minValue = min;
  }

  var maxValue;

  if (max === 'auto') {
    var _data$maxStacked;

    maxValue = stacked === true ? (_data$maxStacked = data.maxStacked) !== null && _data$maxStacked !== void 0 ? _data$maxStacked : 0 : data.max;
  } else {
    maxValue = max;
  }

  var scale = d3Scale.scaleLinear().rangeRound(axis === 'x' ? [0, size] : [size, 0]).domain(reverse ? [maxValue, minValue] : [minValue, maxValue]).clamp(clamp);
  if (nice === true) scale.nice();else if (typeof nice === 'number') scale.nice(nice);
  var typedScale = scale;
  typedScale.type = 'linear';
  typedScale.stacked = stacked;
  return typedScale;
};

var createPointScale = function createPointScale(_spec, data, size) {
  var scale = d3Scale.scalePoint().range([0, size]).domain(data.all);
  var typedScale = scale;
  typedScale.type = 'point';
  return typedScale;
};

var createBandScale = function createBandScale(_ref, data, size, axis) {
  var _ref$round = _ref.round,
      round = _ref$round === void 0 ? true : _ref$round;
  var scale = d3Scale.scaleBand().range(axis === 'x' ? [0, size] : [size, 0]).domain(data.all).round(round);
  var typedScale = scale;
  typedScale.type = 'band';
  return typedScale;
};

var createTimeScale = function createTimeScale(_ref, data, size) {
  var _ref$format = _ref.format,
      format = _ref$format === void 0 ? 'native' : _ref$format,
      _ref$precision = _ref.precision,
      precision = _ref$precision === void 0 ? 'millisecond' : _ref$precision,
      _ref$min = _ref.min,
      min = _ref$min === void 0 ? 'auto' : _ref$min,
      _ref$max = _ref.max,
      max = _ref$max === void 0 ? 'auto' : _ref$max,
      _ref$useUTC = _ref.useUTC,
      useUTC = _ref$useUTC === void 0 ? true : _ref$useUTC,
      _ref$nice = _ref.nice,
      nice = _ref$nice === void 0 ? false : _ref$nice;
  var normalize = createDateNormalizer({
    format: format,
    precision: precision,
    useUTC: useUTC
  });
  var minValue;

  if (min === 'auto') {
    minValue = normalize(data.min);
  } else if (format !== 'native') {
    minValue = normalize(min);
  } else {
    minValue = min;
  }

  var maxValue;

  if (max === 'auto') {
    maxValue = normalize(data.max);
  } else if (format !== 'native') {
    maxValue = normalize(max);
  } else {
    maxValue = max;
  }

  var scale = useUTC ? d3Scale.scaleUtc() : d3Scale.scaleTime();
  scale.range([0, size]);
  if (minValue && maxValue) scale.domain([minValue, maxValue]);
  if (nice === true) scale.nice();else if (typeof nice === 'object' || typeof nice === 'number') scale.nice(nice);
  var typedScale = scale;
  typedScale.type = 'time';
  typedScale.useUTC = useUTC;
  return typedScale;
};

var createLogScale = function createLogScale(_ref, data, size, axis) {
  var _ref$base = _ref.base,
      base = _ref$base === void 0 ? 10 : _ref$base,
      _ref$min = _ref.min,
      min = _ref$min === void 0 ? 'auto' : _ref$min,
      _ref$max = _ref.max,
      max = _ref$max === void 0 ? 'auto' : _ref$max;
  var hasZero = data.all.some(function (v) {
    return v === 0;
  });

  if (hasZero) {
    throw new Error("a log scale domain must not include or cross zero");
  }

  var sign;
  var hasMixedSign = false;
  data.all.filter(function (v) {
    return v != null;
  }).forEach(function (v) {
    if (hasMixedSign) return;

    if (sign === undefined) {
      sign = Math.sign(v);
    } else if (Math.sign(v) !== sign) {
      hasMixedSign = true;
    }
  });

  if (hasMixedSign) {
    throw new Error("a log scale domain must be strictly-positive or strictly-negative");
  }

  var minValue;

  if (min === 'auto') {
    minValue = data.min;
  } else {
    minValue = min;
  }

  var maxValue;

  if (max === 'auto') {
    maxValue = data.max;
  } else {
    maxValue = max;
  }

  var scale = d3Scale.scaleLog().domain([minValue, maxValue]).rangeRound(axis === 'x' ? [0, size] : [size, 0]).base(base).nice();
  var typedScale = scale;
  typedScale.type = 'log';
  return scale;
};

var createSymlogScale = function createSymlogScale(_ref, data, size, axis) {
  var _ref$constant = _ref.constant,
      constant = _ref$constant === void 0 ? 1 : _ref$constant,
      _ref$min = _ref.min,
      min = _ref$min === void 0 ? 'auto' : _ref$min,
      _ref$max = _ref.max,
      max = _ref$max === void 0 ? 'auto' : _ref$max,
      _ref$reverse = _ref.reverse,
      reverse = _ref$reverse === void 0 ? false : _ref$reverse;
  var minValue;

  if (min === 'auto') {
    minValue = data.min;
  } else {
    minValue = min;
  }

  var maxValue;

  if (max === 'auto') {
    maxValue = data.max;
  } else {
    maxValue = max;
  }

  var scale = d3Scale.scaleSymlog().constant(constant).rangeRound(axis === 'x' ? [0, size] : [size, 0]).nice();
  if (reverse === true) scale.domain([maxValue, minValue]);else scale.domain([minValue, maxValue]);
  var typedScale = scale;
  typedScale.type = 'symlog';
  return typedScale;
};

var getOtherAxis = function getOtherAxis(axis) {
  return axis === 'x' ? 'y' : 'x';
};
var compareValues = function compareValues(a, b) {
  return a === b;
};
var compareDateValues = function compareDateValues(a, b) {
  return a.getTime() === b.getTime();
};
function computeScale(spec, data, size, axis) {
  switch (spec.type) {
    case 'linear':
      return createLinearScale(spec, data, size, axis);

    case 'point':
      return createPointScale(spec, data, size);

    case 'band':
      return createBandScale(spec, data, size, axis);

    case 'time':
      return createTimeScale(spec, data, size);

    case 'log':
      return createLogScale(spec, data, size, axis);

    case 'symlog':
      return createSymlogScale(spec, data, size, axis);

    default:
      throw new Error('invalid scale spec');
  }
}
var computeXYScalesForSeries = function computeXYScalesForSeries(_series, xScaleSpec, yScaleSpec, width, height) {
  var series = _series.map(function (serie) {
    return _objectSpread2(_objectSpread2({}, serie), {}, {
      data: serie.data.map(function (d) {
        return {
          data: _objectSpread2({}, d)
        };
      })
    });
  });

  var xy = generateSeriesXY(series, xScaleSpec, yScaleSpec);

  if ('stacked' in xScaleSpec && xScaleSpec.stacked === true) {
    stackX(xy, series);
  }

  if ('stacked' in yScaleSpec && yScaleSpec.stacked === true) {
    stackY(xy, series);
  }

  var xScale = computeScale(xScaleSpec, xy.x, width, 'x');
  var yScale = computeScale(yScaleSpec, xy.y, height, 'y');
  series.forEach(function (serie) {
    serie.data.forEach(function (d) {
      var _xScale, _yScale;

      d.position = {
        x: 'stacked' in xScale && xScale.stacked === true ? d.data.xStacked === null ? null : xScale(d.data.xStacked) : d.data.x === null ? null : (_xScale = xScale(d.data.x)) !== null && _xScale !== void 0 ? _xScale : null,
        y: 'stacked' in yScale && yScale.stacked === true ? d.data.yStacked === null ? null : yScale(d.data.yStacked) : d.data.y === null ? null : (_yScale = yScale(d.data.y)) !== null && _yScale !== void 0 ? _yScale : null
      };
    });
  });
  return _objectSpread2(_objectSpread2({}, xy), {}, {
    series: series,
    xScale: xScale,
    yScale: yScale
  });
};
var generateSeriesXY = function generateSeriesXY(series, xScaleSpec, yScaleSpec) {
  return {
    x: generateSeriesAxis(series, 'x', xScaleSpec),
    y: generateSeriesAxis(series, 'y', yScaleSpec)
  };
};
var generateSeriesAxis = function generateSeriesAxis(series, axis, scaleSpec) {
  var _ref = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {},
      _ref$getValue = _ref.getValue,
      getValue = _ref$getValue === void 0 ? function (d) {
    return d.data[axis];
  } : _ref$getValue,
      _ref$setValue = _ref.setValue,
      setValue = _ref$setValue === void 0 ? function (d, v) {
    d.data[axis] = v;
  } : _ref$setValue;

  if (scaleSpec.type === 'linear') {
    series.forEach(function (serie) {
      serie.data.forEach(function (d) {
        var value = getValue(d);

        if (value) {
          setValue(d, parseFloat(String(value)));
        }
      });
    });
  } else if (scaleSpec.type === 'time' && scaleSpec.format !== 'native') {
    var parseTime = createDateNormalizer(scaleSpec);
    series.forEach(function (serie) {
      serie.data.forEach(function (d) {
        var value = getValue(d);

        if (value) {
          setValue(d, parseTime(value));
        }
      });
    });
  }

  var values = [];
  series.forEach(function (serie) {
    serie.data.forEach(function (d) {
      values.push(getValue(d));
    });
  });

  switch (scaleSpec.type) {
    case 'linear':
      {
        var all = sortBy(uniq(values), function (v) {
          return v;
        });
        return {
          all: all,
          min: Math.min.apply(Math, _toConsumableArray(all)),
          max: Math.max.apply(Math, _toConsumableArray(all))
        };
      }

    case 'time':
      {
        var _all = uniqBy(values, function (v) {
          return v.getTime();
        }).slice(0).sort(function (a, b) {
          return b.getTime() - a.getTime();
        }).reverse();

        return {
          all: _all,
          min: _all[0],
          max: last(_all)
        };
      }

    default:
      {
        var _all2 = uniq(values);

        return {
          all: _all2,
          min: _all2[0],
          max: last(_all2)
        };
      }
  }
};
var stackAxis = function stackAxis(axis, xy, series) {
  var otherAxis = getOtherAxis(axis);
  var all = [];
  xy[otherAxis].all.forEach(function (v) {
    var compare = isDate(v) ? compareDateValues : compareValues;
    var stack = [];
    series.forEach(function (serie) {
      var datum = serie.data.find(function (d) {
        return compare(d.data[otherAxis], v);
      });
      var value = null;
      var stackValue = null;

      if (datum !== undefined) {
        value = datum.data[axis];

        if (value !== null) {
          var head = last(stack);

          if (head === undefined) {
            stackValue = value;
          } else if (head !== null) {
            stackValue = head + value;
          }
        }

        datum.data["".concat(axis, "Stacked")] = stackValue;
      }

      stack.push(stackValue);

      if (stackValue !== null) {
        all.push(stackValue);
      }
    });
  });
  xy[axis].minStacked = Math.min.apply(Math, all);
  xy[axis].maxStacked = Math.max.apply(Math, all);
};

var stackX = function stackX(xy, series) {
  return stackAxis('x', xy, series);
};

var stackY = function stackY(xy, series) {
  return stackAxis('y', xy, series);
};

exports.compareDateValues = compareDateValues;
exports.compareValues = compareValues;
exports.computeScale = computeScale;
exports.computeXYScalesForSeries = computeXYScalesForSeries;
exports.createBandScale = createBandScale;
exports.createDateNormalizer = createDateNormalizer;
exports.createLinearScale = createLinearScale;
exports.createLogScale = createLogScale;
exports.createPointScale = createPointScale;
exports.createPrecisionMethod = createPrecisionMethod;
exports.createSymlogScale = createSymlogScale;
exports.createTimeScale = createTimeScale;
exports.generateSeriesAxis = generateSeriesAxis;
exports.generateSeriesXY = generateSeriesXY;
exports.getOtherAxis = getOtherAxis;
exports.precisionCutOffs = precisionCutOffs;
exports.precisionCutOffsByType = precisionCutOffsByType;
exports.stackAxis = stackAxis;
exports.timePrecisions = timePrecisions;
//# sourceMappingURL=nivo-scales.cjs.js.map
