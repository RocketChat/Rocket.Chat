'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var react = require('react');
var tooltip = require('@nivo/tooltip');
var PropTypes = _interopDefault(require('prop-types'));
var merge = _interopDefault(require('lodash/merge'));
var get = _interopDefault(require('lodash/get'));
var set = _interopDefault(require('lodash/set'));
var d3Interpolate = require('d3-interpolate');
var web = require('@react-spring/web');
var _isString = _interopDefault(require('lodash/isString'));
var jsxRuntime = require('react/jsx-runtime');
var last = _interopDefault(require('lodash/last'));
var isArray = _interopDefault(require('lodash/isArray'));
var d3Scale = require('d3-scale');
var d3ScaleChromatic = require('d3-scale-chromatic');
var isFunction = _interopDefault(require('lodash/isFunction'));
var without = _interopDefault(require('lodash/without'));
var d3Shape = require('d3-shape');
var d3Hierarchy = require('d3-hierarchy');
var d3Format = require('d3-format');
var d3TimeFormat = require('d3-time-format');
var recompose = require('@nivo/recompose');
var isEqual = _interopDefault(require('lodash/isEqual'));
var isPlainObject = _interopDefault(require('lodash/isPlainObject'));
var pick = _interopDefault(require('lodash/pick'));

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
    text: PropTypes.shape(_objectSpread2({}, textProps)).isRequired
  }).isRequired,
  legend: PropTypes.shape({
    text: PropTypes.shape(_objectSpread2({}, textProps)).isRequired
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
  hidden: PropTypes.shape({
    symbol: PropTypes.shape({
      fill: PropTypes.string.isRequired,
      opacity: PropTypes.number
    }).isRequired,
    text: PropTypes.shape(_objectSpread2(_objectSpread2({}, textProps), {}, {
      opacity: PropTypes.number
    })).isRequired
  }).isRequired,
  text: PropTypes.shape(_objectSpread2({}, textProps)).isRequired
});
var labelsThemePropType = PropTypes.shape({
  text: PropTypes.shape(_objectSpread2({}, textProps)).isRequired
});
var dotsThemePropType = PropTypes.shape({
  text: PropTypes.shape(_objectSpread2({}, textProps)).isRequired
});
var markersThemePropType = PropTypes.shape({
  text: PropTypes.shape(_objectSpread2({}, textProps)).isRequired
});
var crosshairPropType = PropTypes.shape({
  line: PropTypes.shape({
    stroke: PropTypes.string.isRequired,
    strokeWidth: PropTypes.number.isRequired,
    strokeDasharray: PropTypes.string
  }).isRequired
});
var annotationsPropType = PropTypes.shape({
  text: PropTypes.shape(_objectSpread2(_objectSpread2({}, textProps), {}, {
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
    hidden: {
      symbol: {
        fill: '#333333',
        opacity: 0.6
      },
      text: {
        fill: '#333333',
        opacity: 0.6
      }
    },
    text: {}
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
    },
    tableCellValue: {
      fontWeight: 'bold'
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

var motionConfigContext = react.createContext();
var MotionConfigProvider = function MotionConfigProvider(_ref) {
  var children = _ref.children,
      animate = _ref.animate,
      stiffness = _ref.stiffness,
      damping = _ref.damping,
      config = _ref.config;
  var value = react.useMemo(function () {
    var reactSpringConfig = _isString(config) ? web.config[config] : config;
    return {
      animate: animate,
      springConfig: {
        stiffness: stiffness,
        damping: damping
      },
      config: reactSpringConfig
    };
  }, [animate, stiffness, damping, config]);
  return jsxRuntime.jsx(motionConfigContext.Provider, {
    value: value,
    children: children
  });
};
var motionPropTypes = {
  animate: PropTypes.bool,
  motionStiffness: PropTypes.number,
  motionDamping: PropTypes.number,
  motionConfig: PropTypes.oneOfType([PropTypes.oneOf(Object.keys(web.config)), PropTypes.shape({
    mass: PropTypes.number,
    tension: PropTypes.number,
    friction: PropTypes.number,
    clamp: PropTypes.bool,
    precision: PropTypes.number,
    velocity: PropTypes.number,
    duration: PropTypes.number,
    easing: PropTypes.func
  })])
};
var motionDefaultProps = {
  animate: true,
  stiffness: 90,
  damping: 15,
  config: 'default'
};
MotionConfigProvider.defaultProps = motionDefaultProps;

var useMotionConfig = function useMotionConfig() {
  return react.useContext(motionConfigContext);
};

var usePrevious = function usePrevious(value) {
  var ref = react.useRef();
  react.useEffect(function () {
    ref.current = value;
  }, [value]);
  return ref.current;
};
var useAnimatedPath = function useAnimatedPath(path) {
  var _useMotionConfig = useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.config;
  var previousPath = usePrevious(path);
  var interpolator = react.useMemo(function () {
    return d3Interpolate.interpolateString(previousPath, path);
  }, [previousPath, path]);
  var _useSpring = web.useSpring({
    from: {
      value: 0
    },
    to: {
      value: 1
    },
    reset: true,
    config: springConfig,
    immediate: !animate
  }),
      value = _useSpring.value;
  return web.to(value, interpolator);
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
var colorSchemeIds = ['nivo', 'category10', 'accent', 'dark2', 'paired', 'pastel1', 'pastel2', 'set1', 'set2', 'set3', 'brown_blueGreen', 'purpleRed_green', 'pink_yellowGreen', 'purple_orange', 'red_blue', 'red_grey', 'red_yellow_blue', 'red_yellow_green', 'spectral', 'blues', 'greens', 'greys', 'oranges', 'purples', 'reds', 'blue_green', 'blue_purple', 'green_blue', 'orange_red', 'purple_blue_green', 'purple_blue', 'purple_red', 'red_purple', 'yellow_green_blue', 'yellow_green', 'yellow_orange_brown', 'yellow_orange_red'];
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
var colorInterpolatorIds = ['brown_blueGreen', 'purpleRed_green', 'pink_yellowGreen', 'purple_orange', 'red_blue', 'red_grey', 'red_yellow_blue', 'red_yellow_green', 'spectral', 'blues', 'greens', 'greys', 'oranges', 'purples', 'reds', 'viridis', 'inferno', 'magma', 'plasma', 'warm', 'cool', 'cubehelixDefault', 'blue_green', 'blue_purple', 'green_blue', 'orange_red', 'purple_blue_green', 'purple_blue', 'purple_red', 'red_purple', 'yellow_green_blue', 'yellow_green', 'yellow_orange_brown', 'yellow_orange_red', 'rainbow', 'sinebow'];
var nivoCategoricalColors = function nivoCategoricalColors() {
  return d3Scale.scaleOrdinal(['#e8c1a0', '#f47560', '#f1e15b', '#e8a838', '#61cdbb', '#97e3d5']);
};
var getColorScale = function getColorScale(colors, dataScale) {
  if (_isString(colors)) {
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
var blendModes = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];
var blendModePropType = PropTypes.oneOf(blendModes);

var useCurveInterpolation = function useCurveInterpolation(interpolation) {
  return react.useMemo(function () {
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

var useDimensions = function useDimensions(width, height) {
  var partialMargin = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return react.useMemo(function () {
    var margin = _objectSpread2(_objectSpread2({}, defaultMargin), partialMargin);
    return {
      margin: margin,
      innerWidth: width - margin.left - margin.right,
      innerHeight: height - margin.top - margin.bottom,
      outerWidth: width,
      outerHeight: height
    };
  }, [width, height, partialMargin.top, partialMargin.right, partialMargin.bottom, partialMargin.left]);
};

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

var MapShim = (function () {
    if (typeof Map !== 'undefined') {
        return Map;
    }
    function getIndex(arr, key) {
        var result = -1;
        arr.some(function (entry, index) {
            if (entry[0] === key) {
                result = index;
                return true;
            }
            return false;
        });
        return result;
    }
    return  (function () {
        function class_1() {
            this.__entries__ = [];
        }
        Object.defineProperty(class_1.prototype, "size", {
            get: function () {
                return this.__entries__.length;
            },
            enumerable: true,
            configurable: true
        });
        class_1.prototype.get = function (key) {
            var index = getIndex(this.__entries__, key);
            var entry = this.__entries__[index];
            return entry && entry[1];
        };
        class_1.prototype.set = function (key, value) {
            var index = getIndex(this.__entries__, key);
            if (~index) {
                this.__entries__[index][1] = value;
            }
            else {
                this.__entries__.push([key, value]);
            }
        };
        class_1.prototype.delete = function (key) {
            var entries = this.__entries__;
            var index = getIndex(entries, key);
            if (~index) {
                entries.splice(index, 1);
            }
        };
        class_1.prototype.has = function (key) {
            return !!~getIndex(this.__entries__, key);
        };
        class_1.prototype.clear = function () {
            this.__entries__.splice(0);
        };
        class_1.prototype.forEach = function (callback, ctx) {
            if (ctx === void 0) { ctx = null; }
            for (var _i = 0, _a = this.__entries__; _i < _a.length; _i++) {
                var entry = _a[_i];
                callback.call(ctx, entry[1], entry[0]);
            }
        };
        return class_1;
    }());
})();
var isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined' && window.document === document;
var global$1 = (function () {
    if (typeof global !== 'undefined' && global.Math === Math) {
        return global;
    }
    if (typeof self !== 'undefined' && self.Math === Math) {
        return self;
    }
    if (typeof window !== 'undefined' && window.Math === Math) {
        return window;
    }
    return Function('return this')();
})();
var requestAnimationFrame$1 = (function () {
    if (typeof requestAnimationFrame === 'function') {
        return requestAnimationFrame.bind(global$1);
    }
    return function (callback) { return setTimeout(function () { return callback(Date.now()); }, 1000 / 60); };
})();
var trailingTimeout = 2;
function throttle (callback, delay) {
    var leadingCall = false, trailingCall = false, lastCallTime = 0;
    function resolvePending() {
        if (leadingCall) {
            leadingCall = false;
            callback();
        }
        if (trailingCall) {
            proxy();
        }
    }
    function timeoutCallback() {
        requestAnimationFrame$1(resolvePending);
    }
    function proxy() {
        var timeStamp = Date.now();
        if (leadingCall) {
            if (timeStamp - lastCallTime < trailingTimeout) {
                return;
            }
            trailingCall = true;
        }
        else {
            leadingCall = true;
            trailingCall = false;
            setTimeout(timeoutCallback, delay);
        }
        lastCallTime = timeStamp;
    }
    return proxy;
}
var REFRESH_DELAY = 20;
var transitionKeys = ['top', 'right', 'bottom', 'left', 'width', 'height', 'size', 'weight'];
var mutationObserverSupported = typeof MutationObserver !== 'undefined';
var ResizeObserverController =  (function () {
    function ResizeObserverController() {
        this.connected_ = false;
        this.mutationEventsAdded_ = false;
        this.mutationsObserver_ = null;
        this.observers_ = [];
        this.onTransitionEnd_ = this.onTransitionEnd_.bind(this);
        this.refresh = throttle(this.refresh.bind(this), REFRESH_DELAY);
    }
    ResizeObserverController.prototype.addObserver = function (observer) {
        if (!~this.observers_.indexOf(observer)) {
            this.observers_.push(observer);
        }
        if (!this.connected_) {
            this.connect_();
        }
    };
    ResizeObserverController.prototype.removeObserver = function (observer) {
        var observers = this.observers_;
        var index = observers.indexOf(observer);
        if (~index) {
            observers.splice(index, 1);
        }
        if (!observers.length && this.connected_) {
            this.disconnect_();
        }
    };
    ResizeObserverController.prototype.refresh = function () {
        var changesDetected = this.updateObservers_();
        if (changesDetected) {
            this.refresh();
        }
    };
    ResizeObserverController.prototype.updateObservers_ = function () {
        var activeObservers = this.observers_.filter(function (observer) {
            return observer.gatherActive(), observer.hasActive();
        });
        activeObservers.forEach(function (observer) { return observer.broadcastActive(); });
        return activeObservers.length > 0;
    };
    ResizeObserverController.prototype.connect_ = function () {
        if (!isBrowser || this.connected_) {
            return;
        }
        document.addEventListener('transitionend', this.onTransitionEnd_);
        window.addEventListener('resize', this.refresh);
        if (mutationObserverSupported) {
            this.mutationsObserver_ = new MutationObserver(this.refresh);
            this.mutationsObserver_.observe(document, {
                attributes: true,
                childList: true,
                characterData: true,
                subtree: true
            });
        }
        else {
            document.addEventListener('DOMSubtreeModified', this.refresh);
            this.mutationEventsAdded_ = true;
        }
        this.connected_ = true;
    };
    ResizeObserverController.prototype.disconnect_ = function () {
        if (!isBrowser || !this.connected_) {
            return;
        }
        document.removeEventListener('transitionend', this.onTransitionEnd_);
        window.removeEventListener('resize', this.refresh);
        if (this.mutationsObserver_) {
            this.mutationsObserver_.disconnect();
        }
        if (this.mutationEventsAdded_) {
            document.removeEventListener('DOMSubtreeModified', this.refresh);
        }
        this.mutationsObserver_ = null;
        this.mutationEventsAdded_ = false;
        this.connected_ = false;
    };
    ResizeObserverController.prototype.onTransitionEnd_ = function (_a) {
        var _b = _a.propertyName, propertyName = _b === void 0 ? '' : _b;
        var isReflowProperty = transitionKeys.some(function (key) {
            return !!~propertyName.indexOf(key);
        });
        if (isReflowProperty) {
            this.refresh();
        }
    };
    ResizeObserverController.getInstance = function () {
        if (!this.instance_) {
            this.instance_ = new ResizeObserverController();
        }
        return this.instance_;
    };
    ResizeObserverController.instance_ = null;
    return ResizeObserverController;
}());
var defineConfigurable = (function (target, props) {
    for (var _i = 0, _a = Object.keys(props); _i < _a.length; _i++) {
        var key = _a[_i];
        Object.defineProperty(target, key, {
            value: props[key],
            enumerable: false,
            writable: false,
            configurable: true
        });
    }
    return target;
});
var getWindowOf = (function (target) {
    var ownerGlobal = target && target.ownerDocument && target.ownerDocument.defaultView;
    return ownerGlobal || global$1;
});
var emptyRect = createRectInit(0, 0, 0, 0);
function toFloat(value) {
    return parseFloat(value) || 0;
}
function getBordersSize(styles) {
    var positions = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        positions[_i - 1] = arguments[_i];
    }
    return positions.reduce(function (size, position) {
        var value = styles['border-' + position + '-width'];
        return size + toFloat(value);
    }, 0);
}
function getPaddings(styles) {
    var positions = ['top', 'right', 'bottom', 'left'];
    var paddings = {};
    for (var _i = 0, positions_1 = positions; _i < positions_1.length; _i++) {
        var position = positions_1[_i];
        var value = styles['padding-' + position];
        paddings[position] = toFloat(value);
    }
    return paddings;
}
function getSVGContentRect(target) {
    var bbox = target.getBBox();
    return createRectInit(0, 0, bbox.width, bbox.height);
}
function getHTMLElementContentRect(target) {
    var clientWidth = target.clientWidth, clientHeight = target.clientHeight;
    if (!clientWidth && !clientHeight) {
        return emptyRect;
    }
    var styles = getWindowOf(target).getComputedStyle(target);
    var paddings = getPaddings(styles);
    var horizPad = paddings.left + paddings.right;
    var vertPad = paddings.top + paddings.bottom;
    var width = toFloat(styles.width), height = toFloat(styles.height);
    if (styles.boxSizing === 'border-box') {
        if (Math.round(width + horizPad) !== clientWidth) {
            width -= getBordersSize(styles, 'left', 'right') + horizPad;
        }
        if (Math.round(height + vertPad) !== clientHeight) {
            height -= getBordersSize(styles, 'top', 'bottom') + vertPad;
        }
    }
    if (!isDocumentElement(target)) {
        var vertScrollbar = Math.round(width + horizPad) - clientWidth;
        var horizScrollbar = Math.round(height + vertPad) - clientHeight;
        if (Math.abs(vertScrollbar) !== 1) {
            width -= vertScrollbar;
        }
        if (Math.abs(horizScrollbar) !== 1) {
            height -= horizScrollbar;
        }
    }
    return createRectInit(paddings.left, paddings.top, width, height);
}
var isSVGGraphicsElement = (function () {
    if (typeof SVGGraphicsElement !== 'undefined') {
        return function (target) { return target instanceof getWindowOf(target).SVGGraphicsElement; };
    }
    return function (target) { return (target instanceof getWindowOf(target).SVGElement &&
        typeof target.getBBox === 'function'); };
})();
function isDocumentElement(target) {
    return target === getWindowOf(target).document.documentElement;
}
function getContentRect(target) {
    if (!isBrowser) {
        return emptyRect;
    }
    if (isSVGGraphicsElement(target)) {
        return getSVGContentRect(target);
    }
    return getHTMLElementContentRect(target);
}
function createReadOnlyRect(_a) {
    var x = _a.x, y = _a.y, width = _a.width, height = _a.height;
    var Constr = typeof DOMRectReadOnly !== 'undefined' ? DOMRectReadOnly : Object;
    var rect = Object.create(Constr.prototype);
    defineConfigurable(rect, {
        x: x, y: y, width: width, height: height,
        top: y,
        right: x + width,
        bottom: height + y,
        left: x
    });
    return rect;
}
function createRectInit(x, y, width, height) {
    return { x: x, y: y, width: width, height: height };
}
var ResizeObservation =  (function () {
    function ResizeObservation(target) {
        this.broadcastWidth = 0;
        this.broadcastHeight = 0;
        this.contentRect_ = createRectInit(0, 0, 0, 0);
        this.target = target;
    }
    ResizeObservation.prototype.isActive = function () {
        var rect = getContentRect(this.target);
        this.contentRect_ = rect;
        return (rect.width !== this.broadcastWidth ||
            rect.height !== this.broadcastHeight);
    };
    ResizeObservation.prototype.broadcastRect = function () {
        var rect = this.contentRect_;
        this.broadcastWidth = rect.width;
        this.broadcastHeight = rect.height;
        return rect;
    };
    return ResizeObservation;
}());
var ResizeObserverEntry =  (function () {
    function ResizeObserverEntry(target, rectInit) {
        var contentRect = createReadOnlyRect(rectInit);
        defineConfigurable(this, { target: target, contentRect: contentRect });
    }
    return ResizeObserverEntry;
}());
var ResizeObserverSPI =  (function () {
    function ResizeObserverSPI(callback, controller, callbackCtx) {
        this.activeObservations_ = [];
        this.observations_ = new MapShim();
        if (typeof callback !== 'function') {
            throw new TypeError('The callback provided as parameter 1 is not a function.');
        }
        this.callback_ = callback;
        this.controller_ = controller;
        this.callbackCtx_ = callbackCtx;
    }
    ResizeObserverSPI.prototype.observe = function (target) {
        if (!arguments.length) {
            throw new TypeError('1 argument required, but only 0 present.');
        }
        if (typeof Element === 'undefined' || !(Element instanceof Object)) {
            return;
        }
        if (!(target instanceof getWindowOf(target).Element)) {
            throw new TypeError('parameter 1 is not of type "Element".');
        }
        var observations = this.observations_;
        if (observations.has(target)) {
            return;
        }
        observations.set(target, new ResizeObservation(target));
        this.controller_.addObserver(this);
        this.controller_.refresh();
    };
    ResizeObserverSPI.prototype.unobserve = function (target) {
        if (!arguments.length) {
            throw new TypeError('1 argument required, but only 0 present.');
        }
        if (typeof Element === 'undefined' || !(Element instanceof Object)) {
            return;
        }
        if (!(target instanceof getWindowOf(target).Element)) {
            throw new TypeError('parameter 1 is not of type "Element".');
        }
        var observations = this.observations_;
        if (!observations.has(target)) {
            return;
        }
        observations.delete(target);
        if (!observations.size) {
            this.controller_.removeObserver(this);
        }
    };
    ResizeObserverSPI.prototype.disconnect = function () {
        this.clearActive();
        this.observations_.clear();
        this.controller_.removeObserver(this);
    };
    ResizeObserverSPI.prototype.gatherActive = function () {
        var _this = this;
        this.clearActive();
        this.observations_.forEach(function (observation) {
            if (observation.isActive()) {
                _this.activeObservations_.push(observation);
            }
        });
    };
    ResizeObserverSPI.prototype.broadcastActive = function () {
        if (!this.hasActive()) {
            return;
        }
        var ctx = this.callbackCtx_;
        var entries = this.activeObservations_.map(function (observation) {
            return new ResizeObserverEntry(observation.target, observation.broadcastRect());
        });
        this.callback_.call(ctx, entries, ctx);
        this.clearActive();
    };
    ResizeObserverSPI.prototype.clearActive = function () {
        this.activeObservations_.splice(0);
    };
    ResizeObserverSPI.prototype.hasActive = function () {
        return this.activeObservations_.length > 0;
    };
    return ResizeObserverSPI;
}());
var observers = typeof WeakMap !== 'undefined' ? new WeakMap() : new MapShim();
var ResizeObserver =  (function () {
    function ResizeObserver(callback) {
        if (!(this instanceof ResizeObserver)) {
            throw new TypeError('Cannot call a class as a function.');
        }
        if (!arguments.length) {
            throw new TypeError('1 argument required, but only 0 present.');
        }
        var controller = ResizeObserverController.getInstance();
        var observer = new ResizeObserverSPI(callback, controller, this);
        observers.set(this, observer);
    }
    return ResizeObserver;
}());
[
    'observe',
    'unobserve',
    'disconnect'
].forEach(function (method) {
    ResizeObserver.prototype[method] = function () {
        var _a;
        return (_a = observers.get(this))[method].apply(_a, arguments);
    };
});
var index = (function () {
    if (typeof global$1.ResizeObserver !== 'undefined') {
        return global$1.ResizeObserver;
    }
    return ResizeObserver;
})();

var useMeasure = function useMeasure() {
  var measureRef = react.useRef(null);
  var _useState = react.useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0
  }),
      _useState2 = _slicedToArray(_useState, 2),
      bounds = _useState2[0],
      setBounds = _useState2[1];
  var _useState3 = react.useState(function () {
    return new index(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 1),
          entry = _ref2[0];
      return setBounds(entry.contentRect);
    });
  }),
      _useState4 = _slicedToArray(_useState3, 1),
      observer = _useState4[0];
  react.useEffect(function () {
    if (measureRef.current) {
      observer.observe(measureRef.current);
    }
    return function () {
      return observer.disconnect();
    };
  }, []);
  return [measureRef, bounds];
};

var usePartialTheme = function usePartialTheme(partialTheme) {
  return react.useMemo(function () {
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
    return "".concat(v);
  };
};
var useValueFormatter = function useValueFormatter(format) {
  return react.useMemo(function () {
    return getValueFormatter(format);
  }, [format]);
};

var themeContext = react.createContext();
var defaultPartialTheme = {};
var ThemeProvider = function ThemeProvider(_ref) {
  var _ref$theme = _ref.theme,
      partialTheme = _ref$theme === void 0 ? defaultPartialTheme : _ref$theme,
      children = _ref.children;
  var theme = usePartialTheme(partialTheme);
  return jsxRuntime.jsx(themeContext.Provider, {
    value: theme,
    children: children
  });
};
var useTheme = function useTheme() {
  return react.useContext(themeContext);
};

var ConditionalWrapper = function ConditionalWrapper(_ref) {
  var children = _ref.children,
      condition = _ref.condition,
      wrapper = _ref.wrapper;
  if (!condition) return children;
  return react.cloneElement(wrapper, {}, children);
};

var containerStyle = {
  position: 'relative'
};
var Container = function Container(_ref) {
  var children = _ref.children,
      theme = _ref.theme,
      _ref$renderWrapper = _ref.renderWrapper,
      renderWrapper = _ref$renderWrapper === void 0 ? true : _ref$renderWrapper,
      _ref$isInteractive = _ref.isInteractive,
      isInteractive = _ref$isInteractive === void 0 ? true : _ref$isInteractive,
      animate = _ref.animate,
      motionStiffness = _ref.motionStiffness,
      motionDamping = _ref.motionDamping,
      motionConfig = _ref.motionConfig;
  var container = react.useRef(null);
  return jsxRuntime.jsx(ThemeProvider, {
    theme: theme,
    children: jsxRuntime.jsx(MotionConfigProvider, {
      animate: animate,
      stiffness: motionStiffness,
      damping: motionDamping,
      config: motionConfig,
      children: jsxRuntime.jsx(tooltip.TooltipProvider, {
        container: container,
        children: jsxRuntime.jsxs(ConditionalWrapper, {
          condition: renderWrapper,
          wrapper: jsxRuntime.jsx("div", {
            style: containerStyle,
            ref: container
          }),
          children: [children, isInteractive && jsxRuntime.jsx(tooltip.Tooltip, {})]
        })
      })
    })
  });
};

var noop = (function () {});

var containerStyle$1 = {
  position: 'relative'
};
var LegacyContainer = function LegacyContainer(_ref) {
  var children = _ref.children,
      theme = _ref.theme,
      _ref$isInteractive = _ref.isInteractive,
      isInteractive = _ref$isInteractive === void 0 ? true : _ref$isInteractive,
      _ref$renderWrapper = _ref.renderWrapper,
      renderWrapper = _ref$renderWrapper === void 0 ? true : _ref$renderWrapper,
      animate = _ref.animate,
      motionStiffness = _ref.motionStiffness,
      motionDamping = _ref.motionDamping,
      motionConfig = _ref.motionConfig;
  var container = react.useRef(null);
  var _useTooltipHandlers = tooltip.useTooltipHandlers(container),
      tooltipActions = _useTooltipHandlers.actions,
      tooltipState = _useTooltipHandlers.state;
  var showTooltip = react.useCallback(function (content, event) {
    return tooltipActions.showTooltipFromEvent(content, event);
  }, [tooltipActions.showTooltipFromEvent]);
  var handlers = react.useMemo(function () {
    return {
      showTooltip: isInteractive ? showTooltip : noop,
      hideTooltip: isInteractive ? tooltipActions.hideTooltip : noop
    };
  }, [tooltipActions.hideTooltip, isInteractive, showTooltip]);
  return jsxRuntime.jsx(ThemeProvider, {
    theme: theme,
    children: jsxRuntime.jsx(MotionConfigProvider, {
      animate: animate,
      stiffness: motionStiffness,
      damping: motionDamping,
      config: motionConfig,
      children: jsxRuntime.jsx(tooltip.TooltipActionsContext.Provider, {
        value: tooltipActions,
        children: jsxRuntime.jsx(tooltip.TooltipStateContext.Provider, {
          value: tooltipState,
          children: jsxRuntime.jsxs(ConditionalWrapper, {
            condition: renderWrapper,
            wrapper: jsxRuntime.jsx("div", {
              style: containerStyle$1,
              ref: container
            }),
            children: [children(handlers), isInteractive && jsxRuntime.jsx(tooltip.Tooltip, {})]
          })
        })
      })
    })
  });
};

var ResponsiveWrapper = function ResponsiveWrapper(_ref) {
  var children = _ref.children;
  var _useMeasure = useMeasure(),
      _useMeasure2 = _slicedToArray(_useMeasure, 2),
      measureRef = _useMeasure2[0],
      bounds = _useMeasure2[1];
  var shouldRender = bounds.width > 0 && bounds.height > 0;
  return jsxRuntime.jsx("div", {
    ref: measureRef,
    style: {
      width: '100%',
      height: '100%'
    },
    children: shouldRender && children({
      width: bounds.width,
      height: bounds.height
    })
  });
};

var LinearGradient = function LinearGradient(_ref) {
  var id = _ref.id,
      colors = _ref.colors;
  return jsxRuntime.jsx("linearGradient", {
    id: id,
    x1: 0,
    x2: 0,
    y1: 0,
    y2: 1,
    children: colors.map(function (_ref2) {
      var offset = _ref2.offset,
          color = _ref2.color,
          opacity = _ref2.opacity;
      return jsxRuntime.jsx("stop", {
        offset: "".concat(offset, "%"),
        stopColor: color,
        stopOpacity: opacity !== undefined ? opacity : 1
      }, offset);
    })
  });
};
var linearGradientDef = function linearGradientDef(id, colors) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  return _objectSpread2({
    id: id,
    type: 'linearGradient',
    colors: colors
  }, options);
};

var gradientTypes = {
  linearGradient: LinearGradient
};

var PatternDots = react.memo(function (_ref) {
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
  return jsxRuntime.jsxs("pattern", {
    id: id,
    width: fullSize,
    height: fullSize,
    patternUnits: "userSpaceOnUse",
    children: [jsxRuntime.jsx("rect", {
      width: fullSize,
      height: fullSize,
      fill: background
    }), jsxRuntime.jsx("circle", {
      cx: halfPadding + radius,
      cy: halfPadding + radius,
      r: radius,
      fill: color
    }), stagger && jsxRuntime.jsx("circle", {
      cx: padding * 1.5 + size + radius,
      cy: padding * 1.5 + size + radius,
      r: radius,
      fill: color
    })]
  });
});
PatternDots.displayName = 'PatternDots';
PatternDots.defaultProps = {
  color: '#000000',
  background: '#ffffff',
  size: 4,
  padding: 4,
  stagger: false
};
var patternDotsDef = function patternDotsDef(id) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return _objectSpread2({
    id: id,
    type: 'patternDots'
  }, options);
};

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

var textPropsByEngine = {
  svg: {
    align: {
      left: 'start',
      center: 'middle',
      right: 'end',
      start: 'start',
      middle: 'middle',
      end: 'end'
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
      right: 'right',
      start: 'left',
      middle: 'center',
      end: 'right'
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

var PatternLines = react.memo(function (_ref) {
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
  return jsxRuntime.jsxs("pattern", {
    id: id,
    width: width,
    height: height,
    patternUnits: "userSpaceOnUse",
    children: [jsxRuntime.jsx("rect", {
      width: width,
      height: height,
      fill: background,
      stroke: "rgba(255, 0, 0, 0.1)",
      strokeWidth: 0
    }), jsxRuntime.jsx("path", {
      d: path,
      strokeWidth: lineWidth,
      stroke: color,
      strokeLinecap: "square"
    })]
  });
});
PatternLines.displayName = 'PatternLines';
PatternLines.defaultProps = {
  spacing: 5,
  rotation: 0,
  color: '#000000',
  background: '#ffffff',
  lineWidth: 2
};
var patternLinesDef = function patternLinesDef(id) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return _objectSpread2({
    id: id,
    type: 'patternLines'
  }, options);
};

var PatternSquares = react.memo(function (_ref) {
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
  return jsxRuntime.jsxs("pattern", {
    id: id,
    width: fullSize,
    height: fullSize,
    patternUnits: "userSpaceOnUse",
    children: [jsxRuntime.jsx("rect", {
      width: fullSize,
      height: fullSize,
      fill: background
    }), jsxRuntime.jsx("rect", {
      x: halfPadding,
      y: halfPadding,
      width: size,
      height: size,
      fill: color
    }), stagger && jsxRuntime.jsx("rect", {
      x: padding * 1.5 + size,
      y: padding * 1.5 + size,
      width: size,
      height: size,
      fill: color
    })]
  });
});
PatternSquares.displayName = 'PatternSquares';
PatternSquares.defaultProps = {
  color: '#000000',
  background: '#ffffff',
  size: 4,
  padding: 4,
  stagger: false
};
var patternSquaresDef = function patternSquaresDef(id) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return _objectSpread2({
    id: id,
    type: 'patternSquares'
  }, options);
};

var patternTypes = {
  patternDots: PatternDots,
  patternLines: PatternLines,
  patternSquares: PatternSquares
};

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

var defsMapping = _objectSpread2(_objectSpread2({}, gradientTypes), patternTypes);
var Defs = function Defs(_ref) {
  var definitions = _ref.defs;
  if (!definitions || definitions.length < 1) return null;
  return jsxRuntime.jsx("defs", {
    children: definitions.map(function (_ref2) {
      var type = _ref2.type,
          def = _objectWithoutProperties(_ref2, ["type"]);
      if (defsMapping[type]) return react.createElement(defsMapping[type], _objectSpread2({
        key: def.id
      }, def));
      return null;
    })
  });
};
var Defs$1 = react.memo(Defs);

var SvgWrapper = function SvgWrapper(_ref) {
  var width = _ref.width,
      height = _ref.height,
      margin = _ref.margin,
      defs = _ref.defs,
      children = _ref.children,
      role = _ref.role;
  var theme = useTheme();
  return jsxRuntime.jsxs("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    role: role,
    width: width,
    height: height,
    children: [jsxRuntime.jsx(Defs$1, {
      defs: defs
    }), jsxRuntime.jsx("rect", {
      width: width,
      height: height,
      fill: theme.background
    }), jsxRuntime.jsx("g", {
      transform: "translate(".concat(margin.left, ",").concat(margin.top, ")"),
      children: children
    })]
  });
};

var DotsItemSymbol = function DotsItemSymbol(_ref) {
  var size = _ref.size,
      color = _ref.color,
      borderWidth = _ref.borderWidth,
      borderColor = _ref.borderColor;
  return jsxRuntime.jsx("circle", {
    r: size / 2,
    fill: color,
    stroke: borderColor,
    strokeWidth: borderWidth,
    style: {
      pointerEvents: 'none'
    }
  });
};
var DotsItemSymbol$1 = react.memo(DotsItemSymbol);

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
  var _useMotionConfig = useMotionConfig(),
      animate = _useMotionConfig.animate,
      springConfig = _useMotionConfig.config;
  var animatedProps = web.useSpring({
    transform: "translate(".concat(x, ", ").concat(y, ")"),
    config: springConfig,
    immediate: !animate
  });
  return jsxRuntime.jsxs(web.animated.g, {
    transform: animatedProps.transform,
    style: {
      pointerEvents: 'none'
    },
    children: [react.createElement(symbol, {
      size: size,
      color: color,
      datum: datum,
      borderWidth: borderWidth,
      borderColor: borderColor
    }), label && jsxRuntime.jsx("text", {
      textAnchor: labelTextAnchor,
      y: labelYOffset,
      style: theme.dots.text,
      children: label
    })]
  });
};
var DotsItemDefaultProps = {
  symbol: DotsItemSymbol$1,
  labelTextAnchor: 'middle',
  labelYOffset: -12
};
DotsItem.defaultProps = DotsItemDefaultProps;
var DotsItem$1 = react.memo(DotsItem);

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
    legendNode = jsxRuntime.jsx("text", {
      transform: "translate(".concat(legendProps.x, ", ").concat(legendProps.y, ") rotate(").concat(legendProps.rotation, ")"),
      textAnchor: legendProps.textAnchor,
      dominantBaseline: "central",
      style: textStyle,
      children: legend
    });
  }
  return jsxRuntime.jsxs("g", {
    transform: "translate(".concat(x, ", ").concat(y, ")"),
    children: [jsxRuntime.jsx("line", {
      x1: 0,
      x2: x2,
      y1: 0,
      y2: y2,
      stroke: theme.markers.lineColor,
      strokeWidth: theme.markers.lineStrokeWidth,
      style: lineStyle
    }), legendNode]
  });
};
CartesianMarkersItem.defaultProps = {
  legendPosition: 'top-right',
  legendOffsetX: 14,
  legendOffsetY: 14,
  legendOrientation: 'horizontal'
};
var CartesianMarkersItem$1 = react.memo(CartesianMarkersItem);

var CartesianMarkers = function CartesianMarkers(_ref) {
  var markers = _ref.markers,
      width = _ref.width,
      height = _ref.height,
      xScale = _ref.xScale,
      yScale = _ref.yScale;
  if (!markers || markers.length === 0) return null;
  return markers.map(function (marker, i) {
    return jsxRuntime.jsx(CartesianMarkersItem$1, _objectSpread2(_objectSpread2({}, marker), {}, {
      width: width,
      height: height,
      scale: marker.axis === 'y' ? yScale : xScale
    }), i);
  });
};
var CartesianMarkers$1 = react.memo(CartesianMarkers);

var withCurve = (function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$srcKey = _ref.srcKey,
      srcKey = _ref$srcKey === void 0 ? 'curve' : _ref$srcKey,
      _ref$destKey = _ref.destKey,
      destKey = _ref$destKey === void 0 ? 'curveInterpolator' : _ref$destKey;
  return recompose.withProps(function (props) {
    return _defineProperty({}, destKey, curveFromProp(props[srcKey]));
  });
});

var withDimensions = (function () {
  return recompose.compose(recompose.defaultProps({
    margin: defaultMargin
  }), recompose.setPropTypes({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    margin: marginPropType
  }), recompose.withPropsOnChange(function (props, nextProps) {
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
var getPropertyAccessor = function getPropertyAccessor(accessor) {
  return isFunction(accessor) ? accessor : function (d) {
    return get(d, accessor);
  };
};
var usePropertyAccessor = function usePropertyAccessor(accessor) {
  return react.useMemo(function () {
    return getPropertyAccessor(accessor);
  }, [accessor]);
};

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
  return recompose.compose(recompose.defaultProps(_defineProperty({}, valueKey, valueDefault)), recompose.setPropTypes((_setPropTypes = {}, _defineProperty(_setPropTypes, srcKey, PropTypes.object.isRequired), _defineProperty(_setPropTypes, valueKey, PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired), _setPropTypes)), recompose.withPropsOnChange([srcKey, valueKey], function (props) {
    return _defineProperty({}, destKey, d3Hierarchy.hierarchy(props[srcKey]).sum(getPropertyAccessor(props[valueKey])));
  }));
});

var withMotion = (function () {
  return recompose.compose(recompose.setPropTypes(motionPropTypes), recompose.defaultProps({
    animate: defaultAnimate,
    motionDamping: defaultMotionDamping,
    motionStiffness: defaultMotionStiffness
  }));
});

var withTheme = (function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$srcKey = _ref.srcKey,
      srcKey = _ref$srcKey === void 0 ? 'theme' : _ref$srcKey,
      _ref$destKey = _ref.destKey,
      destKey = _ref$destKey === void 0 ? 'theme' : _ref$destKey;
  return recompose.compose(recompose.setPropTypes(_defineProperty({}, srcKey, PropTypes.object)), recompose.withPropsOnChange([srcKey], function (props) {
    return _defineProperty({}, destKey, extendDefaultTheme(defaultTheme, props[srcKey]));
  }));
});

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };
  return _setPrototypeOf(o, p);
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;
  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _typeof(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }
  return _typeof(obj);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }
  return _assertThisInitialized(self);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();
  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
        result;
    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;
      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }
    return _possibleConstructorReturn(this, result);
  };
}

var withContainer = function withContainer(WrappedComponent) {
  return function (_Component) {
    _inherits(_class, _Component);
    var _super = _createSuper(_class);
    function _class() {
      _classCallCheck(this, _class);
      return _super.apply(this, arguments);
    }
    _createClass(_class, [{
      key: "render",
      value: function render() {
        var _this$props = this.props,
            theme = _this$props.theme,
            renderWrapper = _this$props.renderWrapper,
            animate = _this$props.animate,
            motionStiffness = _this$props.motionStiffness,
            motionDamping = _this$props.motionDamping,
            motionConfig = _this$props.motionConfig,
            childProps = _objectWithoutProperties(_this$props, ["theme", "renderWrapper", "animate", "motionStiffness", "motionDamping", "motionConfig"]);
        return jsxRuntime.jsx(Container, {
          theme: theme,
          renderWrapper: renderWrapper,
          isInteractive: childProps.isInteractive,
          animate: animate,
          motionStiffness: motionStiffness,
          motionDamping: motionDamping,
          motionConfig: motionConfig,
          children: jsxRuntime.jsx(WrappedComponent, _objectSpread2({}, childProps))
        });
      }
    }]);
    return _class;
  }(react.Component);
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

var getRelativeCursor = function getRelativeCursor(el, event) {
  var clientX = event.clientX,
      clientY = event.clientY;
  var bounds = el.getBoundingClientRect();
  return [clientX - bounds.left, clientY - bounds.top];
};

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

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
    boundDefs = _toConsumableArray(defs);
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
                  boundDefs.push(_objectSpread2(_objectSpread2({}, def), {}, {
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
                var inheritedDef = _objectSpread2(_objectSpread2({}, def), {}, {
                  colors: def.colors.map(function (colorStop, i) {
                    if (colorStop.color !== 'inherit') return colorStop;
                    _inheritedId = "".concat(_inheritedId, ".").concat(i, ".").concat(_nodeColor);
                    return _objectSpread2(_objectSpread2({}, colorStop), {}, {
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
exports.LegacyContainer = LegacyContainer;
exports.LinearGradient = LinearGradient;
exports.MotionConfigProvider = MotionConfigProvider;
exports.PatternDots = PatternDots;
exports.PatternLines = PatternLines;
exports.PatternSquares = PatternSquares;
exports.ResponsiveWrapper = ResponsiveWrapper;
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
exports.getAngle = getAngle;
exports.getColorScale = getColorScale;
exports.getDistance = getDistance;
exports.getLabelGenerator = getLabelGenerator;
exports.getPolarLabelProps = getPolarLabelProps;
exports.getPropertyAccessor = getPropertyAccessor;
exports.getRelativeCursor = getRelativeCursor;
exports.getValueFormatter = getValueFormatter;
exports.gradientTypes = gradientTypes;
exports.gridThemePropType = gridThemePropType;
exports.guessQuantizeColorScale = guessQuantizeColorScale;
exports.isCursorInRect = isCursorInRect;
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
exports.motionDefaultProps = motionDefaultProps;
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
exports.useAnimatedPath = useAnimatedPath;
exports.useCurveInterpolation = useCurveInterpolation;
exports.useDimensions = useDimensions;
exports.useMeasure = useMeasure;
exports.useMotionConfig = useMotionConfig;
exports.usePartialTheme = usePartialTheme;
exports.usePropertyAccessor = usePropertyAccessor;
exports.useTheme = useTheme;
exports.useValueFormatter = useValueFormatter;
exports.withContainer = withContainer;
exports.withCurve = withCurve;
exports.withDimensions = withDimensions;
exports.withHierarchy = withHierarchy;
exports.withMotion = withMotion;
exports.withTheme = withTheme;
//# sourceMappingURL=nivo-core.cjs.js.map
