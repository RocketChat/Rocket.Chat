'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var PropTypes = _interopDefault(require('prop-types'));
var tooltip = require('@nivo/tooltip');
var merge = _interopDefault(require('lodash/merge'));
var get = _interopDefault(require('lodash/get'));
var set = _interopDefault(require('lodash/set'));
var last = _interopDefault(require('lodash/last'));
var isArray = _interopDefault(require('lodash/isArray'));
var isString = _interopDefault(require('lodash/isString'));
var d3Scale = require('d3-scale');
var d3ScaleChromatic = require('d3-scale-chromatic');
var isFunction = _interopDefault(require('lodash/isFunction'));
var without = _interopDefault(require('lodash/without'));
var d3Shape = require('d3-shape');
var d3Hierarchy = require('d3-hierarchy');
var d3Format = require('d3-format');
var d3TimeFormat = require('d3-time-format');
var reactMotion = require('react-motion');
var d3Interpolate = require('d3-interpolate');
var Measure = _interopDefault(require('react-measure'));
var withProps = _interopDefault(require('recompose/withProps'));
var isEqual = _interopDefault(require('lodash/isEqual'));
var compose = _interopDefault(require('recompose/compose'));
var setPropTypes = _interopDefault(require('recompose/setPropTypes'));
var defaultProps = _interopDefault(require('recompose/defaultProps'));
var withPropsOnChange = _interopDefault(require('recompose/withPropsOnChange'));
var partialRight = _interopDefault(require('lodash/partialRight'));
var isPlainObject = _interopDefault(require('lodash/isPlainObject'));
var pick = _interopDefault(require('lodash/pick'));

var noop = (function () {});

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var textProps = {
  fill: PropTypes.string,
  fontSize: PropTypes.number,
  fontFamily: PropTypes.string
};
var axisThemePropType = PropTypes.shape({
  domain: PropTypes.shape({
    line: PropTypes.shape({
      stroke: PropTypes.string.isRequired,
      strokeWidth: PropTypes.number.isRequired,
      strokeDasharray: PropTypes.string
    }).isRequired
  }).isRequired,
  ticks: PropTypes.shape({
    line: PropTypes.shape({
      stroke: PropTypes.string.isRequired,
      strokeWidth: PropTypes.number.isRequired,
      strokeDasharray: PropTypes.string
    }).isRequired,
    text: PropTypes.shape(_objectSpread({}, textProps)).isRequired
  }).isRequired,
  legend: PropTypes.shape({
    text: PropTypes.shape(_objectSpread({}, textProps)).isRequired
  }).isRequired
});
var gridThemePropType = PropTypes.shape({
  line: PropTypes.shape({
    stroke: PropTypes.string.isRequired,
    strokeWidth: PropTypes.number.isRequired,
    strokeDasharray: PropTypes.string
  }).isRequired
});
var legendsThemePropType = PropTypes.shape({
  text: PropTypes.shape(_objectSpread({}, textProps)).isRequired
});
var labelsThemePropType = PropTypes.shape({
  text: PropTypes.shape(_objectSpread({}, textProps)).isRequired
});
var dotsThemePropType = PropTypes.shape({
  text: PropTypes.shape(_objectSpread({}, textProps)).isRequired
});
var markersThemePropType = PropTypes.shape({
  text: PropTypes.shape(_objectSpread({}, textProps)).isRequired
});
var crosshairPropType = PropTypes.shape({
  line: PropTypes.shape({
    stroke: PropTypes.string.isRequired,
    strokeWidth: PropTypes.number.isRequired,
    strokeDasharray: PropTypes.string
  }).isRequired
});
var annotationsPropType = PropTypes.shape({
  text: PropTypes.shape(_objectSpread({}, textProps, {
    outlineWidth: PropTypes.number.isRequired,
    outlineColor: PropTypes.string.isRequired
  })).isRequired,
  link: PropTypes.shape({
    stroke: PropTypes.string.isRequired,
    strokeWidth: PropTypes.number.isRequired,
    outlineWidth: PropTypes.number.isRequired,
    outlineColor: PropTypes.string.isRequired
  }).isRequired,
  outline: PropTypes.shape({
    stroke: PropTypes.string.isRequired,
    strokeWidth: PropTypes.number.isRequired,
    outlineWidth: PropTypes.number.isRequired,
    outlineColor: PropTypes.string.isRequired
  }).isRequired,
  symbol: PropTypes.shape({
    fill: PropTypes.string.isRequired,
    outlineWidth: PropTypes.number.isRequired,
    outlineColor: PropTypes.string.isRequired
  }).isRequired
});
var themePropType = PropTypes.shape({
  background: PropTypes.string.isRequired,
  fontFamily: PropTypes.string.isRequired,
  fontSize: PropTypes.number.isRequired,
  textColor: PropTypes.string.isRequired,
  axis: axisThemePropType.isRequired,
  grid: gridThemePropType.isRequired,
  legends: legendsThemePropType.isRequired,
  labels: labelsThemePropType.isRequired,
  dots: dotsThemePropType.isRequired,
  markers: markersThemePropType,
  crosshair: crosshairPropType.isRequired,
  annotations: annotationsPropType.isRequired
});

var defaultTheme = {
  background: 'transparent',
  fontFamily: 'sans-serif',
  fontSize: 11,
  textColor: '#333333',
  axis: {
    domain: {
      line: {
        stroke: 'transparent',
        strokeWidth: 1
      }
    },
    ticks: {
      line: {
        stroke: '#777777',
        strokeWidth: 1
      },
      text: {}
    },
    legend: {
      text: {
        fontSize: 12
      }
    }
  },
  grid: {
    line: {
      stroke: '#dddddd',
      strokeWidth: 1
    }
  },
  legends: {
    text: {
      fill: '#333333'
    }
  },
  labels: {
    text: {}
  },
  markers: {
    lineColor: '#000000',
    lineStrokeWidth: 1,
    text: {}
  },
  dots: {
    text: {}
  },
  tooltip: {
    container: {
      background: 'white',
      color: 'inherit',
      fontSize: 'inherit',
      borderRadius: '2px',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
      padding: '5px 9px'
    },
    basic: {
      whiteSpace: 'pre',
      display: 'flex',
      alignItems: 'center'
    },
    chip: {
      marginRight: 7
    },
    table: {},
    tableCell: {
      padding: '3px 5px'
    }
  },
  crosshair: {
    line: {
      stroke: '#000000',
      strokeWidth: 1,
      strokeOpacity: 0.75,
      strokeDasharray: '6 6'
    }
  },
  annotations: {
    text: {
      fontSize: 13,
      outlineWidth: 2,
      outlineColor: '#ffffff'
    },
    link: {
      stroke: '#000000',
      strokeWidth: 1,
      outlineWidth: 2,
      outlineColor: '#ffffff'
    },
    outline: {
      fill: 'none',
      stroke: '#000000',
      strokeWidth: 2,
      outlineWidth: 2,
      outlineColor: '#ffffff'
    },
    symbol: {
      fill: '#000000',
      outlineWidth: 2,
      outlineColor: '#ffffff'
    }
  }
};

var fontProps = ['axis.ticks.text', 'axis.legend.text', 'legends.text', 'labels.text', 'dots.text', 'markers.text', 'annotations.text'];
var extendDefaultTheme = function extendDefaultTheme(defaultTheme, customTheme) {
  var theme = merge({}, defaultTheme, customTheme);
  fontProps.forEach(function (prop) {
    if (get(theme, "".concat(prop, ".fontFamily")) === undefined) {
      set(theme, "".concat(prop, ".fontFamily"), theme.fontFamily);
    }
    if (get(theme, "".concat(prop, ".fontSize")) === undefined) {
      set(theme, "".concat(prop, ".fontSize"), theme.fontSize);
    }
    if (get(theme, "".concat(prop, ".fill")) === undefined) {
      set(theme, "".concat(prop, ".fill"), theme.textColor);
    }
  });
  return theme;
};

var quantizeColorScales = {
  nivo: ['#d76445', '#f47560', '#e8c1a0', '#97e3d5', '#61cdbb', '#00b0a7'],
  BrBG: last(d3ScaleChromatic.schemeBrBG),
  PRGn: last(d3ScaleChromatic.schemePRGn),
  PiYG: last(d3ScaleChromatic.schemePiYG),
  PuOr: last(d3ScaleChromatic.schemePuOr),
  RdBu: last(d3ScaleChromatic.schemeRdBu),
  RdGy: last(d3ScaleChromatic.schemeRdGy),
  RdYlBu: last(d3ScaleChromatic.schemeRdYlBu),
  RdYlGn: last(d3ScaleChromatic.schemeRdYlGn),
  spectral: last(d3ScaleChromatic.schemeSpectral),
  blues: last(d3ScaleChromatic.schemeBlues),
  greens: last(d3ScaleChromatic.schemeGreens),
  greys: last(d3ScaleChromatic.schemeGreys),
  oranges: last(d3ScaleChromatic.schemeOranges),
  purples: last(d3ScaleChromatic.schemePurples),
  reds: last(d3ScaleChromatic.schemeReds),
  BuGn: last(d3ScaleChromatic.schemeBuGn),
  BuPu: last(d3ScaleChromatic.schemeBuPu),
  GnBu: last(d3ScaleChromatic.schemeGnBu),
  OrRd: last(d3ScaleChromatic.schemeOrRd),
  PuBuGn: last(d3ScaleChromatic.schemePuBuGn),
  PuBu: last(d3ScaleChromatic.schemePuBu),
  PuRd: last(d3ScaleChromatic.schemePuRd),
  RdPu: last(d3ScaleChromatic.schemeRdPu),
  YlGnBu: last(d3ScaleChromatic.schemeYlGnBu),
  YlGn: last(d3ScaleChromatic.schemeYlGn),
  YlOrBr: last(d3ScaleChromatic.schemeYlOrBr),
  YlOrRd: last(d3ScaleChromatic.schemeYlOrRd)
};
var quantizeColorScalesKeys = Object.keys(quantizeColorScales);
var guessQuantizeColorScale = function guessQuantizeColorScale(colors) {
  if (isFunction(colors)) {
    if (!isFunction(colors.domain)) {
      throw new Error("Provided colors should be a valid quantize scale providing a 'domain()' function");
    }
    return colors;
  }
  if (quantizeColorScales[colors]) {
    return d3Scale.scaleQuantize().range(quantizeColorScales[colors]);
  }
  if (isArray(colors)) return d3Scale.scaleQuantize().range(colors);
  throw new Error("Unable to guess quantize color scale from '".concat(colors, "',\nmust be a function or one of:\n'").concat(quantizeColorScalesKeys.join("', '"), "'"));
};

var colorSchemes = {
  nivo: ['#e8c1a0', '#f47560', '#f1e15b', '#e8a838', '#61cdbb', '#97e3d5'],
  category10: d3ScaleChromatic.schemeCategory10,
  accent: d3ScaleChromatic.schemeAccent,
  dark2: d3ScaleChromatic.schemeDark2,
  paired: d3ScaleChromatic.schemePaired,
  pastel1: d3ScaleChromatic.schemePastel1,
  pastel2: d3ScaleChromatic.schemePastel2,
  set1: d3ScaleChromatic.schemeSet1,
  set2: d3ScaleChromatic.schemeSet2,
  set3: d3ScaleChromatic.schemeSet3,
  brown_blueGreen: last(d3ScaleChromatic.schemeBrBG),
  purpleRed_green: last(d3ScaleChromatic.schemePRGn),
  pink_yellowGreen: last(d3ScaleChromatic.schemePiYG),
  purple_orange: last(d3ScaleChromatic.schemePuOr),
  red_blue: last(d3ScaleChromatic.schemeRdBu),
  red_grey: last(d3ScaleChromatic.schemeRdGy),
  red_yellow_blue: last(d3ScaleChromatic.schemeRdYlBu),
  red_yellow_green: last(d3ScaleChromatic.schemeRdYlGn),
  spectral: last(d3ScaleChromatic.schemeSpectral),
  blues: last(d3ScaleChromatic.schemeBlues),
  greens: last(d3ScaleChromatic.schemeGreens),
  greys: last(d3ScaleChromatic.schemeGreys),
  oranges: last(d3ScaleChromatic.schemeOranges),
  purples: last(d3ScaleChromatic.schemePurples),
  reds: last(d3ScaleChromatic.schemeReds),
  blue_green: last(d3ScaleChromatic.schemeBuGn),
  blue_purple: last(d3ScaleChromatic.schemeBuPu),
  green_blue: last(d3ScaleChromatic.schemeGnBu),
  orange_red: last(d3ScaleChromatic.schemeOrRd),
  purple_blue_green: last(d3ScaleChromatic.schemePuBuGn),
  purple_blue: last(d3ScaleChromatic.schemePuBu),
  purple_red: last(d3ScaleChromatic.schemePuRd),
  red_purple: last(d3ScaleChromatic.schemeRdPu),
  yellow_green_blue: last(d3ScaleChromatic.schemeYlGnBu),
  yellow_green: last(d3ScaleChromatic.schemeYlGn),
  yellow_orange_brown: last(d3ScaleChromatic.schemeYlOrBr),
  yellow_orange_red: last(d3ScaleChromatic.schemeYlOrRd)
};
var colorSchemeIds = ['nivo',
'category10', 'accent', 'dark2', 'paired', 'pastel1', 'pastel2', 'set1', 'set2', 'set3',
'brown_blueGreen', 'purpleRed_green', 'pink_yellowGreen', 'purple_orange', 'red_blue', 'red_grey', 'red_yellow_blue', 'red_yellow_green', 'spectral',
'blues', 'greens', 'greys', 'oranges', 'purples', 'reds',
'blue_green', 'blue_purple', 'green_blue', 'orange_red', 'purple_blue_green', 'purple_blue', 'purple_red', 'red_purple', 'yellow_green_blue', 'yellow_green', 'yellow_orange_brown', 'yellow_orange_red'];
var colorInterpolators = {
  brown_blueGreen: d3ScaleChromatic.interpolateBrBG,
  purpleRed_green: d3ScaleChromatic.interpolatePRGn,
  pink_yellowGreen: d3ScaleChromatic.interpolatePiYG,
  purple_orange: d3ScaleChromatic.interpolatePuOr,
  red_blue: d3ScaleChromatic.interpolateRdBu,
  red_grey: d3ScaleChromatic.interpolateRdGy,
  red_yellow_blue: d3ScaleChromatic.interpolateRdYlBu,
  red_yellow_green: d3ScaleChromatic.interpolateRdYlGn,
  spectral: d3ScaleChromatic.interpolateSpectral,
  blues: d3ScaleChromatic.interpolateBlues,
  greens: d3ScaleChromatic.interpolateGreens,
  greys: d3ScaleChromatic.interpolateGreys,
  oranges: d3ScaleChromatic.interpolateOranges,
  purples: d3ScaleChromatic.interpolatePurples,
  reds: d3ScaleChromatic.interpolateReds,
  viridis: d3ScaleChromatic.interpolateViridis,
  inferno: d3ScaleChromatic.interpolateInferno,
  magma: d3ScaleChromatic.interpolateMagma,
  plasma: d3ScaleChromatic.interpolatePlasma,
  warm: d3ScaleChromatic.interpolateWarm,
  cool: d3ScaleChromatic.interpolateCool,
  cubehelixDefault: d3ScaleChromatic.interpolateCubehelixDefault,
  blue_green: d3ScaleChromatic.interpolateBuGn,
  blue_purple: d3ScaleChromatic.interpolateBuPu,
  green_blue: d3ScaleChromatic.interpolateGnBu,
  orange_red: d3ScaleChromatic.interpolateOrRd,
  purple_blue_green: d3ScaleChromatic.interpolatePuBuGn,
  purple_blue: d3ScaleChromatic.interpolatePuBu,
  purple_red: d3ScaleChromatic.interpolatePuRd,
  red_purple: d3ScaleChromatic.interpolateRdPu,
  yellow_green_blue: d3ScaleChromatic.interpolateYlGnBu,
  yellow_green: d3ScaleChromatic.interpolateYlGn,
  yellow_orange_brown: d3ScaleChromatic.interpolateYlOrBr,
  yellow_orange_red: d3ScaleChromatic.interpolateYlOrRd,
  rainbow: d3ScaleChromatic.interpolateRainbow,
  sinebow: d3ScaleChromatic.interpolateSinebow
};
var colorInterpolatorIds = [
'brown_blueGreen', 'purpleRed_green', 'pink_yellowGreen', 'purple_orange', 'red_blue', 'red_grey', 'red_yellow_blue', 'red_yellow_green', 'spectral',
'blues', 'greens', 'greys', 'oranges', 'purples', 'reds',
'viridis', 'inferno', 'magma', 'plasma', 'warm', 'cool', 'cubehelixDefault', 'blue_green', 'blue_purple', 'green_blue', 'orange_red', 'purple_blue_green', 'purple_blue', 'purple_red', 'red_purple', 'yellow_green_blue', 'yellow_green', 'yellow_orange_brown', 'yellow_orange_red',
'rainbow', 'sinebow'];
var nivoCategoricalColors = function nivoCategoricalColors() {
  return d3Scale.scaleOrdinal(['#e8c1a0', '#f47560', '#f1e15b', '#e8a838', '#61cdbb', '#97e3d5']);
};
var getColorScale = function getColorScale(colors, dataScale) {
  if (isString(colors)) {
    var scheme = colorSchemes[colors];
    if (scheme !== undefined) {
      var scale = d3Scale.scaleOrdinal(scheme);
      scale.type = 'ordinal';
      return scale;
    }
    if (dataScale !== undefined && colors.indexOf('seq:') === 0) {
      var interpolator = colorInterpolators[colors.slice(4)];
      if (interpolator !== undefined) {
        var _scale = d3Scale.scaleSequential(interpolator).domain(dataScale.domain());
        _scale.type = 'sequential';
        return _scale;
      }
    }
  }
  if (isArray(colors)) {
    var _scale2 = d3Scale.scaleOrdinal(colors);
    _scale2.type = 'ordinal';
    return _scale2;
  }
  return function () {
    return colors;
  };
};

var quantizeColorScalePropType = PropTypes.oneOfType([PropTypes.oneOf(quantizeColorScalesKeys), PropTypes.func, PropTypes.arrayOf(PropTypes.string)]);

var curvePropMapping = {
  basis: d3Shape.curveBasis,
  basisClosed: d3Shape.curveBasisClosed,
  basisOpen: d3Shape.curveBasisOpen,
  bundle: d3Shape.curveBundle,
  cardinal: d3Shape.curveCardinal,
  cardinalClosed: d3Shape.curveCardinalClosed,
  cardinalOpen: d3Shape.curveCardinalOpen,
  catmullRom: d3Shape.curveCatmullRom,
  catmullRomClosed: d3Shape.curveCatmullRomClosed,
  catmullRomOpen: d3Shape.curveCatmullRomOpen,
  linear: d3Shape.curveLinear,
  linearClosed: d3Shape.curveLinearClosed,
  monotoneX: d3Shape.curveMonotoneX,
  monotoneY: d3Shape.curveMonotoneY,
  natural: d3Shape.curveNatural,
  step: d3Shape.curveStep,
  stepAfter: d3Shape.curveStepAfter,
  stepBefore: d3Shape.curveStepBefore
};
var curvePropKeys = Object.keys(curvePropMapping);
var curvePropType = PropTypes.oneOf(curvePropKeys);
var closedCurvePropKeys = curvePropKeys.filter(function (c) {
  return c.endsWith('Closed');
});
var closedCurvePropType = PropTypes.oneOf(closedCurvePropKeys);
var areaCurvePropKeys = without(curvePropKeys, 'bundle', 'basisClosed', 'basisOpen', 'cardinalClosed', 'cardinalOpen', 'catmullRomClosed', 'catmullRomOpen', 'linearClosed');
var areaCurvePropType = PropTypes.oneOf(areaCurvePropKeys);
var lineCurvePropKeys = without(curvePropKeys, 'bundle', 'basisClosed', 'basisOpen', 'cardinalClosed', 'cardinalOpen', 'catmullRomClosed', 'catmullRomOpen', 'linearClosed');
var lineCurvePropType = PropTypes.oneOf(lineCurvePropKeys);
var curveFromProp = function curveFromProp(id) {
  var curveInterpolator = curvePropMapping[id];
  if (!curveInterpolator) {
    throw new TypeError("'".concat(id, "', is not a valid curve interpolator identifier."));
  }
  return curvePropMapping[id];
};

var defsPropTypes = {
  defs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired
  })).isRequired,
  fill: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    match: PropTypes.oneOfType([PropTypes.oneOf(['*']), PropTypes.object, PropTypes.func]).isRequired
  })).isRequired
};

var stackOrderPropMapping = {
  ascending: d3Shape.stackOrderAscending,
  descending: d3Shape.stackOrderDescending,
  insideOut: d3Shape.stackOrderInsideOut,
  none: d3Shape.stackOrderNone,
  reverse: d3Shape.stackOrderReverse
};
var stackOrderPropKeys = Object.keys(stackOrderPropMapping);
var stackOrderPropType = PropTypes.oneOf(stackOrderPropKeys);
var stackOrderFromProp = function stackOrderFromProp(prop) {
  return stackOrderPropMapping[prop];
};
var stackOffsetPropMapping = {
  expand: d3Shape.stackOffsetExpand,
  diverging: d3Shape.stackOffsetDiverging,
  none: d3Shape.stackOffsetNone,
  silhouette: d3Shape.stackOffsetSilhouette,
  wiggle: d3Shape.stackOffsetWiggle
};
var stackOffsetPropKeys = Object.keys(stackOffsetPropMapping);
var stackOffsetPropType = PropTypes.oneOf(stackOffsetPropKeys);
var stackOffsetFromProp = function stackOffsetFromProp(prop) {
  return stackOffsetPropMapping[prop];
};

var treeMapTilePropMapping = {
  binary: d3Hierarchy.treemapBinary,
  dice: d3Hierarchy.treemapDice,
  slice: d3Hierarchy.treemapSlice,
  sliceDice: d3Hierarchy.treemapSliceDice,
  squarify: d3Hierarchy.treemapSquarify,
  resquarify: d3Hierarchy.treemapResquarify
};
var treeMapTilePropKeys = Object.keys(treeMapTilePropMapping);
var treeMapTilePropType = PropTypes.oneOf(treeMapTilePropKeys);
var treeMapTileFromProp = function treeMapTileFromProp(prop) {
  return treeMapTilePropMapping[prop];
};

var marginPropType = PropTypes.shape({
  top: PropTypes.number,
  right: PropTypes.number,
  bottom: PropTypes.number,
  left: PropTypes.number
}).isRequired;
var motionPropTypes = {
  animate: PropTypes.bool.isRequired,
  motionStiffness: PropTypes.number.isRequired,
  motionDamping: PropTypes.number.isRequired
};
var blendModes = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];
var blendModePropType = PropTypes.oneOf(blendModes);

var useCurveInterpolation = function useCurveInterpolation(interpolation) {
  return React.useMemo(function () {
    return curveFromProp(interpolation);
  }, [interpolation]);
};

var defaultAnimate = true;
var defaultMotionStiffness = 90;
var defaultMotionDamping = 15;
var defaultCategoricalColors = nivoCategoricalColors;
var defaultColorRange = d3Scale.scaleOrdinal(d3ScaleChromatic.schemeSet3);
var defaultMargin = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
};

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$1(target, key, source[key]); }); } return target; }
function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var useDimensions = function useDimensions(width, height) {
  var partialMargin = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return React.useMemo(function () {
    var margin = _objectSpread$1({}, defaultMargin, partialMargin);
    return {
      margin: margin,
      innerWidth: width - margin.left - margin.right,
      innerHeight: height - margin.top - margin.bottom,
      outerWidth: width,
      outerHeight: height
    };
  }, [width, height, partialMargin.top, partialMargin.right, partialMargin.bottom, partialMargin.left]);
};

var usePartialTheme = function usePartialTheme(partialTheme) {
  return React.useMemo(function () {
    return extendDefaultTheme(defaultTheme, partialTheme);
  }, [partialTheme]);
};

var getValueFormatter = function getValueFormatter(format) {
  if (typeof format === 'function') return format;
  if (typeof format === 'string') {
    if (format.indexOf('time:') === 0) {
      return d3TimeFormat.timeFormat(format.slice('5'));
    }
    return d3Format.format(format);
  }
  return function (v) {
    return v;
  };
};
var useValueFormatter = function useValueFormatter(format) {
  return React.useMemo(function () {
    return getValueFormatter(format);
  }, [format]);
};

var themeContext = React.createContext();
var defaultPartialTheme = {};
var ThemeProvider = function ThemeProvider(_ref) {
  var _ref$theme = _ref.theme,
      partialTheme = _ref$theme === void 0 ? defaultPartialTheme : _ref$theme,
      children = _ref.children;
  var theme = usePartialTheme(partialTheme);
  return React__default.createElement(themeContext.Provider, {
    value: theme
  }, children);
};
ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
  theme: PropTypes.object
};
var useTheme = function useTheme() {
  return React.useContext(themeContext);
};

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }
function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$2(target, key, source[key]); }); } return target; }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }
function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }
function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }
function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
function _defineProperty$2(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var enhancedSpring = function enhancedSpring(value, config) {
  if (typeof value !== 'number') {
    return {
      value: value,
      config: config,
      interpolator: config && config.interpolator ? config.interpolator : d3Interpolate.interpolate
    };
  }
  return reactMotion.spring(value, config);
};
var SmartMotion =
function (_PureComponent) {
  _inherits(SmartMotion, _PureComponent);
  function SmartMotion() {
    var _getPrototypeOf2;
    var _this;
    _classCallCheck(this, SmartMotion);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(SmartMotion)).call.apply(_getPrototypeOf2, [this].concat(args)));
    _defineProperty$2(_assertThisInitialized(_this), "oldValues", {});
    _defineProperty$2(_assertThisInitialized(_this), "newInters", {});
    _defineProperty$2(_assertThisInitialized(_this), "currentStepValues", {});
    _defineProperty$2(_assertThisInitialized(_this), "stepValues", {});
    _defineProperty$2(_assertThisInitialized(_this), "stepInterpolators", {});
    return _this;
  }
  _createClass(SmartMotion, [{
    key: "render",
    value: function render() {
      var _this2 = this;
      var _this$props = this.props,
          style = _this$props.style,
          children = _this$props.children,
          rest = _objectWithoutProperties(_this$props, ["style", "children"]);
      var resolvedStyle = style(enhancedSpring);
      for (var key in resolvedStyle) {
        if (
        resolvedStyle[key] && resolvedStyle[key].interpolator) {
          this.currentStepValues[key] = this.currentStepValues[key] || 0;
          if (
          typeof this.newInters[key] === 'undefined' || resolvedStyle[key].value !== this.newInters[key].value) {
            this.newInters[key] = resolvedStyle[key];
            this.stepValues[key] = this.currentStepValues[key] + 1;
            this.stepInterpolators[key] = this.newInters[key].interpolator(this.oldValues[key], this.newInters[key].value);
          }
          resolvedStyle[key] = reactMotion.spring(this.stepValues[key], this.newInters[key].config);
        }
      }
      return React__default.createElement(reactMotion.Motion, _extends({}, rest, {
        style: resolvedStyle
      }), function (values) {
        var newValues = {};
        for (var _key2 in values) {
          if (_this2.stepValues[_key2]) {
            _this2.currentStepValues[_key2] = values[_key2];
            var percentage = _this2.currentStepValues[_key2] - _this2.stepValues[_key2] + 1;
            _this2.oldValues[_key2] = newValues[_key2] = _this2.stepInterpolators[_key2](percentage);
          }
        }
        return children(_objectSpread$2({}, values, newValues));
      });
    }
  }]);
  return SmartMotion;
}(React.PureComponent);
_defineProperty$2(SmartMotion, "propTypes", {
  children: PropTypes.func.isRequired,
  style: PropTypes.func.isRequired
});

var motionConfigContext = React.createContext();
var MotionConfigProvider = function MotionConfigProvider(_ref) {
  var children = _ref.children,
      animate = _ref.animate,
      stiffness = _ref.stiffness,
      damping = _ref.damping;
  var value = React.useMemo(function () {
    return {
      animate: animate,
      springConfig: {
        stiffness: stiffness,
        damping: damping
      }
    };
  }, [animate, stiffness, damping]);
  return React__default.createElement(motionConfigContext.Provider, {
    value: value
  }, children);
};
MotionConfigProvider.propTypes = {
  children: PropTypes.node.isRequired,
  animate: PropTypes.bool.isRequired,
  stiffness: PropTypes.number.isRequired,
  damping: PropTypes.number.isRequired
};
MotionConfigProvider.defaultProps = {
  animate: true,
  stiffness: 90,
  damping: 15
};

var useMotionConfig = function useMotionConfig() {
  return React.useContext(motionConfigContext);
};

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$3(target, key, source[key]); }); } return target; }
function _defineProperty$3(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }
function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
var containerStyle = {
  position: 'relative'
};
var tooltipStyle = {
  pointerEvents: 'none',
  position: 'absolute',
  zIndex: 10
};
var Container = function Container(_ref) {
  var children = _ref.children,
      theme = _ref.theme,
      _ref$isInteractive = _ref.isInteractive,
      isInteractive = _ref$isInteractive === void 0 ? true : _ref$isInteractive,
      animate = _ref.animate,
      motionStiffness = _ref.motionStiffness,
      motionDamping = _ref.motionDamping;
  var containerEl = React.useRef(null);
  var _useState = React.useState({
    isTooltipVisible: false,
    tooltipContent: null,
    position: {}
  }),
      _useState2 = _slicedToArray(_useState, 2),
      state = _useState2[0],
      setState = _useState2[1];
  var showTooltip = React.useCallback(function (content, event) {
    if (!containerEl) return;
    var bounds = containerEl.current.getBoundingClientRect();
    var clientX = event.clientX,
        clientY = event.clientY;
    var x = clientX - bounds.left;
    var y = clientY - bounds.top;
    var position = {};
    if (x < bounds.width / 2) position.left = x + 20;else position.right = bounds.width - x + 20;
    if (y < bounds.height / 2) position.top = y - 12;else position.bottom = bounds.height - y - 12;
    setState({
      isTooltipVisible: true,
      tooltipContent: content,
      position: position
    });
  }, [containerEl]);
  var hideTooltip = React.useCallback(function () {
    setState({
      isTooltipVisible: false,
      tooltipContent: null
    });
  });
  var isTooltipVisible = state.isTooltipVisible,
      tooltipContent = state.tooltipContent,
      position = state.position;
  var content;
  if (isInteractive === true) {
    content = React__default.createElement("div", {
      style: containerStyle,
      ref: containerEl
    }, children({
      showTooltip: isInteractive ? showTooltip : noop,
      hideTooltip: isInteractive ? hideTooltip : noop
    }), isTooltipVisible && React__default.createElement("div", {
      style: _objectSpread$3({}, tooltipStyle, position, theme.tooltip)
    }, tooltipContent));
  } else {
    content = children({
      showTooltip: isInteractive ? showTooltip : noop,
      hideTooltip: isInteractive ? hideTooltip : noop
    });
  }
  return React__default.createElement(themeContext.Provider, {
    value: theme
  }, React__default.createElement(MotionConfigProvider, {
    animate: animate,
    stiffness: motionStiffness,
    damping: motionDamping
  }, React__default.createElement(tooltip.tooltipContext.Provider, {
    value: [showTooltip, hideTooltip]
  }, content)));
};
Container.propTypes = {
  children: PropTypes.func.isRequired,
  isInteractive: PropTypes.bool,
  theme: PropTypes.object.isRequired,
  animate: PropTypes.bool.isRequired,
  motionStiffness: PropTypes.number,
  motionDamping: PropTypes.number
};

function _typeof$1(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$1 = function _typeof(obj) { return typeof obj; }; } else { _typeof$1 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$1(obj); }
function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties$1(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
function _createClass$1(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$1(Constructor.prototype, protoProps); if (staticProps) _defineProperties$1(Constructor, staticProps); return Constructor; }
function _possibleConstructorReturn$1(self, call) { if (call && (_typeof$1(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized$1(self); }
function _getPrototypeOf$1(o) { _getPrototypeOf$1 = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf$1(o); }
function _assertThisInitialized$1(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _inherits$1(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf$1(subClass, superClass); }
function _setPrototypeOf$1(o, p) { _setPrototypeOf$1 = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf$1(o, p); }
function _defineProperty$4(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var ResponsiveWrapper =
function (_Component) {
  _inherits$1(ResponsiveWrapper, _Component);
  function ResponsiveWrapper() {
    var _getPrototypeOf2;
    var _this;
    _classCallCheck$1(this, ResponsiveWrapper);
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    _this = _possibleConstructorReturn$1(this, (_getPrototypeOf2 = _getPrototypeOf$1(ResponsiveWrapper)).call.apply(_getPrototypeOf2, [this].concat(args)));
    _defineProperty$4(_assertThisInitialized$1(_this), "state", {
      dimensions: {
        width: -1,
        height: -1
      }
    });
    return _this;
  }
  _createClass$1(ResponsiveWrapper, [{
    key: "render",
    value: function render() {
      var _this2 = this;
      var _this$state$dimension = this.state.dimensions,
          width = _this$state$dimension.width,
          height = _this$state$dimension.height;
      var shouldRender = width > 0 && height > 0;
      return React__default.createElement(Measure, {
        bounds: true,
        onResize: function onResize(contentRect) {
          _this2.setState({
            dimensions: contentRect.bounds
          });
        }
      }, function (_ref) {
        var measureRef = _ref.measureRef;
        return React__default.createElement("div", {
          ref: measureRef,
          style: {
            width: '100%',
            height: '100%'
          }
        }, shouldRender && _this2.props.children({
          width: width,
          height: height
        }));
      });
    }
  }]);
  return ResponsiveWrapper;
}(React.Component);
_defineProperty$4(ResponsiveWrapper, "propTypes", {
  children: PropTypes.func.isRequired
});

function _objectSpread$4(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$5(target, key, source[key]); }); } return target; }
function _defineProperty$5(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var LinearGradient = function LinearGradient(_ref) {
  var id = _ref.id,
      colors = _ref.colors;
  return React__default.createElement("linearGradient", {
    id: id,
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 1
  }, colors.map(function (_ref2) {
    var offset = _ref2.offset,
        color = _ref2.color,
        opacity = _ref2.opacity;
    return React__default.createElement("stop", {
      key: offset,
      offset: "".concat(offset, "%"),
      stopColor: color,
      stopOpacity: opacity !== undefined ? opacity : 1
    });
  }));
};
LinearGradient.propTypes = {
  id: PropTypes.string.isRequired,
  colors: PropTypes.arrayOf(PropTypes.shape({
    offset: PropTypes.number.isRequired,
    color: PropTypes.string.isRequired
  })).isRequired
};
var linearGradientDef = function linearGradientDef(id, colors) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return _objectSpread$4({
    id: id,
    type: 'linearGradient',
    colors: colors
  }, options);
};

var gradientTypes = {
  linearGradient: LinearGradient
};

function _objectSpread$5(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$6(target, key, source[key]); }); } return target; }
function _defineProperty$6(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var PatternDots = React.memo(function (_ref) {
  var id = _ref.id,
      background = _ref.background,
      color = _ref.color,
      size = _ref.size,
      padding = _ref.padding,
      stagger = _ref.stagger;
  var fullSize = size + padding;
  var radius = size / 2;
  var halfPadding = padding / 2;
  if (stagger === true) {
    fullSize = size * 2 + padding * 2;
  }
  return React__default.createElement("pattern", {
    id: id,
    width: fullSize,
    height: fullSize,
    patternUnits: "userSpaceOnUse"
  }, React__default.createElement("rect", {
    width: fullSize,
    height: fullSize,
    fill: background
  }), React__default.createElement("circle", {
    cx: halfPadding + radius,
    cy: halfPadding + radius,
    r: radius,
    fill: color
  }), stagger && React__default.createElement("circle", {
    cx: padding * 1.5 + size + radius,
    cy: padding * 1.5 + size + radius,
    r: radius,
    fill: color
  }));
});
PatternDots.displayName = 'PatternDots';
PatternDots.propTypes = {
  id: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  background: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  padding: PropTypes.number.isRequired,
  stagger: PropTypes.bool.isRequired
};
PatternDots.defaultProps = {
  color: '#000000',
  background: '#ffffff',
  size: 4,
  padding: 4,
  stagger: false
};
var patternDotsDef = function patternDotsDef(id) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return _objectSpread$5({
    id: id,
    type: 'patternDots'
  }, options);
};

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }
function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }
function _slicedToArray$1(arr, i) { return _arrayWithHoles$1(arr) || _iterableToArrayLimit$1(arr, i) || _nonIterableRest$1(); }
function _nonIterableRest$1() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }
function _iterableToArrayLimit$1(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles$1(arr) { if (Array.isArray(arr)) return arr; }
var TWO_PI = Math.PI * 2;
var degreesToRadians = function degreesToRadians(degrees) {
  return degrees * Math.PI / 180;
};
var radiansToDegrees = function radiansToDegrees(radians) {
  return 180 * radians / Math.PI;
};
var midAngle = function midAngle(arc) {
  return arc.startAngle + (arc.endAngle - arc.startAngle) / 2;
};
var positionFromAngle = function positionFromAngle(angle, distance) {
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance
  };
};
var absoluteAngleDegrees = function absoluteAngleDegrees(angle) {
  var absAngle = angle % 360;
  if (absAngle < 0) {
    absAngle += 360;
  }
  return absAngle;
};
var absoluteAngleRadians = function absoluteAngleRadians(angle) {
  return angle - TWO_PI * Math.floor((angle + Math.PI) / TWO_PI);
};
var computeArcBoundingBox = function computeArcBoundingBox(ox, oy, radius, startAngle, endAngle) {
  var includeCenter = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : true;
  var points = [];
  var p0 = positionFromAngle(degreesToRadians(startAngle), radius);
  points.push([p0.x, p0.y]);
  var p1 = positionFromAngle(degreesToRadians(endAngle), radius);
  points.push([p1.x, p1.y]);
  for (var angle = Math.round(Math.min(startAngle, endAngle)); angle <= Math.round(Math.max(startAngle, endAngle)); angle++) {
    if (angle % 90 === 0) {
      var p = positionFromAngle(degreesToRadians(angle), radius);
      points.push([p.x, p.y]);
    }
  }
  points = points.map(function (_ref) {
    var _ref2 = _slicedToArray$1(_ref, 2),
        x = _ref2[0],
        y = _ref2[1];
    return [ox + x, oy + y];
  });
  if (includeCenter === true) points.push([ox, oy]);
  var xs = points.map(function (_ref3) {
    var _ref4 = _slicedToArray$1(_ref3, 1),
        x = _ref4[0];
    return x;
  });
  var ys = points.map(function (_ref5) {
    var _ref6 = _slicedToArray$1(_ref5, 2),
        y = _ref6[1];
    return y;
  });
  var x0 = Math.min.apply(Math, _toConsumableArray(xs));
  var x1 = Math.max.apply(Math, _toConsumableArray(xs));
  var y0 = Math.min.apply(Math, _toConsumableArray(ys));
  var y1 = Math.max.apply(Math, _toConsumableArray(ys));
  return {
    points: points,
    x: x0,
    y: y0,
    width: x1 - x0,
    height: y1 - y0
  };
};

var textPropsByEngine = {
  svg: {
    align: {
      left: 'start',
      center: 'middle',
      right: 'end'
    },
    baseline: {
      top: 'text-before-edge',
      center: 'central',
      bottom: 'alphabetic'
    }
  },
  canvas: {
    align: {
      left: 'left',
      center: 'center',
      right: 'right'
    },
    baseline: {
      top: 'top',
      center: 'middle',
      bottom: 'bottom'
    }
  }
};

var getPolarLabelProps = function getPolarLabelProps(radius, angle, rotation) {
  var engine = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'svg';
  var textProps = textPropsByEngine[engine];
  var _positionFromAngle = positionFromAngle(angle - Math.PI / 2, radius),
      x = _positionFromAngle.x,
      y = _positionFromAngle.y;
  var rotate = radiansToDegrees(angle);
  var align = textProps.align.center;
  var baseline = textProps.baseline.bottom;
  if (rotation > 0) {
    align = textProps.align.right;
    baseline = textProps.baseline.center;
  } else if (rotation < 0) {
    align = textProps.align.left;
    baseline = textProps.baseline.center;
  }
  if (rotation !== 0 && rotate > 180) {
    rotate -= 180;
    align = align === textProps.align.right ? textProps.align.left : textProps.align.right;
  }
  rotate += rotation;
  return {
    x: x,
    y: y,
    rotate: rotate,
    align: align,
    baseline: baseline
  };
};

function _objectSpread$6(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$7(target, key, source[key]); }); } return target; }
function _defineProperty$7(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var PatternLines = React.memo(function (_ref) {
  var id = _ref.id,
      _spacing = _ref.spacing,
      _rotation = _ref.rotation,
      background = _ref.background,
      color = _ref.color,
      lineWidth = _ref.lineWidth;
  var rotation = Math.round(_rotation) % 360;
  var spacing = Math.abs(_spacing);
  if (rotation > 180) rotation = rotation - 360;else if (rotation > 90) rotation = rotation - 180;else if (rotation < -180) rotation = rotation + 360;else if (rotation < -90) rotation = rotation + 180;
  var width = spacing;
  var height = spacing;
  var path;
  if (rotation === 0) {
    path = "\n                M 0 0 L ".concat(width, " 0\n                M 0 ").concat(height, " L ").concat(width, " ").concat(height, "\n            ");
  } else if (rotation === 90) {
    path = "\n                M 0 0 L 0 ".concat(height, "\n                M ").concat(width, " 0 L ").concat(width, " ").concat(height, "\n            ");
  } else {
    width = Math.abs(spacing / Math.sin(degreesToRadians(rotation)));
    height = spacing / Math.sin(degreesToRadians(90 - rotation));
    if (rotation > 0) {
      path = "\n                    M 0 ".concat(-height, " L ").concat(width * 2, " ").concat(height, "\n                    M ").concat(-width, " ").concat(-height, " L ").concat(width, " ").concat(height, "\n                    M ").concat(-width, " 0 L ").concat(width, " ").concat(height * 2, "\n                ");
    } else {
      path = "\n                    M ".concat(-width, " ").concat(height, " L ").concat(width, " ").concat(-height, "\n                    M ").concat(-width, " ").concat(height * 2, " L ").concat(width * 2, " ").concat(-height, "\n                    M 0 ").concat(height * 2, " L ").concat(width * 2, " 0\n                ");
    }
  }
  return React__default.createElement("pattern", {
    id: id,
    width: width,
    height: height,
    patternUnits: "userSpaceOnUse"
  }, React__default.createElement("rect", {
    width: width,
    height: height,
    fill: background,
    stroke: "rgba(255, 0, 0, 0.1)",
    strokeWidth: 0
  }), React__default.createElement("path", {
    d: path,
    strokeWidth: lineWidth,
    stroke: color,
    strokeLinecap: "square"
  }));
});
PatternLines.displayName = 'PatternLines';
PatternLines.propTypes = {
  id: PropTypes.string.isRequired,
  spacing: PropTypes.number.isRequired,
  rotation: PropTypes.number.isRequired,
  background: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  lineWidth: PropTypes.number.isRequired
};
PatternLines.defaultProps = {
  spacing: 5,
  rotation: 0,
  color: '#000000',
  background: '#ffffff',
  lineWidth: 2
};
var patternLinesDef = function patternLinesDef(id) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return _objectSpread$6({
    id: id,
    type: 'patternLines'
  }, options);
};

function _objectSpread$7(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$8(target, key, source[key]); }); } return target; }
function _defineProperty$8(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var PatternSquares = React.memo(function (_ref) {
  var id = _ref.id,
      background = _ref.background,
      color = _ref.color,
      size = _ref.size,
      padding = _ref.padding,
      stagger = _ref.stagger;
  var fullSize = size + padding;
  var halfPadding = padding / 2;
  if (stagger === true) {
    fullSize = size * 2 + padding * 2;
  }
  return React__default.createElement("pattern", {
    id: id,
    width: fullSize,
    height: fullSize,
    patternUnits: "userSpaceOnUse"
  }, React__default.createElement("rect", {
    width: fullSize,
    height: fullSize,
    fill: background
  }), React__default.createElement("rect", {
    x: halfPadding,
    y: halfPadding,
    width: size,
    height: size,
    fill: color
  }), stagger && React__default.createElement("rect", {
    x: padding * 1.5 + size,
    y: padding * 1.5 + size,
    width: size,
    height: size,
    fill: color
  }));
});
PatternSquares.displayName = 'PatternSquares';
PatternSquares.propTypes = {
  id: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  background: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  padding: PropTypes.number.isRequired,
  stagger: PropTypes.bool.isRequired
};
PatternSquares.defaultProps = {
  color: '#000000',
  background: '#ffffff',
  size: 4,
  padding: 4,
  stagger: false
};
var patternSquaresDef = function patternSquaresDef(id) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return _objectSpread$7({
    id: id,
    type: 'patternSquares'
  }, options);
};

var patternTypes = {
  patternDots: PatternDots,
  patternLines: PatternLines,
  patternSquares: PatternSquares
};

function _objectWithoutProperties$1(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose$1(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose$1(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
function _objectSpread$8(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$9(target, key, source[key]); }); } return target; }
function _defineProperty$9(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var defsMapping = _objectSpread$8({}, gradientTypes, patternTypes);
var Defs = function Defs(_ref) {
  var definitions = _ref.defs;
  if (!definitions || definitions.length < 1) return null;
  return React__default.createElement("defs", null, definitions.map(function (_ref2) {
    var type = _ref2.type,
        def = _objectWithoutProperties$1(_ref2, ["type"]);
    if (defsMapping[type]) return React__default.createElement(defsMapping[type], _objectSpread$8({
      key: def.id
    }, def));
    return null;
  }));
};
Defs.propTypes = {
  defs: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.oneOf(Object.keys(defsMapping)).isRequired,
    id: PropTypes.string.isRequired
  }))
};
var Defs$1 = React.memo(Defs);

var SvgWrapper = function SvgWrapper(_ref) {
  var width = _ref.width,
      height = _ref.height,
      margin = _ref.margin,
      defs = _ref.defs,
      children = _ref.children;
  var theme = useTheme();
  return React__default.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    role: "img",
    width: width,
    height: height
  }, React__default.createElement(Defs$1, {
    defs: defs
  }), React__default.createElement("rect", {
    width: width,
    height: height,
    fill: theme.background
  }), React__default.createElement("g", {
    transform: "translate(".concat(margin.left, ",").concat(margin.top, ")")
  }, children));
};
SvgWrapper.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  margin: PropTypes.shape({
    top: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired
  }).isRequired,
  defs: PropTypes.array,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired
};

var DotsItemSymbol = function DotsItemSymbol(_ref) {
  var size = _ref.size,
      color = _ref.color,
      borderWidth = _ref.borderWidth,
      borderColor = _ref.borderColor;
  return React__default.createElement("circle", {
    r: size / 2,
    fill: color,
    stroke: borderColor,
    strokeWidth: borderWidth,
    style: {
      pointerEvents: 'none'
    }
  });
};
DotsItemSymbol.propTypes = {
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  borderWidth: PropTypes.number.isRequired,
  borderColor: PropTypes.string.isRequired
};
var DotsItemSymbol$1 = React.memo(DotsItemSymbol);

var DotsItem = function DotsItem(_ref) {
  var x = _ref.x,
      y = _ref.y,
      symbol = _ref.symbol,
      size = _ref.size,
      datum = _ref.datum,
      color = _ref.color,
      borderWidth = _ref.borderWidth,
      borderColor = _ref.borderColor,
      label = _ref.label,
      labelTextAnchor = _ref.labelTextAnchor,
      labelYOffset = _ref.labelYOffset,
      theme = _ref.theme;
  return React__default.createElement("g", {
    transform: "translate(".concat(x, ", ").concat(y, ")"),
    style: {
      pointerEvents: 'none'
    }
  }, React__default.createElement(symbol, {
    size: size,
    color: color,
    datum: datum,
    borderWidth: borderWidth,
    borderColor: borderColor
  }), label && React__default.createElement("text", {
    textAnchor: labelTextAnchor,
    y: labelYOffset,
    style: theme.dots.text
  }, label));
};
DotsItem.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  datum: PropTypes.object.isRequired,
  size: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  borderWidth: PropTypes.number.isRequired,
  borderColor: PropTypes.string.isRequired,
  symbol: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  labelTextAnchor: PropTypes.oneOf(['start', 'middle', 'end']),
  labelYOffset: PropTypes.number.isRequired,
  theme: PropTypes.shape({
    dots: dotsThemePropType.isRequired
  }).isRequired
};
var DotsItemDefaultProps = {
  symbol: DotsItemSymbol$1,
  labelTextAnchor: 'middle',
  labelYOffset: -12
};
DotsItem.defaultProps = DotsItemDefaultProps;
var DotsItem$1 = React.memo(DotsItem);

var computeLabel = function computeLabel(_ref) {
  var axis = _ref.axis,
      width = _ref.width,
      height = _ref.height,
      position = _ref.position,
      offsetX = _ref.offsetX,
      offsetY = _ref.offsetY,
      orientation = _ref.orientation;
  var x = 0;
  var y = 0;
  var rotation = orientation === 'vertical' ? -90 : 0;
  var textAnchor = 'start';
  if (axis === 'x') {
    switch (position) {
      case 'top-left':
        x = -offsetX;
        y = offsetY;
        textAnchor = 'end';
        break;
      case 'top':
        y = -offsetY;
        if (orientation === 'horizontal') {
          textAnchor = 'middle';
        } else {
          textAnchor = 'start';
        }
        break;
      case 'top-right':
        x = offsetX;
        y = offsetY;
        if (orientation === 'horizontal') {
          textAnchor = 'start';
        } else {
          textAnchor = 'end';
        }
        break;
      case 'right':
        x = offsetX;
        y = height / 2;
        if (orientation === 'horizontal') {
          textAnchor = 'start';
        } else {
          textAnchor = 'middle';
        }
        break;
      case 'bottom-right':
        x = offsetX;
        y = height - offsetY;
        textAnchor = 'start';
        break;
      case 'bottom':
        y = height + offsetY;
        if (orientation === 'horizontal') {
          textAnchor = 'middle';
        } else {
          textAnchor = 'end';
        }
        break;
      case 'bottom-left':
        y = height - offsetY;
        x = -offsetX;
        if (orientation === 'horizontal') {
          textAnchor = 'end';
        } else {
          textAnchor = 'start';
        }
        break;
      case 'left':
        x = -offsetX;
        y = height / 2;
        if (orientation === 'horizontal') {
          textAnchor = 'end';
        } else {
          textAnchor = 'middle';
        }
        break;
    }
  } else {
    switch (position) {
      case 'top-left':
        x = offsetX;
        y = -offsetY;
        textAnchor = 'start';
        break;
      case 'top':
        x = width / 2;
        y = -offsetY;
        if (orientation === 'horizontal') {
          textAnchor = 'middle';
        } else {
          textAnchor = 'start';
        }
        break;
      case 'top-right':
        x = width - offsetX;
        y = -offsetY;
        if (orientation === 'horizontal') {
          textAnchor = 'end';
        } else {
          textAnchor = 'start';
        }
        break;
      case 'right':
        x = width + offsetX;
        if (orientation === 'horizontal') {
          textAnchor = 'start';
        } else {
          textAnchor = 'middle';
        }
        break;
      case 'bottom-right':
        x = width - offsetX;
        y = offsetY;
        textAnchor = 'end';
        break;
      case 'bottom':
        x = width / 2;
        y = offsetY;
        if (orientation === 'horizontal') {
          textAnchor = 'middle';
        } else {
          textAnchor = 'end';
        }
        break;
      case 'bottom-left':
        x = offsetX;
        y = offsetY;
        if (orientation === 'horizontal') {
          textAnchor = 'start';
        } else {
          textAnchor = 'end';
        }
        break;
      case 'left':
        x = -offsetX;
        if (orientation === 'horizontal') {
          textAnchor = 'end';
        } else {
          textAnchor = 'middle';
        }
        break;
    }
  }
  return {
    x: x,
    y: y,
    rotation: rotation,
    textAnchor: textAnchor
  };
};
var CartesianMarkersItem = function CartesianMarkersItem(_ref2) {
  var width = _ref2.width,
      height = _ref2.height,
      axis = _ref2.axis,
      scale = _ref2.scale,
      value = _ref2.value,
      lineStyle = _ref2.lineStyle,
      textStyle = _ref2.textStyle,
      legend = _ref2.legend,
      legendPosition = _ref2.legendPosition,
      legendOffsetX = _ref2.legendOffsetX,
      legendOffsetY = _ref2.legendOffsetY,
      legendOrientation = _ref2.legendOrientation;
  var theme = useTheme();
  var x = 0;
  var x2 = 0;
  var y = 0;
  var y2 = 0;
  if (axis === 'y') {
    y = scale(value);
    x2 = width;
  } else {
    x = scale(value);
    y2 = height;
  }
  var legendNode = null;
  if (legend) {
    var legendProps = computeLabel({
      axis: axis,
      width: width,
      height: height,
      position: legendPosition,
      offsetX: legendOffsetX,
      offsetY: legendOffsetY,
      orientation: legendOrientation
    });
    legendNode = React__default.createElement("text", {
      transform: "translate(".concat(legendProps.x, ", ").concat(legendProps.y, ") rotate(").concat(legendProps.rotation, ")"),
      textAnchor: legendProps.textAnchor,
      dominantBaseline: "central",
      style: textStyle
    }, legend);
  }
  return React__default.createElement("g", {
    transform: "translate(".concat(x, ", ").concat(y, ")")
  }, React__default.createElement("line", {
    x1: 0,
    x2: x2,
    y1: 0,
    y2: y2,
    stroke: theme.markers.lineColor,
    strokeWidth: theme.markers.lineStrokeWidth,
    style: lineStyle
  }), legendNode);
};
CartesianMarkersItem.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  axis: PropTypes.oneOf(['x', 'y']).isRequired,
  scale: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  lineStyle: PropTypes.object,
  textStyle: PropTypes.object,
  legend: PropTypes.string,
  legendPosition: PropTypes.oneOf(['top-left', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left']),
  legendOffsetX: PropTypes.number.isRequired,
  legendOffsetY: PropTypes.number.isRequired,
  legendOrientation: PropTypes.oneOf(['horizontal', 'vertical']).isRequired
};
CartesianMarkersItem.defaultProps = {
  legendPosition: 'top-right',
  legendOffsetX: 14,
  legendOffsetY: 14,
  legendOrientation: 'horizontal'
};
var CartesianMarkersItem$1 = React.memo(CartesianMarkersItem);

function _extends$1() { _extends$1 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends$1.apply(this, arguments); }
var CartesianMarkers = function CartesianMarkers(_ref) {
  var markers = _ref.markers,
      width = _ref.width,
      height = _ref.height,
      xScale = _ref.xScale,
      yScale = _ref.yScale;
  if (!markers || markers.length === 0) return null;
  return markers.map(function (marker, i) {
    return React__default.createElement(CartesianMarkersItem$1, _extends$1({
      key: i
    }, marker, {
      width: width,
      height: height,
      scale: marker.axis === 'y' ? yScale : xScale
    }));
  });
};
CartesianMarkers.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  xScale: PropTypes.func.isRequired,
  yScale: PropTypes.func.isRequired,
  markers: PropTypes.arrayOf(PropTypes.shape({
    axis: PropTypes.oneOf(['x', 'y']).isRequired,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
    lineStyle: PropTypes.object,
    textStyle: PropTypes.object
  }))
};
var CartesianMarkers$1 = React.memo(CartesianMarkers);

function _defineProperty$a(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var withCurve = (function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$srcKey = _ref.srcKey,
      srcKey = _ref$srcKey === void 0 ? 'curve' : _ref$srcKey,
      _ref$destKey = _ref.destKey,
      destKey = _ref$destKey === void 0 ? 'curveInterpolator' : _ref$destKey;
  return withProps(function (props) {
    return _defineProperty$a({}, destKey, curveFromProp(props[srcKey]));
  });
});

var withDimensions = (function () {
  return compose(defaultProps({
    margin: defaultMargin
  }), setPropTypes({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    margin: marginPropType
  }), withPropsOnChange(function (props, nextProps) {
    return props.width !== nextProps.width || props.height !== nextProps.height || !isEqual(props.margin, nextProps.margin);
  }, function (props) {
    var margin = Object.assign({}, defaultMargin, props.margin);
    return {
      margin: margin,
      width: props.width - margin.left - margin.right,
      height: props.height - margin.top - margin.bottom,
      outerWidth: props.width,
      outerHeight: props.height
    };
  }));
});

var getLabelGenerator = function getLabelGenerator(_label, labelFormat) {
  var getRawLabel = isFunction(_label) ? _label : function (d) {
    return get(d, _label);
  };
  var formatter;
  if (labelFormat) {
    formatter = isFunction(labelFormat) ? labelFormat : d3Format.format(labelFormat);
  }
  if (formatter) return function (d) {
    return formatter(getRawLabel(d));
  };
  return getRawLabel;
};
var getAccessorFor = function getAccessorFor(directive) {
  return isFunction(directive) ? directive : function (d) {
    return d[directive];
  };
};
var getAccessorOrValue = function getAccessorOrValue(value) {
  return isFunction(value) ? value : function () {
    return value;
  };
};

function _defineProperty$b(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var withHierarchy = (function () {
  var _setPropTypes;
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$srcKey = _ref.srcKey,
      srcKey = _ref$srcKey === void 0 ? 'root' : _ref$srcKey,
      _ref$destKey = _ref.destKey,
      destKey = _ref$destKey === void 0 ? 'root' : _ref$destKey,
      _ref$valueKey = _ref.valueKey,
      valueKey = _ref$valueKey === void 0 ? 'value' : _ref$valueKey,
      _ref$valueDefault = _ref.valueDefault,
      valueDefault = _ref$valueDefault === void 0 ? 'value' : _ref$valueDefault;
  return compose(defaultProps(_defineProperty$b({}, valueKey, valueDefault)), setPropTypes((_setPropTypes = {}, _defineProperty$b(_setPropTypes, srcKey, PropTypes.object.isRequired), _defineProperty$b(_setPropTypes, valueKey, PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired), _setPropTypes)), withPropsOnChange([srcKey, valueKey], function (props) {
    return _defineProperty$b({}, destKey, d3Hierarchy.hierarchy(props[srcKey]).sum(getAccessorFor(props[valueKey])));
  }));
});

var withMotion = (function () {
  return compose(setPropTypes(motionPropTypes), defaultProps({
    animate: defaultAnimate,
    motionDamping: defaultMotionDamping,
    motionStiffness: defaultMotionStiffness
  }), withPropsOnChange(['motionDamping', 'motionStiffness'], function (_ref) {
    var motionDamping = _ref.motionDamping,
        motionStiffness = _ref.motionStiffness;
    return {
      boundSpring: partialRight(reactMotion.spring, {
        damping: motionDamping,
        stiffness: motionStiffness
      })
    };
  }));
});

function _defineProperty$c(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var withTheme = (function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$srcKey = _ref.srcKey,
      srcKey = _ref$srcKey === void 0 ? 'theme' : _ref$srcKey,
      _ref$destKey = _ref.destKey,
      destKey = _ref$destKey === void 0 ? 'theme' : _ref$destKey;
  return compose(setPropTypes(_defineProperty$c({}, srcKey, PropTypes.object)), withPropsOnChange([srcKey], function (props) {
    return _defineProperty$c({}, destKey, extendDefaultTheme(defaultTheme, props[srcKey]));
  }));
});

function _typeof$2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$2 = function _typeof(obj) { return typeof obj; }; } else { _typeof$2 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$2(obj); }
function _objectWithoutProperties$2(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose$2(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose$2(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
function _classCallCheck$2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties$2(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }
function _createClass$2(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties$2(Constructor.prototype, protoProps); if (staticProps) _defineProperties$2(Constructor, staticProps); return Constructor; }
function _possibleConstructorReturn$2(self, call) { if (call && (_typeof$2(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized$2(self); }
function _assertThisInitialized$2(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }
function _getPrototypeOf$2(o) { _getPrototypeOf$2 = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf$2(o); }
function _inherits$2(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf$2(subClass, superClass); }
function _setPrototypeOf$2(o, p) { _setPrototypeOf$2 = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf$2(o, p); }
var containerStyle$1 = {
  position: 'relative'
};
var Container$1 = function Container(_ref) {
  var theme = _ref.theme,
      _ref$renderWrapper = _ref.renderWrapper,
      renderWrapper = _ref$renderWrapper === void 0 ? true : _ref$renderWrapper,
      children = _ref.children,
      animate = _ref.animate,
      motionStiffness = _ref.motionStiffness,
      motionDamping = _ref.motionDamping;
  var container = React.useRef(null);
  var _useTooltipHandlers = tooltip.useTooltipHandlers(container),
      showTooltipAt = _useTooltipHandlers.showTooltipAt,
      showTooltipFromEvent = _useTooltipHandlers.showTooltipFromEvent,
      hideTooltip = _useTooltipHandlers.hideTooltip,
      isTooltipVisible = _useTooltipHandlers.isTooltipVisible,
      tooltipContent = _useTooltipHandlers.tooltipContent,
      tooltipPosition = _useTooltipHandlers.tooltipPosition,
      tooltipAnchor = _useTooltipHandlers.tooltipAnchor;
  return React__default.createElement(ThemeProvider, {
    theme: theme
  }, React__default.createElement(MotionConfigProvider, {
    animate: animate,
    stiffness: motionStiffness,
    damping: motionDamping
  }, React__default.createElement(tooltip.tooltipContext.Provider, {
    value: {
      showTooltipAt: showTooltipAt,
      showTooltipFromEvent: showTooltipFromEvent,
      hideTooltip: hideTooltip
    }
  }, renderWrapper === true && React__default.createElement("div", {
    style: containerStyle$1,
    ref: container
  }, children, isTooltipVisible && React__default.createElement(tooltip.TooltipWrapper, {
    position: tooltipPosition,
    anchor: tooltipAnchor
  }, tooltipContent)), renderWrapper !== true && children)));
};
Container$1.propTypes = {
  children: PropTypes.node.isRequired,
  theme: PropTypes.object,
  animate: PropTypes.bool,
  motionStiffness: PropTypes.number,
  motionDamping: PropTypes.number,
  renderWrapper: PropTypes.bool
};
var withContainer = function withContainer(WrappedComponent) {
  return (
    function (_Component) {
      _inherits$2(_class, _Component);
      function _class() {
        _classCallCheck$2(this, _class);
        return _possibleConstructorReturn$2(this, _getPrototypeOf$2(_class).apply(this, arguments));
      }
      _createClass$2(_class, [{
        key: "render",
        value: function render() {
          var _this$props = this.props,
              theme = _this$props.theme,
              renderWrapper = _this$props.renderWrapper,
              childProps = _objectWithoutProperties$2(_this$props, ["theme", "renderWrapper"]);
          return React__default.createElement(Container$1, {
            theme: theme,
            renderWrapper: renderWrapper,
            animate: childProps.animate,
            motionStiffness: childProps.motionStiffness,
            motionDamping: childProps.motionDamping
          }, React__default.createElement(WrappedComponent, childProps));
        }
      }]);
      return _class;
    }(React.Component)
  );
};

var boxAlignments = ['center', 'top-left', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left'];
var alignBox = function alignBox(box, container, alignment) {
  var deltaX = container.width - box.width;
  var deltaY = container.height - box.height;
  var x = 0;
  var y = 0;
  if (alignment === 'center') {
    x = deltaX / 2;
    y = deltaY / 2;
  }
  if (alignment === 'top') {
    x = deltaX / 2;
  }
  if (alignment === 'top-right') {
    x = deltaX;
  }
  if (alignment === 'right') {
    x = deltaX;
    y = deltaY / 2;
  }
  if (alignment === 'bottom-right') {
    x = deltaX;
    y = deltaY;
  }
  if (alignment === 'bottom') {
    x = deltaX / 2;
    y = deltaY;
  }
  if (alignment === 'bottom-left') {
    y = deltaY;
  }
  if (alignment === 'left') {
    y = deltaY / 2;
  }
  return [x, y];
};

var getDistance = function getDistance(x1, y1, x2, y2) {
  var deltaX = x2 - x1;
  var deltaY = y2 - y1;
  deltaX *= deltaX;
  deltaY *= deltaY;
  return Math.sqrt(deltaX + deltaY);
};
var getAngle = function getAngle(x1, y1, x2, y2) {
  var angle = Math.atan2(y2 - y1, x2 - x1) - Math.PI / 2;
  return angle > 0 ? angle : Math.PI * 2 + angle;
};
var isCursorInRect = function isCursorInRect(x, y, width, height, cursorX, cursorY) {
  return x <= cursorX && cursorX <= x + width && y <= cursorY && cursorY <= y + height;
};
var isCursorInRing = function isCursorInRing(centerX, centerY, radius, innerRadius, cursorX, cursorY) {
  var distance = getDistance(cursorX, cursorY, centerX, centerY);
  return distance < radius && distance > innerRadius;
};
var getHoveredArc = function getHoveredArc(centerX, centerY, radius, innerRadius, arcs, cursorX, cursorY) {
  if (!isCursorInRing(centerX, centerY, radius, innerRadius, cursorX, cursorY)) return null;
  var cursorAngle = getAngle(cursorX, cursorY, centerX, centerY);
  return arcs.find(function (_ref) {
    var startAngle = _ref.startAngle,
        endAngle = _ref.endAngle;
    return cursorAngle >= startAngle && cursorAngle < endAngle;
  });
};

var getRelativeCursor = function getRelativeCursor(el, event) {
  var clientX = event.clientX,
      clientY = event.clientY;
  var bounds = el.getBoundingClientRect();
  return [clientX - bounds.left, clientY - bounds.top];
};

function _objectSpread$9(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$d(target, key, source[key]); }); } return target; }
function _defineProperty$d(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toConsumableArray$1(arr) { return _arrayWithoutHoles$1(arr) || _iterableToArray$1(arr) || _nonIterableSpread$1(); }
function _nonIterableSpread$1() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }
function _iterableToArray$1(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }
function _arrayWithoutHoles$1(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }
var gradientKeys = Object.keys(gradientTypes);
var patternKeys = Object.keys(patternTypes);
var isMatchingDef = function isMatchingDef(predicate, node, dataKey) {
  if (predicate === '*') {
    return true;
  } else if (isFunction(predicate)) {
    return predicate(node);
  } else if (isPlainObject(predicate)) {
    var data = dataKey ? get(node, dataKey) : node;
    return isEqual(pick(data, Object.keys(predicate)), predicate);
  }
  return false;
};
var bindDefs = function bindDefs(defs, nodes, rules) {
  var _ref = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {},
      dataKey = _ref.dataKey,
      _ref$colorKey = _ref.colorKey,
      colorKey = _ref$colorKey === void 0 ? 'color' : _ref$colorKey,
      _ref$targetKey = _ref.targetKey,
      targetKey = _ref$targetKey === void 0 ? 'fill' : _ref$targetKey;
  var boundDefs = [];
  var generatedIds = {};
  if (defs.length && nodes.length) {
    boundDefs = _toConsumableArray$1(defs);
    nodes.forEach(function (node) {
      var _loop = function _loop(i) {
        var _rules$i = rules[i],
            id = _rules$i.id,
            match = _rules$i.match;
        if (isMatchingDef(match, node, dataKey)) {
          var def = defs.find(function (_ref2) {
            var defId = _ref2.id;
            return defId === id;
          });
          if (def) {
            if (patternKeys.includes(def.type)) {
              if (def.background === 'inherit' || def.color === 'inherit') {
                var nodeColor = get(node, colorKey);
                var background = def.background;
                var color = def.color;
                var inheritedId = id;
                if (def.background === 'inherit') {
                  inheritedId = "".concat(inheritedId, ".bg.").concat(nodeColor);
                  background = nodeColor;
                }
                if (def.color === 'inherit') {
                  inheritedId = "".concat(inheritedId, ".fg.").concat(nodeColor);
                  color = nodeColor;
                }
                set(node, targetKey, "url(#".concat(inheritedId, ")"));
                if (!generatedIds[inheritedId]) {
                  boundDefs.push(_objectSpread$9({}, def, {
                    id: inheritedId,
                    background: background,
                    color: color
                  }));
                  generatedIds[inheritedId] = 1;
                }
              } else {
                set(node, targetKey, "url(#".concat(id, ")"));
              }
            } else if (gradientKeys.includes(def.type)) {
              var allColors = def.colors.map(function (_ref3) {
                var color = _ref3.color;
                return color;
              });
              if (allColors.includes('inherit')) {
                var _nodeColor = get(node, colorKey);
                var _inheritedId = id;
                var inheritedDef = _objectSpread$9({}, def, {
                  colors: def.colors.map(function (colorStop, i) {
                    if (colorStop.color !== 'inherit') return colorStop;
                    _inheritedId = "".concat(_inheritedId, ".").concat(i, ".").concat(_nodeColor);
                    return _objectSpread$9({}, colorStop, {
                      color: colorStop.color === 'inherit' ? _nodeColor : colorStop.color
                    });
                  })
                });
                inheritedDef.id = _inheritedId;
                set(node, targetKey, "url(#".concat(_inheritedId, ")"));
                if (!generatedIds[_inheritedId]) {
                  boundDefs.push(inheritedDef);
                  generatedIds[_inheritedId] = 1;
                }
              } else {
                set(node, targetKey, "url(#".concat(id, ")"));
              }
            }
          }
          return "break";
        }
      };
      for (var i = 0; i < rules.length; i++) {
        var _ret = _loop(i);
        if (_ret === "break") break;
      }
    });
  }
  return boundDefs;
};

exports.CartesianMarkers = CartesianMarkers$1;
exports.CartesianMarkersItem = CartesianMarkersItem$1;
exports.Container = Container;
exports.Defs = Defs$1;
exports.DotsItem = DotsItem$1;
exports.DotsItemDefaultProps = DotsItemDefaultProps;
exports.LinearGradient = LinearGradient;
exports.MotionConfigProvider = MotionConfigProvider;
exports.PatternDots = PatternDots;
exports.PatternLines = PatternLines;
exports.PatternSquares = PatternSquares;
exports.ResponsiveWrapper = ResponsiveWrapper;
exports.SmartMotion = SmartMotion;
exports.SvgWrapper = SvgWrapper;
exports.TWO_PI = TWO_PI;
exports.ThemeProvider = ThemeProvider;
exports.absoluteAngleDegrees = absoluteAngleDegrees;
exports.absoluteAngleRadians = absoluteAngleRadians;
exports.alignBox = alignBox;
exports.annotationsPropType = annotationsPropType;
exports.areaCurvePropKeys = areaCurvePropKeys;
exports.areaCurvePropType = areaCurvePropType;
exports.axisThemePropType = axisThemePropType;
exports.bindDefs = bindDefs;
exports.blendModePropType = blendModePropType;
exports.blendModes = blendModes;
exports.boxAlignments = boxAlignments;
exports.closedCurvePropKeys = closedCurvePropKeys;
exports.closedCurvePropType = closedCurvePropType;
exports.colorInterpolatorIds = colorInterpolatorIds;
exports.colorInterpolators = colorInterpolators;
exports.colorSchemeIds = colorSchemeIds;
exports.computeArcBoundingBox = computeArcBoundingBox;
exports.crosshairPropType = crosshairPropType;
exports.curveFromProp = curveFromProp;
exports.curvePropKeys = curvePropKeys;
exports.curvePropMapping = curvePropMapping;
exports.curvePropType = curvePropType;
exports.defaultAnimate = defaultAnimate;
exports.defaultCategoricalColors = defaultCategoricalColors;
exports.defaultColorRange = defaultColorRange;
exports.defaultMargin = defaultMargin;
exports.defaultMotionDamping = defaultMotionDamping;
exports.defaultMotionStiffness = defaultMotionStiffness;
exports.defaultTheme = defaultTheme;
exports.defsPropTypes = defsPropTypes;
exports.degreesToRadians = degreesToRadians;
exports.dotsThemePropType = dotsThemePropType;
exports.extendDefaultTheme = extendDefaultTheme;
exports.getAccessorFor = getAccessorFor;
exports.getAccessorOrValue = getAccessorOrValue;
exports.getAngle = getAngle;
exports.getColorScale = getColorScale;
exports.getDistance = getDistance;
exports.getHoveredArc = getHoveredArc;
exports.getLabelGenerator = getLabelGenerator;
exports.getPolarLabelProps = getPolarLabelProps;
exports.getRelativeCursor = getRelativeCursor;
exports.getValueFormatter = getValueFormatter;
exports.gradientTypes = gradientTypes;
exports.gridThemePropType = gridThemePropType;
exports.guessQuantizeColorScale = guessQuantizeColorScale;
exports.isCursorInRect = isCursorInRect;
exports.isCursorInRing = isCursorInRing;
exports.isMatchingDef = isMatchingDef;
exports.labelsThemePropType = labelsThemePropType;
exports.legendsThemePropType = legendsThemePropType;
exports.lineCurvePropKeys = lineCurvePropKeys;
exports.lineCurvePropType = lineCurvePropType;
exports.linearGradientDef = linearGradientDef;
exports.marginPropType = marginPropType;
exports.markersThemePropType = markersThemePropType;
exports.midAngle = midAngle;
exports.motionConfigContext = motionConfigContext;
exports.motionPropTypes = motionPropTypes;
exports.nivoCategoricalColors = nivoCategoricalColors;
exports.noop = noop;
exports.patternDotsDef = patternDotsDef;
exports.patternLinesDef = patternLinesDef;
exports.patternSquaresDef = patternSquaresDef;
exports.patternTypes = patternTypes;
exports.positionFromAngle = positionFromAngle;
exports.quantizeColorScalePropType = quantizeColorScalePropType;
exports.quantizeColorScales = quantizeColorScales;
exports.quantizeColorScalesKeys = quantizeColorScalesKeys;
exports.radiansToDegrees = radiansToDegrees;
exports.stackOffsetFromProp = stackOffsetFromProp;
exports.stackOffsetPropKeys = stackOffsetPropKeys;
exports.stackOffsetPropMapping = stackOffsetPropMapping;
exports.stackOffsetPropType = stackOffsetPropType;
exports.stackOrderFromProp = stackOrderFromProp;
exports.stackOrderPropKeys = stackOrderPropKeys;
exports.stackOrderPropMapping = stackOrderPropMapping;
exports.stackOrderPropType = stackOrderPropType;
exports.textPropsByEngine = textPropsByEngine;
exports.themeContext = themeContext;
exports.themePropType = themePropType;
exports.treeMapTileFromProp = treeMapTileFromProp;
exports.treeMapTilePropKeys = treeMapTilePropKeys;
exports.treeMapTilePropMapping = treeMapTilePropMapping;
exports.treeMapTilePropType = treeMapTilePropType;
exports.useCurveInterpolation = useCurveInterpolation;
exports.useDimensions = useDimensions;
exports.useMotionConfig = useMotionConfig;
exports.usePartialTheme = usePartialTheme;
exports.useTheme = useTheme;
exports.useValueFormatter = useValueFormatter;
exports.withContainer = withContainer;
exports.withCurve = withCurve;
exports.withDimensions = withDimensions;
exports.withHierarchy = withHierarchy;
exports.withMotion = withMotion;
exports.withTheme = withTheme;
