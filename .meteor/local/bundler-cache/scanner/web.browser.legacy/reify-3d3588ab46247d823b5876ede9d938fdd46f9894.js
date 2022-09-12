'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var d3ScaleChromatic = require('d3-scale-chromatic');
var _isPlainObject = _interopDefault(require('lodash/isPlainObject'));
var _get = _interopDefault(require('lodash/get'));
var react = require('react');
var d3Color = require('d3-color');
var reactMotion = require('react-motion');
var d3Scale = require('d3-scale');
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

var categoricalColorSchemes = {
  nivo: ['#e8c1a0', '#f47560', '#f1e15b', '#e8a838', '#61cdbb', '#97e3d5'],
  category10: d3ScaleChromatic.schemeCategory10,
  accent: d3ScaleChromatic.schemeAccent,
  dark2: d3ScaleChromatic.schemeDark2,
  paired: d3ScaleChromatic.schemePaired,
  pastel1: d3ScaleChromatic.schemePastel1,
  pastel2: d3ScaleChromatic.schemePastel2,
  set1: d3ScaleChromatic.schemeSet1,
  set2: d3ScaleChromatic.schemeSet2,
  set3: d3ScaleChromatic.schemeSet3
};
var categoricalColorSchemeIds = Object.keys(categoricalColorSchemes);

var divergingColorSchemes = {
  brown_blueGreen: d3ScaleChromatic.schemeBrBG,
  purpleRed_green: d3ScaleChromatic.schemePRGn,
  pink_yellowGreen: d3ScaleChromatic.schemePiYG,
  purple_orange: d3ScaleChromatic.schemePuOr,
  red_blue: d3ScaleChromatic.schemeRdBu,
  red_grey: d3ScaleChromatic.schemeRdGy,
  red_yellow_blue: d3ScaleChromatic.schemeRdYlBu,
  red_yellow_green: d3ScaleChromatic.schemeRdYlGn,
  spectral: d3ScaleChromatic.schemeSpectral
};
var divergingColorSchemeIds = Object.keys(divergingColorSchemes);
var divergingColorInterpolators = {
  brown_blueGreen: d3ScaleChromatic.interpolateBrBG,
  purpleRed_green: d3ScaleChromatic.interpolatePRGn,
  pink_yellowGreen: d3ScaleChromatic.interpolatePiYG,
  purple_orange: d3ScaleChromatic.interpolatePuOr,
  red_blue: d3ScaleChromatic.interpolateRdBu,
  red_grey: d3ScaleChromatic.interpolateRdGy,
  red_yellow_blue: d3ScaleChromatic.interpolateRdYlBu,
  red_yellow_green: d3ScaleChromatic.interpolateRdYlGn,
  spectral: d3ScaleChromatic.interpolateSpectral
};

var sequentialColorSchemes = {
  blues: d3ScaleChromatic.schemeBlues,
  greens: d3ScaleChromatic.schemeGreens,
  greys: d3ScaleChromatic.schemeGreys,
  oranges: d3ScaleChromatic.schemeOranges,
  purples: d3ScaleChromatic.schemePurples,
  reds: d3ScaleChromatic.schemeReds,
  blue_green: d3ScaleChromatic.schemeBuGn,
  blue_purple: d3ScaleChromatic.schemeBuPu,
  green_blue: d3ScaleChromatic.schemeGnBu,
  orange_red: d3ScaleChromatic.schemeOrRd,
  purple_blue_green: d3ScaleChromatic.schemePuBuGn,
  purple_blue: d3ScaleChromatic.schemePuBu,
  purple_red: d3ScaleChromatic.schemePuRd,
  red_purple: d3ScaleChromatic.schemeRdPu,
  yellow_green_blue: d3ScaleChromatic.schemeYlGnBu,
  yellow_green: d3ScaleChromatic.schemeYlGn,
  yellow_orange_brown: d3ScaleChromatic.schemeYlOrBr,
  yellow_orange_red: d3ScaleChromatic.schemeYlOrRd
};
var sequentialColorSchemeIds = Object.keys(sequentialColorSchemes);
var sequentialColorInterpolators = {
  blues: d3ScaleChromatic.interpolateBlues,
  greens: d3ScaleChromatic.interpolateGreens,
  greys: d3ScaleChromatic.interpolateGreys,
  oranges: d3ScaleChromatic.interpolateOranges,
  purples: d3ScaleChromatic.interpolatePurples,
  reds: d3ScaleChromatic.interpolateReds,
  turbo: d3ScaleChromatic.interpolateTurbo,
  viridis: d3ScaleChromatic.interpolateViridis,
  inferno: d3ScaleChromatic.interpolateInferno,
  magma: d3ScaleChromatic.interpolateMagma,
  plasma: d3ScaleChromatic.interpolatePlasma,
  cividis: d3ScaleChromatic.interpolateCividis,
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
  yellow_orange_red: d3ScaleChromatic.interpolateYlOrRd
};

var colorSchemes = _objectSpread2(_objectSpread2(_objectSpread2({}, categoricalColorSchemes), divergingColorSchemes), sequentialColorSchemes);
var colorSchemeIds = Object.keys(colorSchemes);
var isCategoricalColorScheme = function isCategoricalColorScheme(scheme) {
  return categoricalColorSchemeIds.includes(scheme);
};
var isDivergingColorScheme = function isDivergingColorScheme(scheme) {
  return divergingColorSchemeIds.includes(scheme);
};
var isSequentialColorScheme = function isSequentialColorScheme(scheme) {
  return sequentialColorSchemeIds.includes(scheme);
};

var cyclicalColorInterpolators = {
  rainbow: d3ScaleChromatic.interpolateRainbow,
  sinebow: d3ScaleChromatic.interpolateSinebow
};

var colorInterpolators = _objectSpread2(_objectSpread2(_objectSpread2({}, divergingColorInterpolators), sequentialColorInterpolators), cyclicalColorInterpolators);
var colorInterpolatorIds = Object.keys(colorInterpolators);

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

function _createForOfIteratorHelper(o, allowArrayLike) {
  var it;
  if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
    if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
      if (it) o = it;
      var i = 0;
      var F = function F() {};
      return {
        s: F,
        n: function n() {
          if (i >= o.length) return {
            done: true
          };
          return {
            done: false,
            value: o[i++]
          };
        },
        e: function e(_e) {
          throw _e;
        },
        f: F
      };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  var normalCompletion = true,
      didErr = false,
      err;
  return {
    s: function s() {
      it = o[Symbol.iterator]();
    },
    n: function n() {
      var step = it.next();
      normalCompletion = step.done;
      return step;
    },
    e: function e(_e2) {
      didErr = true;
      err = _e2;
    },
    f: function f() {
      try {
        if (!normalCompletion && it["return"] != null) it["return"]();
      } finally {
        if (didErr) throw err;
      }
    }
  };
}

var isInheritedColorConfigFromTheme = function isInheritedColorConfigFromTheme(config) {
  return config.theme !== undefined;
};

var isInheritedColorConfigFromContext = function isInheritedColorConfigFromContext(config) {
  return config.from !== undefined;
};

var getInheritedColorGenerator = function getInheritedColorGenerator(config, theme) {
  if (typeof config === 'function') {
    return config;
  }

  if (_isPlainObject(config)) {
    if (isInheritedColorConfigFromTheme(config)) {
      if (theme === undefined) {
        throw new Error("Unable to use color from theme as no theme was provided");
      }

      var themeColor = _get(theme, config.theme);

      if (themeColor === undefined) {
        throw new Error("Color from theme is undefined at path: '".concat(config.theme, "'"));
      }

      return function () {
        return themeColor;
      };
    }

    if (isInheritedColorConfigFromContext(config)) {
      var getColor = function getColor(d) {
        return _get(d, config.from);
      };

      if (Array.isArray(config.modifiers)) {
        var modifiers = [];

        var _iterator = _createForOfIteratorHelper(config.modifiers),
            _step;

        try {
          var _loop = function _loop() {
            var modifier = _step.value;

            var _modifier = _slicedToArray(modifier, 2),
                modifierType = _modifier[0],
                amount = _modifier[1];

            if (modifierType === 'brighter') {
              modifiers.push(function (color) {
                return color.brighter(amount);
              });
            } else if (modifierType === 'darker') {
              modifiers.push(function (color) {
                return color.darker(amount);
              });
            } else if (modifierType === 'opacity') {
              modifiers.push(function (color) {
                color.opacity = amount;
                return color;
              });
            } else {
              throw new Error("Invalid color modifier: '".concat(modifierType, "', must be one of: 'brighter', 'darker', 'opacity'"));
            }
          };

          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            _loop();
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }

        if (modifiers.length === 0) return getColor;
        return function (datum) {
          return modifiers.reduce(function (color, modify) {
            return modify(color);
          }, d3Color.rgb(getColor(datum))).toString();
        };
      }

      return getColor;
    }

    throw new Error("Invalid color spec, you should either specify 'theme' or 'from' when using a config object");
  }

  return function () {
    return config;
  };
};
var useInheritedColor = function useInheritedColor(config, theme) {
  return react.useMemo(function () {
    return getInheritedColorGenerator(config, theme);
  }, [config, theme]);
};

var interpolateColor = function interpolateColor(color, springConfig) {
  var colorComponents = d3Color.rgb(color);

  if (!springConfig) {
    return {
      colorR: colorComponents.r,
      colorG: colorComponents.g,
      colorB: colorComponents.b
    };
  }

  var configWithPrecision = _objectSpread2(_objectSpread2({}, springConfig), {}, {
    precision: 1
  });

  return {
    colorR: reactMotion.spring(colorComponents.r, configWithPrecision),
    colorG: reactMotion.spring(colorComponents.g, configWithPrecision),
    colorB: reactMotion.spring(colorComponents.b, configWithPrecision)
  };
};
var getInterpolatedColor = function getInterpolatedColor(_ref) {
  var colorR = _ref.colorR,
      colorG = _ref.colorG,
      colorB = _ref.colorB;
  return "rgb(".concat(Math.round(Math.max(colorR, 0)), ",").concat(Math.round(Math.max(colorG, 0)), ",").concat(Math.round(Math.max(colorB, 0)), ")");
};

var isOrdinalColorScaleConfigScheme = function isOrdinalColorScaleConfigScheme(config) {
  return config.scheme !== undefined;
};

var isOrdinalColorScaleConfigDatumProperty = function isOrdinalColorScaleConfigDatumProperty(config) {
  return config.datum !== undefined;
};

var getOrdinalColorScale = function getOrdinalColorScale(config, identity) {
  if (typeof config === 'function') {
    return config;
  }

  var getIdentity = typeof identity === 'function' ? identity : function (datum) {
    return _get(datum, identity);
  };

  if (Array.isArray(config)) {
    var scale = d3Scale.scaleOrdinal(config);

    var generator = function generator(datum) {
      return scale(getIdentity(datum));
    };

    generator.scale = scale;
    return generator;
  }

  if (_isPlainObject(config)) {
    if (isOrdinalColorScaleConfigDatumProperty(config)) {
      return function (datum) {
        return _get(datum, config.datum);
      };
    }

    if (isOrdinalColorScaleConfigScheme(config)) {
      if (isCategoricalColorScheme(config.scheme)) {
        var _scale = d3Scale.scaleOrdinal(colorSchemes[config.scheme]);

        var _generator = function _generator(datum) {
          return _scale(getIdentity(datum));
        };

        _generator.scale = _scale;
        return _generator;
      }

      if (isDivergingColorScheme(config.scheme)) {
        if (config.size !== undefined && (config.size < 3 || config.size > 11)) {
          throw new Error("Invalid size '".concat(config.size, "' for diverging color scheme '").concat(config.scheme, "', must be between 3~11"));
        }

        var _scale2 = d3Scale.scaleOrdinal(colorSchemes[config.scheme][config.size || 11]);

        var _generator2 = function _generator2(d) {
          return _scale2(getIdentity(d));
        };

        _generator2.scale = _scale2;
        return _generator2;
      }

      if (isSequentialColorScheme(config.scheme)) {
        if (config.size !== undefined && (config.size < 3 || config.size > 9)) {
          throw new Error("Invalid size '".concat(config.size, "' for sequential color scheme '").concat(config.scheme, "', must be between 3~9"));
        }

        var _scale3 = d3Scale.scaleOrdinal(colorSchemes[config.scheme][config.size || 9]);

        var _generator3 = function _generator3(d) {
          return _scale3(getIdentity(d));
        };

        _generator3.scale = _scale3;
        return _generator3;
      }
    }

    throw new Error("Invalid colors, when using an object, you should either pass a 'datum' or a 'scheme' property");
  }

  return function () {
    return config;
  };
};
var useOrdinalColorScale = function useOrdinalColorScale(config, identity) {
  return react.useMemo(function () {
    return getOrdinalColorScale(config, identity);
  }, [config, identity]);
};

var ordinalColorsPropType = PropTypes.oneOfType([PropTypes.func, PropTypes.arrayOf(PropTypes.string), PropTypes.shape({
  scheme: PropTypes.oneOf(colorSchemeIds).isRequired,
  size: PropTypes.number
}), PropTypes.shape({
  datum: PropTypes.string.isRequired
}), PropTypes.string]);
var colorPropertyAccessorPropType = PropTypes.oneOfType([PropTypes.func, PropTypes.string]);
var inheritedColorPropType = PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.shape({
  theme: PropTypes.string.isRequired
}), PropTypes.shape({
  from: PropTypes.string.isRequired,
  modifiers: PropTypes.arrayOf(PropTypes.array)
})]);

exports.categoricalColorSchemeIds = categoricalColorSchemeIds;
exports.categoricalColorSchemes = categoricalColorSchemes;
exports.colorInterpolatorIds = colorInterpolatorIds;
exports.colorInterpolators = colorInterpolators;
exports.colorPropertyAccessorPropType = colorPropertyAccessorPropType;
exports.colorSchemeIds = colorSchemeIds;
exports.colorSchemes = colorSchemes;
exports.cyclicalColorInterpolators = cyclicalColorInterpolators;
exports.divergingColorInterpolators = divergingColorInterpolators;
exports.divergingColorSchemeIds = divergingColorSchemeIds;
exports.divergingColorSchemes = divergingColorSchemes;
exports.getInheritedColorGenerator = getInheritedColorGenerator;
exports.getInterpolatedColor = getInterpolatedColor;
exports.getOrdinalColorScale = getOrdinalColorScale;
exports.inheritedColorPropType = inheritedColorPropType;
exports.interpolateColor = interpolateColor;
exports.isCategoricalColorScheme = isCategoricalColorScheme;
exports.isDivergingColorScheme = isDivergingColorScheme;
exports.isSequentialColorScheme = isSequentialColorScheme;
exports.ordinalColorsPropType = ordinalColorsPropType;
exports.sequentialColorInterpolators = sequentialColorInterpolators;
exports.sequentialColorSchemeIds = sequentialColorSchemeIds;
exports.sequentialColorSchemes = sequentialColorSchemes;
exports.useInheritedColor = useInheritedColor;
exports.useOrdinalColorScale = useOrdinalColorScale;
//# sourceMappingURL=nivo-colors.cjs.js.map
