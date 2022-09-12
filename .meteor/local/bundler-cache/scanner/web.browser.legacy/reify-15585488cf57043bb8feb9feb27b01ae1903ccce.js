'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var react = require('react');
var core = require('@nivo/core');
var arcs = require('@nivo/arcs');
var legends = require('@nivo/legends');
var jsxRuntime = require('react/jsx-runtime');
var d3Shape = require('d3-shape');
var colors = require('@nivo/colors');
var tooltip = require('@nivo/tooltip');

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

var PieLegends = function PieLegends(_ref) {
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
        toggleSerie: legend.toggleSerie ? toggleSerie : undefined
      }), i);
    })
  });
};

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

var PieTooltip = function PieTooltip(_ref) {
  var datum = _ref.datum;
  return jsxRuntime.jsx(tooltip.BasicTooltip, {
    id: datum.id,
    value: datum.formattedValue,
    enableChip: true,
    color: datum.color
  });
};

var _window$devicePixelRa;
var defaultProps = {
  id: 'id',
  value: 'value',
  sortByValue: false,
  innerRadius: 0,
  padAngle: 0,
  cornerRadius: 0,
  layers: ['arcLinkLabels', 'arcs', 'arcLabels', 'legends'],
  startAngle: 0,
  endAngle: 360,
  fit: true,
  activeInnerRadiusOffset: 0,
  activeOuterRadiusOffset: 0,
  borderWidth: 0,
  borderColor: {
    from: 'color',
    modifiers: [['darker', 1]]
  },
  enableArcLabels: true,
  arcLabel: 'formattedValue',
  arcLabelsSkipAngle: 0,
  arcLabelsRadiusOffset: 0.5,
  arcLabelsTextColor: {
    theme: 'labels.text.fill'
  },
  enableArcLinkLabels: true,
  arcLinkLabel: 'id',
  arcLinkLabelsSkipAngle: 0,
  arcLinkLabelsOffset: 0,
  arcLinkLabelsDiagonalLength: 16,
  arcLinkLabelsStraightLength: 24,
  arcLinkLabelsThickness: 1,
  arcLinkLabelsTextOffset: 6,
  arcLinkLabelsTextColor: {
    theme: 'labels.text.fill'
  },
  arcLinkLabelsColor: {
    theme: 'axis.ticks.line.stroke'
  },
  colors: {
    scheme: 'nivo'
  },
  defs: [],
  fill: [],
  isInteractive: true,
  animate: true,
  motionConfig: 'gentle',
  transitionMode: 'innerRadius',
  tooltip: PieTooltip,
  legends: [],
  role: 'img',
  pixelRatio: typeof window !== 'undefined' ? (_window$devicePixelRa = window.devicePixelRatio) !== null && _window$devicePixelRa !== void 0 ? _window$devicePixelRa : 1 : 1
};

var useNormalizedData = function useNormalizedData(_ref) {
  var data = _ref.data,
      _ref$id = _ref.id,
      id = _ref$id === void 0 ? defaultProps.id : _ref$id,
      _ref$value = _ref.value,
      value = _ref$value === void 0 ? defaultProps.value : _ref$value,
      valueFormat = _ref.valueFormat,
      _ref$colors = _ref.colors,
      colors$1 = _ref$colors === void 0 ? defaultProps.colors : _ref$colors;
  var getId = core.usePropertyAccessor(id);
  var getValue = core.usePropertyAccessor(value);
  var formatValue = core.useValueFormatter(valueFormat);
  var getColor = colors.useOrdinalColorScale(colors$1, 'id');
  return react.useMemo(function () {
    return data.map(function (datum) {
      var _datum$label;

      var datumId = getId(datum);
      var datumValue = getValue(datum);
      var normalizedDatum = {
        id: datumId,
        label: (_datum$label = datum.label) !== null && _datum$label !== void 0 ? _datum$label : datumId,
        hidden: false,
        value: datumValue,
        formattedValue: formatValue(datumValue),
        data: datum
      };
      return _objectSpread2(_objectSpread2({}, normalizedDatum), {}, {
        color: getColor(normalizedDatum)
      });
    });
  }, [data, getId, getValue, formatValue, getColor]);
};
var usePieArcs = function usePieArcs(_ref2) {
  var data = _ref2.data,
      startAngle = _ref2.startAngle,
      endAngle = _ref2.endAngle,
      innerRadius = _ref2.innerRadius,
      outerRadius = _ref2.outerRadius,
      padAngle = _ref2.padAngle,
      sortByValue = _ref2.sortByValue,
      activeId = _ref2.activeId,
      activeInnerRadiusOffset = _ref2.activeInnerRadiusOffset,
      activeOuterRadiusOffset = _ref2.activeOuterRadiusOffset,
      hiddenIds = _ref2.hiddenIds;
  var pie = react.useMemo(function () {
    var innerPie = d3Shape.pie().value(function (d) {
      return d.value;
    }).startAngle(core.degreesToRadians(startAngle)).endAngle(core.degreesToRadians(endAngle)).padAngle(core.degreesToRadians(padAngle));

    if (!sortByValue) {
      innerPie.sortValues(null);
    }

    return innerPie;
  }, [startAngle, endAngle, padAngle, sortByValue]);
  return react.useMemo(function () {
    var hiddenData = data.filter(function (item) {
      return !hiddenIds.includes(item.id);
    });
    var dataWithArc = pie(hiddenData).map(function (arc) {
      var angle = Math.abs(arc.endAngle - arc.startAngle);
      return _objectSpread2(_objectSpread2({}, arc.data), {}, {
        arc: {
          index: arc.index,
          startAngle: arc.startAngle,
          endAngle: arc.endAngle,
          innerRadius: activeId === arc.data.id ? innerRadius - activeInnerRadiusOffset : innerRadius,
          outerRadius: activeId === arc.data.id ? outerRadius + activeOuterRadiusOffset : outerRadius,
          thickness: outerRadius - innerRadius,
          padAngle: arc.padAngle,
          angle: angle,
          angleDeg: core.radiansToDegrees(angle)
        }
      });
    });
    var legendData = data.map(function (item) {
      return _objectSpread2(_objectSpread2({}, item), {}, {
        hidden: hiddenIds.includes(item.id)
      });
    });
    return {
      dataWithArc: dataWithArc,
      legendData: legendData
    };
  }, [pie, data, hiddenIds, activeId, innerRadius, activeInnerRadiusOffset, outerRadius, activeOuterRadiusOffset]);
};
var usePie = function usePie(_ref3) {
  var data = _ref3.data,
      radius = _ref3.radius,
      innerRadius = _ref3.innerRadius,
      _ref3$startAngle = _ref3.startAngle,
      startAngle = _ref3$startAngle === void 0 ? defaultProps.startAngle : _ref3$startAngle,
      _ref3$endAngle = _ref3.endAngle,
      endAngle = _ref3$endAngle === void 0 ? defaultProps.endAngle : _ref3$endAngle,
      _ref3$padAngle = _ref3.padAngle,
      padAngle = _ref3$padAngle === void 0 ? defaultProps.padAngle : _ref3$padAngle,
      _ref3$sortByValue = _ref3.sortByValue,
      sortByValue = _ref3$sortByValue === void 0 ? defaultProps.sortByValue : _ref3$sortByValue,
      _ref3$cornerRadius = _ref3.cornerRadius,
      cornerRadius = _ref3$cornerRadius === void 0 ? defaultProps.cornerRadius : _ref3$cornerRadius,
      _ref3$activeInnerRadi = _ref3.activeInnerRadiusOffset,
      activeInnerRadiusOffset = _ref3$activeInnerRadi === void 0 ? defaultProps.activeInnerRadiusOffset : _ref3$activeInnerRadi,
      _ref3$activeOuterRadi = _ref3.activeOuterRadiusOffset,
      activeOuterRadiusOffset = _ref3$activeOuterRadi === void 0 ? defaultProps.activeOuterRadiusOffset : _ref3$activeOuterRadi;

  var _useState = react.useState(null),
      _useState2 = _slicedToArray(_useState, 2),
      activeId = _useState2[0],
      setActiveId = _useState2[1];

  var _useState3 = react.useState([]),
      _useState4 = _slicedToArray(_useState3, 2),
      hiddenIds = _useState4[0],
      setHiddenIds = _useState4[1];

  var pieArcs = usePieArcs({
    data: data,
    startAngle: startAngle,
    endAngle: endAngle,
    innerRadius: innerRadius,
    outerRadius: radius,
    padAngle: padAngle,
    sortByValue: sortByValue,
    activeId: activeId,
    activeInnerRadiusOffset: activeInnerRadiusOffset,
    activeOuterRadiusOffset: activeOuterRadiusOffset,
    hiddenIds: hiddenIds
  });
  var toggleSerie = react.useCallback(function (id) {
    setHiddenIds(function (state) {
      return state.indexOf(id) > -1 ? state.filter(function (item) {
        return item !== id;
      }) : [].concat(_toConsumableArray(state), [id]);
    });
  }, []);
  var arcGenerator = arcs.useArcGenerator({
    cornerRadius: cornerRadius,
    padAngle: core.degreesToRadians(padAngle)
  });
  return _objectSpread2(_objectSpread2({}, pieArcs), {}, {
    arcGenerator: arcGenerator,
    setActiveId: setActiveId,
    toggleSerie: toggleSerie
  });
};
var usePieFromBox = function usePieFromBox(_ref4) {
  var data = _ref4.data,
      width = _ref4.width,
      height = _ref4.height,
      _ref4$innerRadius = _ref4.innerRadius,
      innerRadiusRatio = _ref4$innerRadius === void 0 ? defaultProps.innerRadius : _ref4$innerRadius,
      _ref4$startAngle = _ref4.startAngle,
      startAngle = _ref4$startAngle === void 0 ? defaultProps.startAngle : _ref4$startAngle,
      _ref4$endAngle = _ref4.endAngle,
      endAngle = _ref4$endAngle === void 0 ? defaultProps.endAngle : _ref4$endAngle,
      _ref4$padAngle = _ref4.padAngle,
      padAngle = _ref4$padAngle === void 0 ? defaultProps.padAngle : _ref4$padAngle,
      _ref4$sortByValue = _ref4.sortByValue,
      sortByValue = _ref4$sortByValue === void 0 ? defaultProps.sortByValue : _ref4$sortByValue,
      _ref4$cornerRadius = _ref4.cornerRadius,
      cornerRadius = _ref4$cornerRadius === void 0 ? defaultProps.cornerRadius : _ref4$cornerRadius,
      _ref4$fit = _ref4.fit,
      fit = _ref4$fit === void 0 ? defaultProps.fit : _ref4$fit,
      _ref4$activeInnerRadi = _ref4.activeInnerRadiusOffset,
      activeInnerRadiusOffset = _ref4$activeInnerRadi === void 0 ? defaultProps.activeInnerRadiusOffset : _ref4$activeInnerRadi,
      _ref4$activeOuterRadi = _ref4.activeOuterRadiusOffset,
      activeOuterRadiusOffset = _ref4$activeOuterRadi === void 0 ? defaultProps.activeOuterRadiusOffset : _ref4$activeOuterRadi;

  var _useState5 = react.useState(null),
      _useState6 = _slicedToArray(_useState5, 2),
      activeId = _useState6[0],
      setActiveId = _useState6[1];

  var _useState7 = react.useState([]),
      _useState8 = _slicedToArray(_useState7, 2),
      hiddenIds = _useState8[0],
      setHiddenIds = _useState8[1];

  var computedProps = react.useMemo(function () {
    var radius = Math.min(width, height) / 2;
    var innerRadius = radius * Math.min(innerRadiusRatio, 1);
    var centerX = width / 2;
    var centerY = height / 2;
    var boundingBox;

    if (fit) {
      var _computeArcBoundingBo = arcs.computeArcBoundingBox(centerX, centerY, radius, startAngle - 90, endAngle - 90),
          points = _computeArcBoundingBo.points,
          box = _objectWithoutProperties(_computeArcBoundingBo, ["points"]);

      var ratio = Math.min(width / box.width, height / box.height);
      var adjustedBox = {
        width: box.width * ratio,
        height: box.height * ratio
      };
      adjustedBox.x = (width - adjustedBox.width) / 2;
      adjustedBox.y = (height - adjustedBox.height) / 2;
      centerX = (centerX - box.x) / box.width * box.width * ratio + adjustedBox.x;
      centerY = (centerY - box.y) / box.height * box.height * ratio + adjustedBox.y;
      boundingBox = {
        box: box,
        ratio: ratio,
        points: points
      };
      radius = radius * ratio;
      innerRadius = innerRadius * ratio;
    }

    return {
      centerX: centerX,
      centerY: centerY,
      radius: radius,
      innerRadius: innerRadius,
      debug: boundingBox
    };
  }, [width, height, innerRadiusRatio, startAngle, endAngle, fit, cornerRadius]);
  var pieArcs = usePieArcs({
    data: data,
    startAngle: startAngle,
    endAngle: endAngle,
    innerRadius: computedProps.innerRadius,
    outerRadius: computedProps.radius,
    padAngle: padAngle,
    sortByValue: sortByValue,
    activeId: activeId,
    activeInnerRadiusOffset: activeInnerRadiusOffset,
    activeOuterRadiusOffset: activeOuterRadiusOffset,
    hiddenIds: hiddenIds
  });
  var toggleSerie = react.useCallback(function (id) {
    setHiddenIds(function (state) {
      return state.indexOf(id) > -1 ? state.filter(function (item) {
        return item !== id;
      }) : [].concat(_toConsumableArray(state), [id]);
    });
  }, []);
  var arcGenerator = arcs.useArcGenerator({
    cornerRadius: cornerRadius,
    padAngle: core.degreesToRadians(padAngle)
  });
  return _objectSpread2(_objectSpread2({
    arcGenerator: arcGenerator,
    setActiveId: setActiveId,
    toggleSerie: toggleSerie
  }, pieArcs), computedProps);
};
var usePieLayerContext = function usePieLayerContext(_ref5) {
  var dataWithArc = _ref5.dataWithArc,
      arcGenerator = _ref5.arcGenerator,
      centerX = _ref5.centerX,
      centerY = _ref5.centerY,
      radius = _ref5.radius,
      innerRadius = _ref5.innerRadius;
  return react.useMemo(function () {
    return {
      dataWithArc: dataWithArc,
      arcGenerator: arcGenerator,
      centerX: centerX,
      centerY: centerY,
      radius: radius,
      innerRadius: innerRadius
    };
  }, [dataWithArc, arcGenerator, centerX, centerY, radius, innerRadius]);
};

var Arcs = function Arcs(_ref) {
  var center = _ref.center,
      data = _ref.data,
      arcGenerator = _ref.arcGenerator,
      borderWidth = _ref.borderWidth,
      borderColor = _ref.borderColor,
      isInteractive = _ref.isInteractive,
      onClick = _ref.onClick,
      onMouseEnter = _ref.onMouseEnter,
      onMouseMove = _ref.onMouseMove,
      onMouseLeave = _ref.onMouseLeave,
      setActiveId = _ref.setActiveId,
      tooltip$1 = _ref.tooltip,
      transitionMode = _ref.transitionMode;

  var _useTooltip = tooltip.useTooltip(),
      showTooltipFromEvent = _useTooltip.showTooltipFromEvent,
      hideTooltip = _useTooltip.hideTooltip;

  var handleClick = react.useMemo(function () {
    if (!isInteractive) return undefined;
    return function (datum, event) {
      onClick === null || onClick === void 0 ? void 0 : onClick(datum, event);
    };
  }, [isInteractive, onClick]);
  var handleMouseEnter = react.useMemo(function () {
    if (!isInteractive) return undefined;
    return function (datum, event) {
      showTooltipFromEvent(react.createElement(tooltip$1, {
        datum: datum
      }), event);
      setActiveId(datum.id);
      onMouseEnter === null || onMouseEnter === void 0 ? void 0 : onMouseEnter(datum, event);
    };
  }, [isInteractive, showTooltipFromEvent, setActiveId, onMouseEnter]);
  var handleMouseMove = react.useMemo(function () {
    if (!isInteractive) return undefined;
    return function (datum, event) {
      showTooltipFromEvent(react.createElement(tooltip$1, {
        datum: datum
      }), event);
      onMouseMove === null || onMouseMove === void 0 ? void 0 : onMouseMove(datum, event);
    };
  }, [isInteractive, showTooltipFromEvent, onMouseMove]);
  var handleMouseLeave = react.useMemo(function () {
    if (!isInteractive) return undefined;
    return function (datum, event) {
      hideTooltip();
      setActiveId(null);
      onMouseLeave === null || onMouseLeave === void 0 ? void 0 : onMouseLeave(datum, event);
    };
  }, [isInteractive, hideTooltip, setActiveId, onMouseLeave]);
  return jsxRuntime.jsx(arcs.ArcsLayer, {
    center: center,
    data: data,
    arcGenerator: arcGenerator,
    borderWidth: borderWidth,
    borderColor: borderColor,
    transitionMode: transitionMode,
    onClick: handleClick,
    onMouseEnter: handleMouseEnter,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave
  });
};

var InnerPie = function InnerPie(_ref) {
  var data = _ref.data,
      _ref$id = _ref.id,
      id = _ref$id === void 0 ? defaultProps.id : _ref$id,
      _ref$value = _ref.value,
      value = _ref$value === void 0 ? defaultProps.value : _ref$value,
      valueFormat = _ref.valueFormat,
      _ref$sortByValue = _ref.sortByValue,
      sortByValue = _ref$sortByValue === void 0 ? defaultProps.sortByValue : _ref$sortByValue,
      _ref$layers = _ref.layers,
      layers = _ref$layers === void 0 ? defaultProps.layers : _ref$layers,
      _ref$startAngle = _ref.startAngle,
      startAngle = _ref$startAngle === void 0 ? defaultProps.startAngle : _ref$startAngle,
      _ref$endAngle = _ref.endAngle,
      endAngle = _ref$endAngle === void 0 ? defaultProps.endAngle : _ref$endAngle,
      _ref$padAngle = _ref.padAngle,
      padAngle = _ref$padAngle === void 0 ? defaultProps.padAngle : _ref$padAngle,
      _ref$fit = _ref.fit,
      fit = _ref$fit === void 0 ? defaultProps.fit : _ref$fit,
      _ref$innerRadius = _ref.innerRadius,
      innerRadiusRatio = _ref$innerRadius === void 0 ? defaultProps.innerRadius : _ref$innerRadius,
      _ref$cornerRadius = _ref.cornerRadius,
      cornerRadius = _ref$cornerRadius === void 0 ? defaultProps.cornerRadius : _ref$cornerRadius,
      _ref$activeInnerRadiu = _ref.activeInnerRadiusOffset,
      activeInnerRadiusOffset = _ref$activeInnerRadiu === void 0 ? defaultProps.activeInnerRadiusOffset : _ref$activeInnerRadiu,
      _ref$activeOuterRadiu = _ref.activeOuterRadiusOffset,
      activeOuterRadiusOffset = _ref$activeOuterRadiu === void 0 ? defaultProps.activeOuterRadiusOffset : _ref$activeOuterRadiu,
      width = _ref.width,
      height = _ref.height,
      partialMargin = _ref.margin,
      _ref$colors = _ref.colors,
      colors = _ref$colors === void 0 ? defaultProps.colors : _ref$colors,
      _ref$borderWidth = _ref.borderWidth,
      borderWidth = _ref$borderWidth === void 0 ? defaultProps.borderWidth : _ref$borderWidth,
      _ref$borderColor = _ref.borderColor,
      borderColor = _ref$borderColor === void 0 ? defaultProps.borderColor : _ref$borderColor,
      _ref$enableArcLabels = _ref.enableArcLabels,
      enableArcLabels = _ref$enableArcLabels === void 0 ? defaultProps.enableArcLabels : _ref$enableArcLabels,
      _ref$arcLabel = _ref.arcLabel,
      arcLabel = _ref$arcLabel === void 0 ? defaultProps.arcLabel : _ref$arcLabel,
      _ref$arcLabelsSkipAng = _ref.arcLabelsSkipAngle,
      arcLabelsSkipAngle = _ref$arcLabelsSkipAng === void 0 ? defaultProps.arcLabelsSkipAngle : _ref$arcLabelsSkipAng,
      _ref$arcLabelsTextCol = _ref.arcLabelsTextColor,
      arcLabelsTextColor = _ref$arcLabelsTextCol === void 0 ? defaultProps.arcLabelsTextColor : _ref$arcLabelsTextCol,
      _ref$arcLabelsRadiusO = _ref.arcLabelsRadiusOffset,
      arcLabelsRadiusOffset = _ref$arcLabelsRadiusO === void 0 ? defaultProps.arcLabelsRadiusOffset : _ref$arcLabelsRadiusO,
      arcLabelsComponent = _ref.arcLabelsComponent,
      _ref$enableArcLinkLab = _ref.enableArcLinkLabels,
      enableArcLinkLabels = _ref$enableArcLinkLab === void 0 ? defaultProps.enableArcLinkLabels : _ref$enableArcLinkLab,
      _ref$arcLinkLabel = _ref.arcLinkLabel,
      arcLinkLabel = _ref$arcLinkLabel === void 0 ? defaultProps.arcLinkLabel : _ref$arcLinkLabel,
      _ref$arcLinkLabelsSki = _ref.arcLinkLabelsSkipAngle,
      arcLinkLabelsSkipAngle = _ref$arcLinkLabelsSki === void 0 ? defaultProps.arcLinkLabelsSkipAngle : _ref$arcLinkLabelsSki,
      _ref$arcLinkLabelsOff = _ref.arcLinkLabelsOffset,
      arcLinkLabelsOffset = _ref$arcLinkLabelsOff === void 0 ? defaultProps.arcLinkLabelsOffset : _ref$arcLinkLabelsOff,
      _ref$arcLinkLabelsDia = _ref.arcLinkLabelsDiagonalLength,
      arcLinkLabelsDiagonalLength = _ref$arcLinkLabelsDia === void 0 ? defaultProps.arcLinkLabelsDiagonalLength : _ref$arcLinkLabelsDia,
      _ref$arcLinkLabelsStr = _ref.arcLinkLabelsStraightLength,
      arcLinkLabelsStraightLength = _ref$arcLinkLabelsStr === void 0 ? defaultProps.arcLinkLabelsStraightLength : _ref$arcLinkLabelsStr,
      _ref$arcLinkLabelsThi = _ref.arcLinkLabelsThickness,
      arcLinkLabelsThickness = _ref$arcLinkLabelsThi === void 0 ? defaultProps.arcLinkLabelsThickness : _ref$arcLinkLabelsThi,
      _ref$arcLinkLabelsTex = _ref.arcLinkLabelsTextOffset,
      arcLinkLabelsTextOffset = _ref$arcLinkLabelsTex === void 0 ? defaultProps.arcLinkLabelsTextOffset : _ref$arcLinkLabelsTex,
      _ref$arcLinkLabelsTex2 = _ref.arcLinkLabelsTextColor,
      arcLinkLabelsTextColor = _ref$arcLinkLabelsTex2 === void 0 ? defaultProps.arcLinkLabelsTextColor : _ref$arcLinkLabelsTex2,
      _ref$arcLinkLabelsCol = _ref.arcLinkLabelsColor,
      arcLinkLabelsColor = _ref$arcLinkLabelsCol === void 0 ? defaultProps.arcLinkLabelsColor : _ref$arcLinkLabelsCol,
      arcLinkLabelComponent = _ref.arcLinkLabelComponent,
      _ref$defs = _ref.defs,
      defs = _ref$defs === void 0 ? defaultProps.defs : _ref$defs,
      _ref$fill = _ref.fill,
      fill = _ref$fill === void 0 ? defaultProps.fill : _ref$fill,
      _ref$isInteractive = _ref.isInteractive,
      isInteractive = _ref$isInteractive === void 0 ? defaultProps.isInteractive : _ref$isInteractive,
      onClick = _ref.onClick,
      onMouseEnter = _ref.onMouseEnter,
      onMouseMove = _ref.onMouseMove,
      onMouseLeave = _ref.onMouseLeave,
      _ref$tooltip = _ref.tooltip,
      tooltip = _ref$tooltip === void 0 ? defaultProps.tooltip : _ref$tooltip,
      _ref$transitionMode = _ref.transitionMode,
      transitionMode = _ref$transitionMode === void 0 ? defaultProps.transitionMode : _ref$transitionMode,
      _ref$legends = _ref.legends,
      legends = _ref$legends === void 0 ? defaultProps.legends : _ref$legends,
      _ref$role = _ref.role,
      role = _ref$role === void 0 ? defaultProps.role : _ref$role;

  var _useDimensions = core.useDimensions(width, height, partialMargin),
      outerWidth = _useDimensions.outerWidth,
      outerHeight = _useDimensions.outerHeight,
      margin = _useDimensions.margin,
      innerWidth = _useDimensions.innerWidth,
      innerHeight = _useDimensions.innerHeight;

  var normalizedData = useNormalizedData({
    data: data,
    id: id,
    value: value,
    valueFormat: valueFormat,
    colors: colors
  });

  var _usePieFromBox = usePieFromBox({
    data: normalizedData,
    width: innerWidth,
    height: innerHeight,
    fit: fit,
    innerRadius: innerRadiusRatio,
    startAngle: startAngle,
    endAngle: endAngle,
    padAngle: padAngle,
    sortByValue: sortByValue,
    cornerRadius: cornerRadius,
    activeInnerRadiusOffset: activeInnerRadiusOffset,
    activeOuterRadiusOffset: activeOuterRadiusOffset
  }),
      dataWithArc = _usePieFromBox.dataWithArc,
      legendData = _usePieFromBox.legendData,
      arcGenerator = _usePieFromBox.arcGenerator,
      centerX = _usePieFromBox.centerX,
      centerY = _usePieFromBox.centerY,
      radius = _usePieFromBox.radius,
      innerRadius = _usePieFromBox.innerRadius,
      setActiveId = _usePieFromBox.setActiveId,
      toggleSerie = _usePieFromBox.toggleSerie;

  var boundDefs = core.bindDefs(defs, dataWithArc, fill);
  var layerById = {
    arcLinkLabels: null,
    arcs: null,
    arcLabels: null,
    legends: null
  };

  if (enableArcLinkLabels && layers.includes('arcLinkLabels')) {
    layerById.arcLinkLabels = jsxRuntime.jsx(arcs.ArcLinkLabelsLayer, {
      center: [centerX, centerY],
      data: dataWithArc,
      label: arcLinkLabel,
      skipAngle: arcLinkLabelsSkipAngle,
      offset: arcLinkLabelsOffset,
      diagonalLength: arcLinkLabelsDiagonalLength,
      straightLength: arcLinkLabelsStraightLength,
      strokeWidth: arcLinkLabelsThickness,
      textOffset: arcLinkLabelsTextOffset,
      textColor: arcLinkLabelsTextColor,
      linkColor: arcLinkLabelsColor,
      component: arcLinkLabelComponent
    }, "arcLinkLabels");
  }

  if (layers.includes('arcs')) {
    layerById.arcs = jsxRuntime.jsx(Arcs, {
      center: [centerX, centerY],
      data: dataWithArc,
      arcGenerator: arcGenerator,
      borderWidth: borderWidth,
      borderColor: borderColor,
      isInteractive: isInteractive,
      onClick: onClick,
      onMouseEnter: onMouseEnter,
      onMouseMove: onMouseMove,
      onMouseLeave: onMouseLeave,
      setActiveId: setActiveId,
      tooltip: tooltip,
      transitionMode: transitionMode
    }, "arcs");
  }

  if (enableArcLabels && layers.includes('arcLabels')) {
    layerById.arcLabels = jsxRuntime.jsx(arcs.ArcLabelsLayer, {
      center: [centerX, centerY],
      data: dataWithArc,
      label: arcLabel,
      radiusOffset: arcLabelsRadiusOffset,
      skipAngle: arcLabelsSkipAngle,
      textColor: arcLabelsTextColor,
      transitionMode: transitionMode,
      component: arcLabelsComponent
    }, "arcLabels");
  }

  if (legends.length > 0 && layers.includes('legends')) {
    layerById.legends = jsxRuntime.jsx(PieLegends, {
      width: innerWidth,
      height: innerHeight,
      data: legendData,
      legends: legends,
      toggleSerie: toggleSerie
    }, "legends");
  }

  var layerContext = usePieLayerContext({
    dataWithArc: dataWithArc,
    arcGenerator: arcGenerator,
    centerX: centerX,
    centerY: centerY,
    radius: radius,
    innerRadius: innerRadius
  });
  return jsxRuntime.jsx(core.SvgWrapper, {
    width: outerWidth,
    height: outerHeight,
    margin: margin,
    defs: boundDefs,
    role: role,
    children: layers.map(function (layer, i) {
      if (layerById[layer] !== undefined) {
        return layerById[layer];
      }

      if (typeof layer === 'function') {
        return jsxRuntime.jsx(react.Fragment, {
          children: react.createElement(layer, layerContext)
        }, i);
      }

      return null;
    })
  });
};

var Pie = function Pie(_ref2) {
  var _ref2$isInteractive = _ref2.isInteractive,
      isInteractive = _ref2$isInteractive === void 0 ? defaultProps.isInteractive : _ref2$isInteractive,
      _ref2$animate = _ref2.animate,
      animate = _ref2$animate === void 0 ? defaultProps.animate : _ref2$animate,
      _ref2$motionConfig = _ref2.motionConfig,
      motionConfig = _ref2$motionConfig === void 0 ? defaultProps.motionConfig : _ref2$motionConfig,
      theme = _ref2.theme,
      renderWrapper = _ref2.renderWrapper,
      otherProps = _objectWithoutProperties(_ref2, ["isInteractive", "animate", "motionConfig", "theme", "renderWrapper"]);

  return jsxRuntime.jsx(core.Container, {
    animate: animate,
    isInteractive: isInteractive,
    motionConfig: motionConfig,
    renderWrapper: renderWrapper,
    theme: theme,
    children: jsxRuntime.jsx(InnerPie, _objectSpread2({
      isInteractive: isInteractive
    }, otherProps))
  });
};

var ResponsivePie = function ResponsivePie(props) {
  return jsxRuntime.jsx(core.ResponsiveWrapper, {
    children: function children(_ref) {
      var width = _ref.width,
          height = _ref.height;
      return jsxRuntime.jsx(Pie, _objectSpread2({
        width: width,
        height: height
      }, props));
    }
  });
};

var InnerPieCanvas = function InnerPieCanvas(_ref) {
  var data = _ref.data,
      _ref$id = _ref.id,
      id = _ref$id === void 0 ? defaultProps.id : _ref$id,
      _ref$value = _ref.value,
      value = _ref$value === void 0 ? defaultProps.value : _ref$value,
      valueFormat = _ref.valueFormat,
      _ref$sortByValue = _ref.sortByValue,
      sortByValue = _ref$sortByValue === void 0 ? defaultProps.sortByValue : _ref$sortByValue,
      _ref$startAngle = _ref.startAngle,
      startAngle = _ref$startAngle === void 0 ? defaultProps.startAngle : _ref$startAngle,
      _ref$endAngle = _ref.endAngle,
      endAngle = _ref$endAngle === void 0 ? defaultProps.endAngle : _ref$endAngle,
      _ref$padAngle = _ref.padAngle,
      padAngle = _ref$padAngle === void 0 ? defaultProps.padAngle : _ref$padAngle,
      _ref$fit = _ref.fit,
      fit = _ref$fit === void 0 ? defaultProps.fit : _ref$fit,
      _ref$innerRadius = _ref.innerRadius,
      innerRadiusRatio = _ref$innerRadius === void 0 ? defaultProps.innerRadius : _ref$innerRadius,
      _ref$cornerRadius = _ref.cornerRadius,
      cornerRadius = _ref$cornerRadius === void 0 ? defaultProps.cornerRadius : _ref$cornerRadius,
      _ref$activeInnerRadiu = _ref.activeInnerRadiusOffset,
      activeInnerRadiusOffset = _ref$activeInnerRadiu === void 0 ? defaultProps.activeInnerRadiusOffset : _ref$activeInnerRadiu,
      _ref$activeOuterRadiu = _ref.activeOuterRadiusOffset,
      activeOuterRadiusOffset = _ref$activeOuterRadiu === void 0 ? defaultProps.activeOuterRadiusOffset : _ref$activeOuterRadiu,
      width = _ref.width,
      height = _ref.height,
      partialMargin = _ref.margin,
      _ref$pixelRatio = _ref.pixelRatio,
      pixelRatio = _ref$pixelRatio === void 0 ? 1 : _ref$pixelRatio,
      _ref$colors = _ref.colors,
      colors$1 = _ref$colors === void 0 ? defaultProps.colors : _ref$colors,
      _ref$borderWidth = _ref.borderWidth,
      borderWidth = _ref$borderWidth === void 0 ? defaultProps.borderWidth : _ref$borderWidth,
      _ref$borderColor = _ref.borderColor,
      borderColor = _ref$borderColor === void 0 ? defaultProps.borderColor : _ref$borderColor,
      _ref$enableArcLabels = _ref.enableArcLabels,
      enableArcLabels = _ref$enableArcLabels === void 0 ? defaultProps.enableArcLabels : _ref$enableArcLabels,
      _ref$arcLabel = _ref.arcLabel,
      arcLabel = _ref$arcLabel === void 0 ? defaultProps.arcLabel : _ref$arcLabel,
      _ref$arcLabelsSkipAng = _ref.arcLabelsSkipAngle,
      arcLabelsSkipAngle = _ref$arcLabelsSkipAng === void 0 ? defaultProps.arcLabelsSkipAngle : _ref$arcLabelsSkipAng,
      _ref$arcLabelsTextCol = _ref.arcLabelsTextColor,
      arcLabelsTextColor = _ref$arcLabelsTextCol === void 0 ? defaultProps.arcLabelsTextColor : _ref$arcLabelsTextCol,
      _ref$arcLabelsRadiusO = _ref.arcLabelsRadiusOffset,
      arcLabelsRadiusOffset = _ref$arcLabelsRadiusO === void 0 ? defaultProps.arcLabelsRadiusOffset : _ref$arcLabelsRadiusO,
      _ref$enableArcLinkLab = _ref.enableArcLinkLabels,
      enableArcLinkLabels = _ref$enableArcLinkLab === void 0 ? defaultProps.enableArcLinkLabels : _ref$enableArcLinkLab,
      _ref$arcLinkLabel = _ref.arcLinkLabel,
      arcLinkLabel = _ref$arcLinkLabel === void 0 ? defaultProps.arcLinkLabel : _ref$arcLinkLabel,
      _ref$arcLinkLabelsSki = _ref.arcLinkLabelsSkipAngle,
      arcLinkLabelsSkipAngle = _ref$arcLinkLabelsSki === void 0 ? defaultProps.arcLinkLabelsSkipAngle : _ref$arcLinkLabelsSki,
      _ref$arcLinkLabelsOff = _ref.arcLinkLabelsOffset,
      arcLinkLabelsOffset = _ref$arcLinkLabelsOff === void 0 ? defaultProps.arcLinkLabelsOffset : _ref$arcLinkLabelsOff,
      _ref$arcLinkLabelsDia = _ref.arcLinkLabelsDiagonalLength,
      arcLinkLabelsDiagonalLength = _ref$arcLinkLabelsDia === void 0 ? defaultProps.arcLinkLabelsDiagonalLength : _ref$arcLinkLabelsDia,
      _ref$arcLinkLabelsStr = _ref.arcLinkLabelsStraightLength,
      arcLinkLabelsStraightLength = _ref$arcLinkLabelsStr === void 0 ? defaultProps.arcLinkLabelsStraightLength : _ref$arcLinkLabelsStr,
      _ref$arcLinkLabelsThi = _ref.arcLinkLabelsThickness,
      arcLinkLabelsThickness = _ref$arcLinkLabelsThi === void 0 ? defaultProps.arcLinkLabelsThickness : _ref$arcLinkLabelsThi,
      _ref$arcLinkLabelsTex = _ref.arcLinkLabelsTextOffset,
      arcLinkLabelsTextOffset = _ref$arcLinkLabelsTex === void 0 ? defaultProps.arcLinkLabelsTextOffset : _ref$arcLinkLabelsTex,
      _ref$arcLinkLabelsTex2 = _ref.arcLinkLabelsTextColor,
      arcLinkLabelsTextColor = _ref$arcLinkLabelsTex2 === void 0 ? defaultProps.arcLinkLabelsTextColor : _ref$arcLinkLabelsTex2,
      _ref$arcLinkLabelsCol = _ref.arcLinkLabelsColor,
      arcLinkLabelsColor = _ref$arcLinkLabelsCol === void 0 ? defaultProps.arcLinkLabelsColor : _ref$arcLinkLabelsCol,
      _ref$isInteractive = _ref.isInteractive,
      isInteractive = _ref$isInteractive === void 0 ? defaultProps.isInteractive : _ref$isInteractive,
      onClick = _ref.onClick,
      onMouseMove = _ref.onMouseMove,
      _ref$tooltip = _ref.tooltip,
      tooltip$1 = _ref$tooltip === void 0 ? defaultProps.tooltip : _ref$tooltip,
      _ref$legends = _ref.legends,
      legends$1 = _ref$legends === void 0 ? defaultProps.legends : _ref$legends;
  var canvasEl = react.useRef(null);
  var theme = core.useTheme();

  var _useDimensions = core.useDimensions(width, height, partialMargin),
      margin = _useDimensions.margin,
      innerWidth = _useDimensions.innerWidth,
      innerHeight = _useDimensions.innerHeight,
      outerWidth = _useDimensions.outerWidth,
      outerHeight = _useDimensions.outerHeight;

  var normalizedData = useNormalizedData({
    data: data,
    id: id,
    value: value,
    valueFormat: valueFormat,
    colors: colors$1
  });

  var _usePieFromBox = usePieFromBox({
    data: normalizedData,
    width: innerWidth,
    height: innerHeight,
    fit: fit,
    innerRadius: innerRadiusRatio,
    startAngle: startAngle,
    endAngle: endAngle,
    padAngle: padAngle,
    sortByValue: sortByValue,
    cornerRadius: cornerRadius,
    activeInnerRadiusOffset: activeInnerRadiusOffset,
    activeOuterRadiusOffset: activeOuterRadiusOffset
  }),
      dataWithArc = _usePieFromBox.dataWithArc,
      arcGenerator = _usePieFromBox.arcGenerator,
      centerX = _usePieFromBox.centerX,
      centerY = _usePieFromBox.centerY,
      radius = _usePieFromBox.radius,
      innerRadius = _usePieFromBox.innerRadius,
      setActiveId = _usePieFromBox.setActiveId;

  var getBorderColor = colors.useInheritedColor(borderColor, theme);
  var arcLabels = arcs.useArcLabels({
    data: dataWithArc,
    label: arcLabel,
    skipAngle: arcLabelsSkipAngle,
    offset: arcLabelsRadiusOffset,
    textColor: arcLabelsTextColor
  });
  var arcLinkLabels = arcs.useArcLinkLabels({
    data: dataWithArc,
    skipAngle: arcLinkLabelsSkipAngle,
    offset: arcLinkLabelsOffset,
    diagonalLength: arcLinkLabelsDiagonalLength,
    straightLength: arcLinkLabelsStraightLength,
    label: arcLinkLabel,
    linkColor: arcLinkLabelsColor,
    textOffset: arcLinkLabelsTextOffset,
    textColor: arcLinkLabelsTextColor
  });
  react.useEffect(function () {
    if (!canvasEl.current) return;
    canvasEl.current.width = outerWidth * pixelRatio;
    canvasEl.current.height = outerHeight * pixelRatio;
    var ctx = canvasEl.current.getContext('2d');
    ctx.scale(pixelRatio, pixelRatio);
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, outerWidth, outerHeight);
    ctx.save();
    ctx.translate(margin.left, margin.top);
    arcGenerator.context(ctx);
    ctx.save();
    ctx.translate(centerX, centerY);
    dataWithArc.forEach(function (arc) {
      ctx.beginPath();
      ctx.fillStyle = arc.color;
      ctx.strokeStyle = getBorderColor(arc);
      ctx.lineWidth = borderWidth;
      arcGenerator(arc.arc);
      ctx.fill();

      if (borderWidth > 0) {
        ctx.stroke();
      }
    });

    if (enableArcLinkLabels === true) {
      arcs.drawCanvasArcLinkLabels(ctx, arcLinkLabels, theme, arcLinkLabelsThickness);
    }

    if (enableArcLabels === true) {
      arcs.drawCanvasArcLabels(ctx, arcLabels, theme);
    }

    ctx.restore();
    legends$1.forEach(function (legend) {
      legends.renderLegendToCanvas(ctx, _objectSpread2(_objectSpread2({}, legend), {}, {
        data: dataWithArc,
        containerWidth: innerWidth,
        containerHeight: innerHeight,
        theme: theme
      }));
    });
  }, [canvasEl, innerWidth, innerHeight, outerWidth, outerHeight, margin.top, margin.left, pixelRatio, centerX, centerY, arcGenerator, dataWithArc, getBorderColor, enableArcLabels, arcLabels, enableArcLinkLabels, arcLinkLabels, arcLinkLabelsThickness, legends$1, theme]);
  var arcs$1 = react.useMemo(function () {
    return dataWithArc.map(function (datum) {
      return _objectSpread2({
        id: datum.id
      }, datum.arc);
    });
  }, [dataWithArc]);

  var getArcFromMouse = function getArcFromMouse(event) {
    if (!canvasEl.current) return null;

    var _getRelativeCursor = core.getRelativeCursor(canvasEl.current, event),
        _getRelativeCursor2 = _slicedToArray(_getRelativeCursor, 2),
        x = _getRelativeCursor2[0],
        y = _getRelativeCursor2[1];

    var hoveredArc = arcs.findArcUnderCursor(margin.left + centerX, margin.top + centerY, radius, innerRadius, arcs$1, x, y);
    if (!hoveredArc) return null;
    return dataWithArc.find(function (datum) {
      return datum.id === hoveredArc.id;
    });
  };

  var _useTooltip = tooltip.useTooltip(),
      showTooltipFromEvent = _useTooltip.showTooltipFromEvent,
      hideTooltip = _useTooltip.hideTooltip;

  var handleMouseHover = function handleMouseHover(event) {
    var datum = getArcFromMouse(event);

    if (datum) {
      onMouseMove === null || onMouseMove === void 0 ? void 0 : onMouseMove(datum, event);
      setActiveId(datum.id);
      showTooltipFromEvent(react.createElement(tooltip$1, {
        datum: datum
      }), event);
    } else {
      setActiveId(null);
      hideTooltip();
    }
  };

  var handleMouseLeave = function handleMouseLeave() {
    hideTooltip();
  };

  var handleClick = function handleClick(event) {
    if (!onClick) return;
    var arc = getArcFromMouse(event);

    if (arc) {
      onClick(arc, event);
    }
  };

  return jsxRuntime.jsx("canvas", {
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

var PieCanvas = function PieCanvas(_ref2) {
  var _ref2$isInteractive = _ref2.isInteractive,
      isInteractive = _ref2$isInteractive === void 0 ? defaultProps.isInteractive : _ref2$isInteractive,
      theme = _ref2.theme,
      renderWrapper = _ref2.renderWrapper,
      otherProps = _objectWithoutProperties(_ref2, ["isInteractive", "theme", "renderWrapper"]);

  return jsxRuntime.jsx(core.Container, {
    isInteractive: isInteractive,
    renderWrapper: renderWrapper,
    theme: theme,
    children: jsxRuntime.jsx(InnerPieCanvas, _objectSpread2({
      isInteractive: isInteractive
    }, otherProps))
  });
};

var ResponsivePieCanvas = function ResponsivePieCanvas(props) {
  return jsxRuntime.jsx(core.ResponsiveWrapper, {
    children: function children(_ref) {
      var width = _ref.width,
          height = _ref.height;
      return jsxRuntime.jsx(PieCanvas, _objectSpread2({
        width: width,
        height: height
      }, props));
    }
  });
};

exports.Pie = Pie;
exports.PieCanvas = PieCanvas;
exports.ResponsivePie = ResponsivePie;
exports.ResponsivePieCanvas = ResponsivePieCanvas;
exports.defaultProps = defaultProps;
exports.useNormalizedData = useNormalizedData;
exports.usePie = usePie;
exports.usePieArcs = usePieArcs;
exports.usePieFromBox = usePieFromBox;
exports.usePieLayerContext = usePieLayerContext;
//# sourceMappingURL=nivo-pie.cjs.js.map
