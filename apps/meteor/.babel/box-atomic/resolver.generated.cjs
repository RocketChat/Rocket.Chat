"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../../node_modules/invariant/invariant.js
var require_invariant = __commonJS({
  "../../node_modules/invariant/invariant.js"(exports2, module2) {
    "use strict";
    var NODE_ENV = process.env.NODE_ENV;
    var invariant3 = function(condition, format, a, b, c, d, e, f) {
      if (NODE_ENV !== "production") {
        if (format === void 0) {
          throw new Error("invariant requires an error message argument");
        }
      }
      if (!condition) {
        var error;
        if (format === void 0) {
          error = new Error(
            "Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings."
          );
        } else {
          var args = [a, b, c, d, e, f];
          var argIndex = 0;
          error = new Error(
            format.replace(/%s/g, function() {
              return args[argIndex++];
            })
          );
          error.name = "Invariant Violation";
        }
        error.framesToPop = 1;
        throw error;
      }
    };
    module2.exports = invariant3;
  }
});

// ../memo/dist/cjs/memoize.js
var require_memoize = __commonJS({
  "../memo/dist/cjs/memoize.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.clear = exports2.memoize = void 0;
    var store = /* @__PURE__ */ new WeakMap();
    var isCachedValue = (cachedValue, arg, cache) => cache.has(arg) && cache.get(arg) === cachedValue;
    var memoize2 = (fn, _options) => {
      const cache = /* @__PURE__ */ new Map();
      const cacheTimers = /* @__PURE__ */ new Map();
      const memoized = function(arg) {
        const cleanUp = () => {
          cache.delete(arg);
          cacheTimers.delete(arg);
        };
        const cachedValue = cache.get(arg);
        if (isCachedValue(cachedValue, arg, cache)) {
          const oldTimer = cacheTimers.get(arg);
          if (oldTimer) {
            clearTimeout(oldTimer);
          }
          if (_options) {
            const timer = setTimeout(cleanUp, _options.maxAge);
            cacheTimers.set(arg, timer);
          }
          return cachedValue;
        }
        const result = fn.call(this, arg);
        cache.set(arg, result);
        if (_options) {
          const timer = setTimeout(cleanUp, _options.maxAge);
          cacheTimers.set(arg, timer);
        }
        return result;
      };
      store.set(memoized, cache);
      return memoized;
    };
    exports2.memoize = memoize2;
    var clear = (fn) => {
      const cache = store.get(fn);
      cache?.clear();
    };
    exports2.clear = clear;
  }
});

// ../memo/dist/cjs/index.js
var require_cjs = __commonJS({
  "../memo/dist/cjs/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.clear = exports2.memoize = void 0;
    var memoize_1 = require_memoize();
    Object.defineProperty(exports2, "memoize", { enumerable: true, get: function() {
      return memoize_1.memoize;
    } });
    Object.defineProperty(exports2, "clear", { enumerable: true, get: function() {
      return memoize_1.clear;
    } });
  }
});

// poc/box-compiler/resolver.entry.ts
var resolver_entry_exports = {};
__export(resolver_entry_exports, {
  resolve: () => resolve,
  styleProps: () => styleProps
});
module.exports = __toCommonJS(resolver_entry_exports);
var import_css_in_js3 = require("@rocket.chat/css-in-js");

// src/components/Box/stylingProps.ts
var import_css_in_js = require("@rocket.chat/css-in-js");

// ../fuselage-tokens/colors.json
var colors_default = {
  white: "#FFFFFF",
  n100: "#F7F8FA",
  n200: "#F2F3F5",
  n250: "#EBECEF",
  n300: "#EEEFF1",
  n400: "#E4E7EA",
  n450: "#D7DBE0",
  n500: "#CBCED1",
  n600: "#9EA2A8",
  n700: "#6C737A",
  n800: "#2F343D",
  n900: "#1F2329",
  r100: "#FFE9EC",
  r200: "#FFC1C9",
  r300: "#F98F9D",
  r400: "#F5455C",
  r500: "#EC0D2A",
  r600: "#D40C26",
  r700: "#BB0B21",
  r800: "#9B1325",
  r900: "#8B0719",
  r1000: "#6B0513",
  o100: "#FDE8D7",
  o200: "#FAD1B0",
  o300: "#F7B27B",
  o400: "#F59B53",
  o500: "#F38C39",
  o600: "#E26D0E",
  o700: "#BD5A0B",
  o800: "#974809",
  o900: "#713607",
  o1000: "#5B2C06",
  p100: "#F9EFFC",
  p200: "#EDD0F7",
  p300: "#DCA0EF",
  p400: "#CA71E7",
  p500: "#9F22C7",
  p600: "#7F1B9F",
  p700: "#5F1477",
  p800: "#4A105D",
  p900: "#350B42",
  y100: "#FFF8E0",
  y200: "#FFECAD",
  y300: "#FFE383",
  y400: "#FFD95A",
  y500: "#FFD031",
  y600: "#F3BE08",
  y700: "#DFAC00",
  y800: "#AC892F",
  y900: "#8E6300",
  y1000: "#573D00",
  g100: "#E5FBF4",
  g200: "#C0F6E4",
  g300: "#96F0D2",
  g400: "#6CE9C0",
  g500: "#2DE0A5",
  g600: "#1ECB92",
  g700: "#19AC7C",
  g800: "#148660",
  g900: "#106D4F",
  g1000: "#0D5940",
  b100: "#E8F2FF",
  b200: "#D1EBFE",
  b300: "#76B7FC",
  b400: "#549DF9",
  b500: "#156FF5",
  b600: "#095AD2",
  b700: "#10529E",
  b800: "#01336B",
  b900: "#012247"
};

// src/getPaletteColor.ts
var import_invariant = __toESM(require_invariant());
var isPaletteColorRef = (ref) => typeof ref === "string" && ref in colors_default;
var mapTypeToPrefix = {
  neutral: "n",
  blue: "b",
  green: "g",
  yellow: "y",
  red: "r",
  orange: "o",
  purple: "p"
};
var getPaletteColor = (type, grade, alpha) => {
  const ref = `${mapTypeToPrefix[type]}${grade}`;
  (0, import_invariant.default)(isPaletteColorRef(ref), "invalid color reference");
  const baseColor = colors_default[ref];
  const matches = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/.exec(
    baseColor
  );
  (0, import_invariant.default)(!!matches, "invalid color token format");
  if (alpha !== void 0) {
    const [, r, g, b] = matches;
    return [
      `--rcx-color-${type}-${grade}-${(alpha * 100).toFixed(0)}`,
      `rgba(${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}, ${alpha * 100}%)`
    ];
  }
  return [`--rcx-color-${type}-${grade}`, baseColor];
};

// src/helpers/toCSSValue.ts
var toCSSValue = (label, value) => `var(${label}, ${value})`;
var toCSSFontValue = (label, value) => toCSSValue(`--rcx-font-family-${label}`, value);
var toCSSColorValue = (label, value) => toCSSValue(`--rcx-color-${label}`, value);

// src/Theme.ts
var Var = class _Var {
  name;
  value;
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }
  toString() {
    return toCSSColorValue(this.name, this.value);
  }
  theme(name) {
    return new _Var(name, this.toString());
  }
};
var white = new Var("white", "#ffffff");
var throwErrorOnInvalidToken = false;
var neutral = {
  100: new Var("neutral-100", colors_default.n100),
  200: new Var("neutral-200", colors_default.n200),
  250: new Var("neutral-250", colors_default.n250),
  300: new Var("neutral-300", colors_default.n300),
  400: new Var("neutral-400", colors_default.n400),
  450: new Var("neutral-450", colors_default.n450),
  500: new Var("neutral-500", colors_default.n500),
  600: new Var("neutral-600", colors_default.n600),
  700: new Var("neutral-700", colors_default.n700),
  800: new Var("neutral-800", colors_default.n800),
  900: new Var("neutral-900", colors_default.n900)
};
var blue = {
  100: new Var("primary-100", colors_default.b100),
  200: new Var("primary-200", colors_default.b200),
  300: new Var("primary-300", colors_default.b300),
  400: new Var("primary-400", colors_default.b400),
  500: new Var("primary-500", colors_default.b500),
  600: new Var("primary-600", colors_default.b600),
  700: new Var("primary-700", colors_default.b700),
  800: new Var("primary-800", colors_default.b800),
  900: new Var("primary-900", colors_default.b900)
};
var green = {
  100: new Var("success-100", colors_default.g100),
  200: new Var("success-200", colors_default.g200),
  300: new Var("success-300", colors_default.g300),
  400: new Var("success-400", colors_default.g400),
  500: new Var("success-500", colors_default.g500),
  600: new Var("success-600", colors_default.g600),
  700: new Var("success-700", colors_default.g700),
  800: new Var("success-800", colors_default.g800),
  900: new Var("success-900", colors_default.g900)
};
var yellow = {
  100: new Var("warning-100", colors_default.y100),
  200: new Var("warning-200", colors_default.y200),
  300: new Var("warning-300", colors_default.y300),
  400: new Var("warning-400", colors_default.y400),
  500: new Var("warning-500", colors_default.y500),
  600: new Var("warning-600", colors_default.y600),
  700: new Var("warning-700", colors_default.y700),
  800: new Var("warning-800", colors_default.y800),
  900: new Var("warning-900", colors_default.y900)
};
var red = {
  100: new Var("danger-100", colors_default.r100),
  200: new Var("danger-200", colors_default.r200),
  300: new Var("danger-300", colors_default.r300),
  400: new Var("danger-400", colors_default.r400),
  500: new Var("danger-500", colors_default.r500),
  600: new Var("danger-600", colors_default.r600),
  700: new Var("danger-700", colors_default.r700),
  800: new Var("danger-800", colors_default.r800),
  900: new Var("danger-900", colors_default.r900)
};
var orange = {
  100: new Var("service-1-100", colors_default.o100),
  200: new Var("service-1-200", colors_default.o200),
  300: new Var("service-1-300", colors_default.o300),
  400: new Var("service-1-400", colors_default.o400),
  500: new Var("service-1-500", colors_default.o500),
  600: new Var("service-1-600", colors_default.o600),
  700: new Var("service-1-700", colors_default.o700),
  800: new Var("service-1-800", colors_default.o800),
  900: new Var("service-1-900", colors_default.o900)
};
var purple = {
  100: new Var("service-2-100", colors_default.p100),
  200: new Var("service-2-200", colors_default.p200),
  300: new Var("service-2-300", colors_default.p300),
  400: new Var("service-2-400", colors_default.p400),
  500: new Var("service-2-500", colors_default.p500),
  600: new Var("service-2-600", colors_default.p600),
  700: new Var("service-2-700", colors_default.p700),
  800: new Var("service-2-800", colors_default.p800),
  900: new Var("service-2-900", colors_default.p900)
};
var surfaceColors = {
  "surface-light": white.theme("surface-light"),
  "surface-tint": neutral[100].theme("surface-tint"),
  "surface-room": white.theme("surface-room"),
  "surface-neutral": neutral[400].theme("surface-neutral"),
  "surface-disabled": neutral[100].theme("surface-disabled"),
  "surface-hover": neutral[200].theme("surface-hover"),
  "surface-selected": neutral[450].theme("surface-selected"),
  "surface-dark": neutral[800].theme("surface-dark"),
  "surface-featured": purple["700"].theme("surface-featured"),
  "surface-featured-hover": purple["800"].theme("surface-featured-hover"),
  "surface-overlay": neutral[800].theme("surface-overlay"),
  "surface-transparent": "transparent",
  "surface-sidebar": neutral[400].theme("surface-sidebar")
};
var strokeColors = {
  "stroke-extra-light": neutral[250].theme("stroke-extra-light"),
  "stroke-light": neutral[500].theme("stroke-light"),
  "stroke-medium": neutral[600].theme("stroke-medium"),
  "stroke-dark": neutral[700].theme("stroke-dark"),
  "stroke-extra-dark": neutral[800].theme("stroke-extra-dark"),
  "stroke-extra-light-highlight": blue[200].theme(
    "stroke-extra-light-highlight"
  ),
  "stroke-highlight": blue[500].theme("stroke-highlight"),
  "stroke-extra-light-error": red[200].theme("stroke-extra-light-error"),
  "stroke-error": red[500].theme("stroke-error")
};
var textIconColors = {
  "font-white": white.theme("font-white"),
  "font-disabled": neutral[500].theme("font-disabled"),
  "font-annotation": neutral[600].theme("font-annotation"),
  "font-hint": neutral[700].theme("font-hint"),
  "font-secondary-info": neutral[700].theme("font-secondary-info"),
  "font-default": neutral[800].theme("font-default"),
  "font-titles-labels": neutral[900].theme("font-titles-labels"),
  "font-info": blue[600].theme("font-info"),
  "font-danger": red[600].theme("font-danger"),
  "font-pure-black": neutral[800].theme("font-pure-black"),
  "font-pure-white": white.theme("font-pure-white")
};
var statusBackgroundColors = {
  "status-background-info": blue[200].theme("status-background-info"),
  "status-background-success": green[200].theme("status-background-success"),
  "status-background-danger": red[200].theme("status-background-danger"),
  "status-background-warning": yellow[200].theme("status-background-warning"),
  "status-background-warning-2": yellow[100].theme(
    "status-background-warning-2"
  ),
  "status-background-service-1": orange[200].theme(
    "status-background-service-1"
  ),
  "status-background-service-2": purple[200].theme(
    "status-background-service-2"
  )
};
var statusColors = {
  "status-font-on-info": blue[600].theme("status-font-on-info"),
  "status-font-on-success": green[800].theme("status-font-on-success"),
  "status-font-on-warning": yellow[800].theme("status-font-on-warning"),
  "status-font-on-warning-2": neutral[800].theme("status-font-on-warning-2"),
  "status-font-on-danger": red[800].theme("status-font-on-danger"),
  "status-font-on-service-1": orange[800].theme("status-font-on-service-1"),
  "status-font-on-service-2": purple[600].theme("status-font-on-service-2")
};
var badgeBackgroundColors = {
  "badge-background-level-0": neutral[400].theme("badge-background-level-0"),
  "badge-background-level-1": neutral[600].theme("badge-background-level-1"),
  "badge-background-level-2": blue[500].theme("badge-background-level-2"),
  "badge-background-level-3": orange[500].theme("badge-background-level-3"),
  "badge-background-level-4": red[500].theme("badge-background-level-4")
};
var shadowColors = {
  "shadow-elevation-border": strokeColors["stroke-extra-light"].theme(
    "shadow-elevation-border"
  ),
  "shadow-elevation-1": new Var(
    "shadow-elevation-1",
    getPaletteColor("neutral", 800, 0.1)[1]
  ),
  "shadow-elevation-2x": new Var(
    "shadow-elevation-2x",
    getPaletteColor("neutral", 800, 0.08)[1]
  ),
  "shadow-elevation-2y": new Var(
    "shadow-elevation-2y",
    getPaletteColor("neutral", 800, 0.12)[1]
  ),
  "shadow-highlight": blue[200].theme("shadow-highlight"),
  "shadow-danger": red[100].theme("shadow-danger")
};
var isSurfaceColor = (color2) => typeof color2 === "string" && color2 in surfaceColors;
var isStrokeColor = (color2) => typeof color2 === "string" && color2 in strokeColors;
var isTextIconColor = (color2) => typeof color2 === "string" && color2 in textIconColors;
var isBadgeColor = (color2) => typeof color2 === "string" && color2 in badgeBackgroundColors;
var isStatusBackgroundColor = (color2) => typeof color2 === "string" && color2 in statusBackgroundColors;
var isStatusColor = (color2) => typeof color2 === "string" && color2 in statusColors;
var Palette = {
  surface: surfaceColors,
  status: statusBackgroundColors,
  statusColor: statusColors,
  badge: badgeBackgroundColors,
  text: textIconColors,
  stroke: strokeColors,
  shadow: shadowColors
};

// src/helpers/fromCamelToKebab.ts
var fromCamelToKebab = (string) => string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();

// ../fuselage-tokens/typography.json
var typography_default = {
  fontFamilies: {
    sans: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "Oxygen",
      "Ubuntu",
      "Cantarell",
      "Helvetica Neue",
      "Apple Color Emoji",
      "Segoe UI Emoji",
      "Segoe UI Symbol",
      "Meiryo UI",
      "Arial",
      "sans-serif"
    ],
    mono: [
      "Menlo",
      "Monaco",
      "Consolas",
      "Liberation Mono",
      "Courier New",
      "monospace"
    ]
  },
  fontScales: {
    hero: {
      fontSize: 48,
      fontWeight: 800,
      letterSpacing: 0,
      lineHeight: 64
    },
    h1: {
      fontSize: 32,
      fontWeight: 700,
      letterSpacing: 0,
      lineHeight: 40
    },
    h2: {
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: 0,
      lineHeight: 32
    },
    h3: {
      fontSize: 20,
      fontWeight: 700,
      letterSpacing: 0,
      lineHeight: 28
    },
    h4: {
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: 0,
      lineHeight: 24
    },
    h5: {
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: 0,
      lineHeight: 20
    },
    p1: {
      fontSize: 16,
      fontWeight: 400,
      letterSpacing: 0,
      lineHeight: 24
    },
    p1m: {
      fontSize: 16,
      fontWeight: 500,
      letterSpacing: 0,
      lineHeight: 24
    },
    p1b: {
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: 0,
      lineHeight: 24
    },
    p2: {
      fontSize: 14,
      fontWeight: 400,
      letterSpacing: 0,
      lineHeight: 20
    },
    p2m: {
      fontSize: 14,
      fontWeight: 500,
      letterSpacing: 0,
      lineHeight: 20
    },
    p2b: {
      fontSize: 14,
      fontWeight: 700,
      letterSpacing: 0,
      lineHeight: 20
    },
    c1: {
      fontSize: 12,
      fontWeight: 400,
      letterSpacing: 0,
      lineHeight: 16
    },
    c2: {
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 0,
      lineHeight: 16
    },
    micro: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 0,
      lineHeight: 12
    }
  }
};

// src/styleTokens.ts
var import_memo = __toESM(require_cjs());
var import_invariant2 = __toESM(require_invariant());
var measure = (computeSpecialValue) => (0, import_memo.memoize)((value) => {
  if (typeof value === "number") {
    return `${value}px`;
  }
  if (typeof value !== "string") {
    return void 0;
  }
  const xRegExp = /^(neg-|-)?x(\d+)$/;
  const matches = xRegExp.exec(value);
  if (matches) {
    const [, negativeMark, measureInPixelsAsString] = matches;
    const measureInPixels = (negativeMark ? -1 : 1) * parseInt(measureInPixelsAsString, 10);
    return `${measureInPixels / 16}rem`;
  }
  if (computeSpecialValue) {
    return computeSpecialValue(value) || value;
  }
  return value;
});
var borderWidth = measure((value) => {
  if (value === "none") {
    return "0px";
  }
  if (value === "default") {
    return borderWidth("x1");
  }
  return void 0;
});
var borderRadius = measure((value) => {
  if (value === "none") {
    return "0px";
  }
  if (value === "full") {
    return "9999px";
  }
  return void 0;
});
var mapTypeToPrefix2 = {
  neutral: "n",
  blue: "b",
  green: "g",
  yellow: "y",
  red: "r",
  orange: "o",
  purple: "p"
};
var isPaletteColorType = (type) => typeof type === "string" && type in mapTypeToPrefix2;
var isPaletteColorGrade = (grade) => typeof grade === "number" && grade % 100 === 0 && grade / 100 >= 1 && grade / 100 <= 9;
var isPaletteColorAlpha = (alpha) => alpha === void 0 || typeof alpha === "number" && alpha >= 0 && alpha <= 1;
var paletteColorRegex = /^(neutral|blue|green|yellow|red|orange|purple)-(\d+)(-(\d+))?$/;
var strokeColor = (0, import_memo.memoize)((value) => {
  const colorName = `stroke-${value}`;
  if (isStrokeColor(colorName)) {
    return strokeColors[colorName].toString();
  }
  return color(value);
});
var backgroundColor = (0, import_memo.memoize)((value) => {
  const colorName = `surface-${value}`;
  if (isSurfaceColor(value)) {
    return surfaceColors[value].toString();
  }
  if (isSurfaceColor(colorName)) {
    return surfaceColors[colorName].toString();
  }
  if (isStatusBackgroundColor(value)) {
    return statusBackgroundColors[value].toString();
  }
  if (isStatusColor(value)) {
    if (process.env["NODE_ENV"] !== "production" && process.env["NODE_ENV"] !== "test") {
      console.warn(`${value} shouldn't be used as a backgroundColor.`);
    }
    return statusColors[value].toString();
  }
  if (isBadgeColor(value)) {
    return badgeBackgroundColors[value].toString();
  }
  return color(value);
});
var fontColor = (0, import_memo.memoize)((value) => {
  const colorName = `font-${value}`;
  if (isTextIconColor(colorName)) {
    return textIconColors[colorName].toString();
  }
  if (isStatusColor(value)) {
    return statusColors[value].toString();
  }
  return color(value);
});
var color = (0, import_memo.memoize)((value) => {
  if (typeof value !== "string") {
    return;
  }
  if (process.env["NODE_ENV"] !== "production" && process.env["NODE_ENV"] !== "test") {
    console.warn(`invalid color: ${value}`, new Error().stack);
  }
  if (throwErrorOnInvalidToken) {
    throw new Error(
      `The color token "${value}" is deprecated. Please use the new color tokens instead.`
    );
  }
  if (isSurfaceColor(value)) {
    return surfaceColors[value].toString();
  }
  if (isStatusBackgroundColor(value)) {
    return statusBackgroundColors[value].toString();
  }
  if (isStrokeColor(value)) {
    return strokeColors[value].toString();
  }
  if (isTextIconColor(value)) {
    return textIconColors[value].toString();
  }
  if (value === "surface" || value === "surface-light") {
    return surfaceColors["surface-light"].toString();
  }
  if (value === "surface-tint") {
    return toCSSColorValue(value, neutral[100]);
  }
  if (value === "secondary-info") {
    return toCSSColorValue(value, neutral[700]);
  }
  if (value === "surface-neutral") {
    return toCSSColorValue(value, neutral[400]);
  }
  const paletteMatches = paletteColorRegex.exec(String(value));
  if (typeof paletteMatches?.length === "number" && paletteMatches?.length >= 5) {
    const [, type, gradeString, , alphaString] = paletteMatches;
    const grade = parseInt(gradeString, 10);
    const alpha = alphaString !== void 0 ? parseInt(alphaString, 10) / 100 : void 0;
    (0, import_invariant2.default)(isPaletteColorType(type), "invalid color type");
    (0, import_invariant2.default)(isPaletteColorGrade(grade), "invalid color grade");
    (0, import_invariant2.default)(isPaletteColorAlpha(alpha), "invalid color alpha");
    const [customProperty, color2] = getPaletteColor(type, grade, alpha);
    if (customProperty) {
      return toCSSValue(customProperty, color2);
    }
    return color2;
  }
  return value;
});
var size = measure((value) => {
  if (value === "none") {
    return "0px";
  }
  if (value === "full") {
    return "100%";
  }
  if (value === "sw") {
    return "100vw";
  }
  if (value === "sh") {
    return "100vh";
  }
  return void 0;
});
var spacing = measure((value) => {
  if (value === "none") {
    return "0px";
  }
  return void 0;
});
var isFontFamily = (value) => typeof value === "string" && value in typography_default.fontFamilies;
var fontFamily = (0, import_memo.memoize)((value) => {
  if (!isFontFamily(value)) {
    return void 0;
  }
  const fontFamily2 = typography_default.fontFamilies[value].map((fontFace) => fontFace.includes(" ") ? `'${fontFace}'` : fontFace).join(", ");
  return toCSSFontValue(value, fontFamily2);
});
var isFontScale = (value) => typeof value === "string" && value in typography_default.fontScales;
var fontScale = (0, import_memo.memoize)(
  (value) => {
    if (!isFontScale(value)) {
      return void 0;
    }
    const { fontSize, fontWeight, lineHeight, letterSpacing } = typography_default.fontScales[value];
    return {
      fontSize: `${fontSize / 16}rem`,
      fontWeight,
      lineHeight: `${lineHeight / 16}rem`,
      letterSpacing: `${letterSpacing / 16}rem`
    };
  }
);

// src/components/Box/stylingProps.ts
var stringProp = {
  toCSSValue: (value) => typeof value === "string" ? value : void 0
};
var numberOrStringProp = {
  toCSSValue: (value) => {
    if (typeof value === "number" || typeof value === "string") {
      return String(value);
    }
    return void 0;
  }
};
var borderWidthProp = {
  toCSSValue: borderWidth
};
var borderRadiusProp = {
  toCSSValue: borderRadius
};
var backgroundColorProp = {
  toCSSValue: backgroundColor
};
var fontColorProp = {
  toCSSValue: fontColor
};
var strokeColorProp = {
  toCSSValue: strokeColor
};
var sizeProp = {
  toCSSValue: size
};
var insetProp = {
  toCSSValue: spacing
};
var marginProp = {
  toCSSValue: spacing
};
var paddingProp = {
  toCSSValue: spacing
};
var gapProp = {
  toCSSValue: spacing
};
var fontFamilyProp = {
  toCSSValue: fontFamily
};
var fontSizeProp = {
  toCSSValue: (value) => fontScale(value)?.fontSize || size(value)
};
var fontWeightProp = {
  toCSSValue: (value) => value ? String(fontScale(value)?.fontWeight || value) : void 0
};
var lineHeightProp = {
  toCSSValue: (value) => fontScale(value)?.lineHeight || size(value)
};
var letterSpacingProp = {
  toCSSValue: (value) => value ? String(fontScale(value)?.letterSpacing || value) : void 0
};
var propDefs = {
  border: stringProp,
  borderBlock: stringProp,
  borderBlockStart: stringProp,
  borderBlockEnd: stringProp,
  borderInline: stringProp,
  borderInlineStart: stringProp,
  borderInlineEnd: stringProp,
  borderWidth: borderWidthProp,
  borderBlockWidth: borderWidthProp,
  borderBlockStartWidth: borderWidthProp,
  borderBlockEndWidth: borderWidthProp,
  borderInlineWidth: borderWidthProp,
  borderInlineStartWidth: borderWidthProp,
  borderInlineEndWidth: borderWidthProp,
  borderStyle: stringProp,
  borderBlockStyle: stringProp,
  borderBlockStartStyle: stringProp,
  borderBlockEndStyle: stringProp,
  borderInlineStyle: stringProp,
  borderInlineStartStyle: stringProp,
  borderInlineEndStyle: stringProp,
  borderColor: strokeColorProp,
  borderBlockColor: strokeColorProp,
  borderBlockStartColor: strokeColorProp,
  borderBlockEndColor: strokeColorProp,
  borderInlineColor: strokeColorProp,
  borderInlineStartColor: strokeColorProp,
  borderInlineEndColor: strokeColorProp,
  borderRadius: borderRadiusProp,
  borderStartStartRadius: borderRadiusProp,
  borderStartEndRadius: borderRadiusProp,
  borderEndStartRadius: borderRadiusProp,
  borderEndEndRadius: borderRadiusProp,
  color: fontColorProp,
  backgroundColor: backgroundColorProp,
  opacity: numberOrStringProp,
  alignItems: stringProp,
  alignContent: stringProp,
  justifyItems: stringProp,
  justifyContent: stringProp,
  flexWrap: stringProp,
  flexDirection: stringProp,
  flexGrow: numberOrStringProp,
  flexShrink: numberOrStringProp,
  flexBasis: stringProp,
  justifySelf: stringProp,
  alignSelf: stringProp,
  order: numberOrStringProp,
  gap: gapProp,
  rowGap: gapProp,
  columnGap: gapProp,
  width: sizeProp,
  minWidth: sizeProp,
  maxWidth: sizeProp,
  height: sizeProp,
  minHeight: sizeProp,
  maxHeight: sizeProp,
  display: stringProp,
  verticalAlign: stringProp,
  overflow: stringProp,
  overflowX: stringProp,
  overflowY: stringProp,
  objectFit: stringProp,
  position: stringProp,
  zIndex: numberOrStringProp,
  inset: insetProp,
  insetBlock: insetProp,
  insetBlockStart: insetProp,
  insetBlockEnd: insetProp,
  insetInline: insetProp,
  insetInlineStart: insetProp,
  insetInlineEnd: insetProp,
  margin: marginProp,
  marginBlock: marginProp,
  marginBlockStart: marginProp,
  marginBlockEnd: marginProp,
  marginInline: marginProp,
  marginInlineStart: marginProp,
  marginInlineEnd: marginProp,
  padding: paddingProp,
  paddingBlock: paddingProp,
  paddingBlockStart: paddingProp,
  paddingBlockEnd: paddingProp,
  paddingInline: paddingProp,
  paddingInlineStart: paddingProp,
  paddingInlineEnd: paddingProp,
  fontFamily: fontFamilyProp,
  fontSize: fontSizeProp,
  fontStyle: stringProp,
  fontWeight: fontWeightProp,
  letterSpacing: letterSpacingProp,
  lineHeight: lineHeightProp,
  textAlign: stringProp,
  textTransform: stringProp,
  textDecorationLine: stringProp,
  wordBreak: stringProp,
  elevation: {
    toStyle: (value) => {
      if (value === "0") {
        return import_css_in_js.css`
          box-shadow: none;
        `;
      }
      if (value === "1") {
        return import_css_in_js.css`
          box-shadow: 0px 0px 12px 0px ${Palette.shadow["shadow-elevation-1"]};
          border: 1px solid ${Palette.shadow["shadow-elevation-border"]};
        `;
      }
      if (value === "1nb") {
        return import_css_in_js.css`
          box-shadow: 0px 0px 12px 0px ${Palette.shadow["shadow-elevation-1"]};
        `;
      }
      if (value === "2") {
        return import_css_in_js.css`
          box-shadow:
            0px 0px 2px 0px ${Palette.shadow["shadow-elevation-2x"]},
            0px 0px 12px 0px ${Palette.shadow["shadow-elevation-2y"]};
          border: 1px solid ${Palette.shadow["shadow-elevation-border"]};
        `;
      }
      if (value === "2nb") {
        return import_css_in_js.css`
          box-shadow:
            0px 0px 2px 0px ${Palette.shadow["shadow-elevation-2x"]},
            0px 0px 12px 0px ${Palette.shadow["shadow-elevation-2y"]};
        `;
      }
      return void 0;
    }
  },
  invisible: {
    toStyle: (value) => value ? import_css_in_js.css`
            visibility: hidden;
            opacity: 0;
          ` : void 0
  },
  withTruncatedText: {
    toStyle: (value) => value ? import_css_in_js.css`
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ` : void 0
  },
  size: {
    toStyle: (value) => size(value) ? import_css_in_js.css`
            width: ${size(value)} !important;
            height: ${size(value)} !important;
          ` : void 0
  },
  minSize: {
    toStyle: (value) => size(value) ? import_css_in_js.css`
            min-width: ${size(value)} !important;
            min-height: ${size(value)} !important;
          ` : void 0
  },
  maxSize: {
    toStyle: (value) => size(value) ? import_css_in_js.css`
            max-width: ${size(value)} !important;
            max-height: ${size(value)} !important;
          ` : void 0
  },
  fontScale: {
    toStyle: (value) => import_css_in_js.css`
      font-size: ${fontScale(value)?.fontSize} !important;
      font-weight: ${fontScale(value)?.fontWeight} !important;
      letter-spacing: ${fontScale(value)?.letterSpacing} !important;
      line-height: ${fontScale(value)?.lineHeight} !important;
    `
  }
};
var compiledPropDefs = new Map(
  Object.entries(propDefs).map(
    ([propName, propDef]) => {
      if ("toCSSValue" in propDef) {
        const cssProperty = fromCamelToKebab(propName);
        const { toCSSValue: toCSSValue2 } = propDef;
        return [
          propName,
          (value, stylingProps) => {
            const cssValue = toCSSValue2(value);
            if (cssValue === void 0) {
              return;
            }
            stylingProps.set(
              propName,
              import_css_in_js.css`
                ${cssProperty}: ${cssValue} !important;
              `
            );
          }
        ];
      }
      const { toStyle } = propDef;
      return [
        propName,
        (value, stylingProps) => {
          const style = toStyle(value);
          if (style === void 0) {
            return;
          }
          stylingProps.set(propName, style);
        }
      ];
    }
  )
);
var collectStylingProps = (props) => {
  const stylingProps = /* @__PURE__ */ new Map();
  const newProps = {};
  for (const [propName, value] of Object.entries(props)) {
    const inject = compiledPropDefs.get(propName);
    if (!inject) {
      newProps[propName] = value;
      continue;
    }
    if (value === void 0) {
      continue;
    }
    inject(value, stylingProps);
  }
  return [newProps, stylingProps];
};
var extractAtomicStylingProps = (props) => {
  const [newProps, stylingProps] = collectStylingProps(props);
  return [newProps, Array.from(stylingProps.values())];
};

// src/hooks/buildAtomicClassName.ts
var import_css_in_js2 = require("@rocket.chat/css-in-js");
var SINGLE_DECLARATION = /^([a-z-]+):\s*(.+?)\s*(?:!important)?;?$/;
var buildAtomicClassName = (content) => {
  const hash = (0, import_css_in_js2.createClassName)(content).slice("rcx-css-".length);
  const match = SINGLE_DECLARATION.exec(content);
  if (match) {
    const [, property, rawValue] = match;
    const value = rawValue.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (value && value.length <= 24) {
      return `rcx-${property}-${value}-${hash.slice(0, 5)}`;
    }
    return `rcx-${property}-${hash}`;
  }
  return `rcx-css-${hash}`;
};

// poc/box-compiler/resolver.entry.ts
var styleProps = Object.keys(propDefs);
var resolve = (props) => {
  const [, styles] = extractAtomicStylingProps(props);
  return styles.map((cssFn) => {
    const content = cssFn();
    const className = buildAtomicClassName(content);
    return { className, css: (0, import_css_in_js3.transpile)(`.${(0, import_css_in_js3.escapeName)(className)}`, content) };
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  resolve,
  styleProps
});
