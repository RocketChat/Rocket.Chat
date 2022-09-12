'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var d3ScaleChromatic = require('d3-scale-chromatic');
var react = require('react');
var get = _interopDefault(require('lodash.get'));
var isPlainObject = _interopDefault(require('lodash.isplainobject'));
var d3Scale = require('d3-scale');
var d3Color = require('d3-color');
var PropTypes = _interopDefault(require('prop-types'));
var reactMotion = require('react-motion');

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
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
var isCategoricalColorScheme = function isCategoricalColorScheme(scheme) {
  return categoricalColorSchemeIds.includes(scheme);
};
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
var isDivergingColorScheme = function isDivergingColorScheme(scheme) {
  return divergingColorSchemeIds.includes(scheme);
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
var isSequentialColorScheme = function isSequentialColorScheme(scheme) {
  return sequentialColorSchemeIds.includes(scheme);
};
var colorSchemes = _objectSpread({}, categoricalColorSchemes, divergingColorSchemes, sequentialColorSchemes);
var colorSchemeIds = Object.keys(colorSchemes);
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
var colorInterpolatorIds = Object.keys(colorInterpolators);

var getOrdinalColorScale = function getOrdinalColorScale(instruction, identity) {
  if (typeof instruction === 'function') return instruction;
  var getIdentity = typeof identity === 'function' ? identity : function (d) {
    return get(d, identity);
  };
  if (Array.isArray(instruction)) {
    var scale = d3Scale.scaleOrdinal(instruction);
    var generator = function generator(d) {
      return scale(getIdentity(d));
    };
    generator.scale = scale;
    return generator;
  }
  if (isPlainObject(instruction)) {
    if (instruction.datum !== undefined) {
      return function (datum) {
        return get(datum, instruction.datum);
      };
    }
    if (instruction.scheme !== undefined) {
      if (isCategoricalColorScheme(instruction.scheme)) {
        var _scale = d3Scale.scaleOrdinal(colorSchemes[instruction.scheme]);
        var _generator = function _generator(d) {
          return _scale(getIdentity(d));
        };
        _generator.scale = _scale;
        return _generator;
      }
      if (isDivergingColorScheme(instruction.scheme)) {
        if (instruction.size !== undefined && (instruction.size < 3 || instruction.size > 11)) {
          throw new Error("Invalid size '".concat(instruction.size, "' for diverging color scheme '").concat(instruction.scheme, "', must be between 3~11"));
        }
        var _scale2 = d3Scale.scaleOrdinal(colorSchemes[instruction.scheme][instruction.size || 11]);
        var _generator2 = function _generator2(d) {
          return _scale2(getIdentity(d));
        };
        _generator2.scale = _scale2;
        return _generator2;
      }
      if (isSequentialColorScheme(instruction.scheme)) {
        if (instruction.size !== undefined && (instruction.size < 3 || instruction.size > 9)) {
          throw new Error("Invalid size '".concat(instruction.size, "' for sequential color scheme '").concat(instruction.scheme, "', must be between 3~9"));
        }
        var _scale3 = d3Scale.scaleOrdinal(colorSchemes[instruction.scheme][instruction.size || 9]);
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
    return instruction;
  };
};
var useOrdinalColorScale = function useOrdinalColorScale(instruction, identity) {
  return react.useMemo(function () {
    return getOrdinalColorScale(instruction, identity);
  }, [instruction, identity]);
};

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }
function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
var getInheritedColorGenerator = function getInheritedColorGenerator(inheritedColor, theme) {
  if (typeof inheritedColor === 'function') return function (node) {
    return inheritedColor(node);
  };
  if (isPlainObject(inheritedColor)) {
    if (inheritedColor.theme !== undefined) {
      if (theme === undefined) {
        throw new Error("Unable to use color from theme as no theme was provided");
      }
      var themeColor = get(theme, inheritedColor.theme);
      if (themeColor === undefined) {
        throw new Error("Color from theme is undefined at path: '".concat(inheritedColor.theme, "'"));
      }
      return function () {
        return themeColor;
      };
    }
    if (inheritedColor.from !== undefined) {
      var getColor = function getColor(datum) {
        return get(datum, inheritedColor.from);
      };
      if (Array.isArray(inheritedColor.modifiers)) {
        var modifiers = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;
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
          for (var _iterator = inheritedColor.modifiers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            _loop();
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
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
    return inheritedColor;
  };
};
var useInheritedColor = function useInheritedColor(parentColor, theme) {
  return react.useMemo(function () {
    return getInheritedColorGenerator(parentColor, theme);
  }, [parentColor, theme]);
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

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(Object(source)); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty$1(target, key, source[key]); }); } return target; }
function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var interpolateColor = function interpolateColor(color, springConfig) {
  var colorComponents = d3Color.rgb(color);
  if (!springConfig) {
    return {
      colorR: colorComponents.r,
      colorG: colorComponents.g,
      colorB: colorComponents.b
    };
  }
  var configWithPrecision = _objectSpread$1({}, springConfig, {
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

exports.categoricalColorSchemeIds = categoricalColorSchemeIds;
exports.categoricalColorSchemes = categoricalColorSchemes;
exports.colorInterpolatorIds = colorInterpolatorIds;
exports.colorInterpolators = colorInterpolators;
exports.colorPropertyAccessorPropType = colorPropertyAccessorPropType;
exports.colorSchemeIds = colorSchemeIds;
exports.colorSchemes = colorSchemes;
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
exports.sequentialColorSchemeIds = sequentialColorSchemeIds;
exports.sequentialColorSchemes = sequentialColorSchemes;
exports.useInheritedColor = useInheritedColor;
exports.useOrdinalColorScale = useOrdinalColorScale;
