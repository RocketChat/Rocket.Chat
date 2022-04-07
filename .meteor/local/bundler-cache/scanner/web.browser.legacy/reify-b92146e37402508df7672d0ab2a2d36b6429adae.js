'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var axes = require('@nivo/axes');
var annotations = require('@nivo/annotations');
var jsxRuntime = require('react/jsx-runtime');
var legends = require('@nivo/legends');
var core = require('@nivo/core');
var react = require('react');
var scales = require('@nivo/scales');
var d3Shape = require('d3-shape');
var _uniqBy = _interopDefault(require('lodash/uniqBy'));
var web = require('@react-spring/web');
var tooltip = require('@nivo/tooltip');
var colors = require('@nivo/colors');

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }
  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = _objectWithoutPropertiesLoose(source, excluded);
  var key, i;
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }
  return target;
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

var BarAnnotations = function BarAnnotations(_ref) {
  var bars = _ref.bars,
      annotations$1 = _ref.annotations;
  var boundAnnotations = annotations.useAnnotations({
    data: bars,
    annotations: annotations$1,
    getPosition: function getPosition(bar) {
      return {
        x: bar.x + bar.width / 2,
        y: bar.y + bar.height / 2
      };
    },
    getDimensions: function getDimensions(_ref2) {
      var height = _ref2.height,
          width = _ref2.width;
      return {
        width: width,
        height: height,
        size: Math.max(width, height)
      };
    }
  });
  return jsxRuntime.jsx(jsxRuntime.Fragment, {
    children: boundAnnotations.map(function (annotation, i) {
      return jsxRuntime.jsx(annotations.Annotation, _objectSpread2({}, annotation), i);
    })
  });
};

var BarLegends = function BarLegends(_ref) {
  var width = _ref.width,
      height = _ref.height,
      legends$1 = _ref.legends,
      data = _ref.data,
      toggleSerie = _ref.toggleSerie;
  return jsxRuntime.jsx(jsxRuntime.Fragment, {
    children: legends$1.map(function (legend, i) {
      var _legend$data;

      return jsxRuntime.jsx(legends.BoxLegendSvg, _objectSpread2(_objectSpread2({}, legend), {}, {
        containerWidth: width,
        containerHeight: height,
        data: (_legend$data = legend.data) !== null && _legend$data !== void 0 ? _legend$data : data,
        toggleSerie: legend.toggleSerie && legend.dataFrom === 'keys' ? toggleSerie : undefined
      }), i);
    })
  });
};

var getIndexScale = function getIndexScale(data, getIndex, padding, indexScale, size, axis) {
  return scales.computeScale(indexScale, {
    all: data.map(getIndex),
    min: 0,
    max: 0
  }, size, axis).padding(padding);
};
var normalizeData = function normalizeData(data, keys) {
  return data.map(function (item) {
    return _objectSpread2(_objectSpread2({}, keys.reduce(function (acc, key) {
      acc[key] = null;
      return acc;
    }, {})), item);
  });
};
var filterNullValues = function filterNullValues(data) {
  return Object.keys(data).reduce(function (acc, key) {
    if (data[key]) {
      acc[key] = data[key];
    }

    return acc;
  }, {});
};
var coerceValue = function coerceValue(value) {
  return [value, Number(value)];
};

var gt = function gt(value, other) {
  return value > other;
};

var lt = function lt(value, other) {
  return value < other;
};

var flatten = function flatten(array) {
  var _ref;

  return (_ref = []).concat.apply(_ref, _toConsumableArray(array));
};

var range = function range(start, end) {
  return Array.from(' '.repeat(end - start), function (_, index) {
    return start + index;
  });
};

var clampToZero = function clampToZero(value) {
  return gt(value, 0) ? 0 : value;
};

var zeroIfNotFinite = function zeroIfNotFinite(value) {
  return isFinite(value) ? value : 0;
};

var generateVerticalGroupedBars = function generateVerticalGroupedBars(_ref2, barWidth, reverse, yRef) {
  var data = _ref2.data,
      formatValue = _ref2.formatValue,
      getColor = _ref2.getColor,
      getIndex = _ref2.getIndex,
      getTooltipLabel = _ref2.getTooltipLabel,
      _ref2$innerPadding = _ref2.innerPadding,
      innerPadding = _ref2$innerPadding === void 0 ? 0 : _ref2$innerPadding,
      keys = _ref2.keys,
      xScale = _ref2.xScale,
      yScale = _ref2.yScale;
  var compare = reverse ? lt : gt;

  var getY = function getY(d) {
    var _yScale;

    return compare(d, 0) ? (_yScale = yScale(d)) !== null && _yScale !== void 0 ? _yScale : 0 : yRef;
  };

  var getHeight = function getHeight(d, y) {
    var _yScale2;

    return compare(d, 0) ? yRef - y : ((_yScale2 = yScale(d)) !== null && _yScale2 !== void 0 ? _yScale2 : 0) - yRef;
  };

  var cleanedData = data.map(filterNullValues);
  var bars = flatten(keys.map(function (key, i) {
    return range(0, xScale.domain().length).map(function (index) {
      var _xScale;

      var _coerceValue = coerceValue(data[index][key]),
          _coerceValue2 = _slicedToArray(_coerceValue, 2),
          rawValue = _coerceValue2[0],
          value = _coerceValue2[1];

      var indexValue = getIndex(data[index]);
      var x = ((_xScale = xScale(indexValue)) !== null && _xScale !== void 0 ? _xScale : 0) + barWidth * i + innerPadding * i;
      var y = getY(value);
      var barHeight = getHeight(value, y);
      var barData = {
        id: key,
        value: rawValue === null ? rawValue : value,
        formattedValue: formatValue(value),
        hidden: false,
        index: index,
        indexValue: indexValue,
        data: cleanedData[index]
      };
      return {
        key: "".concat(key, ".").concat(barData.indexValue),
        data: barData,
        x: x,
        y: y,
        width: barWidth,
        height: barHeight,
        color: getColor(barData),
        label: getTooltipLabel(barData)
      };
    });
  }));
  return bars;
};

var generateHorizontalGroupedBars = function generateHorizontalGroupedBars(_ref3, barHeight, reverse, xRef) {
  var data = _ref3.data,
      formatValue = _ref3.formatValue,
      getIndex = _ref3.getIndex,
      getColor = _ref3.getColor,
      getTooltipLabel = _ref3.getTooltipLabel,
      keys = _ref3.keys,
      _ref3$innerPadding = _ref3.innerPadding,
      innerPadding = _ref3$innerPadding === void 0 ? 0 : _ref3$innerPadding,
      xScale = _ref3.xScale,
      yScale = _ref3.yScale;
  var compare = reverse ? lt : gt;

  var getX = function getX(d) {
    var _xScale2;

    return compare(d, 0) ? xRef : (_xScale2 = xScale(d)) !== null && _xScale2 !== void 0 ? _xScale2 : 0;
  };

  var getWidth = function getWidth(d, x) {
    var _xScale3;

    return compare(d, 0) ? ((_xScale3 = xScale(d)) !== null && _xScale3 !== void 0 ? _xScale3 : 0) - xRef : xRef - x;
  };

  var cleanedData = data.map(filterNullValues);
  var bars = flatten(keys.map(function (key, i) {
    return range(0, yScale.domain().length).map(function (index) {
      var _yScale3;

      var _coerceValue3 = coerceValue(data[index][key]),
          _coerceValue4 = _slicedToArray(_coerceValue3, 2),
          rawValue = _coerceValue4[0],
          value = _coerceValue4[1];

      var indexValue = getIndex(data[index]);
      var x = getX(value);
      var y = ((_yScale3 = yScale(indexValue)) !== null && _yScale3 !== void 0 ? _yScale3 : 0) + barHeight * i + innerPadding * i;
      var barWidth = getWidth(value, x);
      var barData = {
        id: key,
        value: rawValue === null ? rawValue : value,
        formattedValue: formatValue(value),
        hidden: false,
        index: index,
        indexValue: indexValue,
        data: cleanedData[index]
      };
      return {
        key: "".concat(key, ".").concat(barData.indexValue),
        data: barData,
        x: x,
        y: y,
        width: barWidth,
        height: barHeight,
        color: getColor(barData),
        label: getTooltipLabel(barData)
      };
    });
  }));
  return bars;
};

var generateGroupedBars = function generateGroupedBars(_ref4) {
  var _scale;

  var layout = _ref4.layout,
      minValue = _ref4.minValue,
      maxValue = _ref4.maxValue,
      reverse = _ref4.reverse,
      width = _ref4.width,
      height = _ref4.height,
      _ref4$padding = _ref4.padding,
      padding = _ref4$padding === void 0 ? 0 : _ref4$padding,
      _ref4$innerPadding = _ref4.innerPadding,
      innerPadding = _ref4$innerPadding === void 0 ? 0 : _ref4$innerPadding,
      valueScale = _ref4.valueScale,
      indexScaleConfig = _ref4.indexScale,
      _ref4$hiddenIds = _ref4.hiddenIds,
      hiddenIds = _ref4$hiddenIds === void 0 ? [] : _ref4$hiddenIds,
      props = _objectWithoutProperties(_ref4, ["layout", "minValue", "maxValue", "reverse", "width", "height", "padding", "innerPadding", "valueScale", "indexScale", "hiddenIds"]);

  var keys = props.keys.filter(function (key) {
    return !hiddenIds.includes(key);
  });
  var data = normalizeData(props.data, keys);

  var _ref5 = layout === 'vertical' ? ['y', 'x', width] : ['x', 'y', height],
      _ref6 = _slicedToArray(_ref5, 3),
      axis = _ref6[0],
      otherAxis = _ref6[1],
      size = _ref6[2];

  var indexScale = getIndexScale(data, props.getIndex, padding, indexScaleConfig, size, otherAxis);

  var scaleSpec = _objectSpread2({
    max: maxValue,
    min: minValue,
    reverse: reverse
  }, valueScale);

  var clampMin = scaleSpec.min === 'auto' ? clampToZero : function (value) {
    return value;
  };
  var values = data.reduce(function (acc, entry) {
    return [].concat(_toConsumableArray(acc), _toConsumableArray(keys.map(function (k) {
      return entry[k];
    })));
  }, []).filter(Boolean);
  var min = clampMin(Math.min.apply(Math, _toConsumableArray(values)));
  var max = zeroIfNotFinite(Math.max.apply(Math, _toConsumableArray(values)));
  var scale = scales.computeScale(scaleSpec, {
    all: values,
    min: min,
    max: max
  }, axis === 'x' ? width : height, axis);

  var _ref7 = layout === 'vertical' ? [indexScale, scale] : [scale, indexScale],
      _ref8 = _slicedToArray(_ref7, 2),
      xScale = _ref8[0],
      yScale = _ref8[1];

  var bandwidth = (indexScale.bandwidth() - innerPadding * (keys.length - 1)) / keys.length;
  var params = [_objectSpread2(_objectSpread2({}, props), {}, {
    data: data,
    keys: keys,
    innerPadding: innerPadding,
    xScale: xScale,
    yScale: yScale
  }), bandwidth, scaleSpec.reverse, (_scale = scale(0)) !== null && _scale !== void 0 ? _scale : 0];
  var bars = bandwidth > 0 ? layout === 'vertical' ? generateVerticalGroupedBars.apply(void 0, params) : generateHorizontalGroupedBars.apply(void 0, params) : [];
  return {
    xScale: xScale,
    yScale: yScale,
    bars: bars
  };
};

var flattenDeep = function flattenDeep(arr) {
  var _ref;

  return arr.some(Array.isArray) ? flattenDeep((_ref = []).concat.apply(_ref, _toConsumableArray(arr))) : arr;
};

var filterZerosIfLog = function filterZerosIfLog(array, type) {
  return type === 'log' ? array.filter(function (num) {
    return num !== 0;
  }) : array;
};

var generateVerticalStackedBars = function generateVerticalStackedBars(_ref2, barWidth, reverse) {
  var formatValue = _ref2.formatValue,
      getColor = _ref2.getColor,
      getIndex = _ref2.getIndex,
      getTooltipLabel = _ref2.getTooltipLabel,
      innerPadding = _ref2.innerPadding,
      stackedData = _ref2.stackedData,
      xScale = _ref2.xScale,
      yScale = _ref2.yScale;

  var getY = function getY(d) {
    return yScale(d[reverse ? 0 : 1]);
  };

  var getHeight = function getHeight(d, y) {
    var _yScale;

    return ((_yScale = yScale(d[reverse ? 1 : 0])) !== null && _yScale !== void 0 ? _yScale : 0) - y;
  };

  var bars = flattenDeep(stackedData.map(function (stackedDataItem) {
    return xScale.domain().map(function (index, i) {
      var _xScale, _getY;

      var d = stackedDataItem[i];
      var x = (_xScale = xScale(getIndex(d.data))) !== null && _xScale !== void 0 ? _xScale : 0;
      var y = ((_getY = getY(d)) !== null && _getY !== void 0 ? _getY : 0) + innerPadding * 0.5;
      var barHeight = getHeight(d, y) - innerPadding;

      var _coerceValue = coerceValue(d.data[stackedDataItem.key]),
          _coerceValue2 = _slicedToArray(_coerceValue, 2),
          rawValue = _coerceValue2[0],
          value = _coerceValue2[1];

      var barData = {
        id: stackedDataItem.key,
        value: rawValue === null ? rawValue : value,
        formattedValue: formatValue(value),
        hidden: false,
        index: i,
        indexValue: index,
        data: filterNullValues(d.data)
      };
      return {
        key: "".concat(stackedDataItem.key, ".").concat(index),
        data: barData,
        x: x,
        y: y,
        width: barWidth,
        height: barHeight,
        color: getColor(barData),
        label: getTooltipLabel(barData)
      };
    });
  }));
  return bars;
};

var generateHorizontalStackedBars = function generateHorizontalStackedBars(_ref3, barHeight, reverse) {
  var formatValue = _ref3.formatValue,
      getColor = _ref3.getColor,
      getIndex = _ref3.getIndex,
      getTooltipLabel = _ref3.getTooltipLabel,
      innerPadding = _ref3.innerPadding,
      stackedData = _ref3.stackedData,
      xScale = _ref3.xScale,
      yScale = _ref3.yScale;

  var getX = function getX(d) {
    return xScale(d[reverse ? 1 : 0]);
  };

  var getWidth = function getWidth(d, x) {
    var _xScale2;

    return ((_xScale2 = xScale(d[reverse ? 0 : 1])) !== null && _xScale2 !== void 0 ? _xScale2 : 0) - x;
  };

  var bars = flattenDeep(stackedData.map(function (stackedDataItem) {
    return yScale.domain().map(function (index, i) {
      var _yScale2, _getX;

      var d = stackedDataItem[i];
      var y = (_yScale2 = yScale(getIndex(d.data))) !== null && _yScale2 !== void 0 ? _yScale2 : 0;
      var x = ((_getX = getX(d)) !== null && _getX !== void 0 ? _getX : 0) + innerPadding * 0.5;
      var barWidth = getWidth(d, x) - innerPadding;

      var _coerceValue3 = coerceValue(d.data[stackedDataItem.key]),
          _coerceValue4 = _slicedToArray(_coerceValue3, 2),
          rawValue = _coerceValue4[0],
          value = _coerceValue4[1];

      var barData = {
        id: stackedDataItem.key,
        value: rawValue === null ? rawValue : value,
        formattedValue: formatValue(value),
        hidden: false,
        index: i,
        indexValue: index,
        data: filterNullValues(d.data)
      };
      return {
        key: "".concat(stackedDataItem.key, ".").concat(index),
        data: barData,
        x: x,
        y: y,
        width: barWidth,
        height: barHeight,
        color: getColor(barData),
        label: getTooltipLabel(barData)
      };
    });
  }));
  return bars;
};

var generateStackedBars = function generateStackedBars(_ref4) {
  var data = _ref4.data,
      layout = _ref4.layout,
      minValue = _ref4.minValue,
      maxValue = _ref4.maxValue,
      reverse = _ref4.reverse,
      width = _ref4.width,
      height = _ref4.height,
      _ref4$padding = _ref4.padding,
      padding = _ref4$padding === void 0 ? 0 : _ref4$padding,
      valueScale = _ref4.valueScale,
      indexScaleConfig = _ref4.indexScale,
      _ref4$hiddenIds = _ref4.hiddenIds,
      hiddenIds = _ref4$hiddenIds === void 0 ? [] : _ref4$hiddenIds,
      props = _objectWithoutProperties(_ref4, ["data", "layout", "minValue", "maxValue", "reverse", "width", "height", "padding", "valueScale", "indexScale", "hiddenIds"]);

  var keys = props.keys.filter(function (key) {
    return !hiddenIds.includes(key);
  });
  var stackedData = d3Shape.stack().keys(keys).offset(d3Shape.stackOffsetDiverging)(normalizeData(data, keys));

  var _ref5 = layout === 'vertical' ? ['y', 'x', width] : ['x', 'y', height],
      _ref6 = _slicedToArray(_ref5, 3),
      axis = _ref6[0],
      otherAxis = _ref6[1],
      size = _ref6[2];

  var indexScale = getIndexScale(data, props.getIndex, padding, indexScaleConfig, size, otherAxis);

  var scaleSpec = _objectSpread2({
    max: maxValue,
    min: minValue,
    reverse: reverse
  }, valueScale);

  var values = filterZerosIfLog(flattenDeep(stackedData), valueScale.type);
  var min = Math.min.apply(Math, _toConsumableArray(values));
  var max = Math.max.apply(Math, _toConsumableArray(values));
  var scale = scales.computeScale(scaleSpec, {
    all: values,
    min: min,
    max: max
  }, axis === 'x' ? width : height, axis);

  var _ref7 = layout === 'vertical' ? [indexScale, scale] : [scale, indexScale],
      _ref8 = _slicedToArray(_ref7, 2),
      xScale = _ref8[0],
      yScale = _ref8[1];

  var innerPadding = props.innerPadding > 0 ? props.innerPadding : 0;
  var bandwidth = indexScale.bandwidth();
  var params = [_objectSpread2(_objectSpread2({}, props), {}, {
    innerPadding: innerPadding,
    stackedData: stackedData,
    xScale: xScale,
    yScale: yScale
  }), bandwidth, scaleSpec.reverse];
  var bars = bandwidth > 0 ? layout === 'vertical' ? generateVerticalStackedBars.apply(void 0, params) : generateHorizontalStackedBars.apply(void 0, params) : [];
  return {
    xScale: xScale,
    yScale: yScale,
    bars: bars
  };
};

var getLegendDataForKeys = function getLegendDataForKeys(bars, layout, direction, groupMode, reverse, getLegendLabel) {
  var data = _uniqBy(bars.map(function (bar) {
    var _bar$color;

    return {
      id: bar.data.id,
      label: getLegendLabel(bar.data),
      hidden: bar.data.hidden,
      color: (_bar$color = bar.color) !== null && _bar$color !== void 0 ? _bar$color : '#000'
    };
  }), function (_ref) {
    var id = _ref.id;
    return id;
  });

  if (layout === 'vertical' && groupMode === 'stacked' && direction === 'column' && reverse !== true || layout === 'horizontal' && groupMode === 'stacked' && reverse === true) {
    data.reverse();
  }

  return data;
};
var getLegendDataForIndexes = function getLegendDataForIndexes(bars, layout, getLegendLabel) {
  var data = _uniqBy(bars.map(function (bar) {
    var _bar$data$indexValue, _bar$color2;

    return {
      id: (_bar$data$indexValue = bar.data.indexValue) !== null && _bar$data$indexValue !== void 0 ? _bar$data$indexValue : '',
      label: getLegendLabel(bar.data),
      hidden: bar.data.hidden,
      color: (_bar$color2 = bar.color) !== null && _bar$color2 !== void 0 ? _bar$color2 : '#000'
    };
  }), function (_ref2) {
    var id = _ref2.id;
    return id;
  });

  if (layout === 'horizontal') {
    data.reverse();
  }

  return data;
};
var getLegendData = function getLegendData(_ref3) {
  var bars = _ref3.bars,
      direction = _ref3.direction,
      from = _ref3.from,
      groupMode = _ref3.groupMode,
      layout = _ref3.layout,
      legendLabel = _ref3.legendLabel,
      reverse = _ref3.reverse;
  var getLegendLabel = core.getPropertyAccessor(legendLabel !== null && legendLabel !== void 0 ? legendLabel : from === 'indexes' ? 'indexValue' : 'id');

  if (from === 'indexes') {
    return getLegendDataForIndexes(bars, layout, getLegendLabel);
  }

  return getLegendDataForKeys(bars, layout, direction, groupMode, reverse, getLegendLabel);
};

var BarItem = function BarItem(_ref) {
  var _data$fill;

  var _ref$bar = _ref.bar,
      data = _ref$bar.data,
      bar = _objectWithoutProperties(_ref$bar, ["data"]),
      _ref$style = _ref.style,
      borderColor = _ref$style.borderColor,
      color = _ref$style.color,
      height = _ref$style.height,
      labelColor = _ref$style.labelColor,
      labelOpacity = _ref$style.labelOpacity,
      labelX = _ref$style.labelX,
      labelY = _ref$style.labelY,
      transform = _ref$style.transform,
      width = _ref$style.width,
      borderRadius = _ref.borderRadius,
      borderWidth = _ref.borderWidth,
      label = _ref.label,
      shouldRenderLabel = _ref.shouldRenderLabel,
      isInteractive = _ref.isInteractive,
      onClick = _ref.onClick,
      onMouseEnter = _ref.onMouseEnter,
      onMouseLeave = _ref.onMouseLeave,
      tooltip$1 = _ref.tooltip;

  var theme = core.useTheme();

  var _useTooltip = tooltip.useTooltip(),
      showTooltipFromEvent = _useTooltip.showTooltipFromEvent,
      hideTooltip = _useTooltip.hideTooltip;

  var handleClick = react.useCallback(function (event) {
    onClick === null || onClick === void 0 ? void 0 : onClick(_objectSpread2({
      color: bar.color
    }, data), event);
  }, [bar, data, onClick]);
  var handleTooltip = react.useCallback(function (event) {
    return showTooltipFromEvent(react.createElement(tooltip$1, _objectSpread2(_objectSpread2({}, bar), data)), event);
  }, [bar, data, showTooltipFromEvent, tooltip$1]);
  var handleMouseEnter = react.useCallback(function (event) {
    onMouseEnter === null || onMouseEnter === void 0 ? void 0 : onMouseEnter(data, event);
    showTooltipFromEvent(react.createElement(tooltip$1, _objectSpread2(_objectSpread2({}, bar), data)), event);
  }, [bar, data, onMouseEnter, showTooltipFromEvent, tooltip$1]);
  var handleMouseLeave = react.useCallback(function (event) {
    onMouseLeave === null || onMouseLeave === void 0 ? void 0 : onMouseLeave(data, event);
    hideTooltip();
  }, [data, hideTooltip, onMouseLeave]);
  return jsxRuntime.jsxs(web.animated.g, {
    transform: transform,
    children: [jsxRuntime.jsx(web.animated.rect, {
      width: web.to(width, function (value) {
        return Math.max(value, 0);
      }),
      height: web.to(height, function (value) {
        return Math.max(value, 0);
      }),
      rx: borderRadius,
      ry: borderRadius,
      fill: (_data$fill = data.fill) !== null && _data$fill !== void 0 ? _data$fill : color,
      strokeWidth: borderWidth,
      stroke: borderColor,
      onMouseEnter: isInteractive ? handleMouseEnter : undefined,
      onMouseMove: isInteractive ? handleTooltip : undefined,
      onMouseLeave: isInteractive ? handleMouseLeave : undefined,
      onClick: isInteractive ? handleClick : undefined
    }), shouldRenderLabel && jsxRuntime.jsx(web.animated.text, {
      x: labelX,
      y: labelY,
      textAnchor: "middle",
      dominantBaseline: "central",
      fillOpacity: labelOpacity,
      style: _objectSpread2(_objectSpread2({}, theme.labels.text), {}, {
        pointerEvents: 'none',
        fill: labelColor
      }),
      children: label
    })]
  });
};

var BarTooltip = function BarTooltip(_ref) {
  var color = _ref.color,
      label = _ref.label,
      data = _objectWithoutProperties(_ref, ["color", "label"]);

  return jsxRuntime.jsx(tooltip.BasicTooltip, {
    id: label,
    value: data.formattedValue,
    enableChip: true,
    color: color
  });
};

var _window$devicePixelRa;
var defaultProps = {
  indexBy: 'id',
  keys: ['value'],
  groupMode: 'stacked',
  layout: 'vertical',
  reverse: false,
  minValue: 'auto',
  maxValue: 'auto',
  valueScale: {
    type: 'linear'
  },
  indexScale: {
    type: 'band',
    round: true
  },
  padding: 0.1,
  innerPadding: 0,
  axisBottom: {},
  axisLeft: {},
  enableGridX: false,
  enableGridY: true,
  enableLabel: true,
  label: 'formattedValue',
  labelSkipWidth: 0,
  labelSkipHeight: 0,
  labelTextColor: {
    from: 'theme',
    theme: 'labels.text.fill'
  },
  colorBy: 'id',
  colors: {
    scheme: 'nivo'
  },
  borderRadius: 0,
  borderWidth: 0,
  borderColor: {
    from: 'color'
  },
  isInteractive: true,
  tooltip: BarTooltip,
  tooltipLabel: function tooltipLabel(datum) {
    return "".concat(datum.id, " - ").concat(datum.indexValue);
  },
  legends: [],
  annotations: []
};
var svgDefaultProps = _objectSpread2(_objectSpread2({}, defaultProps), {}, {
  layers: ['grid', 'axes', 'bars', 'markers', 'legends', 'annotations'],
  barComponent: BarItem,
  defs: [],
  fill: [],
  animate: true,
  motionConfig: 'default',
  role: 'img'
});
var canvasDefaultProps = _objectSpread2(_objectSpread2({}, defaultProps), {}, {
  layers: ['grid', 'axes', 'bars', 'legends', 'annotations'],
  pixelRatio: typeof window !== 'undefined' ? (_window$devicePixelRa = window.devicePixelRatio) !== null && _window$devicePixelRa !== void 0 ? _window$devicePixelRa : 1 : 1
});

var InnerBar = function InnerBar(_ref) {
  var data = _ref.data,
      _ref$indexBy = _ref.indexBy,
      indexBy = _ref$indexBy === void 0 ? svgDefaultProps.indexBy : _ref$indexBy,
      _ref$keys = _ref.keys,
      keys = _ref$keys === void 0 ? svgDefaultProps.keys : _ref$keys,
      partialMargin = _ref.margin,
      width = _ref.width,
      height = _ref.height,
      _ref$groupMode = _ref.groupMode,
      groupMode = _ref$groupMode === void 0 ? svgDefaultProps.groupMode : _ref$groupMode,
      _ref$layout = _ref.layout,
      layout = _ref$layout === void 0 ? svgDefaultProps.layout : _ref$layout,
      _ref$reverse = _ref.reverse,
      reverse = _ref$reverse === void 0 ? svgDefaultProps.reverse : _ref$reverse,
      _ref$minValue = _ref.minValue,
      minValue = _ref$minValue === void 0 ? svgDefaultProps.minValue : _ref$minValue,
      _ref$maxValue = _ref.maxValue,
      maxValue = _ref$maxValue === void 0 ? svgDefaultProps.maxValue : _ref$maxValue,
      _ref$valueScale = _ref.valueScale,
      valueScale = _ref$valueScale === void 0 ? svgDefaultProps.valueScale : _ref$valueScale,
      _ref$indexScale = _ref.indexScale,
      indexScale = _ref$indexScale === void 0 ? svgDefaultProps.indexScale : _ref$indexScale,
      _ref$padding = _ref.padding,
      padding = _ref$padding === void 0 ? svgDefaultProps.padding : _ref$padding,
      _ref$innerPadding = _ref.innerPadding,
      innerPadding = _ref$innerPadding === void 0 ? svgDefaultProps.innerPadding : _ref$innerPadding,
      axisTop = _ref.axisTop,
      axisRight = _ref.axisRight,
      _ref$axisBottom = _ref.axisBottom,
      axisBottom = _ref$axisBottom === void 0 ? svgDefaultProps.axisBottom : _ref$axisBottom,
      _ref$axisLeft = _ref.axisLeft,
      axisLeft = _ref$axisLeft === void 0 ? svgDefaultProps.axisLeft : _ref$axisLeft,
      _ref$enableGridX = _ref.enableGridX,
      enableGridX = _ref$enableGridX === void 0 ? svgDefaultProps.enableGridX : _ref$enableGridX,
      _ref$enableGridY = _ref.enableGridY,
      enableGridY = _ref$enableGridY === void 0 ? svgDefaultProps.enableGridY : _ref$enableGridY,
      gridXValues = _ref.gridXValues,
      gridYValues = _ref.gridYValues,
      _ref$layers = _ref.layers,
      layers = _ref$layers === void 0 ? svgDefaultProps.layers : _ref$layers,
      _ref$barComponent = _ref.barComponent,
      barComponent = _ref$barComponent === void 0 ? svgDefaultProps.barComponent : _ref$barComponent,
      _ref$enableLabel = _ref.enableLabel,
      enableLabel = _ref$enableLabel === void 0 ? svgDefaultProps.enableLabel : _ref$enableLabel,
      _ref$label = _ref.label,
      label = _ref$label === void 0 ? svgDefaultProps.label : _ref$label,
      _ref$labelSkipWidth = _ref.labelSkipWidth,
      labelSkipWidth = _ref$labelSkipWidth === void 0 ? svgDefaultProps.labelSkipWidth : _ref$labelSkipWidth,
      _ref$labelSkipHeight = _ref.labelSkipHeight,
      labelSkipHeight = _ref$labelSkipHeight === void 0 ? svgDefaultProps.labelSkipHeight : _ref$labelSkipHeight,
      _ref$labelTextColor = _ref.labelTextColor,
      labelTextColor = _ref$labelTextColor === void 0 ? svgDefaultProps.labelTextColor : _ref$labelTextColor,
      markers = _ref.markers,
      _ref$colorBy = _ref.colorBy,
      colorBy = _ref$colorBy === void 0 ? svgDefaultProps.colorBy : _ref$colorBy,
      _ref$colors = _ref.colors,
      colors$1 = _ref$colors === void 0 ? svgDefaultProps.colors : _ref$colors,
      _ref$defs = _ref.defs,
      defs = _ref$defs === void 0 ? svgDefaultProps.defs : _ref$defs,
      _ref$fill = _ref.fill,
      fill = _ref$fill === void 0 ? svgDefaultProps.fill : _ref$fill,
      _ref$borderRadius = _ref.borderRadius,
      borderRadius = _ref$borderRadius === void 0 ? svgDefaultProps.borderRadius : _ref$borderRadius,
      _ref$borderWidth = _ref.borderWidth,
      borderWidth = _ref$borderWidth === void 0 ? svgDefaultProps.borderWidth : _ref$borderWidth,
      _ref$borderColor = _ref.borderColor,
      borderColor = _ref$borderColor === void 0 ? svgDefaultProps.borderColor : _ref$borderColor,
      _ref$annotations = _ref.annotations,
      annotations = _ref$annotations === void 0 ? svgDefaultProps.annotations : _ref$annotations,
      legendLabel = _ref.legendLabel,
      _ref$tooltipLabel = _ref.tooltipLabel,
      tooltipLabel = _ref$tooltipLabel === void 0 ? svgDefaultProps.tooltipLabel : _ref$tooltipLabel,
      valueFormat = _ref.valueFormat,
      _ref$isInteractive = _ref.isInteractive,
      isInteractive = _ref$isInteractive === void 0 ? svgDefaultProps.isInteractive : _ref$isInteractive,
      _ref$tooltip = _ref.tooltip,
      tooltip = _ref$tooltip === void 0 ? svgDefaultProps.tooltip : _ref$tooltip,
      onClick = _ref.onClick,
      onMouseEnter = _ref.onMouseEnter,
      onMouseLeave = _ref.onMouseLeave,
      _ref$legends = _ref.legends,
      legends = _ref$legends === void 0 ? svgDefaultProps.legends : _ref$legends,
      _ref$role = _ref.role,
      role = _ref$role === void 0 ? svgDefaultProps.role : _ref$role,
      initialHiddenIds = _ref.initialHiddenIds;

  var _useState = react.useState(initialHiddenIds !== null && initialHiddenIds !== void 0 ? initialHiddenIds : []),
      _useState2 = _slicedToArray(_useState, 2),
      hiddenIds = _useState2[0],
      setHiddenIds = _useState2[1];

  var toggleSerie = react.useCallback(function (id) {
    setHiddenIds(function (state) {
      return state.indexOf(id) > -1 ? state.filter(function (item) {
        return item !== id;
      }) : [].concat(_toConsumableArray(state), [id]);
    });
  }, []);
  var theme = core.useTheme();

  var _useMotionConfig = core.useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.config;

  var _useDimensions = core.useDimensions(width, height, partialMargin),
      outerWidth = _useDimensions.outerWidth,
      outerHeight = _useDimensions.outerHeight,
      margin = _useDimensions.margin,
      innerWidth = _useDimensions.innerWidth,
      innerHeight = _useDimensions.innerHeight;

  var formatValue = core.useValueFormatter(valueFormat);
  var getBorderColor = colors.useInheritedColor(borderColor, theme);
  var getColor = colors.useOrdinalColorScale(colors$1, colorBy);
  var getIndex = core.usePropertyAccessor(indexBy);
  var getLabel = core.usePropertyAccessor(label);
  var getLabelColor = colors.useInheritedColor(labelTextColor, theme);
  var getTooltipLabel = core.usePropertyAccessor(tooltipLabel);
  var generateBars = groupMode === 'grouped' ? generateGroupedBars : generateStackedBars;
  var result = generateBars({
    layout: layout,
    reverse: reverse,
    data: data,
    getIndex: getIndex,
    keys: keys,
    minValue: minValue,
    maxValue: maxValue,
    width: innerWidth,
    height: innerHeight,
    getColor: getColor,
    padding: padding,
    innerPadding: innerPadding,
    valueScale: valueScale,
    indexScale: indexScale,
    hiddenIds: hiddenIds,
    formatValue: formatValue,
    getTooltipLabel: getTooltipLabel
  });
  var legendData = react.useMemo(function () {
    return keys.map(function (key) {
      var bar = result.bars.find(function (bar) {
        return bar.data.id === key;
      });
      return _objectSpread2(_objectSpread2({}, bar), {}, {
        data: _objectSpread2(_objectSpread2({
          id: key
        }, bar === null || bar === void 0 ? void 0 : bar.data), {}, {
          hidden: hiddenIds.includes(key)
        })
      });
    });
  }, [hiddenIds, keys, result.bars]);
  var barsWithValue = react.useMemo(function () {
    return result.bars.filter(function (bar) {
      return bar.data.value !== null;
    });
  }, [result.bars]);
  var transition = web.useTransition(barsWithValue, {
    keys: function keys(bar) {
      return bar.key;
    },
    from: function from(bar) {
      return _objectSpread2({
        borderColor: getBorderColor(bar),
        color: bar.color,
        height: 0,
        labelColor: getLabelColor(bar),
        labelOpacity: 0,
        labelX: bar.width / 2,
        labelY: bar.height / 2,
        transform: "translate(".concat(bar.x, ", ").concat(bar.y + bar.height, ")"),
        width: bar.width
      }, layout === 'vertical' ? {} : {
        height: bar.height,
        transform: "translate(".concat(bar.x, ", ").concat(bar.y, ")"),
        width: 0
      });
    },
    enter: function enter(bar) {
      return {
        borderColor: getBorderColor(bar),
        color: bar.color,
        height: bar.height,
        labelColor: getLabelColor(bar),
        labelOpacity: 1,
        labelX: bar.width / 2,
        labelY: bar.height / 2,
        transform: "translate(".concat(bar.x, ", ").concat(bar.y, ")"),
        width: bar.width
      };
    },
    update: function update(bar) {
      return {
        borderColor: getBorderColor(bar),
        color: bar.color,
        height: bar.height,
        labelColor: getLabelColor(bar),
        labelOpacity: 1,
        labelX: bar.width / 2,
        labelY: bar.height / 2,
        transform: "translate(".concat(bar.x, ", ").concat(bar.y, ")"),
        width: bar.width
      };
    },
    leave: function leave(bar) {
      return _objectSpread2({
        borderColor: getBorderColor(bar),
        color: bar.color,
        height: 0,
        labelColor: getLabelColor(bar),
        labelOpacity: 0,
        labelX: bar.width / 2,
        labelY: 0,
        transform: "translate(".concat(bar.x, ", ").concat(bar.y + bar.height, ")"),
        width: bar.width
      }, layout === 'vertical' ? {} : {
        labelX: 0,
        labelY: bar.height / 2,
        height: bar.height,
        transform: "translate(".concat(bar.x, ", ").concat(bar.y, ")"),
        width: 0
      });
    },
    config: springConfig,
    immediate: !animate
  });
  var shouldRenderLabel = react.useCallback(function (_ref2) {
    var width = _ref2.width,
        height = _ref2.height;
    if (!enableLabel) return false;
    if (labelSkipWidth > 0 && width < labelSkipWidth) return false;
    if (labelSkipHeight > 0 && height < labelSkipHeight) return false;
    return true;
  }, [enableLabel, labelSkipHeight, labelSkipWidth]);
  var commonProps = react.useMemo(function () {
    return {
      borderRadius: borderRadius,
      borderWidth: borderWidth,
      enableLabel: enableLabel,
      isInteractive: isInteractive,
      labelSkipWidth: labelSkipWidth,
      labelSkipHeight: labelSkipHeight,
      onClick: onClick,
      onMouseEnter: onMouseEnter,
      onMouseLeave: onMouseLeave,
      getTooltipLabel: getTooltipLabel,
      tooltip: tooltip
    };
  }, [borderRadius, borderWidth, enableLabel, getTooltipLabel, isInteractive, labelSkipHeight, labelSkipWidth, onClick, onMouseEnter, onMouseLeave, tooltip]);
  var boundDefs = core.bindDefs(defs, result.bars, fill, {
    dataKey: 'data',
    targetKey: 'data.fill'
  });
  var layerById = {
    annotations: null,
    axes: null,
    bars: null,
    grid: null,
    legends: null,
    markers: null
  };

  if (layers.includes('annotations')) {
    layerById.annotations = jsxRuntime.jsx(BarAnnotations, {
      bars: result.bars,
      annotations: annotations
    }, "annotations");
  }

  if (layers.includes('axes')) {
    layerById.axes = jsxRuntime.jsx(axes.Axes, {
      xScale: result.xScale,
      yScale: result.yScale,
      width: innerWidth,
      height: innerHeight,
      top: axisTop,
      right: axisRight,
      bottom: axisBottom,
      left: axisLeft
    }, "axes");
  }

  if (layers.includes('bars')) {
    layerById.bars = jsxRuntime.jsx(react.Fragment, {
      children: transition(function (style, bar) {
        return react.createElement(barComponent, _objectSpread2(_objectSpread2({}, commonProps), {}, {
          bar: bar,
          style: style,
          shouldRenderLabel: shouldRenderLabel(bar),
          label: getLabel(bar.data)
        }));
      })
    }, "bars");
  }

  if (layers.includes('grid')) {
    layerById.grid = jsxRuntime.jsx(axes.Grid, {
      width: innerWidth,
      height: innerHeight,
      xScale: enableGridX ? result.xScale : null,
      yScale: enableGridY ? result.yScale : null,
      xValues: gridXValues,
      yValues: gridYValues
    }, "grid");
  }

  if (layers.includes('legends')) {
    var _ref3;

    var _data = (_ref3 = []).concat.apply(_ref3, _toConsumableArray(legends.map(function (legend) {
      return getLegendData({
        bars: legend.dataFrom === 'keys' ? legendData : result.bars,
        direction: legend.direction,
        from: legend.dataFrom,
        groupMode: groupMode,
        layout: layout,
        legendLabel: legendLabel,
        reverse: reverse
      });
    })));

    layerById.legends = jsxRuntime.jsx(BarLegends, {
      width: innerWidth,
      height: innerHeight,
      data: _data,
      legends: legends,
      toggleSerie: toggleSerie
    }, "legends");
  }

  if (layers.includes('markers')) {
    layerById.markers = jsxRuntime.jsx(core.CartesianMarkers, {
      markers: markers,
      width: innerWidth,
      height: innerHeight,
      xScale: result.xScale,
      yScale: result.yScale,
      theme: theme
    }, "markers");
  }

  var layerContext = react.useMemo(function () {
    return _objectSpread2(_objectSpread2({}, commonProps), {}, {
      margin: margin,
      innerWidth: innerWidth,
      innerHeight: innerHeight,
      width: width,
      height: height
    }, result);
  }, [commonProps, height, innerHeight, innerWidth, margin, result, width]);
  return jsxRuntime.jsx(core.SvgWrapper, {
    width: outerWidth,
    height: outerHeight,
    margin: margin,
    defs: boundDefs,
    role: role,
    children: layers.map(function (layer, i) {
      var _layerById$layer;

      if (typeof layer === 'function') {
        return jsxRuntime.jsx(react.Fragment, {
          children: react.createElement(layer, layerContext)
        }, i);
      }

      return (_layerById$layer = layerById === null || layerById === void 0 ? void 0 : layerById[layer]) !== null && _layerById$layer !== void 0 ? _layerById$layer : null;
    })
  });
};

var Bar = function Bar(_ref4) {
  var _ref4$isInteractive = _ref4.isInteractive,
      isInteractive = _ref4$isInteractive === void 0 ? svgDefaultProps.isInteractive : _ref4$isInteractive,
      _ref4$animate = _ref4.animate,
      animate = _ref4$animate === void 0 ? svgDefaultProps.animate : _ref4$animate,
      _ref4$motionConfig = _ref4.motionConfig,
      motionConfig = _ref4$motionConfig === void 0 ? svgDefaultProps.motionConfig : _ref4$motionConfig,
      theme = _ref4.theme,
      renderWrapper = _ref4.renderWrapper,
      otherProps = _objectWithoutProperties(_ref4, ["isInteractive", "animate", "motionConfig", "theme", "renderWrapper"]);

  return jsxRuntime.jsx(core.Container, {
    animate: animate,
    isInteractive: isInteractive,
    motionConfig: motionConfig,
    renderWrapper: renderWrapper,
    theme: theme,
    children: jsxRuntime.jsx(InnerBar, _objectSpread2({
      isInteractive: isInteractive
    }, otherProps))
  });
};

var findBarUnderCursor = function findBarUnderCursor(nodes, margin, x, y) {
  return nodes.find(function (node) {
    return core.isCursorInRect(node.x + margin.left, node.y + margin.top, node.width, node.height, x, y);
  });
};

var isNumber = function isNumber(value) {
  return typeof value === 'number';
};

var InnerBarCanvas = function InnerBarCanvas(_ref) {
  var data = _ref.data,
      _ref$indexBy = _ref.indexBy,
      indexBy = _ref$indexBy === void 0 ? canvasDefaultProps.indexBy : _ref$indexBy,
      _ref$keys = _ref.keys,
      keys = _ref$keys === void 0 ? canvasDefaultProps.keys : _ref$keys,
      partialMargin = _ref.margin,
      width = _ref.width,
      height = _ref.height,
      _ref$groupMode = _ref.groupMode,
      groupMode = _ref$groupMode === void 0 ? canvasDefaultProps.groupMode : _ref$groupMode,
      _ref$layout = _ref.layout,
      layout = _ref$layout === void 0 ? canvasDefaultProps.layout : _ref$layout,
      _ref$reverse = _ref.reverse,
      reverse = _ref$reverse === void 0 ? canvasDefaultProps.reverse : _ref$reverse,
      _ref$minValue = _ref.minValue,
      minValue = _ref$minValue === void 0 ? canvasDefaultProps.minValue : _ref$minValue,
      _ref$maxValue = _ref.maxValue,
      maxValue = _ref$maxValue === void 0 ? canvasDefaultProps.maxValue : _ref$maxValue,
      _ref$valueScale = _ref.valueScale,
      valueScale = _ref$valueScale === void 0 ? canvasDefaultProps.valueScale : _ref$valueScale,
      _ref$indexScale = _ref.indexScale,
      indexScale = _ref$indexScale === void 0 ? canvasDefaultProps.indexScale : _ref$indexScale,
      _ref$padding = _ref.padding,
      padding = _ref$padding === void 0 ? canvasDefaultProps.padding : _ref$padding,
      _ref$innerPadding = _ref.innerPadding,
      innerPadding = _ref$innerPadding === void 0 ? canvasDefaultProps.innerPadding : _ref$innerPadding,
      axisTop = _ref.axisTop,
      axisRight = _ref.axisRight,
      _ref$axisBottom = _ref.axisBottom,
      axisBottom = _ref$axisBottom === void 0 ? canvasDefaultProps.axisBottom : _ref$axisBottom,
      _ref$axisLeft = _ref.axisLeft,
      axisLeft = _ref$axisLeft === void 0 ? canvasDefaultProps.axisLeft : _ref$axisLeft,
      _ref$enableGridX = _ref.enableGridX,
      enableGridX = _ref$enableGridX === void 0 ? canvasDefaultProps.enableGridX : _ref$enableGridX,
      _ref$enableGridY = _ref.enableGridY,
      enableGridY = _ref$enableGridY === void 0 ? canvasDefaultProps.enableGridY : _ref$enableGridY,
      gridXValues = _ref.gridXValues,
      gridYValues = _ref.gridYValues,
      _ref$layers = _ref.layers,
      layers = _ref$layers === void 0 ? canvasDefaultProps.layers : _ref$layers,
      _ref$renderBar = _ref.renderBar,
      renderBar = _ref$renderBar === void 0 ? function (ctx, _ref2) {
    var _ref2$bar = _ref2.bar,
        color = _ref2$bar.color,
        height = _ref2$bar.height,
        width = _ref2$bar.width,
        x = _ref2$bar.x,
        y = _ref2$bar.y,
        borderColor = _ref2.borderColor,
        borderRadius = _ref2.borderRadius,
        borderWidth = _ref2.borderWidth,
        label = _ref2.label,
        labelColor = _ref2.labelColor,
        shouldRenderLabel = _ref2.shouldRenderLabel;
    ctx.fillStyle = color;

    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
    }

    ctx.beginPath();

    if (borderRadius > 0) {
      var radius = Math.min(borderRadius, height);
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    } else {
      ctx.rect(x, y, width, height);
    }

    ctx.fill();

    if (borderWidth > 0) {
      ctx.stroke();
    }

    if (shouldRenderLabel) {
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = labelColor;
      ctx.fillText(label, x + width / 2, y + height / 2);
    }
  } : _ref$renderBar,
      _ref$enableLabel = _ref.enableLabel,
      enableLabel = _ref$enableLabel === void 0 ? canvasDefaultProps.enableLabel : _ref$enableLabel,
      _ref$label = _ref.label,
      label = _ref$label === void 0 ? canvasDefaultProps.label : _ref$label,
      _ref$labelSkipWidth = _ref.labelSkipWidth,
      labelSkipWidth = _ref$labelSkipWidth === void 0 ? canvasDefaultProps.labelSkipWidth : _ref$labelSkipWidth,
      _ref$labelSkipHeight = _ref.labelSkipHeight,
      labelSkipHeight = _ref$labelSkipHeight === void 0 ? canvasDefaultProps.labelSkipHeight : _ref$labelSkipHeight,
      _ref$labelTextColor = _ref.labelTextColor,
      labelTextColor = _ref$labelTextColor === void 0 ? canvasDefaultProps.labelTextColor : _ref$labelTextColor,
      _ref$colorBy = _ref.colorBy,
      colorBy = _ref$colorBy === void 0 ? canvasDefaultProps.colorBy : _ref$colorBy,
      _ref$colors = _ref.colors,
      colors$1 = _ref$colors === void 0 ? canvasDefaultProps.colors : _ref$colors,
      _ref$borderRadius = _ref.borderRadius,
      borderRadius = _ref$borderRadius === void 0 ? canvasDefaultProps.borderRadius : _ref$borderRadius,
      _ref$borderWidth = _ref.borderWidth,
      borderWidth = _ref$borderWidth === void 0 ? canvasDefaultProps.borderWidth : _ref$borderWidth,
      _ref$borderColor = _ref.borderColor,
      borderColor = _ref$borderColor === void 0 ? canvasDefaultProps.borderColor : _ref$borderColor,
      _ref$annotations = _ref.annotations,
      annotations$1 = _ref$annotations === void 0 ? canvasDefaultProps.annotations : _ref$annotations,
      legendLabel = _ref.legendLabel,
      _ref$tooltipLabel = _ref.tooltipLabel,
      tooltipLabel = _ref$tooltipLabel === void 0 ? canvasDefaultProps.tooltipLabel : _ref$tooltipLabel,
      valueFormat = _ref.valueFormat,
      _ref$isInteractive = _ref.isInteractive,
      isInteractive = _ref$isInteractive === void 0 ? canvasDefaultProps.isInteractive : _ref$isInteractive,
      _ref$tooltip = _ref.tooltip,
      tooltip$1 = _ref$tooltip === void 0 ? canvasDefaultProps.tooltip : _ref$tooltip,
      onClick = _ref.onClick,
      onMouseEnter = _ref.onMouseEnter,
      onMouseLeave = _ref.onMouseLeave,
      _ref$legends = _ref.legends,
      legends$1 = _ref$legends === void 0 ? canvasDefaultProps.legends : _ref$legends,
      _ref$pixelRatio = _ref.pixelRatio,
      pixelRatio = _ref$pixelRatio === void 0 ? canvasDefaultProps.pixelRatio : _ref$pixelRatio,
      canvasRef = _ref.canvasRef;
  var canvasEl = react.useRef(null);
  var theme = core.useTheme();

  var _useDimensions = core.useDimensions(width, height, partialMargin),
      margin = _useDimensions.margin,
      innerWidth = _useDimensions.innerWidth,
      innerHeight = _useDimensions.innerHeight,
      outerWidth = _useDimensions.outerWidth,
      outerHeight = _useDimensions.outerHeight;

  var _useTooltip = tooltip.useTooltip(),
      showTooltipFromEvent = _useTooltip.showTooltipFromEvent,
      hideTooltip = _useTooltip.hideTooltip;

  var formatValue = core.useValueFormatter(valueFormat);
  var getBorderColor = colors.useInheritedColor(borderColor, theme);
  var getColor = colors.useOrdinalColorScale(colors$1, colorBy);
  var getIndex = core.usePropertyAccessor(indexBy);
  var getLabel = core.usePropertyAccessor(label);
  var getLabelColor = colors.useInheritedColor(labelTextColor, theme);
  var getTooltipLabel = core.usePropertyAccessor(tooltipLabel);
  var options = {
    layout: layout,
    reverse: reverse,
    data: data,
    getIndex: getIndex,
    keys: keys,
    minValue: minValue,
    maxValue: maxValue,
    width: innerWidth,
    height: innerHeight,
    getColor: getColor,
    padding: padding,
    innerPadding: innerPadding,
    valueScale: valueScale,
    indexScale: indexScale,
    formatValue: formatValue,
    getTooltipLabel: getTooltipLabel
  };
  var result = groupMode === 'grouped' ? generateGroupedBars(options) : generateStackedBars(options);
  var legendData = react.useMemo(function () {
    return keys.map(function (key) {
      var bar = result.bars.find(function (bar) {
        return bar.data.id === key;
      });
      return _objectSpread2(_objectSpread2({}, bar), {}, {
        data: _objectSpread2(_objectSpread2({
          id: key
        }, bar === null || bar === void 0 ? void 0 : bar.data), {}, {
          hidden: false
        })
      });
    });
  }, [keys, result.bars]);
  var barsWithValue = react.useMemo(function () {
    return result.bars.filter(function (bar) {
      return bar.data.value !== null;
    });
  }, [result.bars]);
  var shouldRenderLabel = react.useCallback(function (_ref3) {
    var width = _ref3.width,
        height = _ref3.height;
    if (!enableLabel) return false;
    if (labelSkipWidth > 0 && width < labelSkipWidth) return false;
    if (labelSkipHeight > 0 && height < labelSkipHeight) return false;
    return true;
  }, [enableLabel, labelSkipHeight, labelSkipWidth]);
  var boundAnnotations = annotations.useComputedAnnotations({
    annotations: annotations.useAnnotations({
      data: result.bars,
      annotations: annotations$1,
      getPosition: function getPosition(node) {
        return {
          x: node.x,
          y: node.y
        };
      },
      getDimensions: function getDimensions(_ref4) {
        var width = _ref4.width,
            height = _ref4.height;
        return {
          width: width,
          height: height,
          size: Math.max(width, height)
        };
      }
    })
  });
  var layerContext = react.useMemo(function () {
    return _objectSpread2({
      borderRadius: borderRadius,
      borderWidth: borderWidth,
      enableLabel: enableLabel,
      isInteractive: isInteractive,
      labelSkipWidth: labelSkipWidth,
      labelSkipHeight: labelSkipHeight,
      onClick: onClick,
      onMouseEnter: onMouseEnter,
      onMouseLeave: onMouseLeave,
      getTooltipLabel: getTooltipLabel,
      tooltip: tooltip$1,
      margin: margin,
      innerWidth: innerWidth,
      innerHeight: innerHeight,
      width: width,
      height: height
    }, result);
  }, [borderRadius, borderWidth, enableLabel, getTooltipLabel, height, innerHeight, innerWidth, isInteractive, labelSkipHeight, labelSkipWidth, margin, onClick, onMouseEnter, onMouseLeave, result, tooltip$1, width]);
  react.useEffect(function () {
    var _canvasEl$current;

    var ctx = (_canvasEl$current = canvasEl.current) === null || _canvasEl$current === void 0 ? void 0 : _canvasEl$current.getContext('2d');
    if (!canvasEl.current) return;
    if (!ctx) return;
    canvasEl.current.width = outerWidth * pixelRatio;
    canvasEl.current.height = outerHeight * pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, outerWidth, outerHeight);
    ctx.translate(margin.left, margin.top);
    layers.forEach(function (layer) {
      if (layer === 'grid') {
        if (isNumber(theme.grid.line.strokeWidth) && theme.grid.line.strokeWidth > 0) {
          ctx.lineWidth = theme.grid.line.strokeWidth;
          ctx.strokeStyle = theme.grid.line.stroke;

          if (enableGridX) {
            axes.renderGridLinesToCanvas(ctx, {
              width: width,
              height: height,
              scale: result.xScale,
              axis: 'x',
              values: gridXValues
            });
          }

          if (enableGridY) {
            axes.renderGridLinesToCanvas(ctx, {
              width: width,
              height: height,
              scale: result.yScale,
              axis: 'y',
              values: gridYValues
            });
          }
        }
      } else if (layer === 'axes') {
        axes.renderAxesToCanvas(ctx, {
          xScale: result.xScale,
          yScale: result.yScale,
          width: innerWidth,
          height: innerHeight,
          top: axisTop,
          right: axisRight,
          bottom: axisBottom,
          left: axisLeft,
          theme: theme
        });
      } else if (layer === 'bars') {
        barsWithValue.forEach(function (bar) {
          renderBar(ctx, {
            bar: bar,
            borderColor: getBorderColor(bar),
            borderRadius: borderRadius,
            borderWidth: borderWidth,
            label: getLabel(bar.data),
            labelColor: getLabelColor(bar),
            shouldRenderLabel: shouldRenderLabel(bar)
          });
        });
      } else if (layer === 'legends') {
        legends$1.forEach(function (legend) {
          var data = getLegendData({
            bars: legendData,
            direction: legend.direction,
            from: legend.dataFrom,
            groupMode: groupMode,
            layout: layout,
            legendLabel: legendLabel,
            reverse: reverse
          });
          legends.renderLegendToCanvas(ctx, _objectSpread2(_objectSpread2({}, legend), {}, {
            data: data,
            containerWidth: innerWidth,
            containerHeight: innerHeight,
            theme: theme
          }));
        });
      } else if (layer === 'annotations') {
        annotations.renderAnnotationsToCanvas(ctx, {
          annotations: boundAnnotations,
          theme: theme
        });
      } else if (typeof layer === 'function') {
        layer(ctx, layerContext);
      }
    });
    ctx.save();
  }, [axisBottom, axisLeft, axisRight, axisTop, barsWithValue, borderRadius, borderWidth, boundAnnotations, enableGridX, enableGridY, getBorderColor, getLabel, getLabelColor, gridXValues, gridYValues, groupMode, height, innerHeight, innerWidth, layerContext, layers, layout, legendData, legendLabel, legends$1, margin.left, margin.top, outerHeight, outerWidth, pixelRatio, renderBar, result.xScale, result.yScale, reverse, shouldRenderLabel, theme, width]);
  var handleMouseHover = react.useCallback(function (event) {
    if (!result.bars) return;
    if (!canvasEl.current) return;

    var _getRelativeCursor = core.getRelativeCursor(canvasEl.current, event),
        _getRelativeCursor2 = _slicedToArray(_getRelativeCursor, 2),
        x = _getRelativeCursor2[0],
        y = _getRelativeCursor2[1];

    var bar = findBarUnderCursor(result.bars, margin, x, y);

    if (bar !== undefined) {
      showTooltipFromEvent(react.createElement(tooltip$1, _objectSpread2(_objectSpread2({}, bar.data), {}, {
        color: bar.color,
        label: bar.label,
        value: Number(bar.data.value)
      })), event);

      if (event.type === 'mouseenter') {
        onMouseEnter === null || onMouseEnter === void 0 ? void 0 : onMouseEnter(bar.data, event);
      }
    } else {
      hideTooltip();
    }
  }, [hideTooltip, margin, onMouseEnter, result.bars, showTooltipFromEvent, tooltip$1]);
  var handleMouseLeave = react.useCallback(function (event) {
    if (!result.bars) return;
    if (!canvasEl.current) return;
    hideTooltip();

    var _getRelativeCursor3 = core.getRelativeCursor(canvasEl.current, event),
        _getRelativeCursor4 = _slicedToArray(_getRelativeCursor3, 2),
        x = _getRelativeCursor4[0],
        y = _getRelativeCursor4[1];

    var bar = findBarUnderCursor(result.bars, margin, x, y);

    if (bar) {
      onMouseLeave === null || onMouseLeave === void 0 ? void 0 : onMouseLeave(bar.data, event);
    }
  }, [hideTooltip, margin, onMouseLeave, result.bars]);
  var handleClick = react.useCallback(function (event) {
    if (!result.bars) return;
    if (!canvasEl.current) return;

    var _getRelativeCursor5 = core.getRelativeCursor(canvasEl.current, event),
        _getRelativeCursor6 = _slicedToArray(_getRelativeCursor5, 2),
        x = _getRelativeCursor6[0],
        y = _getRelativeCursor6[1];

    var bar = findBarUnderCursor(result.bars, margin, x, y);

    if (bar !== undefined) {
      onClick === null || onClick === void 0 ? void 0 : onClick(_objectSpread2(_objectSpread2({}, bar.data), {}, {
        color: bar.color
      }), event);
    }
  }, [margin, onClick, result.bars]);
  return jsxRuntime.jsx("canvas", {
    ref: function ref(canvas) {
      canvasEl.current = canvas;
      if (canvasRef && 'current' in canvasRef) canvasRef.current = canvas;
    },
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

var BarCanvas = react.forwardRef(function (_ref5, ref) {
  var isInteractive = _ref5.isInteractive,
      renderWrapper = _ref5.renderWrapper,
      theme = _ref5.theme,
      props = _objectWithoutProperties(_ref5, ["isInteractive", "renderWrapper", "theme"]);

  return jsxRuntime.jsx(core.Container, {
    isInteractive: isInteractive,
    renderWrapper: renderWrapper,
    theme: theme,
    animate: false,
    children: jsxRuntime.jsx(InnerBarCanvas, _objectSpread2(_objectSpread2({}, props), {}, {
      canvasRef: ref
    }))
  });
});

var ResponsiveBar = function ResponsiveBar(props) {
  return jsxRuntime.jsx(core.ResponsiveWrapper, {
    children: function children(_ref) {
      var width = _ref.width,
          height = _ref.height;
      return jsxRuntime.jsx(Bar, _objectSpread2({
        width: width,
        height: height
      }, props));
    }
  });
};

var ResponsiveBarCanvas = react.forwardRef(function ResponsiveBarCanvas(props, ref) {
  return jsxRuntime.jsx(core.ResponsiveWrapper, {
    children: function children(_ref) {
      var width = _ref.width,
          height = _ref.height;
      return jsxRuntime.jsx(BarCanvas, _objectSpread2(_objectSpread2({
        width: width,
        height: height
      }, props), {}, {
        ref: ref
      }));
    }
  });
});

exports.Bar = Bar;
exports.BarCanvas = BarCanvas;
exports.BarItem = BarItem;
exports.ResponsiveBar = ResponsiveBar;
exports.ResponsiveBarCanvas = ResponsiveBarCanvas;
exports.canvasDefaultProps = canvasDefaultProps;
exports.defaultProps = defaultProps;
exports.svgDefaultProps = svgDefaultProps;
//# sourceMappingURL=nivo-bar.cjs.js.map
