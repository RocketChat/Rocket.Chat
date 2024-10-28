var hh = Object.create;
var Po = Object.defineProperty;
var gh = Object.getOwnPropertyDescriptor;
var yh = Object.getOwnPropertyNames;
var vh = Object.getPrototypeOf, bh = Object.prototype.hasOwnProperty;
var a = (e, t) => Po(e, "name", { value: t, configurable: !0 }), br = /* @__PURE__ */ ((e) => typeof require < "u" ? require : typeof Proxy <
"u" ? new Proxy(e, {
  get: (t, r) => (typeof require < "u" ? require : t)[r]
}) : e)(function(e) {
  if (typeof require < "u") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + e + '" is not supported');
});
var V = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports);
var Ih = (e, t, r, n) => {
  if (t && typeof t == "object" || typeof t == "function")
    for (let i of yh(t))
      !bh.call(e, i) && i !== r && Po(e, i, { get: () => t[i], enumerable: !(n = gh(t, i)) || n.enumerable });
  return e;
};
var Be = (e, t, r) => (r = e != null ? hh(vh(e)) : {}, Ih(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  t || !e || !e.__esModule ? Po(r, "default", { value: e, enumerable: !0 }) : r,
  e
));

// ../node_modules/prop-types/lib/ReactPropTypesSecret.js
var _s = V((hC, Cs) => {
  "use strict";
  var xh = "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED";
  Cs.exports = xh;
});

// ../node_modules/prop-types/factoryWithThrowingShims.js
var Ps = V((gC, Os) => {
  "use strict";
  var wh = _s();
  function Ts() {
  }
  a(Ts, "emptyFunction");
  function ks() {
  }
  a(ks, "emptyFunctionWithReset");
  ks.resetWarningCache = Ts;
  Os.exports = function() {
    function e(n, i, o, l, u, c) {
      if (c !== wh) {
        var p = new Error(
          "Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. \
Read more at http://fb.me/use-check-prop-types"
        );
        throw p.name = "Invariant Violation", p;
      }
    }
    a(e, "shim"), e.isRequired = e;
    function t() {
      return e;
    }
    a(t, "getShim");
    var r = {
      array: e,
      bigint: e,
      bool: e,
      func: e,
      number: e,
      object: e,
      string: e,
      symbol: e,
      any: e,
      arrayOf: t,
      element: e,
      elementType: e,
      instanceOf: t,
      node: e,
      objectOf: t,
      oneOf: t,
      oneOfType: t,
      shape: t,
      exact: t,
      checkPropTypes: ks,
      resetWarningCache: Ts
    };
    return r.PropTypes = r, r;
  };
});

// ../node_modules/prop-types/index.js
var Lo = V((IC, As) => {
  As.exports = Ps()();
  var vC, bC;
});

// ../node_modules/react-fast-compare/index.js
var Ds = V((SC, Ms) => {
  var Eh = typeof Element < "u", Ch = typeof Map == "function", _h = typeof Set == "function", Th = typeof ArrayBuffer == "function" && !!ArrayBuffer.
  isView;
  function Jr(e, t) {
    if (e === t) return !0;
    if (e && t && typeof e == "object" && typeof t == "object") {
      if (e.constructor !== t.constructor) return !1;
      var r, n, i;
      if (Array.isArray(e)) {
        if (r = e.length, r != t.length) return !1;
        for (n = r; n-- !== 0; )
          if (!Jr(e[n], t[n])) return !1;
        return !0;
      }
      var o;
      if (Ch && e instanceof Map && t instanceof Map) {
        if (e.size !== t.size) return !1;
        for (o = e.entries(); !(n = o.next()).done; )
          if (!t.has(n.value[0])) return !1;
        for (o = e.entries(); !(n = o.next()).done; )
          if (!Jr(n.value[1], t.get(n.value[0]))) return !1;
        return !0;
      }
      if (_h && e instanceof Set && t instanceof Set) {
        if (e.size !== t.size) return !1;
        for (o = e.entries(); !(n = o.next()).done; )
          if (!t.has(n.value[0])) return !1;
        return !0;
      }
      if (Th && ArrayBuffer.isView(e) && ArrayBuffer.isView(t)) {
        if (r = e.length, r != t.length) return !1;
        for (n = r; n-- !== 0; )
          if (e[n] !== t[n]) return !1;
        return !0;
      }
      if (e.constructor === RegExp) return e.source === t.source && e.flags === t.flags;
      if (e.valueOf !== Object.prototype.valueOf && typeof e.valueOf == "function" && typeof t.valueOf == "function") return e.valueOf() ===
      t.valueOf();
      if (e.toString !== Object.prototype.toString && typeof e.toString == "function" && typeof t.toString == "function") return e.toString() ===
      t.toString();
      if (i = Object.keys(e), r = i.length, r !== Object.keys(t).length) return !1;
      for (n = r; n-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(t, i[n])) return !1;
      if (Eh && e instanceof Element) return !1;
      for (n = r; n-- !== 0; )
        if (!((i[n] === "_owner" || i[n] === "__v" || i[n] === "__o") && e.$$typeof) && !Jr(e[i[n]], t[i[n]]))
          return !1;
      return !0;
    }
    return e !== e && t !== t;
  }
  a(Jr, "equal");
  Ms.exports = /* @__PURE__ */ a(function(t, r) {
    try {
      return Jr(t, r);
    } catch (n) {
      if ((n.message || "").match(/stack|recursion/i))
        return console.warn("react-fast-compare cannot handle circular refs"), !1;
      throw n;
    }
  }, "isEqual");
});

// ../node_modules/invariant/browser.js
var Ns = V((wC, Ls) => {
  "use strict";
  var kh = /* @__PURE__ */ a(function(e, t, r, n, i, o, l, u) {
    if (!e) {
      var c;
      if (t === void 0)
        c = new Error(
          "Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings."
        );
      else {
        var p = [r, n, i, o, l, u], d = 0;
        c = new Error(
          t.replace(/%s/g, function() {
            return p[d++];
          })
        ), c.name = "Invariant Violation";
      }
      throw c.framesToPop = 1, c;
    }
  }, "invariant");
  Ls.exports = kh;
});

// ../node_modules/shallowequal/index.js
var Bs = V((CC, Fs) => {
  Fs.exports = /* @__PURE__ */ a(function(t, r, n, i) {
    var o = n ? n.call(i, t, r) : void 0;
    if (o !== void 0)
      return !!o;
    if (t === r)
      return !0;
    if (typeof t != "object" || !t || typeof r != "object" || !r)
      return !1;
    var l = Object.keys(t), u = Object.keys(r);
    if (l.length !== u.length)
      return !1;
    for (var c = Object.prototype.hasOwnProperty.bind(r), p = 0; p < l.length; p++) {
      var d = l[p];
      if (!c(d))
        return !1;
      var h = t[d], f = r[d];
      if (o = n ? n.call(i, h, f, d) : void 0, o === !1 || o === void 0 && h !== f)
        return !1;
    }
    return !0;
  }, "shallowEqual");
});

// ../node_modules/memoizerific/memoizerific.js
var _n = V((tu, oi) => {
  (function(e) {
    if (typeof tu == "object" && typeof oi < "u")
      oi.exports = e();
    else if (typeof define == "function" && define.amd)
      define([], e);
    else {
      var t;
      typeof window < "u" ? t = window : typeof global < "u" ? t = global : typeof self < "u" ? t = self : t = this, t.memoizerific = e();
    }
  })(function() {
    var e, t, r;
    return (/* @__PURE__ */ a(function n(i, o, l) {
      function u(d, h) {
        if (!o[d]) {
          if (!i[d]) {
            var f = typeof br == "function" && br;
            if (!h && f) return f(d, !0);
            if (c) return c(d, !0);
            var y = new Error("Cannot find module '" + d + "'");
            throw y.code = "MODULE_NOT_FOUND", y;
          }
          var m = o[d] = { exports: {} };
          i[d][0].call(m.exports, function(b) {
            var x = i[d][1][b];
            return u(x || b);
          }, m, m.exports, n, i, o, l);
        }
        return o[d].exports;
      }
      a(u, "s");
      for (var c = typeof br == "function" && br, p = 0; p < l.length; p++) u(l[p]);
      return u;
    }, "e"))({ 1: [function(n, i, o) {
      i.exports = function(l) {
        if (typeof Map != "function" || l) {
          var u = n("./similar");
          return new u();
        } else
          return /* @__PURE__ */ new Map();
      };
    }, { "./similar": 2 }], 2: [function(n, i, o) {
      function l() {
        return this.list = [], this.lastItem = void 0, this.size = 0, this;
      }
      a(l, "Similar"), l.prototype.get = function(u) {
        var c;
        if (this.lastItem && this.isEqual(this.lastItem.key, u))
          return this.lastItem.val;
        if (c = this.indexOf(u), c >= 0)
          return this.lastItem = this.list[c], this.list[c].val;
      }, l.prototype.set = function(u, c) {
        var p;
        return this.lastItem && this.isEqual(this.lastItem.key, u) ? (this.lastItem.val = c, this) : (p = this.indexOf(u), p >= 0 ? (this.lastItem =
        this.list[p], this.list[p].val = c, this) : (this.lastItem = { key: u, val: c }, this.list.push(this.lastItem), this.size++, this));
      }, l.prototype.delete = function(u) {
        var c;
        if (this.lastItem && this.isEqual(this.lastItem.key, u) && (this.lastItem = void 0), c = this.indexOf(u), c >= 0)
          return this.size--, this.list.splice(c, 1)[0];
      }, l.prototype.has = function(u) {
        var c;
        return this.lastItem && this.isEqual(this.lastItem.key, u) ? !0 : (c = this.indexOf(u), c >= 0 ? (this.lastItem = this.list[c], !0) :
        !1);
      }, l.prototype.forEach = function(u, c) {
        var p;
        for (p = 0; p < this.size; p++)
          u.call(c || this, this.list[p].val, this.list[p].key, this);
      }, l.prototype.indexOf = function(u) {
        var c;
        for (c = 0; c < this.size; c++)
          if (this.isEqual(this.list[c].key, u))
            return c;
        return -1;
      }, l.prototype.isEqual = function(u, c) {
        return u === c || u !== u && c !== c;
      }, i.exports = l;
    }, {}], 3: [function(n, i, o) {
      var l = n("map-or-similar");
      i.exports = function(d) {
        var h = new l(!1), f = [];
        return function(y) {
          var m = /* @__PURE__ */ a(function() {
            var b = h, x, _, g = arguments.length - 1, v = Array(g + 1), S = !0, C;
            if ((m.numArgs || m.numArgs === 0) && m.numArgs !== g + 1)
              throw new Error("Memoizerific functions should always be called with the same number of arguments");
            for (C = 0; C < g; C++) {
              if (v[C] = {
                cacheItem: b,
                arg: arguments[C]
              }, b.has(arguments[C])) {
                b = b.get(arguments[C]);
                continue;
              }
              S = !1, x = new l(!1), b.set(arguments[C], x), b = x;
            }
            return S && (b.has(arguments[g]) ? _ = b.get(arguments[g]) : S = !1), S || (_ = y.apply(null, arguments), b.set(arguments[g], _)),
            d > 0 && (v[g] = {
              cacheItem: b,
              arg: arguments[g]
            }, S ? u(f, v) : f.push(v), f.length > d && c(f.shift())), m.wasMemoized = S, m.numArgs = g + 1, _;
          }, "memoizerific");
          return m.limit = d, m.wasMemoized = !1, m.cache = h, m.lru = f, m;
        };
      };
      function u(d, h) {
        var f = d.length, y = h.length, m, b, x;
        for (b = 0; b < f; b++) {
          for (m = !0, x = 0; x < y; x++)
            if (!p(d[b][x].arg, h[x].arg)) {
              m = !1;
              break;
            }
          if (m)
            break;
        }
        d.push(d.splice(b, 1)[0]);
      }
      a(u, "moveToMostRecentLru");
      function c(d) {
        var h = d.length, f = d[h - 1], y, m;
        for (f.cacheItem.delete(f.arg), m = h - 2; m >= 0 && (f = d[m], y = f.cacheItem.get(f.arg), !y || !y.size); m--)
          f.cacheItem.delete(f.arg);
      }
      a(c, "removeCachedResult");
      function p(d, h) {
        return d === h || d !== d && h !== h;
      }
      a(p, "isEqual");
    }, { "map-or-similar": 1 }] }, {}, [3])(3);
  });
});

// ../node_modules/es-errors/index.js
var au = V((lM, iu) => {
  "use strict";
  iu.exports = Error;
});

// ../node_modules/es-errors/eval.js
var lu = V((uM, su) => {
  "use strict";
  su.exports = EvalError;
});

// ../node_modules/es-errors/range.js
var cu = V((cM, uu) => {
  "use strict";
  uu.exports = RangeError;
});

// ../node_modules/es-errors/ref.js
var du = V((pM, pu) => {
  "use strict";
  pu.exports = ReferenceError;
});

// ../node_modules/es-errors/syntax.js
var li = V((dM, fu) => {
  "use strict";
  fu.exports = SyntaxError;
});

// ../node_modules/es-errors/type.js
var sr = V((fM, mu) => {
  "use strict";
  mu.exports = TypeError;
});

// ../node_modules/es-errors/uri.js
var gu = V((mM, hu) => {
  "use strict";
  hu.exports = URIError;
});

// ../node_modules/has-symbols/shams.js
var vu = V((hM, yu) => {
  "use strict";
  yu.exports = /* @__PURE__ */ a(function() {
    if (typeof Symbol != "function" || typeof Object.getOwnPropertySymbols != "function")
      return !1;
    if (typeof Symbol.iterator == "symbol")
      return !0;
    var t = {}, r = Symbol("test"), n = Object(r);
    if (typeof r == "string" || Object.prototype.toString.call(r) !== "[object Symbol]" || Object.prototype.toString.call(n) !== "[object Sy\
mbol]")
      return !1;
    var i = 42;
    t[r] = i;
    for (r in t)
      return !1;
    if (typeof Object.keys == "function" && Object.keys(t).length !== 0 || typeof Object.getOwnPropertyNames == "function" && Object.getOwnPropertyNames(
    t).length !== 0)
      return !1;
    var o = Object.getOwnPropertySymbols(t);
    if (o.length !== 1 || o[0] !== r || !Object.prototype.propertyIsEnumerable.call(t, r))
      return !1;
    if (typeof Object.getOwnPropertyDescriptor == "function") {
      var l = Object.getOwnPropertyDescriptor(t, r);
      if (l.value !== i || l.enumerable !== !0)
        return !1;
    }
    return !0;
  }, "hasSymbols");
});

// ../node_modules/has-symbols/index.js
var Su = V((yM, Iu) => {
  "use strict";
  var bu = typeof Symbol < "u" && Symbol, Vg = vu();
  Iu.exports = /* @__PURE__ */ a(function() {
    return typeof bu != "function" || typeof Symbol != "function" || typeof bu("foo") != "symbol" || typeof Symbol("bar") != "symbol" ? !1 :
    Vg();
  }, "hasNativeSymbols");
});

// ../node_modules/has-proto/index.js
var wu = V((bM, xu) => {
  "use strict";
  var ui = {
    __proto__: null,
    foo: {}
  }, Kg = Object;
  xu.exports = /* @__PURE__ */ a(function() {
    return { __proto__: ui }.foo === ui.foo && !(ui instanceof Kg);
  }, "hasProto");
});

// ../node_modules/function-bind/implementation.js
var _u = V((SM, Cu) => {
  "use strict";
  var jg = "Function.prototype.bind called on incompatible ", Ug = Object.prototype.toString, qg = Math.max, Gg = "[object Function]", Eu = /* @__PURE__ */ a(
  function(t, r) {
    for (var n = [], i = 0; i < t.length; i += 1)
      n[i] = t[i];
    for (var o = 0; o < r.length; o += 1)
      n[o + t.length] = r[o];
    return n;
  }, "concatty"), Yg = /* @__PURE__ */ a(function(t, r) {
    for (var n = [], i = r || 0, o = 0; i < t.length; i += 1, o += 1)
      n[o] = t[i];
    return n;
  }, "slicy"), Qg = /* @__PURE__ */ a(function(e, t) {
    for (var r = "", n = 0; n < e.length; n += 1)
      r += e[n], n + 1 < e.length && (r += t);
    return r;
  }, "joiny");
  Cu.exports = /* @__PURE__ */ a(function(t) {
    var r = this;
    if (typeof r != "function" || Ug.apply(r) !== Gg)
      throw new TypeError(jg + r);
    for (var n = Yg(arguments, 1), i, o = /* @__PURE__ */ a(function() {
      if (this instanceof i) {
        var d = r.apply(
          this,
          Eu(n, arguments)
        );
        return Object(d) === d ? d : this;
      }
      return r.apply(
        t,
        Eu(n, arguments)
      );
    }, "binder"), l = qg(0, r.length - n.length), u = [], c = 0; c < l; c++)
      u[c] = "$" + c;
    if (i = Function("binder", "return function (" + Qg(u, ",") + "){ return binder.apply(this,arguments); }")(o), r.prototype) {
      var p = /* @__PURE__ */ a(function() {
      }, "Empty");
      p.prototype = r.prototype, i.prototype = new p(), p.prototype = null;
    }
    return i;
  }, "bind");
});

// ../node_modules/function-bind/index.js
var Tn = V((wM, Tu) => {
  "use strict";
  var Xg = _u();
  Tu.exports = Function.prototype.bind || Xg;
});

// ../node_modules/hasown/index.js
var Ou = V((EM, ku) => {
  "use strict";
  var Zg = Function.prototype.call, Jg = Object.prototype.hasOwnProperty, ey = Tn();
  ku.exports = ey.call(Zg, Jg);
});

// ../node_modules/get-intrinsic/index.js
var Dt = V((CM, Lu) => {
  "use strict";
  var ie, ty = au(), ry = lu(), ny = cu(), oy = du(), pr = li(), cr = sr(), iy = gu(), Du = Function, ci = /* @__PURE__ */ a(function(e) {
    try {
      return Du('"use strict"; return (' + e + ").constructor;")();
    } catch {
    }
  }, "getEvalledConstructor"), At = Object.getOwnPropertyDescriptor;
  if (At)
    try {
      At({}, "");
    } catch {
      At = null;
    }
  var pi = /* @__PURE__ */ a(function() {
    throw new cr();
  }, "throwTypeError"), ay = At ? function() {
    try {
      return arguments.callee, pi;
    } catch {
      try {
        return At(arguments, "callee").get;
      } catch {
        return pi;
      }
    }
  }() : pi, lr = Su()(), sy = wu()(), Oe = Object.getPrototypeOf || (sy ? function(e) {
    return e.__proto__;
  } : null), ur = {}, ly = typeof Uint8Array > "u" || !Oe ? ie : Oe(Uint8Array), Mt = {
    __proto__: null,
    "%AggregateError%": typeof AggregateError > "u" ? ie : AggregateError,
    "%Array%": Array,
    "%ArrayBuffer%": typeof ArrayBuffer > "u" ? ie : ArrayBuffer,
    "%ArrayIteratorPrototype%": lr && Oe ? Oe([][Symbol.iterator]()) : ie,
    "%AsyncFromSyncIteratorPrototype%": ie,
    "%AsyncFunction%": ur,
    "%AsyncGenerator%": ur,
    "%AsyncGeneratorFunction%": ur,
    "%AsyncIteratorPrototype%": ur,
    "%Atomics%": typeof Atomics > "u" ? ie : Atomics,
    "%BigInt%": typeof BigInt > "u" ? ie : BigInt,
    "%BigInt64Array%": typeof BigInt64Array > "u" ? ie : BigInt64Array,
    "%BigUint64Array%": typeof BigUint64Array > "u" ? ie : BigUint64Array,
    "%Boolean%": Boolean,
    "%DataView%": typeof DataView > "u" ? ie : DataView,
    "%Date%": Date,
    "%decodeURI%": decodeURI,
    "%decodeURIComponent%": decodeURIComponent,
    "%encodeURI%": encodeURI,
    "%encodeURIComponent%": encodeURIComponent,
    "%Error%": ty,
    "%eval%": eval,
    // eslint-disable-line no-eval
    "%EvalError%": ry,
    "%Float32Array%": typeof Float32Array > "u" ? ie : Float32Array,
    "%Float64Array%": typeof Float64Array > "u" ? ie : Float64Array,
    "%FinalizationRegistry%": typeof FinalizationRegistry > "u" ? ie : FinalizationRegistry,
    "%Function%": Du,
    "%GeneratorFunction%": ur,
    "%Int8Array%": typeof Int8Array > "u" ? ie : Int8Array,
    "%Int16Array%": typeof Int16Array > "u" ? ie : Int16Array,
    "%Int32Array%": typeof Int32Array > "u" ? ie : Int32Array,
    "%isFinite%": isFinite,
    "%isNaN%": isNaN,
    "%IteratorPrototype%": lr && Oe ? Oe(Oe([][Symbol.iterator]())) : ie,
    "%JSON%": typeof JSON == "object" ? JSON : ie,
    "%Map%": typeof Map > "u" ? ie : Map,
    "%MapIteratorPrototype%": typeof Map > "u" || !lr || !Oe ? ie : Oe((/* @__PURE__ */ new Map())[Symbol.iterator]()),
    "%Math%": Math,
    "%Number%": Number,
    "%Object%": Object,
    "%parseFloat%": parseFloat,
    "%parseInt%": parseInt,
    "%Promise%": typeof Promise > "u" ? ie : Promise,
    "%Proxy%": typeof Proxy > "u" ? ie : Proxy,
    "%RangeError%": ny,
    "%ReferenceError%": oy,
    "%Reflect%": typeof Reflect > "u" ? ie : Reflect,
    "%RegExp%": RegExp,
    "%Set%": typeof Set > "u" ? ie : Set,
    "%SetIteratorPrototype%": typeof Set > "u" || !lr || !Oe ? ie : Oe((/* @__PURE__ */ new Set())[Symbol.iterator]()),
    "%SharedArrayBuffer%": typeof SharedArrayBuffer > "u" ? ie : SharedArrayBuffer,
    "%String%": String,
    "%StringIteratorPrototype%": lr && Oe ? Oe(""[Symbol.iterator]()) : ie,
    "%Symbol%": lr ? Symbol : ie,
    "%SyntaxError%": pr,
    "%ThrowTypeError%": ay,
    "%TypedArray%": ly,
    "%TypeError%": cr,
    "%Uint8Array%": typeof Uint8Array > "u" ? ie : Uint8Array,
    "%Uint8ClampedArray%": typeof Uint8ClampedArray > "u" ? ie : Uint8ClampedArray,
    "%Uint16Array%": typeof Uint16Array > "u" ? ie : Uint16Array,
    "%Uint32Array%": typeof Uint32Array > "u" ? ie : Uint32Array,
    "%URIError%": iy,
    "%WeakMap%": typeof WeakMap > "u" ? ie : WeakMap,
    "%WeakRef%": typeof WeakRef > "u" ? ie : WeakRef,
    "%WeakSet%": typeof WeakSet > "u" ? ie : WeakSet
  };
  if (Oe)
    try {
      null.error;
    } catch (e) {
      Pu = Oe(Oe(e)), Mt["%Error.prototype%"] = Pu;
    }
  var Pu, uy = /* @__PURE__ */ a(function e(t) {
    var r;
    if (t === "%AsyncFunction%")
      r = ci("async function () {}");
    else if (t === "%GeneratorFunction%")
      r = ci("function* () {}");
    else if (t === "%AsyncGeneratorFunction%")
      r = ci("async function* () {}");
    else if (t === "%AsyncGenerator%") {
      var n = e("%AsyncGeneratorFunction%");
      n && (r = n.prototype);
    } else if (t === "%AsyncIteratorPrototype%") {
      var i = e("%AsyncGenerator%");
      i && Oe && (r = Oe(i.prototype));
    }
    return Mt[t] = r, r;
  }, "doEval"), Au = {
    __proto__: null,
    "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"],
    "%ArrayPrototype%": ["Array", "prototype"],
    "%ArrayProto_entries%": ["Array", "prototype", "entries"],
    "%ArrayProto_forEach%": ["Array", "prototype", "forEach"],
    "%ArrayProto_keys%": ["Array", "prototype", "keys"],
    "%ArrayProto_values%": ["Array", "prototype", "values"],
    "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"],
    "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"],
    "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"],
    "%BooleanPrototype%": ["Boolean", "prototype"],
    "%DataViewPrototype%": ["DataView", "prototype"],
    "%DatePrototype%": ["Date", "prototype"],
    "%ErrorPrototype%": ["Error", "prototype"],
    "%EvalErrorPrototype%": ["EvalError", "prototype"],
    "%Float32ArrayPrototype%": ["Float32Array", "prototype"],
    "%Float64ArrayPrototype%": ["Float64Array", "prototype"],
    "%FunctionPrototype%": ["Function", "prototype"],
    "%Generator%": ["GeneratorFunction", "prototype"],
    "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"],
    "%Int8ArrayPrototype%": ["Int8Array", "prototype"],
    "%Int16ArrayPrototype%": ["Int16Array", "prototype"],
    "%Int32ArrayPrototype%": ["Int32Array", "prototype"],
    "%JSONParse%": ["JSON", "parse"],
    "%JSONStringify%": ["JSON", "stringify"],
    "%MapPrototype%": ["Map", "prototype"],
    "%NumberPrototype%": ["Number", "prototype"],
    "%ObjectPrototype%": ["Object", "prototype"],
    "%ObjProto_toString%": ["Object", "prototype", "toString"],
    "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"],
    "%PromisePrototype%": ["Promise", "prototype"],
    "%PromiseProto_then%": ["Promise", "prototype", "then"],
    "%Promise_all%": ["Promise", "all"],
    "%Promise_reject%": ["Promise", "reject"],
    "%Promise_resolve%": ["Promise", "resolve"],
    "%RangeErrorPrototype%": ["RangeError", "prototype"],
    "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"],
    "%RegExpPrototype%": ["RegExp", "prototype"],
    "%SetPrototype%": ["Set", "prototype"],
    "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"],
    "%StringPrototype%": ["String", "prototype"],
    "%SymbolPrototype%": ["Symbol", "prototype"],
    "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"],
    "%TypedArrayPrototype%": ["TypedArray", "prototype"],
    "%TypeErrorPrototype%": ["TypeError", "prototype"],
    "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"],
    "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"],
    "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"],
    "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"],
    "%URIErrorPrototype%": ["URIError", "prototype"],
    "%WeakMapPrototype%": ["WeakMap", "prototype"],
    "%WeakSetPrototype%": ["WeakSet", "prototype"]
  }, Pr = Tn(), kn = Ou(), cy = Pr.call(Function.call, Array.prototype.concat), py = Pr.call(Function.apply, Array.prototype.splice), Mu = Pr.
  call(Function.call, String.prototype.replace), On = Pr.call(Function.call, String.prototype.slice), dy = Pr.call(Function.call, RegExp.prototype.
  exec), fy = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g, my = /\\(\\)?/g, hy = /* @__PURE__ */ a(
  function(t) {
    var r = On(t, 0, 1), n = On(t, -1);
    if (r === "%" && n !== "%")
      throw new pr("invalid intrinsic syntax, expected closing `%`");
    if (n === "%" && r !== "%")
      throw new pr("invalid intrinsic syntax, expected opening `%`");
    var i = [];
    return Mu(t, fy, function(o, l, u, c) {
      i[i.length] = u ? Mu(c, my, "$1") : l || o;
    }), i;
  }, "stringToPath"), gy = /* @__PURE__ */ a(function(t, r) {
    var n = t, i;
    if (kn(Au, n) && (i = Au[n], n = "%" + i[0] + "%"), kn(Mt, n)) {
      var o = Mt[n];
      if (o === ur && (o = uy(n)), typeof o > "u" && !r)
        throw new cr("intrinsic " + t + " exists, but is not available. Please file an issue!");
      return {
        alias: i,
        name: n,
        value: o
      };
    }
    throw new pr("intrinsic " + t + " does not exist!");
  }, "getBaseIntrinsic");
  Lu.exports = /* @__PURE__ */ a(function(t, r) {
    if (typeof t != "string" || t.length === 0)
      throw new cr("intrinsic name must be a non-empty string");
    if (arguments.length > 1 && typeof r != "boolean")
      throw new cr('"allowMissing" argument must be a boolean');
    if (dy(/^%?[^%]*%?$/, t) === null)
      throw new pr("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
    var n = hy(t), i = n.length > 0 ? n[0] : "", o = gy("%" + i + "%", r), l = o.name, u = o.value, c = !1, p = o.alias;
    p && (i = p[0], py(n, cy([0, 1], p)));
    for (var d = 1, h = !0; d < n.length; d += 1) {
      var f = n[d], y = On(f, 0, 1), m = On(f, -1);
      if ((y === '"' || y === "'" || y === "`" || m === '"' || m === "'" || m === "`") && y !== m)
        throw new pr("property names with quotes must have matching quotes");
      if ((f === "constructor" || !h) && (c = !0), i += "." + f, l = "%" + i + "%", kn(Mt, l))
        u = Mt[l];
      else if (u != null) {
        if (!(f in u)) {
          if (!r)
            throw new cr("base intrinsic for " + t + " exists, but the property is not available.");
          return;
        }
        if (At && d + 1 >= n.length) {
          var b = At(u, f);
          h = !!b, h && "get" in b && !("originalValue" in b.get) ? u = b.get : u = u[f];
        } else
          h = kn(u, f), u = u[f];
        h && !c && (Mt[l] = u);
      }
    }
    return u;
  }, "GetIntrinsic");
});

// ../node_modules/es-define-property/index.js
var An = V((TM, Nu) => {
  "use strict";
  var yy = Dt(), Pn = yy("%Object.defineProperty%", !0) || !1;
  if (Pn)
    try {
      Pn({}, "a", { value: 1 });
    } catch {
      Pn = !1;
    }
  Nu.exports = Pn;
});

// ../node_modules/gopd/index.js
var di = V((kM, Fu) => {
  "use strict";
  var vy = Dt(), Mn = vy("%Object.getOwnPropertyDescriptor%", !0);
  if (Mn)
    try {
      Mn([], "length");
    } catch {
      Mn = null;
    }
  Fu.exports = Mn;
});

// ../node_modules/define-data-property/index.js
var zu = V((OM, Ru) => {
  "use strict";
  var Bu = An(), by = li(), dr = sr(), Hu = di();
  Ru.exports = /* @__PURE__ */ a(function(t, r, n) {
    if (!t || typeof t != "object" && typeof t != "function")
      throw new dr("`obj` must be an object or a function`");
    if (typeof r != "string" && typeof r != "symbol")
      throw new dr("`property` must be a string or a symbol`");
    if (arguments.length > 3 && typeof arguments[3] != "boolean" && arguments[3] !== null)
      throw new dr("`nonEnumerable`, if provided, must be a boolean or null");
    if (arguments.length > 4 && typeof arguments[4] != "boolean" && arguments[4] !== null)
      throw new dr("`nonWritable`, if provided, must be a boolean or null");
    if (arguments.length > 5 && typeof arguments[5] != "boolean" && arguments[5] !== null)
      throw new dr("`nonConfigurable`, if provided, must be a boolean or null");
    if (arguments.length > 6 && typeof arguments[6] != "boolean")
      throw new dr("`loose`, if provided, must be a boolean");
    var i = arguments.length > 3 ? arguments[3] : null, o = arguments.length > 4 ? arguments[4] : null, l = arguments.length > 5 ? arguments[5] :
    null, u = arguments.length > 6 ? arguments[6] : !1, c = !!Hu && Hu(t, r);
    if (Bu)
      Bu(t, r, {
        configurable: l === null && c ? c.configurable : !l,
        enumerable: i === null && c ? c.enumerable : !i,
        value: n,
        writable: o === null && c ? c.writable : !o
      });
    else if (u || !i && !o && !l)
      t[r] = n;
    else
      throw new by("This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.");
  }, "defineDataProperty");
});

// ../node_modules/has-property-descriptors/index.js
var Vu = V((AM, Wu) => {
  "use strict";
  var fi = An(), $u = /* @__PURE__ */ a(function() {
    return !!fi;
  }, "hasPropertyDescriptors");
  $u.hasArrayLengthDefineBug = /* @__PURE__ */ a(function() {
    if (!fi)
      return null;
    try {
      return fi([], "length", { value: 1 }).length !== 1;
    } catch {
      return !0;
    }
  }, "hasArrayLengthDefineBug");
  Wu.exports = $u;
});

// ../node_modules/set-function-length/index.js
var Gu = V((DM, qu) => {
  "use strict";
  var Iy = Dt(), Ku = zu(), Sy = Vu()(), ju = di(), Uu = sr(), xy = Iy("%Math.floor%");
  qu.exports = /* @__PURE__ */ a(function(t, r) {
    if (typeof t != "function")
      throw new Uu("`fn` is not a function");
    if (typeof r != "number" || r < 0 || r > 4294967295 || xy(r) !== r)
      throw new Uu("`length` must be a positive 32-bit integer");
    var n = arguments.length > 2 && !!arguments[2], i = !0, o = !0;
    if ("length" in t && ju) {
      var l = ju(t, "length");
      l && !l.configurable && (i = !1), l && !l.writable && (o = !1);
    }
    return (i || o || !n) && (Sy ? Ku(
      /** @type {Parameters<define>[0]} */
      t,
      "length",
      r,
      !0,
      !0
    ) : Ku(
      /** @type {Parameters<define>[0]} */
      t,
      "length",
      r
    )), t;
  }, "setFunctionLength");
});

// ../node_modules/call-bind/index.js
var ec = V((NM, Dn) => {
  "use strict";
  var mi = Tn(), Ln = Dt(), wy = Gu(), Ey = sr(), Xu = Ln("%Function.prototype.apply%"), Zu = Ln("%Function.prototype.call%"), Ju = Ln("%Ref\
lect.apply%", !0) || mi.call(Zu, Xu), Yu = An(), Cy = Ln("%Math.max%");
  Dn.exports = /* @__PURE__ */ a(function(t) {
    if (typeof t != "function")
      throw new Ey("a function is required");
    var r = Ju(mi, Zu, arguments);
    return wy(
      r,
      1 + Cy(0, t.length - (arguments.length - 1)),
      !0
    );
  }, "callBind");
  var Qu = /* @__PURE__ */ a(function() {
    return Ju(mi, Xu, arguments);
  }, "applyBind");
  Yu ? Yu(Dn.exports, "apply", { value: Qu }) : Dn.exports.apply = Qu;
});

// ../node_modules/call-bind/callBound.js
var oc = V((BM, nc) => {
  "use strict";
  var tc = Dt(), rc = ec(), _y = rc(tc("String.prototype.indexOf"));
  nc.exports = /* @__PURE__ */ a(function(t, r) {
    var n = tc(t, !!r);
    return typeof n == "function" && _y(t, ".prototype.") > -1 ? rc(n) : n;
  }, "callBoundIntrinsic");
});

// (disabled):../node_modules/object-inspect/util.inspect
var ic = V(() => {
});

// ../node_modules/object-inspect/index.js
var Cc = V(($M, Ec) => {
  var Ei = typeof Map == "function" && Map.prototype, hi = Object.getOwnPropertyDescriptor && Ei ? Object.getOwnPropertyDescriptor(Map.prototype,
  "size") : null, Fn = Ei && hi && typeof hi.get == "function" ? hi.get : null, ac = Ei && Map.prototype.forEach, Ci = typeof Set == "functi\
on" && Set.prototype, gi = Object.getOwnPropertyDescriptor && Ci ? Object.getOwnPropertyDescriptor(Set.prototype, "size") : null, Bn = Ci &&
  gi && typeof gi.get == "function" ? gi.get : null, sc = Ci && Set.prototype.forEach, Ty = typeof WeakMap == "function" && WeakMap.prototype,
  Mr = Ty ? WeakMap.prototype.has : null, ky = typeof WeakSet == "function" && WeakSet.prototype, Dr = ky ? WeakSet.prototype.has : null, Oy = typeof WeakRef ==
  "function" && WeakRef.prototype, lc = Oy ? WeakRef.prototype.deref : null, Py = Boolean.prototype.valueOf, Ay = Object.prototype.toString,
  My = Function.prototype.toString, Dy = String.prototype.match, _i = String.prototype.slice, yt = String.prototype.replace, Ly = String.prototype.
  toUpperCase, uc = String.prototype.toLowerCase, vc = RegExp.prototype.test, cc = Array.prototype.concat, nt = Array.prototype.join, Ny = Array.
  prototype.slice, pc = Math.floor, bi = typeof BigInt == "function" ? BigInt.prototype.valueOf : null, yi = Object.getOwnPropertySymbols, Ii = typeof Symbol ==
  "function" && typeof Symbol.iterator == "symbol" ? Symbol.prototype.toString : null, fr = typeof Symbol == "function" && typeof Symbol.iterator ==
  "object", Ne = typeof Symbol == "function" && Symbol.toStringTag && (typeof Symbol.toStringTag === fr || !0) ? Symbol.toStringTag : null, bc = Object.
  prototype.propertyIsEnumerable, dc = (typeof Reflect == "function" ? Reflect.getPrototypeOf : Object.getPrototypeOf) || ([].__proto__ === Array.
  prototype ? function(e) {
    return e.__proto__;
  } : null);
  function fc(e, t) {
    if (e === 1 / 0 || e === -1 / 0 || e !== e || e && e > -1e3 && e < 1e3 || vc.call(/e/, t))
      return t;
    var r = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
    if (typeof e == "number") {
      var n = e < 0 ? -pc(-e) : pc(e);
      if (n !== e) {
        var i = String(n), o = _i.call(t, i.length + 1);
        return yt.call(i, r, "$&_") + "." + yt.call(yt.call(o, /([0-9]{3})/g, "$&_"), /_$/, "");
      }
    }
    return yt.call(t, r, "$&_");
  }
  a(fc, "addNumericSeparator");
  var Si = ic(), mc = Si.custom, hc = Sc(mc) ? mc : null;
  Ec.exports = /* @__PURE__ */ a(function e(t, r, n, i) {
    var o = r || {};
    if (gt(o, "quoteStyle") && o.quoteStyle !== "single" && o.quoteStyle !== "double")
      throw new TypeError('option "quoteStyle" must be "single" or "double"');
    if (gt(o, "maxStringLength") && (typeof o.maxStringLength == "number" ? o.maxStringLength < 0 && o.maxStringLength !== 1 / 0 : o.maxStringLength !==
    null))
      throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
    var l = gt(o, "customInspect") ? o.customInspect : !0;
    if (typeof l != "boolean" && l !== "symbol")
      throw new TypeError("option \"customInspect\", if provided, must be `true`, `false`, or `'symbol'`");
    if (gt(o, "indent") && o.indent !== null && o.indent !== "	" && !(parseInt(o.indent, 10) === o.indent && o.indent > 0))
      throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');
    if (gt(o, "numericSeparator") && typeof o.numericSeparator != "boolean")
      throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');
    var u = o.numericSeparator;
    if (typeof t > "u")
      return "undefined";
    if (t === null)
      return "null";
    if (typeof t == "boolean")
      return t ? "true" : "false";
    if (typeof t == "string")
      return wc(t, o);
    if (typeof t == "number") {
      if (t === 0)
        return 1 / 0 / t > 0 ? "0" : "-0";
      var c = String(t);
      return u ? fc(t, c) : c;
    }
    if (typeof t == "bigint") {
      var p = String(t) + "n";
      return u ? fc(t, p) : p;
    }
    var d = typeof o.depth > "u" ? 5 : o.depth;
    if (typeof n > "u" && (n = 0), n >= d && d > 0 && typeof t == "object")
      return xi(t) ? "[Array]" : "[Object]";
    var h = Jy(o, n);
    if (typeof i > "u")
      i = [];
    else if (xc(i, t) >= 0)
      return "[Circular]";
    function f(D, L, W) {
      if (L && (i = Ny.call(i), i.push(L)), W) {
        var Z = {
          depth: o.depth
        };
        return gt(o, "quoteStyle") && (Z.quoteStyle = o.quoteStyle), e(D, Z, n + 1, i);
      }
      return e(D, o, n + 1, i);
    }
    if (a(f, "inspect"), typeof t == "function" && !gc(t)) {
      var y = Ky(t), m = Nn(t, f);
      return "[Function" + (y ? ": " + y : " (anonymous)") + "]" + (m.length > 0 ? " { " + nt.call(m, ", ") + " }" : "");
    }
    if (Sc(t)) {
      var b = fr ? yt.call(String(t), /^(Symbol\(.*\))_[^)]*$/, "$1") : Ii.call(t);
      return typeof t == "object" && !fr ? Ar(b) : b;
    }
    if (Qy(t)) {
      for (var x = "<" + uc.call(String(t.nodeName)), _ = t.attributes || [], g = 0; g < _.length; g++)
        x += " " + _[g].name + "=" + Ic(Fy(_[g].value), "double", o);
      return x += ">", t.childNodes && t.childNodes.length && (x += "..."), x += "</" + uc.call(String(t.nodeName)) + ">", x;
    }
    if (xi(t)) {
      if (t.length === 0)
        return "[]";
      var v = Nn(t, f);
      return h && !Zy(v) ? "[" + wi(v, h) + "]" : "[ " + nt.call(v, ", ") + " ]";
    }
    if (Hy(t)) {
      var S = Nn(t, f);
      return !("cause" in Error.prototype) && "cause" in t && !bc.call(t, "cause") ? "{ [" + String(t) + "] " + nt.call(cc.call("[cause]: " +
      f(t.cause), S), ", ") + " }" : S.length === 0 ? "[" + String(t) + "]" : "{ [" + String(t) + "] " + nt.call(S, ", ") + " }";
    }
    if (typeof t == "object" && l) {
      if (hc && typeof t[hc] == "function" && Si)
        return Si(t, { depth: d - n });
      if (l !== "symbol" && typeof t.inspect == "function")
        return t.inspect();
    }
    if (jy(t)) {
      var C = [];
      return ac && ac.call(t, function(D, L) {
        C.push(f(L, t, !0) + " => " + f(D, t));
      }), yc("Map", Fn.call(t), C, h);
    }
    if (Gy(t)) {
      var E = [];
      return sc && sc.call(t, function(D) {
        E.push(f(D, t));
      }), yc("Set", Bn.call(t), E, h);
    }
    if (Uy(t))
      return vi("WeakMap");
    if (Yy(t))
      return vi("WeakSet");
    if (qy(t))
      return vi("WeakRef");
    if (zy(t))
      return Ar(f(Number(t)));
    if (Wy(t))
      return Ar(f(bi.call(t)));
    if ($y(t))
      return Ar(Py.call(t));
    if (Ry(t))
      return Ar(f(String(t)));
    if (typeof window < "u" && t === window)
      return "{ [object Window] }";
    if (t === global)
      return "{ [object globalThis] }";
    if (!By(t) && !gc(t)) {
      var k = Nn(t, f), O = dc ? dc(t) === Object.prototype : t instanceof Object || t.constructor === Object, w = t instanceof Object ? "" :
      "null prototype", T = !O && Ne && Object(t) === t && Ne in t ? _i.call(vt(t), 8, -1) : w ? "Object" : "", P = O || typeof t.constructor !=
      "function" ? "" : t.constructor.name ? t.constructor.name + " " : "", M = P + (T || w ? "[" + nt.call(cc.call([], T || [], w || []), "\
: ") + "] " : "");
      return k.length === 0 ? M + "{}" : h ? M + "{" + wi(k, h) + "}" : M + "{ " + nt.call(k, ", ") + " }";
    }
    return String(t);
  }, "inspect_");
  function Ic(e, t, r) {
    var n = (r.quoteStyle || t) === "double" ? '"' : "'";
    return n + e + n;
  }
  a(Ic, "wrapQuotes");
  function Fy(e) {
    return yt.call(String(e), /"/g, "&quot;");
  }
  a(Fy, "quote");
  function xi(e) {
    return vt(e) === "[object Array]" && (!Ne || !(typeof e == "object" && Ne in e));
  }
  a(xi, "isArray");
  function By(e) {
    return vt(e) === "[object Date]" && (!Ne || !(typeof e == "object" && Ne in e));
  }
  a(By, "isDate");
  function gc(e) {
    return vt(e) === "[object RegExp]" && (!Ne || !(typeof e == "object" && Ne in e));
  }
  a(gc, "isRegExp");
  function Hy(e) {
    return vt(e) === "[object Error]" && (!Ne || !(typeof e == "object" && Ne in e));
  }
  a(Hy, "isError");
  function Ry(e) {
    return vt(e) === "[object String]" && (!Ne || !(typeof e == "object" && Ne in e));
  }
  a(Ry, "isString");
  function zy(e) {
    return vt(e) === "[object Number]" && (!Ne || !(typeof e == "object" && Ne in e));
  }
  a(zy, "isNumber");
  function $y(e) {
    return vt(e) === "[object Boolean]" && (!Ne || !(typeof e == "object" && Ne in e));
  }
  a($y, "isBoolean");
  function Sc(e) {
    if (fr)
      return e && typeof e == "object" && e instanceof Symbol;
    if (typeof e == "symbol")
      return !0;
    if (!e || typeof e != "object" || !Ii)
      return !1;
    try {
      return Ii.call(e), !0;
    } catch {
    }
    return !1;
  }
  a(Sc, "isSymbol");
  function Wy(e) {
    if (!e || typeof e != "object" || !bi)
      return !1;
    try {
      return bi.call(e), !0;
    } catch {
    }
    return !1;
  }
  a(Wy, "isBigInt");
  var Vy = Object.prototype.hasOwnProperty || function(e) {
    return e in this;
  };
  function gt(e, t) {
    return Vy.call(e, t);
  }
  a(gt, "has");
  function vt(e) {
    return Ay.call(e);
  }
  a(vt, "toStr");
  function Ky(e) {
    if (e.name)
      return e.name;
    var t = Dy.call(My.call(e), /^function\s*([\w$]+)/);
    return t ? t[1] : null;
  }
  a(Ky, "nameOf");
  function xc(e, t) {
    if (e.indexOf)
      return e.indexOf(t);
    for (var r = 0, n = e.length; r < n; r++)
      if (e[r] === t)
        return r;
    return -1;
  }
  a(xc, "indexOf");
  function jy(e) {
    if (!Fn || !e || typeof e != "object")
      return !1;
    try {
      Fn.call(e);
      try {
        Bn.call(e);
      } catch {
        return !0;
      }
      return e instanceof Map;
    } catch {
    }
    return !1;
  }
  a(jy, "isMap");
  function Uy(e) {
    if (!Mr || !e || typeof e != "object")
      return !1;
    try {
      Mr.call(e, Mr);
      try {
        Dr.call(e, Dr);
      } catch {
        return !0;
      }
      return e instanceof WeakMap;
    } catch {
    }
    return !1;
  }
  a(Uy, "isWeakMap");
  function qy(e) {
    if (!lc || !e || typeof e != "object")
      return !1;
    try {
      return lc.call(e), !0;
    } catch {
    }
    return !1;
  }
  a(qy, "isWeakRef");
  function Gy(e) {
    if (!Bn || !e || typeof e != "object")
      return !1;
    try {
      Bn.call(e);
      try {
        Fn.call(e);
      } catch {
        return !0;
      }
      return e instanceof Set;
    } catch {
    }
    return !1;
  }
  a(Gy, "isSet");
  function Yy(e) {
    if (!Dr || !e || typeof e != "object")
      return !1;
    try {
      Dr.call(e, Dr);
      try {
        Mr.call(e, Mr);
      } catch {
        return !0;
      }
      return e instanceof WeakSet;
    } catch {
    }
    return !1;
  }
  a(Yy, "isWeakSet");
  function Qy(e) {
    return !e || typeof e != "object" ? !1 : typeof HTMLElement < "u" && e instanceof HTMLElement ? !0 : typeof e.nodeName == "string" && typeof e.
    getAttribute == "function";
  }
  a(Qy, "isElement");
  function wc(e, t) {
    if (e.length > t.maxStringLength) {
      var r = e.length - t.maxStringLength, n = "... " + r + " more character" + (r > 1 ? "s" : "");
      return wc(_i.call(e, 0, t.maxStringLength), t) + n;
    }
    var i = yt.call(yt.call(e, /(['\\])/g, "\\$1"), /[\x00-\x1f]/g, Xy);
    return Ic(i, "single", t);
  }
  a(wc, "inspectString");
  function Xy(e) {
    var t = e.charCodeAt(0), r = {
      8: "b",
      9: "t",
      10: "n",
      12: "f",
      13: "r"
    }[t];
    return r ? "\\" + r : "\\x" + (t < 16 ? "0" : "") + Ly.call(t.toString(16));
  }
  a(Xy, "lowbyte");
  function Ar(e) {
    return "Object(" + e + ")";
  }
  a(Ar, "markBoxed");
  function vi(e) {
    return e + " { ? }";
  }
  a(vi, "weakCollectionOf");
  function yc(e, t, r, n) {
    var i = n ? wi(r, n) : nt.call(r, ", ");
    return e + " (" + t + ") {" + i + "}";
  }
  a(yc, "collectionOf");
  function Zy(e) {
    for (var t = 0; t < e.length; t++)
      if (xc(e[t], `
`) >= 0)
        return !1;
    return !0;
  }
  a(Zy, "singleLineValues");
  function Jy(e, t) {
    var r;
    if (e.indent === "	")
      r = "	";
    else if (typeof e.indent == "number" && e.indent > 0)
      r = nt.call(Array(e.indent + 1), " ");
    else
      return null;
    return {
      base: r,
      prev: nt.call(Array(t + 1), r)
    };
  }
  a(Jy, "getIndent");
  function wi(e, t) {
    if (e.length === 0)
      return "";
    var r = `
` + t.prev + t.base;
    return r + nt.call(e, "," + r) + `
` + t.prev;
  }
  a(wi, "indentedJoin");
  function Nn(e, t) {
    var r = xi(e), n = [];
    if (r) {
      n.length = e.length;
      for (var i = 0; i < e.length; i++)
        n[i] = gt(e, i) ? t(e[i], e) : "";
    }
    var o = typeof yi == "function" ? yi(e) : [], l;
    if (fr) {
      l = {};
      for (var u = 0; u < o.length; u++)
        l["$" + o[u]] = o[u];
    }
    for (var c in e)
      gt(e, c) && (r && String(Number(c)) === c && c < e.length || fr && l["$" + c] instanceof Symbol || (vc.call(/[^\w$]/, c) ? n.push(t(c,
      e) + ": " + t(e[c], e)) : n.push(c + ": " + t(e[c], e))));
    if (typeof yi == "function")
      for (var p = 0; p < o.length; p++)
        bc.call(e, o[p]) && n.push("[" + t(o[p]) + "]: " + t(e[o[p]], e));
    return n;
  }
  a(Nn, "arrObjKeys");
});

// ../node_modules/side-channel/index.js
var kc = V((VM, Tc) => {
  "use strict";
  var _c = Dt(), mr = oc(), ev = Cc(), tv = sr(), Hn = _c("%WeakMap%", !0), Rn = _c("%Map%", !0), rv = mr("WeakMap.prototype.get", !0), nv = mr(
  "WeakMap.prototype.set", !0), ov = mr("WeakMap.prototype.has", !0), iv = mr("Map.prototype.get", !0), av = mr("Map.prototype.set", !0), sv = mr(
  "Map.prototype.has", !0), Ti = /* @__PURE__ */ a(function(e, t) {
    for (var r = e, n; (n = r.next) !== null; r = n)
      if (n.key === t)
        return r.next = n.next, n.next = /** @type {NonNullable<typeof list.next>} */
        e.next, e.next = n, n;
  }, "listGetNode"), lv = /* @__PURE__ */ a(function(e, t) {
    var r = Ti(e, t);
    return r && r.value;
  }, "listGet"), uv = /* @__PURE__ */ a(function(e, t, r) {
    var n = Ti(e, t);
    n ? n.value = r : e.next = /** @type {import('.').ListNode<typeof value>} */
    {
      // eslint-disable-line no-param-reassign, no-extra-parens
      key: t,
      next: e.next,
      value: r
    };
  }, "listSet"), cv = /* @__PURE__ */ a(function(e, t) {
    return !!Ti(e, t);
  }, "listHas");
  Tc.exports = /* @__PURE__ */ a(function() {
    var t, r, n, i = {
      assert: /* @__PURE__ */ a(function(o) {
        if (!i.has(o))
          throw new tv("Side channel does not contain " + ev(o));
      }, "assert"),
      get: /* @__PURE__ */ a(function(o) {
        if (Hn && o && (typeof o == "object" || typeof o == "function")) {
          if (t)
            return rv(t, o);
        } else if (Rn) {
          if (r)
            return iv(r, o);
        } else if (n)
          return lv(n, o);
      }, "get"),
      has: /* @__PURE__ */ a(function(o) {
        if (Hn && o && (typeof o == "object" || typeof o == "function")) {
          if (t)
            return ov(t, o);
        } else if (Rn) {
          if (r)
            return sv(r, o);
        } else if (n)
          return cv(n, o);
        return !1;
      }, "has"),
      set: /* @__PURE__ */ a(function(o, l) {
        Hn && o && (typeof o == "object" || typeof o == "function") ? (t || (t = new Hn()), nv(t, o, l)) : Rn ? (r || (r = new Rn()), av(r, o,
        l)) : (n || (n = { key: {}, next: null }), uv(n, o, l));
      }, "set")
    };
    return i;
  }, "getSideChannel");
});

// ../node_modules/qs/lib/formats.js
var zn = V((jM, Oc) => {
  "use strict";
  var pv = String.prototype.replace, dv = /%20/g, ki = {
    RFC1738: "RFC1738",
    RFC3986: "RFC3986"
  };
  Oc.exports = {
    default: ki.RFC3986,
    formatters: {
      RFC1738: /* @__PURE__ */ a(function(e) {
        return pv.call(e, dv, "+");
      }, "RFC1738"),
      RFC3986: /* @__PURE__ */ a(function(e) {
        return String(e);
      }, "RFC3986")
    },
    RFC1738: ki.RFC1738,
    RFC3986: ki.RFC3986
  };
});

// ../node_modules/qs/lib/utils.js
var Ai = V((qM, Ac) => {
  "use strict";
  var fv = zn(), Oi = Object.prototype.hasOwnProperty, Lt = Array.isArray, ot = function() {
    for (var e = [], t = 0; t < 256; ++t)
      e.push("%" + ((t < 16 ? "0" : "") + t.toString(16)).toUpperCase());
    return e;
  }(), mv = /* @__PURE__ */ a(function(t) {
    for (; t.length > 1; ) {
      var r = t.pop(), n = r.obj[r.prop];
      if (Lt(n)) {
        for (var i = [], o = 0; o < n.length; ++o)
          typeof n[o] < "u" && i.push(n[o]);
        r.obj[r.prop] = i;
      }
    }
  }, "compactQueue"), Pc = /* @__PURE__ */ a(function(t, r) {
    for (var n = r && r.plainObjects ? /* @__PURE__ */ Object.create(null) : {}, i = 0; i < t.length; ++i)
      typeof t[i] < "u" && (n[i] = t[i]);
    return n;
  }, "arrayToObject"), hv = /* @__PURE__ */ a(function e(t, r, n) {
    if (!r)
      return t;
    if (typeof r != "object") {
      if (Lt(t))
        t.push(r);
      else if (t && typeof t == "object")
        (n && (n.plainObjects || n.allowPrototypes) || !Oi.call(Object.prototype, r)) && (t[r] = !0);
      else
        return [t, r];
      return t;
    }
    if (!t || typeof t != "object")
      return [t].concat(r);
    var i = t;
    return Lt(t) && !Lt(r) && (i = Pc(t, n)), Lt(t) && Lt(r) ? (r.forEach(function(o, l) {
      if (Oi.call(t, l)) {
        var u = t[l];
        u && typeof u == "object" && o && typeof o == "object" ? t[l] = e(u, o, n) : t.push(o);
      } else
        t[l] = o;
    }), t) : Object.keys(r).reduce(function(o, l) {
      var u = r[l];
      return Oi.call(o, l) ? o[l] = e(o[l], u, n) : o[l] = u, o;
    }, i);
  }, "merge"), gv = /* @__PURE__ */ a(function(t, r) {
    return Object.keys(r).reduce(function(n, i) {
      return n[i] = r[i], n;
    }, t);
  }, "assignSingleSource"), yv = /* @__PURE__ */ a(function(e, t, r) {
    var n = e.replace(/\+/g, " ");
    if (r === "iso-8859-1")
      return n.replace(/%[0-9a-f]{2}/gi, unescape);
    try {
      return decodeURIComponent(n);
    } catch {
      return n;
    }
  }, "decode"), Pi = 1024, vv = /* @__PURE__ */ a(function(t, r, n, i, o) {
    if (t.length === 0)
      return t;
    var l = t;
    if (typeof t == "symbol" ? l = Symbol.prototype.toString.call(t) : typeof t != "string" && (l = String(t)), n === "iso-8859-1")
      return escape(l).replace(/%u[0-9a-f]{4}/gi, function(y) {
        return "%26%23" + parseInt(y.slice(2), 16) + "%3B";
      });
    for (var u = "", c = 0; c < l.length; c += Pi) {
      for (var p = l.length >= Pi ? l.slice(c, c + Pi) : l, d = [], h = 0; h < p.length; ++h) {
        var f = p.charCodeAt(h);
        if (f === 45 || f === 46 || f === 95 || f === 126 || f >= 48 && f <= 57 || f >= 65 && f <= 90 || f >= 97 && f <= 122 || o === fv.RFC1738 &&
        (f === 40 || f === 41)) {
          d[d.length] = p.charAt(h);
          continue;
        }
        if (f < 128) {
          d[d.length] = ot[f];
          continue;
        }
        if (f < 2048) {
          d[d.length] = ot[192 | f >> 6] + ot[128 | f & 63];
          continue;
        }
        if (f < 55296 || f >= 57344) {
          d[d.length] = ot[224 | f >> 12] + ot[128 | f >> 6 & 63] + ot[128 | f & 63];
          continue;
        }
        h += 1, f = 65536 + ((f & 1023) << 10 | p.charCodeAt(h) & 1023), d[d.length] = ot[240 | f >> 18] + ot[128 | f >> 12 & 63] + ot[128 |
        f >> 6 & 63] + ot[128 | f & 63];
      }
      u += d.join("");
    }
    return u;
  }, "encode"), bv = /* @__PURE__ */ a(function(t) {
    for (var r = [{ obj: { o: t }, prop: "o" }], n = [], i = 0; i < r.length; ++i)
      for (var o = r[i], l = o.obj[o.prop], u = Object.keys(l), c = 0; c < u.length; ++c) {
        var p = u[c], d = l[p];
        typeof d == "object" && d !== null && n.indexOf(d) === -1 && (r.push({ obj: l, prop: p }), n.push(d));
      }
    return mv(r), t;
  }, "compact"), Iv = /* @__PURE__ */ a(function(t) {
    return Object.prototype.toString.call(t) === "[object RegExp]";
  }, "isRegExp"), Sv = /* @__PURE__ */ a(function(t) {
    return !t || typeof t != "object" ? !1 : !!(t.constructor && t.constructor.isBuffer && t.constructor.isBuffer(t));
  }, "isBuffer"), xv = /* @__PURE__ */ a(function(t, r) {
    return [].concat(t, r);
  }, "combine"), wv = /* @__PURE__ */ a(function(t, r) {
    if (Lt(t)) {
      for (var n = [], i = 0; i < t.length; i += 1)
        n.push(r(t[i]));
      return n;
    }
    return r(t);
  }, "maybeMap");
  Ac.exports = {
    arrayToObject: Pc,
    assign: gv,
    combine: xv,
    compact: bv,
    decode: yv,
    encode: vv,
    isBuffer: Sv,
    isRegExp: Iv,
    maybeMap: wv,
    merge: hv
  };
});

// ../node_modules/qs/lib/stringify.js
var Bc = V((YM, Fc) => {
  "use strict";
  var Dc = kc(), $n = Ai(), Lr = zn(), Ev = Object.prototype.hasOwnProperty, Lc = {
    brackets: /* @__PURE__ */ a(function(t) {
      return t + "[]";
    }, "brackets"),
    comma: "comma",
    indices: /* @__PURE__ */ a(function(t, r) {
      return t + "[" + r + "]";
    }, "indices"),
    repeat: /* @__PURE__ */ a(function(t) {
      return t;
    }, "repeat")
  }, it = Array.isArray, Cv = Array.prototype.push, Nc = /* @__PURE__ */ a(function(e, t) {
    Cv.apply(e, it(t) ? t : [t]);
  }, "pushToArray"), _v = Date.prototype.toISOString, Mc = Lr.default, Ce = {
    addQueryPrefix: !1,
    allowDots: !1,
    allowEmptyArrays: !1,
    arrayFormat: "indices",
    charset: "utf-8",
    charsetSentinel: !1,
    delimiter: "&",
    encode: !0,
    encodeDotInKeys: !1,
    encoder: $n.encode,
    encodeValuesOnly: !1,
    format: Mc,
    formatter: Lr.formatters[Mc],
    // deprecated
    indices: !1,
    serializeDate: /* @__PURE__ */ a(function(t) {
      return _v.call(t);
    }, "serializeDate"),
    skipNulls: !1,
    strictNullHandling: !1
  }, Tv = /* @__PURE__ */ a(function(t) {
    return typeof t == "string" || typeof t == "number" || typeof t == "boolean" || typeof t == "symbol" || typeof t == "bigint";
  }, "isNonNullishPrimitive"), Mi = {}, kv = /* @__PURE__ */ a(function e(t, r, n, i, o, l, u, c, p, d, h, f, y, m, b, x, _, g) {
    for (var v = t, S = g, C = 0, E = !1; (S = S.get(Mi)) !== void 0 && !E; ) {
      var k = S.get(t);
      if (C += 1, typeof k < "u") {
        if (k === C)
          throw new RangeError("Cyclic object value");
        E = !0;
      }
      typeof S.get(Mi) > "u" && (C = 0);
    }
    if (typeof d == "function" ? v = d(r, v) : v instanceof Date ? v = y(v) : n === "comma" && it(v) && (v = $n.maybeMap(v, function(B) {
      return B instanceof Date ? y(B) : B;
    })), v === null) {
      if (l)
        return p && !x ? p(r, Ce.encoder, _, "key", m) : r;
      v = "";
    }
    if (Tv(v) || $n.isBuffer(v)) {
      if (p) {
        var O = x ? r : p(r, Ce.encoder, _, "key", m);
        return [b(O) + "=" + b(p(v, Ce.encoder, _, "value", m))];
      }
      return [b(r) + "=" + b(String(v))];
    }
    var w = [];
    if (typeof v > "u")
      return w;
    var T;
    if (n === "comma" && it(v))
      x && p && (v = $n.maybeMap(v, p)), T = [{ value: v.length > 0 ? v.join(",") || null : void 0 }];
    else if (it(d))
      T = d;
    else {
      var P = Object.keys(v);
      T = h ? P.sort(h) : P;
    }
    var M = c ? r.replace(/\./g, "%2E") : r, D = i && it(v) && v.length === 1 ? M + "[]" : M;
    if (o && it(v) && v.length === 0)
      return D + "[]";
    for (var L = 0; L < T.length; ++L) {
      var W = T[L], Z = typeof W == "object" && typeof W.value < "u" ? W.value : v[W];
      if (!(u && Z === null)) {
        var G = f && c ? W.replace(/\./g, "%2E") : W, R = it(v) ? typeof n == "function" ? n(D, G) : D : D + (f ? "." + G : "[" + G + "]");
        g.set(t, C);
        var z = Dc();
        z.set(Mi, g), Nc(w, e(
          Z,
          R,
          n,
          i,
          o,
          l,
          u,
          c,
          n === "comma" && x && it(v) ? null : p,
          d,
          h,
          f,
          y,
          m,
          b,
          x,
          _,
          z
        ));
      }
    }
    return w;
  }, "stringify"), Ov = /* @__PURE__ */ a(function(t) {
    if (!t)
      return Ce;
    if (typeof t.allowEmptyArrays < "u" && typeof t.allowEmptyArrays != "boolean")
      throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
    if (typeof t.encodeDotInKeys < "u" && typeof t.encodeDotInKeys != "boolean")
      throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
    if (t.encoder !== null && typeof t.encoder < "u" && typeof t.encoder != "function")
      throw new TypeError("Encoder has to be a function.");
    var r = t.charset || Ce.charset;
    if (typeof t.charset < "u" && t.charset !== "utf-8" && t.charset !== "iso-8859-1")
      throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
    var n = Lr.default;
    if (typeof t.format < "u") {
      if (!Ev.call(Lr.formatters, t.format))
        throw new TypeError("Unknown format option provided.");
      n = t.format;
    }
    var i = Lr.formatters[n], o = Ce.filter;
    (typeof t.filter == "function" || it(t.filter)) && (o = t.filter);
    var l;
    if (t.arrayFormat in Lc ? l = t.arrayFormat : "indices" in t ? l = t.indices ? "indices" : "repeat" : l = Ce.arrayFormat, "commaRoundTri\
p" in t && typeof t.commaRoundTrip != "boolean")
      throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
    var u = typeof t.allowDots > "u" ? t.encodeDotInKeys === !0 ? !0 : Ce.allowDots : !!t.allowDots;
    return {
      addQueryPrefix: typeof t.addQueryPrefix == "boolean" ? t.addQueryPrefix : Ce.addQueryPrefix,
      allowDots: u,
      allowEmptyArrays: typeof t.allowEmptyArrays == "boolean" ? !!t.allowEmptyArrays : Ce.allowEmptyArrays,
      arrayFormat: l,
      charset: r,
      charsetSentinel: typeof t.charsetSentinel == "boolean" ? t.charsetSentinel : Ce.charsetSentinel,
      commaRoundTrip: t.commaRoundTrip,
      delimiter: typeof t.delimiter > "u" ? Ce.delimiter : t.delimiter,
      encode: typeof t.encode == "boolean" ? t.encode : Ce.encode,
      encodeDotInKeys: typeof t.encodeDotInKeys == "boolean" ? t.encodeDotInKeys : Ce.encodeDotInKeys,
      encoder: typeof t.encoder == "function" ? t.encoder : Ce.encoder,
      encodeValuesOnly: typeof t.encodeValuesOnly == "boolean" ? t.encodeValuesOnly : Ce.encodeValuesOnly,
      filter: o,
      format: n,
      formatter: i,
      serializeDate: typeof t.serializeDate == "function" ? t.serializeDate : Ce.serializeDate,
      skipNulls: typeof t.skipNulls == "boolean" ? t.skipNulls : Ce.skipNulls,
      sort: typeof t.sort == "function" ? t.sort : null,
      strictNullHandling: typeof t.strictNullHandling == "boolean" ? t.strictNullHandling : Ce.strictNullHandling
    };
  }, "normalizeStringifyOptions");
  Fc.exports = function(e, t) {
    var r = e, n = Ov(t), i, o;
    typeof n.filter == "function" ? (o = n.filter, r = o("", r)) : it(n.filter) && (o = n.filter, i = o);
    var l = [];
    if (typeof r != "object" || r === null)
      return "";
    var u = Lc[n.arrayFormat], c = u === "comma" && n.commaRoundTrip;
    i || (i = Object.keys(r)), n.sort && i.sort(n.sort);
    for (var p = Dc(), d = 0; d < i.length; ++d) {
      var h = i[d];
      n.skipNulls && r[h] === null || Nc(l, kv(
        r[h],
        h,
        u,
        c,
        n.allowEmptyArrays,
        n.strictNullHandling,
        n.skipNulls,
        n.encodeDotInKeys,
        n.encode ? n.encoder : null,
        n.filter,
        n.sort,
        n.allowDots,
        n.serializeDate,
        n.format,
        n.formatter,
        n.encodeValuesOnly,
        n.charset,
        p
      ));
    }
    var f = l.join(n.delimiter), y = n.addQueryPrefix === !0 ? "?" : "";
    return n.charsetSentinel && (n.charset === "iso-8859-1" ? y += "utf8=%26%2310003%3B&" : y += "utf8=%E2%9C%93&"), f.length > 0 ? y + f : "";
  };
});

// ../node_modules/qs/lib/parse.js
var zc = V((XM, Rc) => {
  "use strict";
  var hr = Ai(), Di = Object.prototype.hasOwnProperty, Pv = Array.isArray, Ie = {
    allowDots: !1,
    allowEmptyArrays: !1,
    allowPrototypes: !1,
    allowSparse: !1,
    arrayLimit: 20,
    charset: "utf-8",
    charsetSentinel: !1,
    comma: !1,
    decodeDotInKeys: !1,
    decoder: hr.decode,
    delimiter: "&",
    depth: 5,
    duplicates: "combine",
    ignoreQueryPrefix: !1,
    interpretNumericEntities: !1,
    parameterLimit: 1e3,
    parseArrays: !0,
    plainObjects: !1,
    strictNullHandling: !1
  }, Av = /* @__PURE__ */ a(function(e) {
    return e.replace(/&#(\d+);/g, function(t, r) {
      return String.fromCharCode(parseInt(r, 10));
    });
  }, "interpretNumericEntities"), Hc = /* @__PURE__ */ a(function(e, t) {
    return e && typeof e == "string" && t.comma && e.indexOf(",") > -1 ? e.split(",") : e;
  }, "parseArrayValue"), Mv = "utf8=%26%2310003%3B", Dv = "utf8=%E2%9C%93", Lv = /* @__PURE__ */ a(function(t, r) {
    var n = { __proto__: null }, i = r.ignoreQueryPrefix ? t.replace(/^\?/, "") : t;
    i = i.replace(/%5B/gi, "[").replace(/%5D/gi, "]");
    var o = r.parameterLimit === 1 / 0 ? void 0 : r.parameterLimit, l = i.split(r.delimiter, o), u = -1, c, p = r.charset;
    if (r.charsetSentinel)
      for (c = 0; c < l.length; ++c)
        l[c].indexOf("utf8=") === 0 && (l[c] === Dv ? p = "utf-8" : l[c] === Mv && (p = "iso-8859-1"), u = c, c = l.length);
    for (c = 0; c < l.length; ++c)
      if (c !== u) {
        var d = l[c], h = d.indexOf("]="), f = h === -1 ? d.indexOf("=") : h + 1, y, m;
        f === -1 ? (y = r.decoder(d, Ie.decoder, p, "key"), m = r.strictNullHandling ? null : "") : (y = r.decoder(d.slice(0, f), Ie.decoder,
        p, "key"), m = hr.maybeMap(
          Hc(d.slice(f + 1), r),
          function(x) {
            return r.decoder(x, Ie.decoder, p, "value");
          }
        )), m && r.interpretNumericEntities && p === "iso-8859-1" && (m = Av(m)), d.indexOf("[]=") > -1 && (m = Pv(m) ? [m] : m);
        var b = Di.call(n, y);
        b && r.duplicates === "combine" ? n[y] = hr.combine(n[y], m) : (!b || r.duplicates === "last") && (n[y] = m);
      }
    return n;
  }, "parseQueryStringValues"), Nv = /* @__PURE__ */ a(function(e, t, r, n) {
    for (var i = n ? t : Hc(t, r), o = e.length - 1; o >= 0; --o) {
      var l, u = e[o];
      if (u === "[]" && r.parseArrays)
        l = r.allowEmptyArrays && (i === "" || r.strictNullHandling && i === null) ? [] : [].concat(i);
      else {
        l = r.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
        var c = u.charAt(0) === "[" && u.charAt(u.length - 1) === "]" ? u.slice(1, -1) : u, p = r.decodeDotInKeys ? c.replace(/%2E/g, ".") :
        c, d = parseInt(p, 10);
        !r.parseArrays && p === "" ? l = { 0: i } : !isNaN(d) && u !== p && String(d) === p && d >= 0 && r.parseArrays && d <= r.arrayLimit ?
        (l = [], l[d] = i) : p !== "__proto__" && (l[p] = i);
      }
      i = l;
    }
    return i;
  }, "parseObject"), Fv = /* @__PURE__ */ a(function(t, r, n, i) {
    if (t) {
      var o = n.allowDots ? t.replace(/\.([^.[]+)/g, "[$1]") : t, l = /(\[[^[\]]*])/, u = /(\[[^[\]]*])/g, c = n.depth > 0 && l.exec(o), p = c ?
      o.slice(0, c.index) : o, d = [];
      if (p) {
        if (!n.plainObjects && Di.call(Object.prototype, p) && !n.allowPrototypes)
          return;
        d.push(p);
      }
      for (var h = 0; n.depth > 0 && (c = u.exec(o)) !== null && h < n.depth; ) {
        if (h += 1, !n.plainObjects && Di.call(Object.prototype, c[1].slice(1, -1)) && !n.allowPrototypes)
          return;
        d.push(c[1]);
      }
      return c && d.push("[" + o.slice(c.index) + "]"), Nv(d, r, n, i);
    }
  }, "parseQueryStringKeys"), Bv = /* @__PURE__ */ a(function(t) {
    if (!t)
      return Ie;
    if (typeof t.allowEmptyArrays < "u" && typeof t.allowEmptyArrays != "boolean")
      throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
    if (typeof t.decodeDotInKeys < "u" && typeof t.decodeDotInKeys != "boolean")
      throw new TypeError("`decodeDotInKeys` option can only be `true` or `false`, when provided");
    if (t.decoder !== null && typeof t.decoder < "u" && typeof t.decoder != "function")
      throw new TypeError("Decoder has to be a function.");
    if (typeof t.charset < "u" && t.charset !== "utf-8" && t.charset !== "iso-8859-1")
      throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
    var r = typeof t.charset > "u" ? Ie.charset : t.charset, n = typeof t.duplicates > "u" ? Ie.duplicates : t.duplicates;
    if (n !== "combine" && n !== "first" && n !== "last")
      throw new TypeError("The duplicates option must be either combine, first, or last");
    var i = typeof t.allowDots > "u" ? t.decodeDotInKeys === !0 ? !0 : Ie.allowDots : !!t.allowDots;
    return {
      allowDots: i,
      allowEmptyArrays: typeof t.allowEmptyArrays == "boolean" ? !!t.allowEmptyArrays : Ie.allowEmptyArrays,
      allowPrototypes: typeof t.allowPrototypes == "boolean" ? t.allowPrototypes : Ie.allowPrototypes,
      allowSparse: typeof t.allowSparse == "boolean" ? t.allowSparse : Ie.allowSparse,
      arrayLimit: typeof t.arrayLimit == "number" ? t.arrayLimit : Ie.arrayLimit,
      charset: r,
      charsetSentinel: typeof t.charsetSentinel == "boolean" ? t.charsetSentinel : Ie.charsetSentinel,
      comma: typeof t.comma == "boolean" ? t.comma : Ie.comma,
      decodeDotInKeys: typeof t.decodeDotInKeys == "boolean" ? t.decodeDotInKeys : Ie.decodeDotInKeys,
      decoder: typeof t.decoder == "function" ? t.decoder : Ie.decoder,
      delimiter: typeof t.delimiter == "string" || hr.isRegExp(t.delimiter) ? t.delimiter : Ie.delimiter,
      // eslint-disable-next-line no-implicit-coercion, no-extra-parens
      depth: typeof t.depth == "number" || t.depth === !1 ? +t.depth : Ie.depth,
      duplicates: n,
      ignoreQueryPrefix: t.ignoreQueryPrefix === !0,
      interpretNumericEntities: typeof t.interpretNumericEntities == "boolean" ? t.interpretNumericEntities : Ie.interpretNumericEntities,
      parameterLimit: typeof t.parameterLimit == "number" ? t.parameterLimit : Ie.parameterLimit,
      parseArrays: t.parseArrays !== !1,
      plainObjects: typeof t.plainObjects == "boolean" ? t.plainObjects : Ie.plainObjects,
      strictNullHandling: typeof t.strictNullHandling == "boolean" ? t.strictNullHandling : Ie.strictNullHandling
    };
  }, "normalizeParseOptions");
  Rc.exports = function(e, t) {
    var r = Bv(t);
    if (e === "" || e === null || typeof e > "u")
      return r.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
    for (var n = typeof e == "string" ? Lv(e, r) : e, i = r.plainObjects ? /* @__PURE__ */ Object.create(null) : {}, o = Object.keys(n), l = 0; l <
    o.length; ++l) {
      var u = o[l], c = Fv(u, n[u], r, typeof e == "string");
      i = hr.merge(i, c, r);
    }
    return r.allowSparse === !0 ? i : hr.compact(i);
  };
});

// ../node_modules/qs/lib/index.js
var Wc = V((JM, $c) => {
  "use strict";
  var Hv = Bc(), Rv = zc(), zv = zn();
  $c.exports = {
    formats: zv,
    parse: Rv,
    stringify: Hv
  };
});

// ../node_modules/toggle-selection/index.js
var Gc = V((gD, qc) => {
  qc.exports = function() {
    var e = document.getSelection();
    if (!e.rangeCount)
      return function() {
      };
    for (var t = document.activeElement, r = [], n = 0; n < e.rangeCount; n++)
      r.push(e.getRangeAt(n));
    switch (t.tagName.toUpperCase()) {
      case "INPUT":
      case "TEXTAREA":
        t.blur();
        break;
      default:
        t = null;
        break;
    }
    return e.removeAllRanges(), function() {
      e.type === "Caret" && e.removeAllRanges(), e.rangeCount || r.forEach(function(i) {
        e.addRange(i);
      }), t && t.focus();
    };
  };
});

// ../node_modules/copy-to-clipboard/index.js
var Xc = V((yD, Qc) => {
  "use strict";
  var Uv = Gc(), Yc = {
    "text/plain": "Text",
    "text/html": "Url",
    default: "Text"
  }, qv = "Copy to clipboard: #{key}, Enter";
  function Gv(e) {
    var t = (/mac os x/i.test(navigator.userAgent) ? "\u2318" : "Ctrl") + "+C";
    return e.replace(/#{\s*key\s*}/g, t);
  }
  a(Gv, "format");
  function Yv(e, t) {
    var r, n, i, o, l, u, c = !1;
    t || (t = {}), r = t.debug || !1;
    try {
      i = Uv(), o = document.createRange(), l = document.getSelection(), u = document.createElement("span"), u.textContent = e, u.ariaHidden =
      "true", u.style.all = "unset", u.style.position = "fixed", u.style.top = 0, u.style.clip = "rect(0, 0, 0, 0)", u.style.whiteSpace = "p\
re", u.style.webkitUserSelect = "text", u.style.MozUserSelect = "text", u.style.msUserSelect = "text", u.style.userSelect = "text", u.addEventListener(
      "copy", function(d) {
        if (d.stopPropagation(), t.format)
          if (d.preventDefault(), typeof d.clipboardData > "u") {
            r && console.warn("unable to use e.clipboardData"), r && console.warn("trying IE specific stuff"), window.clipboardData.clearData();
            var h = Yc[t.format] || Yc.default;
            window.clipboardData.setData(h, e);
          } else
            d.clipboardData.clearData(), d.clipboardData.setData(t.format, e);
        t.onCopy && (d.preventDefault(), t.onCopy(d.clipboardData));
      }), document.body.appendChild(u), o.selectNodeContents(u), l.addRange(o);
      var p = document.execCommand("copy");
      if (!p)
        throw new Error("copy command was unsuccessful");
      c = !0;
    } catch (d) {
      r && console.error("unable to copy using execCommand: ", d), r && console.warn("trying IE specific stuff");
      try {
        window.clipboardData.setData(t.format || "text", e), t.onCopy && t.onCopy(window.clipboardData), c = !0;
      } catch (h) {
        r && console.error("unable to copy using clipboardData: ", h), r && console.error("falling back to prompt"), n = Gv("message" in t ?
        t.message : qv), window.prompt(n, e);
      }
    } finally {
      l && (typeof l.removeRange == "function" ? l.removeRange(o) : l.removeAllRanges()), u && document.body.removeChild(u), i();
    }
    return c;
  }
  a(Yv, "copy");
  Qc.exports = Yv;
});

// ../node_modules/lodash/isObject.js
var qn = V((nF, nd) => {
  function e0(e) {
    var t = typeof e;
    return e != null && (t == "object" || t == "function");
  }
  a(e0, "isObject");
  nd.exports = e0;
});

// ../node_modules/lodash/_freeGlobal.js
var id = V((iF, od) => {
  var t0 = typeof global == "object" && global && global.Object === Object && global;
  od.exports = t0;
});

// ../node_modules/lodash/_root.js
var $i = V((aF, ad) => {
  var r0 = id(), n0 = typeof self == "object" && self && self.Object === Object && self, o0 = r0 || n0 || Function("return this")();
  ad.exports = o0;
});

// ../node_modules/lodash/now.js
var ld = V((sF, sd) => {
  var i0 = $i(), a0 = /* @__PURE__ */ a(function() {
    return i0.Date.now();
  }, "now");
  sd.exports = a0;
});

// ../node_modules/lodash/_trimmedEndIndex.js
var cd = V((uF, ud) => {
  var s0 = /\s/;
  function l0(e) {
    for (var t = e.length; t-- && s0.test(e.charAt(t)); )
      ;
    return t;
  }
  a(l0, "trimmedEndIndex");
  ud.exports = l0;
});

// ../node_modules/lodash/_baseTrim.js
var dd = V((pF, pd) => {
  var u0 = cd(), c0 = /^\s+/;
  function p0(e) {
    return e && e.slice(0, u0(e) + 1).replace(c0, "");
  }
  a(p0, "baseTrim");
  pd.exports = p0;
});

// ../node_modules/lodash/_Symbol.js
var Wi = V((fF, fd) => {
  var d0 = $i(), f0 = d0.Symbol;
  fd.exports = f0;
});

// ../node_modules/lodash/_getRawTag.js
var yd = V((mF, gd) => {
  var md = Wi(), hd = Object.prototype, m0 = hd.hasOwnProperty, h0 = hd.toString, $r = md ? md.toStringTag : void 0;
  function g0(e) {
    var t = m0.call(e, $r), r = e[$r];
    try {
      e[$r] = void 0;
      var n = !0;
    } catch {
    }
    var i = h0.call(e);
    return n && (t ? e[$r] = r : delete e[$r]), i;
  }
  a(g0, "getRawTag");
  gd.exports = g0;
});

// ../node_modules/lodash/_objectToString.js
var bd = V((gF, vd) => {
  var y0 = Object.prototype, v0 = y0.toString;
  function b0(e) {
    return v0.call(e);
  }
  a(b0, "objectToString");
  vd.exports = b0;
});

// ../node_modules/lodash/_baseGetTag.js
var wd = V((vF, xd) => {
  var Id = Wi(), I0 = yd(), S0 = bd(), x0 = "[object Null]", w0 = "[object Undefined]", Sd = Id ? Id.toStringTag : void 0;
  function E0(e) {
    return e == null ? e === void 0 ? w0 : x0 : Sd && Sd in Object(e) ? I0(e) : S0(e);
  }
  a(E0, "baseGetTag");
  xd.exports = E0;
});

// ../node_modules/lodash/isObjectLike.js
var Cd = V((IF, Ed) => {
  function C0(e) {
    return e != null && typeof e == "object";
  }
  a(C0, "isObjectLike");
  Ed.exports = C0;
});

// ../node_modules/lodash/isSymbol.js
var Td = V((xF, _d) => {
  var _0 = wd(), T0 = Cd(), k0 = "[object Symbol]";
  function O0(e) {
    return typeof e == "symbol" || T0(e) && _0(e) == k0;
  }
  a(O0, "isSymbol");
  _d.exports = O0;
});

// ../node_modules/lodash/toNumber.js
var Ad = V((EF, Pd) => {
  var P0 = dd(), kd = qn(), A0 = Td(), Od = NaN, M0 = /^[-+]0x[0-9a-f]+$/i, D0 = /^0b[01]+$/i, L0 = /^0o[0-7]+$/i, N0 = parseInt;
  function F0(e) {
    if (typeof e == "number")
      return e;
    if (A0(e))
      return Od;
    if (kd(e)) {
      var t = typeof e.valueOf == "function" ? e.valueOf() : e;
      e = kd(t) ? t + "" : t;
    }
    if (typeof e != "string")
      return e === 0 ? e : +e;
    e = P0(e);
    var r = D0.test(e);
    return r || L0.test(e) ? N0(e.slice(2), r ? 2 : 8) : M0.test(e) ? Od : +e;
  }
  a(F0, "toNumber");
  Pd.exports = F0;
});

// ../node_modules/lodash/debounce.js
var Ki = V((_F, Dd) => {
  var B0 = qn(), Vi = ld(), Md = Ad(), H0 = "Expected a function", R0 = Math.max, z0 = Math.min;
  function $0(e, t, r) {
    var n, i, o, l, u, c, p = 0, d = !1, h = !1, f = !0;
    if (typeof e != "function")
      throw new TypeError(H0);
    t = Md(t) || 0, B0(r) && (d = !!r.leading, h = "maxWait" in r, o = h ? R0(Md(r.maxWait) || 0, t) : o, f = "trailing" in r ? !!r.trailing :
    f);
    function y(E) {
      var k = n, O = i;
      return n = i = void 0, p = E, l = e.apply(O, k), l;
    }
    a(y, "invokeFunc");
    function m(E) {
      return p = E, u = setTimeout(_, t), d ? y(E) : l;
    }
    a(m, "leadingEdge");
    function b(E) {
      var k = E - c, O = E - p, w = t - k;
      return h ? z0(w, o - O) : w;
    }
    a(b, "remainingWait");
    function x(E) {
      var k = E - c, O = E - p;
      return c === void 0 || k >= t || k < 0 || h && O >= o;
    }
    a(x, "shouldInvoke");
    function _() {
      var E = Vi();
      if (x(E))
        return g(E);
      u = setTimeout(_, b(E));
    }
    a(_, "timerExpired");
    function g(E) {
      return u = void 0, f && n ? y(E) : (n = i = void 0, l);
    }
    a(g, "trailingEdge");
    function v() {
      u !== void 0 && clearTimeout(u), p = 0, n = c = i = u = void 0;
    }
    a(v, "cancel");
    function S() {
      return u === void 0 ? l : g(Vi());
    }
    a(S, "flush");
    function C() {
      var E = Vi(), k = x(E);
      if (n = arguments, i = this, c = E, k) {
        if (u === void 0)
          return m(c);
        if (h)
          return clearTimeout(u), u = setTimeout(_, t), y(c);
      }
      return u === void 0 && (u = setTimeout(_, t)), l;
    }
    return a(C, "debounced"), C.cancel = v, C.flush = S, C;
  }
  a($0, "debounce");
  Dd.exports = $0;
});

// ../node_modules/lodash/throttle.js
var Nd = V((kF, Ld) => {
  var W0 = Ki(), V0 = qn(), K0 = "Expected a function";
  function j0(e, t, r) {
    var n = !0, i = !0;
    if (typeof e != "function")
      throw new TypeError(K0);
    return V0(r) && (n = "leading" in r ? !!r.leading : n, i = "trailing" in r ? !!r.trailing : i), W0(e, t, {
      leading: n,
      maxWait: t,
      trailing: i
    });
  }
  a(j0, "throttle");
  Ld.exports = j0;
});

// ../node_modules/downshift/node_modules/react-is/cjs/react-is.production.min.js
var Zd = V((fe) => {
  "use strict";
  var qi = Symbol.for("react.element"), Gi = Symbol.for("react.portal"), Gn = Symbol.for("react.fragment"), Yn = Symbol.for("react.strict_mo\
de"), Qn = Symbol.for("react.profiler"), Xn = Symbol.for("react.provider"), Zn = Symbol.for("react.context"), pI = Symbol.for("react.server_\
context"), Jn = Symbol.for("react.forward_ref"), eo = Symbol.for("react.suspense"), to = Symbol.for("react.suspense_list"), ro = Symbol.for(
  "react.memo"), no = Symbol.for("react.lazy"), dI = Symbol.for("react.offscreen"), Xd;
  Xd = Symbol.for("react.module.reference");
  function qe(e) {
    if (typeof e == "object" && e !== null) {
      var t = e.$$typeof;
      switch (t) {
        case qi:
          switch (e = e.type, e) {
            case Gn:
            case Qn:
            case Yn:
            case eo:
            case to:
              return e;
            default:
              switch (e = e && e.$$typeof, e) {
                case pI:
                case Zn:
                case Jn:
                case no:
                case ro:
                case Xn:
                  return e;
                default:
                  return t;
              }
          }
        case Gi:
          return t;
      }
    }
  }
  a(qe, "v");
  fe.ContextConsumer = Zn;
  fe.ContextProvider = Xn;
  fe.Element = qi;
  fe.ForwardRef = Jn;
  fe.Fragment = Gn;
  fe.Lazy = no;
  fe.Memo = ro;
  fe.Portal = Gi;
  fe.Profiler = Qn;
  fe.StrictMode = Yn;
  fe.Suspense = eo;
  fe.SuspenseList = to;
  fe.isAsyncMode = function() {
    return !1;
  };
  fe.isConcurrentMode = function() {
    return !1;
  };
  fe.isContextConsumer = function(e) {
    return qe(e) === Zn;
  };
  fe.isContextProvider = function(e) {
    return qe(e) === Xn;
  };
  fe.isElement = function(e) {
    return typeof e == "object" && e !== null && e.$$typeof === qi;
  };
  fe.isForwardRef = function(e) {
    return qe(e) === Jn;
  };
  fe.isFragment = function(e) {
    return qe(e) === Gn;
  };
  fe.isLazy = function(e) {
    return qe(e) === no;
  };
  fe.isMemo = function(e) {
    return qe(e) === ro;
  };
  fe.isPortal = function(e) {
    return qe(e) === Gi;
  };
  fe.isProfiler = function(e) {
    return qe(e) === Qn;
  };
  fe.isStrictMode = function(e) {
    return qe(e) === Yn;
  };
  fe.isSuspense = function(e) {
    return qe(e) === eo;
  };
  fe.isSuspenseList = function(e) {
    return qe(e) === to;
  };
  fe.isValidElementType = function(e) {
    return typeof e == "string" || typeof e == "function" || e === Gn || e === Qn || e === Yn || e === eo || e === to || e === dI || typeof e ==
    "object" && e !== null && (e.$$typeof === no || e.$$typeof === ro || e.$$typeof === Xn || e.$$typeof === Zn || e.$$typeof === Jn || e.$$typeof ===
    Xd || e.getModuleId !== void 0);
  };
  fe.typeOf = qe;
});

// ../node_modules/downshift/node_modules/react-is/index.js
var ef = V((X5, Jd) => {
  "use strict";
  Jd.exports = Zd();
});

// ../node_modules/fuse.js/dist/fuse.js
var um = V((Kr, Ra) => {
  (function(e, t) {
    typeof Kr == "object" && typeof Ra == "object" ? Ra.exports = t() : typeof define == "function" && define.amd ? define("Fuse", [], t) : typeof Kr ==
    "object" ? Kr.Fuse = t() : e.Fuse = t();
  })(Kr, function() {
    return function(e) {
      var t = {};
      function r(n) {
        if (t[n]) return t[n].exports;
        var i = t[n] = { i: n, l: !1, exports: {} };
        return e[n].call(i.exports, i, i.exports, r), i.l = !0, i.exports;
      }
      return a(r, "r"), r.m = e, r.c = t, r.d = function(n, i, o) {
        r.o(n, i) || Object.defineProperty(n, i, { enumerable: !0, get: o });
      }, r.r = function(n) {
        typeof Symbol < "u" && Symbol.toStringTag && Object.defineProperty(n, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(
        n, "__esModule", { value: !0 });
      }, r.t = function(n, i) {
        if (1 & i && (n = r(n)), 8 & i || 4 & i && typeof n == "object" && n && n.__esModule) return n;
        var o = /* @__PURE__ */ Object.create(null);
        if (r.r(o), Object.defineProperty(o, "default", { enumerable: !0, value: n }), 2 & i && typeof n != "string") for (var l in n) r.d(o,
        l, (function(u) {
          return n[u];
        }).bind(null, l));
        return o;
      }, r.n = function(n) {
        var i = n && n.__esModule ? function() {
          return n.default;
        } : function() {
          return n;
        };
        return r.d(i, "a", i), i;
      }, r.o = function(n, i) {
        return Object.prototype.hasOwnProperty.call(n, i);
      }, r.p = "", r(r.s = 0);
    }([function(e, t, r) {
      function n(d) {
        return (n = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(h) {
          return typeof h;
        } : function(h) {
          return h && typeof Symbol == "function" && h.constructor === Symbol && h !== Symbol.prototype ? "symbol" : typeof h;
        })(d);
      }
      a(n, "n");
      function i(d, h) {
        for (var f = 0; f < h.length; f++) {
          var y = h[f];
          y.enumerable = y.enumerable || !1, y.configurable = !0, "value" in y && (y.writable = !0), Object.defineProperty(d, y.key, y);
        }
      }
      a(i, "o");
      var o = r(1), l = r(7), u = l.get, c = (l.deepValue, l.isArray), p = function() {
        function d(m, b) {
          var x = b.location, _ = x === void 0 ? 0 : x, g = b.distance, v = g === void 0 ? 100 : g, S = b.threshold, C = S === void 0 ? 0.6 :
          S, E = b.maxPatternLength, k = E === void 0 ? 32 : E, O = b.caseSensitive, w = O !== void 0 && O, T = b.tokenSeparator, P = T === void 0 ?
          / +/g : T, M = b.findAllMatches, D = M !== void 0 && M, L = b.minMatchCharLength, W = L === void 0 ? 1 : L, Z = b.id, G = Z === void 0 ?
          null : Z, R = b.keys, z = R === void 0 ? [] : R, B = b.shouldSort, re = B === void 0 || B, H = b.getFn, N = H === void 0 ? u : H, F = b.
          sortFn, $ = F === void 0 ? function(me, xe) {
            return me.score - xe.score;
          } : F, Q = b.tokenize, ne = Q !== void 0 && Q, ee = b.matchAllTokens, le = ee !== void 0 && ee, se = b.includeMatches, pe = se !==
          void 0 && se, ce = b.includeScore, Se = ce !== void 0 && ce, ge = b.verbose, Pe = ge !== void 0 && ge;
          (function(me, xe) {
            if (!(me instanceof xe)) throw new TypeError("Cannot call a class as a function");
          })(this, d), this.options = { location: _, distance: v, threshold: C, maxPatternLength: k, isCaseSensitive: w, tokenSeparator: P, findAllMatches: D,
          minMatchCharLength: W, id: G, keys: z, includeMatches: pe, includeScore: Se, shouldSort: re, getFn: N, sortFn: $, verbose: Pe, tokenize: ne,
          matchAllTokens: le }, this.setCollection(m), this._processKeys(z);
        }
        a(d, "e");
        var h, f, y;
        return h = d, (f = [{ key: "setCollection", value: /* @__PURE__ */ a(function(m) {
          return this.list = m, m;
        }, "value") }, { key: "_processKeys", value: /* @__PURE__ */ a(function(m) {
          if (this._keyWeights = {}, this._keyNames = [], m.length && typeof m[0] == "string") for (var b = 0, x = m.length; b < x; b += 1) {
            var _ = m[b];
            this._keyWeights[_] = 1, this._keyNames.push(_);
          }
          else {
            for (var g = null, v = null, S = 0, C = 0, E = m.length; C < E; C += 1) {
              var k = m[C];
              if (!k.hasOwnProperty("name")) throw new Error('Missing "name" property in key object');
              var O = k.name;
              if (this._keyNames.push(O), !k.hasOwnProperty("weight")) throw new Error('Missing "weight" property in key object');
              var w = k.weight;
              if (w < 0 || w > 1) throw new Error('"weight" property in key must bein the range of [0, 1)');
              v = v == null ? w : Math.max(v, w), g = g == null ? w : Math.min(g, w), this._keyWeights[O] = w, S += w;
            }
            if (S > 1) throw new Error("Total of weights cannot exceed 1");
          }
        }, "value") }, { key: "search", value: /* @__PURE__ */ a(function(m) {
          var b = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : { limit: !1 };
          this._log(`---------
Search pattern: "`.concat(m, '"'));
          var x = this._prepareSearchers(m), _ = x.tokenSearchers, g = x.fullSearcher, v = this._search(_, g);
          return this._computeScore(v), this.options.shouldSort && this._sort(v), b.limit && typeof b.limit == "number" && (v = v.slice(0, b.
          limit)), this._format(v);
        }, "value") }, { key: "_prepareSearchers", value: /* @__PURE__ */ a(function() {
          var m = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", b = [];
          if (this.options.tokenize) for (var x = m.split(this.options.tokenSeparator), _ = 0, g = x.length; _ < g; _ += 1) b.push(new o(x[_],
          this.options));
          return { tokenSearchers: b, fullSearcher: new o(m, this.options) };
        }, "value") }, { key: "_search", value: /* @__PURE__ */ a(function() {
          var m = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [], b = arguments.length > 1 ? arguments[1] : void 0, x = this.
          list, _ = {}, g = [];
          if (typeof x[0] == "string") {
            for (var v = 0, S = x.length; v < S; v += 1) this._analyze({ key: "", value: x[v], record: v, index: v }, { resultMap: _, results: g,
            tokenSearchers: m, fullSearcher: b });
            return g;
          }
          for (var C = 0, E = x.length; C < E; C += 1) for (var k = x[C], O = 0, w = this._keyNames.length; O < w; O += 1) {
            var T = this._keyNames[O];
            this._analyze({ key: T, value: this.options.getFn(k, T), record: k, index: C }, { resultMap: _, results: g, tokenSearchers: m, fullSearcher: b });
          }
          return g;
        }, "value") }, { key: "_analyze", value: /* @__PURE__ */ a(function(m, b) {
          var x = this, _ = m.key, g = m.arrayIndex, v = g === void 0 ? -1 : g, S = m.value, C = m.record, E = m.index, k = b.tokenSearchers,
          O = k === void 0 ? [] : k, w = b.fullSearcher, T = b.resultMap, P = T === void 0 ? {} : T, M = b.results, D = M === void 0 ? [] : M;
          (/* @__PURE__ */ a(function L(W, Z, G, R) {
            if (Z != null) {
              if (typeof Z == "string") {
                var z = !1, B = -1, re = 0;
                x._log(`
Key: `.concat(_ === "" ? "--" : _));
                var H = w.search(Z);
                if (x._log('Full text: "'.concat(Z, '", score: ').concat(H.score)), x.options.tokenize) {
                  for (var N = Z.split(x.options.tokenSeparator), F = N.length, $ = [], Q = 0, ne = O.length; Q < ne; Q += 1) {
                    var ee = O[Q];
                    x._log(`
Pattern: "`.concat(ee.pattern, '"'));
                    for (var le = !1, se = 0; se < F; se += 1) {
                      var pe = N[se], ce = ee.search(pe), Se = {};
                      ce.isMatch ? (Se[pe] = ce.score, z = !0, le = !0, $.push(ce.score)) : (Se[pe] = 1, x.options.matchAllTokens || $.push(
                      1)), x._log('Token: "'.concat(pe, '", score: ').concat(Se[pe]));
                    }
                    le && (re += 1);
                  }
                  B = $[0];
                  for (var ge = $.length, Pe = 1; Pe < ge; Pe += 1) B += $[Pe];
                  B /= ge, x._log("Token score average:", B);
                }
                var me = H.score;
                B > -1 && (me = (me + B) / 2), x._log("Score average:", me);
                var xe = !x.options.tokenize || !x.options.matchAllTokens || re >= O.length;
                if (x._log(`
Check Matches: `.concat(xe)), (z || H.isMatch) && xe) {
                  var _e = { key: _, arrayIndex: W, value: Z, score: me };
                  x.options.includeMatches && (_e.matchedIndices = H.matchedIndices);
                  var Fe = P[R];
                  Fe ? Fe.output.push(_e) : (P[R] = { item: G, output: [_e] }, D.push(P[R]));
                }
              } else if (c(Z)) for (var tt = 0, Me = Z.length; tt < Me; tt += 1) L(tt, Z[tt], G, R);
            }
          }, "e"))(v, S, C, E);
        }, "value") }, { key: "_computeScore", value: /* @__PURE__ */ a(function(m) {
          this._log(`

Computing score:
`);
          for (var b = this._keyWeights, x = !!Object.keys(b).length, _ = 0, g = m.length; _ < g; _ += 1) {
            for (var v = m[_], S = v.output, C = S.length, E = 1, k = 0; k < C; k += 1) {
              var O = S[k], w = O.key, T = x ? b[w] : 1, P = O.score === 0 && b && b[w] > 0 ? Number.EPSILON : O.score;
              E *= Math.pow(P, T);
            }
            v.score = E, this._log(v);
          }
        }, "value") }, { key: "_sort", value: /* @__PURE__ */ a(function(m) {
          this._log(`

Sorting....`), m.sort(this.options.sortFn);
        }, "value") }, { key: "_format", value: /* @__PURE__ */ a(function(m) {
          var b = [];
          if (this.options.verbose) {
            var x = [];
            this._log(`

Output:

`, JSON.stringify(m, function(O, w) {
              if (n(w) === "object" && w !== null) {
                if (x.indexOf(w) !== -1) return;
                x.push(w);
              }
              return w;
            }, 2)), x = null;
          }
          var _ = [];
          this.options.includeMatches && _.push(function(O, w) {
            var T = O.output;
            w.matches = [];
            for (var P = 0, M = T.length; P < M; P += 1) {
              var D = T[P];
              if (D.matchedIndices.length !== 0) {
                var L = { indices: D.matchedIndices, value: D.value };
                D.key && (L.key = D.key), D.hasOwnProperty("arrayIndex") && D.arrayIndex > -1 && (L.arrayIndex = D.arrayIndex), w.matches.push(
                L);
              }
            }
          }), this.options.includeScore && _.push(function(O, w) {
            w.score = O.score;
          });
          for (var g = 0, v = m.length; g < v; g += 1) {
            var S = m[g];
            if (this.options.id && (S.item = this.options.getFn(S.item, this.options.id)[0]), _.length) {
              for (var C = { item: S.item }, E = 0, k = _.length; E < k; E += 1) _[E](S, C);
              b.push(C);
            } else b.push(S.item);
          }
          return b;
        }, "value") }, { key: "_log", value: /* @__PURE__ */ a(function() {
          var m;
          this.options.verbose && (m = console).log.apply(m, arguments);
        }, "value") }]) && i(h.prototype, f), y && i(h, y), d;
      }();
      e.exports = p;
    }, function(e, t, r) {
      function n(c, p) {
        for (var d = 0; d < p.length; d++) {
          var h = p[d];
          h.enumerable = h.enumerable || !1, h.configurable = !0, "value" in h && (h.writable = !0), Object.defineProperty(c, h.key, h);
        }
      }
      a(n, "n");
      var i = r(2), o = r(3), l = r(6), u = function() {
        function c(f, y) {
          var m = y.location, b = m === void 0 ? 0 : m, x = y.distance, _ = x === void 0 ? 100 : x, g = y.threshold, v = g === void 0 ? 0.6 :
          g, S = y.maxPatternLength, C = S === void 0 ? 32 : S, E = y.isCaseSensitive, k = E !== void 0 && E, O = y.tokenSeparator, w = O ===
          void 0 ? / +/g : O, T = y.findAllMatches, P = T !== void 0 && T, M = y.minMatchCharLength, D = M === void 0 ? 1 : M, L = y.includeMatches,
          W = L !== void 0 && L;
          (function(Z, G) {
            if (!(Z instanceof G)) throw new TypeError("Cannot call a class as a function");
          })(this, c), this.options = { location: b, distance: _, threshold: v, maxPatternLength: C, isCaseSensitive: k, tokenSeparator: w, findAllMatches: P,
          includeMatches: W, minMatchCharLength: D }, this.pattern = k ? f : f.toLowerCase(), this.pattern.length <= C && (this.patternAlphabet =
          l(this.pattern));
        }
        a(c, "e");
        var p, d, h;
        return p = c, (d = [{ key: "search", value: /* @__PURE__ */ a(function(f) {
          var y = this.options, m = y.isCaseSensitive, b = y.includeMatches;
          if (m || (f = f.toLowerCase()), this.pattern === f) {
            var x = { isMatch: !0, score: 0 };
            return b && (x.matchedIndices = [[0, f.length - 1]]), x;
          }
          var _ = this.options, g = _.maxPatternLength, v = _.tokenSeparator;
          if (this.pattern.length > g) return i(f, this.pattern, v);
          var S = this.options, C = S.location, E = S.distance, k = S.threshold, O = S.findAllMatches, w = S.minMatchCharLength;
          return o(f, this.pattern, this.patternAlphabet, { location: C, distance: E, threshold: k, findAllMatches: O, minMatchCharLength: w,
          includeMatches: b });
        }, "value") }]) && n(p.prototype, d), h && n(p, h), c;
      }();
      e.exports = u;
    }, function(e, t) {
      var r = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;
      e.exports = function(n, i) {
        var o = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : / +/g, l = new RegExp(i.replace(r, "\\$&").replace(o, "|")),
        u = n.match(l), c = !!u, p = [];
        if (c) for (var d = 0, h = u.length; d < h; d += 1) {
          var f = u[d];
          p.push([n.indexOf(f), f.length - 1]);
        }
        return { score: c ? 0.5 : 1, isMatch: c, matchedIndices: p };
      };
    }, function(e, t, r) {
      var n = r(4), i = r(5);
      e.exports = function(o, l, u, c) {
        for (var p = c.location, d = p === void 0 ? 0 : p, h = c.distance, f = h === void 0 ? 100 : h, y = c.threshold, m = y === void 0 ? 0.6 :
        y, b = c.findAllMatches, x = b !== void 0 && b, _ = c.minMatchCharLength, g = _ === void 0 ? 1 : _, v = c.includeMatches, S = v !== void 0 &&
        v, C = d, E = o.length, k = m, O = o.indexOf(l, C), w = l.length, T = [], P = 0; P < E; P += 1) T[P] = 0;
        if (O !== -1) {
          var M = n(l, { errors: 0, currentLocation: O, expectedLocation: C, distance: f });
          if (k = Math.min(M, k), (O = o.lastIndexOf(l, C + w)) !== -1) {
            var D = n(l, { errors: 0, currentLocation: O, expectedLocation: C, distance: f });
            k = Math.min(D, k);
          }
        }
        O = -1;
        for (var L = [], W = 1, Z = w + E, G = 1 << (w <= 31 ? w - 1 : 30), R = 0; R < w; R += 1) {
          for (var z = 0, B = Z; z < B; )
            n(l, { errors: R, currentLocation: C + B, expectedLocation: C, distance: f }) <= k ? z = B : Z = B, B = Math.floor((Z - z) / 2 +
            z);
          Z = B;
          var re = Math.max(1, C - B + 1), H = x ? E : Math.min(C + B, E) + w, N = Array(H + 2);
          N[H + 1] = (1 << R) - 1;
          for (var F = H; F >= re; F -= 1) {
            var $ = F - 1, Q = u[o.charAt($)];
            if (Q && (T[$] = 1), N[F] = (N[F + 1] << 1 | 1) & Q, R !== 0 && (N[F] |= (L[F + 1] | L[F]) << 1 | 1 | L[F + 1]), N[F] & G && (W =
            n(l, { errors: R, currentLocation: $, expectedLocation: C, distance: f })) <= k) {
              if (k = W, (O = $) <= C) break;
              re = Math.max(1, 2 * C - O);
            }
          }
          if (n(l, { errors: R + 1, currentLocation: C, expectedLocation: C, distance: f }) > k) break;
          L = N;
        }
        var ne = { isMatch: O >= 0, score: W === 0 ? 1e-3 : W };
        return S && (ne.matchedIndices = i(T, g)), ne;
      };
    }, function(e, t) {
      e.exports = function(r, n) {
        var i = n.errors, o = i === void 0 ? 0 : i, l = n.currentLocation, u = l === void 0 ? 0 : l, c = n.expectedLocation, p = c === void 0 ?
        0 : c, d = n.distance, h = d === void 0 ? 100 : d, f = o / r.length, y = Math.abs(p - u);
        return h ? f + y / h : y ? 1 : f;
      };
    }, function(e, t) {
      e.exports = function() {
        for (var r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [], n = arguments.length > 1 && arguments[1] !== void 0 ?
        arguments[1] : 1, i = [], o = -1, l = -1, u = 0, c = r.length; u < c; u += 1) {
          var p = r[u];
          p && o === -1 ? o = u : p || o === -1 || ((l = u - 1) - o + 1 >= n && i.push([o, l]), o = -1);
        }
        return r[u - 1] && u - o >= n && i.push([o, u - 1]), i;
      };
    }, function(e, t) {
      e.exports = function(r) {
        for (var n = {}, i = r.length, o = 0; o < i; o += 1) n[r.charAt(o)] = 0;
        for (var l = 0; l < i; l += 1) n[r.charAt(l)] |= 1 << i - l - 1;
        return n;
      };
    }, function(e, t) {
      var r = /* @__PURE__ */ a(function(l) {
        return Array.isArray ? Array.isArray(l) : Object.prototype.toString.call(l) === "[object Array]";
      }, "r"), n = /* @__PURE__ */ a(function(l) {
        return l == null ? "" : function(u) {
          if (typeof u == "string") return u;
          var c = u + "";
          return c == "0" && 1 / u == -1 / 0 ? "-0" : c;
        }(l);
      }, "n"), i = /* @__PURE__ */ a(function(l) {
        return typeof l == "string";
      }, "o"), o = /* @__PURE__ */ a(function(l) {
        return typeof l == "number";
      }, "i");
      e.exports = { get: /* @__PURE__ */ a(function(l, u) {
        var c = [];
        return (/* @__PURE__ */ a(function p(d, h) {
          if (h) {
            var f = h.indexOf("."), y = h, m = null;
            f !== -1 && (y = h.slice(0, f), m = h.slice(f + 1));
            var b = d[y];
            if (b != null) if (m || !i(b) && !o(b)) if (r(b)) for (var x = 0, _ = b.length; x < _; x += 1) p(b[x], m);
            else m && p(b, m);
            else c.push(n(b));
          } else c.push(d);
        }, "e"))(l, u), c;
      }, "get"), isArray: r, isString: i, isNum: o, toString: n };
    }]);
  });
});

// ../node_modules/store2/dist/store2.js
var qm = V((_o, To) => {
  (function(e, t) {
    var r = {
      version: "2.14.2",
      areas: {},
      apis: {},
      nsdelim: ".",
      // utilities
      inherit: /* @__PURE__ */ a(function(i, o) {
        for (var l in i)
          o.hasOwnProperty(l) || Object.defineProperty(o, l, Object.getOwnPropertyDescriptor(i, l));
        return o;
      }, "inherit"),
      stringify: /* @__PURE__ */ a(function(i, o) {
        return i === void 0 || typeof i == "function" ? i + "" : JSON.stringify(i, o || r.replace);
      }, "stringify"),
      parse: /* @__PURE__ */ a(function(i, o) {
        try {
          return JSON.parse(i, o || r.revive);
        } catch {
          return i;
        }
      }, "parse"),
      // extension hooks
      fn: /* @__PURE__ */ a(function(i, o) {
        r.storeAPI[i] = o;
        for (var l in r.apis)
          r.apis[l][i] = o;
      }, "fn"),
      get: /* @__PURE__ */ a(function(i, o) {
        return i.getItem(o);
      }, "get"),
      set: /* @__PURE__ */ a(function(i, o, l) {
        i.setItem(o, l);
      }, "set"),
      remove: /* @__PURE__ */ a(function(i, o) {
        i.removeItem(o);
      }, "remove"),
      key: /* @__PURE__ */ a(function(i, o) {
        return i.key(o);
      }, "key"),
      length: /* @__PURE__ */ a(function(i) {
        return i.length;
      }, "length"),
      clear: /* @__PURE__ */ a(function(i) {
        i.clear();
      }, "clear"),
      // core functions
      Store: /* @__PURE__ */ a(function(i, o, l) {
        var u = r.inherit(r.storeAPI, function(p, d, h) {
          return arguments.length === 0 ? u.getAll() : typeof d == "function" ? u.transact(p, d, h) : d !== void 0 ? u.set(p, d, h) : typeof p ==
          "string" || typeof p == "number" ? u.get(p) : typeof p == "function" ? u.each(p) : p ? u.setAll(p, d) : u.clear();
        });
        u._id = i;
        try {
          var c = "__store2_test";
          o.setItem(c, "ok"), u._area = o, o.removeItem(c);
        } catch {
          u._area = r.storage("fake");
        }
        return u._ns = l || "", r.areas[i] || (r.areas[i] = u._area), r.apis[u._ns + u._id] || (r.apis[u._ns + u._id] = u), u;
      }, "Store"),
      storeAPI: {
        // admin functions
        area: /* @__PURE__ */ a(function(i, o) {
          var l = this[i];
          return (!l || !l.area) && (l = r.Store(i, o, this._ns), this[i] || (this[i] = l)), l;
        }, "area"),
        namespace: /* @__PURE__ */ a(function(i, o, l) {
          if (l = l || this._delim || r.nsdelim, !i)
            return this._ns ? this._ns.substring(0, this._ns.length - l.length) : "";
          var u = i, c = this[u];
          if ((!c || !c.namespace) && (c = r.Store(this._id, this._area, this._ns + u + l), c._delim = l, this[u] || (this[u] = c), !o))
            for (var p in r.areas)
              c.area(p, r.areas[p]);
          return c;
        }, "namespace"),
        isFake: /* @__PURE__ */ a(function(i) {
          return i ? (this._real = this._area, this._area = r.storage("fake")) : i === !1 && (this._area = this._real || this._area), this._area.
          name === "fake";
        }, "isFake"),
        toString: /* @__PURE__ */ a(function() {
          return "store" + (this._ns ? "." + this.namespace() : "") + "[" + this._id + "]";
        }, "toString"),
        // storage functions
        has: /* @__PURE__ */ a(function(i) {
          return this._area.has ? this._area.has(this._in(i)) : this._in(i) in this._area;
        }, "has"),
        size: /* @__PURE__ */ a(function() {
          return this.keys().length;
        }, "size"),
        each: /* @__PURE__ */ a(function(i, o) {
          for (var l = 0, u = r.length(this._area); l < u; l++) {
            var c = this._out(r.key(this._area, l));
            if (c !== void 0 && i.call(this, c, this.get(c), o) === !1)
              break;
            u > r.length(this._area) && (u--, l--);
          }
          return o || this;
        }, "each"),
        keys: /* @__PURE__ */ a(function(i) {
          return this.each(function(o, l, u) {
            u.push(o);
          }, i || []);
        }, "keys"),
        get: /* @__PURE__ */ a(function(i, o) {
          var l = r.get(this._area, this._in(i)), u;
          return typeof o == "function" && (u = o, o = null), l !== null ? r.parse(l, u) : o ?? l;
        }, "get"),
        getAll: /* @__PURE__ */ a(function(i) {
          return this.each(function(o, l, u) {
            u[o] = l;
          }, i || {});
        }, "getAll"),
        transact: /* @__PURE__ */ a(function(i, o, l) {
          var u = this.get(i, l), c = o(u);
          return this.set(i, c === void 0 ? u : c), this;
        }, "transact"),
        set: /* @__PURE__ */ a(function(i, o, l) {
          var u = this.get(i), c;
          return u != null && l === !1 ? o : (typeof l == "function" && (c = l, l = void 0), r.set(this._area, this._in(i), r.stringify(o, c),
          l) || u);
        }, "set"),
        setAll: /* @__PURE__ */ a(function(i, o) {
          var l, u;
          for (var c in i)
            u = i[c], this.set(c, u, o) !== u && (l = !0);
          return l;
        }, "setAll"),
        add: /* @__PURE__ */ a(function(i, o, l) {
          var u = this.get(i);
          if (u instanceof Array)
            o = u.concat(o);
          else if (u !== null) {
            var c = typeof u;
            if (c === typeof o && c === "object") {
              for (var p in o)
                u[p] = o[p];
              o = u;
            } else
              o = u + o;
          }
          return r.set(this._area, this._in(i), r.stringify(o, l)), o;
        }, "add"),
        remove: /* @__PURE__ */ a(function(i, o) {
          var l = this.get(i, o);
          return r.remove(this._area, this._in(i)), l;
        }, "remove"),
        clear: /* @__PURE__ */ a(function() {
          return this._ns ? this.each(function(i) {
            r.remove(this._area, this._in(i));
          }, 1) : r.clear(this._area), this;
        }, "clear"),
        clearAll: /* @__PURE__ */ a(function() {
          var i = this._area;
          for (var o in r.areas)
            r.areas.hasOwnProperty(o) && (this._area = r.areas[o], this.clear());
          return this._area = i, this;
        }, "clearAll"),
        // internal use functions
        _in: /* @__PURE__ */ a(function(i) {
          return typeof i != "string" && (i = r.stringify(i)), this._ns ? this._ns + i : i;
        }, "_in"),
        _out: /* @__PURE__ */ a(function(i) {
          return this._ns ? i && i.indexOf(this._ns) === 0 ? i.substring(this._ns.length) : void 0 : (
            // so each() knows to skip it
            i
          );
        }, "_out")
      },
      // end _.storeAPI
      storage: /* @__PURE__ */ a(function(i) {
        return r.inherit(r.storageAPI, { items: {}, name: i });
      }, "storage"),
      storageAPI: {
        length: 0,
        has: /* @__PURE__ */ a(function(i) {
          return this.items.hasOwnProperty(i);
        }, "has"),
        key: /* @__PURE__ */ a(function(i) {
          var o = 0;
          for (var l in this.items)
            if (this.has(l) && i === o++)
              return l;
        }, "key"),
        setItem: /* @__PURE__ */ a(function(i, o) {
          this.has(i) || this.length++, this.items[i] = o;
        }, "setItem"),
        removeItem: /* @__PURE__ */ a(function(i) {
          this.has(i) && (delete this.items[i], this.length--);
        }, "removeItem"),
        getItem: /* @__PURE__ */ a(function(i) {
          return this.has(i) ? this.items[i] : null;
        }, "getItem"),
        clear: /* @__PURE__ */ a(function() {
          for (var i in this.items)
            this.removeItem(i);
        }, "clear")
      }
      // end _.storageAPI
    }, n = (
      // safely set this up (throws error in IE10/32bit mode for local files)
      r.Store("local", function() {
        try {
          return localStorage;
        } catch {
        }
      }())
    );
    n.local = n, n._ = r, n.area("session", function() {
      try {
        return sessionStorage;
      } catch {
      }
    }()), n.area("page", r.storage("page")), typeof t == "function" && t.amd !== void 0 ? t("store2", [], function() {
      return n;
    }) : typeof To < "u" && To.exports ? To.exports = n : (e.store && (r.conflict = e.store), e.store = n);
  })(_o, _o && _o.define);
});

// global-externals:@storybook/core/channels
var Zx = __STORYBOOK_CHANNELS__, { Channel: Jx, PostMessageTransport: ew, WebsocketTransport: tw, createBrowserChannel: Za } = __STORYBOOK_CHANNELS__;

// ../node_modules/@storybook/global/dist/index.mjs
var ae = (() => {
  let e;
  return typeof window < "u" ? e = window : typeof globalThis < "u" ? e = globalThis : typeof global < "u" ? e = global : typeof self < "u" ?
  e = self : e = {}, e;
})();

// global-externals:@storybook/core/core-events
var ow = __STORYBOOK_CORE_EVENTS__, { ARGTYPES_INFO_REQUEST: Ja, ARGTYPES_INFO_RESPONSE: es, CHANNEL_CREATED: ts, CHANNEL_WS_DISCONNECT: iw,
CONFIG_ERROR: aw, CREATE_NEW_STORYFILE_REQUEST: rs, CREATE_NEW_STORYFILE_RESPONSE: ns, CURRENT_STORY_WAS_SET: sw, DOCS_PREPARED: lw, DOCS_RENDERED: uw,
FILE_COMPONENT_SEARCH_REQUEST: os, FILE_COMPONENT_SEARCH_RESPONSE: qr, FORCE_REMOUNT: Ao, FORCE_RE_RENDER: cw, GLOBALS_UPDATED: pw, NAVIGATE_URL: dw,
PLAY_FUNCTION_THREW_EXCEPTION: fw, PRELOAD_ENTRIES: wt, PREVIEW_BUILDER_PROGRESS: is, PREVIEW_KEYDOWN: mw, REGISTER_SUBSCRIPTION: hw, REQUEST_WHATS_NEW_DATA: gw,
RESET_STORY_ARGS: yw, RESULT_WHATS_NEW_DATA: vw, SAVE_STORY_REQUEST: as, SAVE_STORY_RESPONSE: ss, SELECT_STORY: bw, SET_CONFIG: Iw, SET_CURRENT_STORY: ls,
SET_FILTER: Sw, SET_GLOBALS: xw, SET_INDEX: ww, SET_STORIES: Ew, SET_WHATS_NEW_CACHE: Cw, SHARED_STATE_CHANGED: _w, SHARED_STATE_SET: Tw, STORIES_COLLAPSE_ALL: Ir,
STORIES_EXPAND_ALL: Mo, STORY_ARGS_UPDATED: kw, STORY_CHANGED: Ow, STORY_ERRORED: Pw, STORY_INDEX_INVALIDATED: Aw, STORY_MISSING: Mw, STORY_PREPARED: Dw,
STORY_RENDERED: Lw, STORY_RENDER_PHASE_CHANGED: Nw, STORY_SPECIFIED: Fw, STORY_THREW_EXCEPTION: Bw, STORY_UNCHANGED: Hw, TELEMETRY_ERROR: Rw,
TOGGLE_WHATS_NEW_NOTIFICATIONS: zw, UNHANDLED_ERRORS_WHILE_PLAYING: $w, UPDATE_GLOBALS: Ww, UPDATE_QUERY_PARAMS: Vw, UPDATE_STORY_ARGS: Kw } = __STORYBOOK_CORE_EVENTS__;

// global-externals:@storybook/core/manager-api
var Uw = __STORYBOOK_API__, { ActiveTabs: qw, Consumer: he, ManagerContext: Gw, Provider: us, RequestResponseError: Yw, addons: Qe, combineParameters: Qw,
controlOrMetaKey: Xw, controlOrMetaSymbol: Zw, eventMatchesShortcut: Jw, eventToShortcut: cs, experimental_requestResponse: Gr, isMacLike: eE,
isShortcutTaken: tE, keyToSymbol: rE, merge: Yr, mockChannel: nE, optionOrAltSymbol: oE, shortcutMatchesShortcut: ps, shortcutToHumanString: Xe,
types: ve, useAddonState: iE, useArgTypes: aE, useArgs: sE, useChannel: lE, useGlobalTypes: uE, useGlobals: cE, useParameter: pE, useSharedState: dE,
useStoryPrepared: fE, useStorybookApi: de, useStorybookState: Ke } = __STORYBOOK_API__;

// global-externals:react
var s = __REACT__, { Children: hE, Component: Re, Fragment: Te, Profiler: gE, PureComponent: yE, StrictMode: vE, Suspense: bE, __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: IE,
cloneElement: ds, createContext: Ut, createElement: SE, createFactory: xE, createRef: wE, forwardRef: fs, isValidElement: EE, lazy: CE, memo: Sr,
startTransition: _E, unstable_act: TE, useCallback: A, useContext: Qr, useDebugValue: kE, useDeferredValue: ms, useEffect: K, useId: OE, useImperativeHandle: PE,
useInsertionEffect: AE, useLayoutEffect: qt, useMemo: j, useReducer: Gt, useRef: X, useState: J, useSyncExternalStore: ME, useTransition: hs,
version: DE } = __REACT__;

// global-externals:react-dom/client
var LE = __REACT_DOM_CLIENT__, { createRoot: gs, hydrateRoot: NE } = __REACT_DOM_CLIENT__;

// global-externals:@storybook/core/router
var BE = __STORYBOOK_ROUTER__, { BaseLocationProvider: HE, DEEPLY_EQUAL: RE, Link: Xr, Location: Zr, LocationProvider: ys, Match: vs, Route: xr,
buildArgsParam: zE, deepDiff: $E, getMatch: WE, parsePath: VE, queryFromLocation: KE, queryFromString: jE, stringifyQuery: UE, useNavigate: bs } = __STORYBOOK_ROUTER__;

// global-externals:@storybook/core/theming
var GE = __STORYBOOK_THEMING__, { CacheProvider: YE, ClassNames: QE, Global: Yt, ThemeProvider: Do, background: XE, color: ZE, convert: JE, create: eC,
createCache: tC, createGlobal: Is, createReset: rC, css: Ss, darken: nC, ensure: xs, ignoreSsrWarning: oC, isPropValid: iC, jsx: aC, keyframes: wr,
lighten: sC, styled: I, themes: lC, typography: uC, useTheme: De, withTheme: ws } = __STORYBOOK_THEMING__;

// global-externals:@storybook/core/manager-errors
var pC = __STORYBOOK_CORE_EVENTS_MANAGER_ERRORS__, { Category: dC, ProviderDoesNotExtendBaseProviderError: Es, UncaughtManagerError: fC } = __STORYBOOK_CORE_EVENTS_MANAGER_ERRORS__;

// ../node_modules/react-helmet-async/lib/index.module.js
var oe = Be(Lo()), Ks = Be(Ds()), Ro = Be(Ns()), js = Be(Bs());
function be() {
  return be = Object.assign || function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t];
      for (var n in r) Object.prototype.hasOwnProperty.call(r, n) && (e[n] = r[n]);
    }
    return e;
  }, be.apply(this, arguments);
}
a(be, "a");
function Vo(e, t) {
  e.prototype = Object.create(t.prototype), e.prototype.constructor = e, zo(e, t);
}
a(Vo, "s");
function zo(e, t) {
  return zo = Object.setPrototypeOf || function(r, n) {
    return r.__proto__ = n, r;
  }, zo(e, t);
}
a(zo, "c");
function Hs(e, t) {
  if (e == null) return {};
  var r, n, i = {}, o = Object.keys(e);
  for (n = 0; n < o.length; n++) t.indexOf(r = o[n]) >= 0 || (i[r] = e[r]);
  return i;
}
a(Hs, "u");
var Y = { BASE: "base", BODY: "body", HEAD: "head", HTML: "html", LINK: "link", META: "meta", NOSCRIPT: "noscript", SCRIPT: "script", STYLE: "\
style", TITLE: "title", FRAGMENT: "Symbol(react.fragment)" }, Oh = { rel: ["amphtml", "canonical", "alternate"] }, Ph = { type: ["applicatio\
n/ld+json"] }, Ah = { charset: "", name: ["robots", "description"], property: ["og:type", "og:title", "og:url", "og:image", "og:image:alt", "\
og:description", "twitter:url", "twitter:title", "twitter:description", "twitter:image", "twitter:image:alt", "twitter:card", "twitter:site"] },
Rs = Object.keys(Y).map(function(e) {
  return Y[e];
}), rn = { accesskey: "accessKey", charset: "charSet", class: "className", contenteditable: "contentEditable", contextmenu: "contextMenu", "\
http-equiv": "httpEquiv", itemprop: "itemProp", tabindex: "tabIndex" }, Mh = Object.keys(rn).reduce(function(e, t) {
  return e[rn[t]] = t, e;
}, {}), Xt = /* @__PURE__ */ a(function(e, t) {
  for (var r = e.length - 1; r >= 0; r -= 1) {
    var n = e[r];
    if (Object.prototype.hasOwnProperty.call(n, t)) return n[t];
  }
  return null;
}, "T"), Dh = /* @__PURE__ */ a(function(e) {
  var t = Xt(e, Y.TITLE), r = Xt(e, "titleTemplate");
  if (Array.isArray(t) && (t = t.join("")), r && t) return r.replace(/%s/g, function() {
    return t;
  });
  var n = Xt(e, "defaultTitle");
  return t || n || void 0;
}, "g"), Lh = /* @__PURE__ */ a(function(e) {
  return Xt(e, "onChangeClientState") || function() {
  };
}, "b"), No = /* @__PURE__ */ a(function(e, t) {
  return t.filter(function(r) {
    return r[e] !== void 0;
  }).map(function(r) {
    return r[e];
  }).reduce(function(r, n) {
    return be({}, r, n);
  }, {});
}, "v"), Nh = /* @__PURE__ */ a(function(e, t) {
  return t.filter(function(r) {
    return r[Y.BASE] !== void 0;
  }).map(function(r) {
    return r[Y.BASE];
  }).reverse().reduce(function(r, n) {
    if (!r.length) for (var i = Object.keys(n), o = 0; o < i.length; o += 1) {
      var l = i[o].toLowerCase();
      if (e.indexOf(l) !== -1 && n[l]) return r.concat(n);
    }
    return r;
  }, []);
}, "A"), Er = /* @__PURE__ */ a(function(e, t, r) {
  var n = {};
  return r.filter(function(i) {
    return !!Array.isArray(i[e]) || (i[e] !== void 0 && console && typeof console.warn == "function" && console.warn("Helmet: " + e + ' shou\
ld be of type "Array". Instead found type "' + typeof i[e] + '"'), !1);
  }).map(function(i) {
    return i[e];
  }).reverse().reduce(function(i, o) {
    var l = {};
    o.filter(function(h) {
      for (var f, y = Object.keys(h), m = 0; m < y.length; m += 1) {
        var b = y[m], x = b.toLowerCase();
        t.indexOf(x) === -1 || f === "rel" && h[f].toLowerCase() === "canonical" || x === "rel" && h[x].toLowerCase() === "stylesheet" || (f =
        x), t.indexOf(b) === -1 || b !== "innerHTML" && b !== "cssText" && b !== "itemprop" || (f = b);
      }
      if (!f || !h[f]) return !1;
      var _ = h[f].toLowerCase();
      return n[f] || (n[f] = {}), l[f] || (l[f] = {}), !n[f][_] && (l[f][_] = !0, !0);
    }).reverse().forEach(function(h) {
      return i.push(h);
    });
    for (var u = Object.keys(l), c = 0; c < u.length; c += 1) {
      var p = u[c], d = be({}, n[p], l[p]);
      n[p] = d;
    }
    return i;
  }, []).reverse();
}, "C"), Fh = /* @__PURE__ */ a(function(e, t) {
  if (Array.isArray(e) && e.length) {
    for (var r = 0; r < e.length; r += 1) if (e[r][t]) return !0;
  }
  return !1;
}, "O"), Us = /* @__PURE__ */ a(function(e) {
  return Array.isArray(e) ? e.join("") : e;
}, "S"), Fo = /* @__PURE__ */ a(function(e, t) {
  return Array.isArray(e) ? e.reduce(function(r, n) {
    return function(i, o) {
      for (var l = Object.keys(i), u = 0; u < l.length; u += 1) if (o[l[u]] && o[l[u]].includes(i[l[u]])) return !0;
      return !1;
    }(n, t) ? r.priority.push(n) : r.default.push(n), r;
  }, { priority: [], default: [] }) : { default: e };
}, "E"), zs = /* @__PURE__ */ a(function(e, t) {
  var r;
  return be({}, e, ((r = {})[t] = void 0, r));
}, "I"), Bh = [Y.NOSCRIPT, Y.SCRIPT, Y.STYLE], Bo = /* @__PURE__ */ a(function(e, t) {
  return t === void 0 && (t = !0), t === !1 ? String(e) : String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(
  /"/g, "&quot;").replace(/'/g, "&#x27;");
}, "w"), $s = /* @__PURE__ */ a(function(e) {
  return Object.keys(e).reduce(function(t, r) {
    var n = e[r] !== void 0 ? r + '="' + e[r] + '"' : "" + r;
    return t ? t + " " + n : n;
  }, "");
}, "x"), Ws = /* @__PURE__ */ a(function(e, t) {
  return t === void 0 && (t = {}), Object.keys(e).reduce(function(r, n) {
    return r[rn[n] || n] = e[n], r;
  }, t);
}, "L"), tn = /* @__PURE__ */ a(function(e, t) {
  return t.map(function(r, n) {
    var i, o = ((i = { key: n })["data-rh"] = !0, i);
    return Object.keys(r).forEach(function(l) {
      var u = rn[l] || l;
      u === "innerHTML" || u === "cssText" ? o.dangerouslySetInnerHTML = { __html: r.innerHTML || r.cssText } : o[u] = r[l];
    }), s.createElement(e, o);
  });
}, "j"), je = /* @__PURE__ */ a(function(e, t, r) {
  switch (e) {
    case Y.TITLE:
      return { toComponent: /* @__PURE__ */ a(function() {
        return i = t.titleAttributes, (o = { key: n = t.title })["data-rh"] = !0, l = Ws(i, o), [s.createElement(Y.TITLE, l, n)];
        var n, i, o, l;
      }, "toComponent"), toString: /* @__PURE__ */ a(function() {
        return function(n, i, o, l) {
          var u = $s(o), c = Us(i);
          return u ? "<" + n + ' data-rh="true" ' + u + ">" + Bo(c, l) + "</" + n + ">" : "<" + n + ' data-rh="true">' + Bo(c, l) + "</" + n +
          ">";
        }(e, t.title, t.titleAttributes, r);
      }, "toString") };
    case "bodyAttributes":
    case "htmlAttributes":
      return { toComponent: /* @__PURE__ */ a(function() {
        return Ws(t);
      }, "toComponent"), toString: /* @__PURE__ */ a(function() {
        return $s(t);
      }, "toString") };
    default:
      return { toComponent: /* @__PURE__ */ a(function() {
        return tn(e, t);
      }, "toComponent"), toString: /* @__PURE__ */ a(function() {
        return function(n, i, o) {
          return i.reduce(function(l, u) {
            var c = Object.keys(u).filter(function(h) {
              return !(h === "innerHTML" || h === "cssText");
            }).reduce(function(h, f) {
              var y = u[f] === void 0 ? f : f + '="' + Bo(u[f], o) + '"';
              return h ? h + " " + y : y;
            }, ""), p = u.innerHTML || u.cssText || "", d = Bh.indexOf(n) === -1;
            return l + "<" + n + ' data-rh="true" ' + c + (d ? "/>" : ">" + p + "</" + n + ">");
          }, "");
        }(e, t, r);
      }, "toString") };
  }
}, "M"), $o = /* @__PURE__ */ a(function(e) {
  var t = e.baseTag, r = e.bodyAttributes, n = e.encode, i = e.htmlAttributes, o = e.noscriptTags, l = e.styleTags, u = e.title, c = u === void 0 ?
  "" : u, p = e.titleAttributes, d = e.linkTags, h = e.metaTags, f = e.scriptTags, y = { toComponent: /* @__PURE__ */ a(function() {
  }, "toComponent"), toString: /* @__PURE__ */ a(function() {
    return "";
  }, "toString") };
  if (e.prioritizeSeoTags) {
    var m = function(b) {
      var x = b.linkTags, _ = b.scriptTags, g = b.encode, v = Fo(b.metaTags, Ah), S = Fo(x, Oh), C = Fo(_, Ph);
      return { priorityMethods: { toComponent: /* @__PURE__ */ a(function() {
        return [].concat(tn(Y.META, v.priority), tn(Y.LINK, S.priority), tn(Y.SCRIPT, C.priority));
      }, "toComponent"), toString: /* @__PURE__ */ a(function() {
        return je(Y.META, v.priority, g) + " " + je(Y.LINK, S.priority, g) + " " + je(Y.SCRIPT, C.priority, g);
      }, "toString") }, metaTags: v.default, linkTags: S.default, scriptTags: C.default };
    }(e);
    y = m.priorityMethods, d = m.linkTags, h = m.metaTags, f = m.scriptTags;
  }
  return { priority: y, base: je(Y.BASE, t, n), bodyAttributes: je("bodyAttributes", r, n), htmlAttributes: je("htmlAttributes", i, n), link: je(
  Y.LINK, d, n), meta: je(Y.META, h, n), noscript: je(Y.NOSCRIPT, o, n), script: je(Y.SCRIPT, f, n), style: je(Y.STYLE, l, n), title: je(Y.TITLE,
  { title: c, titleAttributes: p }, n) };
}, "k"), en = [], Wo = /* @__PURE__ */ a(function(e, t) {
  var r = this;
  t === void 0 && (t = typeof document < "u"), this.instances = [], this.value = { setHelmet: /* @__PURE__ */ a(function(n) {
    r.context.helmet = n;
  }, "setHelmet"), helmetInstances: { get: /* @__PURE__ */ a(function() {
    return r.canUseDOM ? en : r.instances;
  }, "get"), add: /* @__PURE__ */ a(function(n) {
    (r.canUseDOM ? en : r.instances).push(n);
  }, "add"), remove: /* @__PURE__ */ a(function(n) {
    var i = (r.canUseDOM ? en : r.instances).indexOf(n);
    (r.canUseDOM ? en : r.instances).splice(i, 1);
  }, "remove") } }, this.context = e, this.canUseDOM = t, t || (e.helmet = $o({ baseTag: [], bodyAttributes: {}, encodeSpecialCharacters: !0,
  htmlAttributes: {}, linkTags: [], metaTags: [], noscriptTags: [], scriptTags: [], styleTags: [], title: "", titleAttributes: {} }));
}, "N"), qs = s.createContext({}), Hh = oe.default.shape({ setHelmet: oe.default.func, helmetInstances: oe.default.shape({ get: oe.default.func,
add: oe.default.func, remove: oe.default.func }) }), Rh = typeof document < "u", ft = /* @__PURE__ */ function(e) {
  function t(r) {
    var n;
    return (n = e.call(this, r) || this).helmetData = new Wo(n.props.context, t.canUseDOM), n;
  }
  return a(t, "r"), Vo(t, e), t.prototype.render = function() {
    return s.createElement(qs.Provider, { value: this.helmetData.value }, this.props.children);
  }, t;
}(Re);
ft.canUseDOM = Rh, ft.propTypes = { context: oe.default.shape({ helmet: oe.default.shape() }), children: oe.default.node.isRequired }, ft.defaultProps =
{ context: {} }, ft.displayName = "HelmetProvider";
var Qt = /* @__PURE__ */ a(function(e, t) {
  var r, n = document.head || document.querySelector(Y.HEAD), i = n.querySelectorAll(e + "[data-rh]"), o = [].slice.call(i), l = [];
  return t && t.length && t.forEach(function(u) {
    var c = document.createElement(e);
    for (var p in u) Object.prototype.hasOwnProperty.call(u, p) && (p === "innerHTML" ? c.innerHTML = u.innerHTML : p === "cssText" ? c.styleSheet ?
    c.styleSheet.cssText = u.cssText : c.appendChild(document.createTextNode(u.cssText)) : c.setAttribute(p, u[p] === void 0 ? "" : u[p]));
    c.setAttribute("data-rh", "true"), o.some(function(d, h) {
      return r = h, c.isEqualNode(d);
    }) ? o.splice(r, 1) : l.push(c);
  }), o.forEach(function(u) {
    return u.parentNode.removeChild(u);
  }), l.forEach(function(u) {
    return n.appendChild(u);
  }), { oldTags: o, newTags: l };
}, "Y"), Ho = /* @__PURE__ */ a(function(e, t) {
  var r = document.getElementsByTagName(e)[0];
  if (r) {
    for (var n = r.getAttribute("data-rh"), i = n ? n.split(",") : [], o = [].concat(i), l = Object.keys(t), u = 0; u < l.length; u += 1) {
      var c = l[u], p = t[c] || "";
      r.getAttribute(c) !== p && r.setAttribute(c, p), i.indexOf(c) === -1 && i.push(c);
      var d = o.indexOf(c);
      d !== -1 && o.splice(d, 1);
    }
    for (var h = o.length - 1; h >= 0; h -= 1) r.removeAttribute(o[h]);
    i.length === o.length ? r.removeAttribute("data-rh") : r.getAttribute("data-rh") !== l.join(",") && r.setAttribute("data-rh", l.join(","));
  }
}, "B"), Vs = /* @__PURE__ */ a(function(e, t) {
  var r = e.baseTag, n = e.htmlAttributes, i = e.linkTags, o = e.metaTags, l = e.noscriptTags, u = e.onChangeClientState, c = e.scriptTags, p = e.
  styleTags, d = e.title, h = e.titleAttributes;
  Ho(Y.BODY, e.bodyAttributes), Ho(Y.HTML, n), function(b, x) {
    b !== void 0 && document.title !== b && (document.title = Us(b)), Ho(Y.TITLE, x);
  }(d, h);
  var f = { baseTag: Qt(Y.BASE, r), linkTags: Qt(Y.LINK, i), metaTags: Qt(Y.META, o), noscriptTags: Qt(Y.NOSCRIPT, l), scriptTags: Qt(Y.SCRIPT,
  c), styleTags: Qt(Y.STYLE, p) }, y = {}, m = {};
  Object.keys(f).forEach(function(b) {
    var x = f[b], _ = x.newTags, g = x.oldTags;
    _.length && (y[b] = _), g.length && (m[b] = f[b].oldTags);
  }), t && t(), u(e, y, m);
}, "K"), Cr = null, nn = /* @__PURE__ */ function(e) {
  function t() {
    for (var n, i = arguments.length, o = new Array(i), l = 0; l < i; l++) o[l] = arguments[l];
    return (n = e.call.apply(e, [this].concat(o)) || this).rendered = !1, n;
  }
  a(t, "e"), Vo(t, e);
  var r = t.prototype;
  return r.shouldComponentUpdate = function(n) {
    return !(0, js.default)(n, this.props);
  }, r.componentDidUpdate = function() {
    this.emitChange();
  }, r.componentWillUnmount = function() {
    this.props.context.helmetInstances.remove(this), this.emitChange();
  }, r.emitChange = function() {
    var n, i, o = this.props.context, l = o.setHelmet, u = null, c = (n = o.helmetInstances.get().map(function(p) {
      var d = be({}, p.props);
      return delete d.context, d;
    }), { baseTag: Nh(["href"], n), bodyAttributes: No("bodyAttributes", n), defer: Xt(n, "defer"), encode: Xt(n, "encodeSpecialCharacters"),
    htmlAttributes: No("htmlAttributes", n), linkTags: Er(Y.LINK, ["rel", "href"], n), metaTags: Er(Y.META, ["name", "charset", "http-equiv",
    "property", "itemprop"], n), noscriptTags: Er(Y.NOSCRIPT, ["innerHTML"], n), onChangeClientState: Lh(n), scriptTags: Er(Y.SCRIPT, ["src",
    "innerHTML"], n), styleTags: Er(Y.STYLE, ["cssText"], n), title: Dh(n), titleAttributes: No("titleAttributes", n), prioritizeSeoTags: Fh(
    n, "prioritizeSeoTags") });
    ft.canUseDOM ? (i = c, Cr && cancelAnimationFrame(Cr), i.defer ? Cr = requestAnimationFrame(function() {
      Vs(i, function() {
        Cr = null;
      });
    }) : (Vs(i), Cr = null)) : $o && (u = $o(c)), l(u);
  }, r.init = function() {
    this.rendered || (this.rendered = !0, this.props.context.helmetInstances.add(this), this.emitChange());
  }, r.render = function() {
    return this.init(), null;
  }, t;
}(Re);
nn.propTypes = { context: Hh.isRequired }, nn.displayName = "HelmetDispatcher";
var zh = ["children"], $h = ["children"], _r = /* @__PURE__ */ function(e) {
  function t() {
    return e.apply(this, arguments) || this;
  }
  a(t, "r"), Vo(t, e);
  var r = t.prototype;
  return r.shouldComponentUpdate = function(n) {
    return !(0, Ks.default)(zs(this.props, "helmetData"), zs(n, "helmetData"));
  }, r.mapNestedChildrenToProps = function(n, i) {
    if (!i) return null;
    switch (n.type) {
      case Y.SCRIPT:
      case Y.NOSCRIPT:
        return { innerHTML: i };
      case Y.STYLE:
        return { cssText: i };
      default:
        throw new Error("<" + n.type + " /> elements are self-closing and can not contain children. Refer to our API for more information.");
    }
  }, r.flattenArrayTypeChildren = function(n) {
    var i, o = n.child, l = n.arrayTypeChildren;
    return be({}, l, ((i = {})[o.type] = [].concat(l[o.type] || [], [be({}, n.newChildProps, this.mapNestedChildrenToProps(o, n.nestedChildren))]),
    i));
  }, r.mapObjectTypeChildren = function(n) {
    var i, o, l = n.child, u = n.newProps, c = n.newChildProps, p = n.nestedChildren;
    switch (l.type) {
      case Y.TITLE:
        return be({}, u, ((i = {})[l.type] = p, i.titleAttributes = be({}, c), i));
      case Y.BODY:
        return be({}, u, { bodyAttributes: be({}, c) });
      case Y.HTML:
        return be({}, u, { htmlAttributes: be({}, c) });
      default:
        return be({}, u, ((o = {})[l.type] = be({}, c), o));
    }
  }, r.mapArrayTypeChildrenToProps = function(n, i) {
    var o = be({}, i);
    return Object.keys(n).forEach(function(l) {
      var u;
      o = be({}, o, ((u = {})[l] = n[l], u));
    }), o;
  }, r.warnOnInvalidChildren = function(n, i) {
    return (0, Ro.default)(Rs.some(function(o) {
      return n.type === o;
    }), typeof n.type == "function" ? "You may be attempting to nest <Helmet> components within each other, which is not allowed. Refer to o\
ur API for more information." : "Only elements types " + Rs.join(", ") + " are allowed. Helmet does not support rendering <" + n.type + "> e\
lements. Refer to our API for more information."), (0, Ro.default)(!i || typeof i == "string" || Array.isArray(i) && !i.some(function(o) {
      return typeof o != "string";
    }), "Helmet expects a string as a child of <" + n.type + ">. Did you forget to wrap your children in braces? ( <" + n.type + ">{``}</" +
    n.type + "> ) Refer to our API for more information."), !0;
  }, r.mapChildrenToProps = function(n, i) {
    var o = this, l = {};
    return s.Children.forEach(n, function(u) {
      if (u && u.props) {
        var c = u.props, p = c.children, d = Hs(c, zh), h = Object.keys(d).reduce(function(y, m) {
          return y[Mh[m] || m] = d[m], y;
        }, {}), f = u.type;
        switch (typeof f == "symbol" ? f = f.toString() : o.warnOnInvalidChildren(u, p), f) {
          case Y.FRAGMENT:
            i = o.mapChildrenToProps(p, i);
            break;
          case Y.LINK:
          case Y.META:
          case Y.NOSCRIPT:
          case Y.SCRIPT:
          case Y.STYLE:
            l = o.flattenArrayTypeChildren({ child: u, arrayTypeChildren: l, newChildProps: h, nestedChildren: p });
            break;
          default:
            i = o.mapObjectTypeChildren({ child: u, newProps: i, newChildProps: h, nestedChildren: p });
        }
      }
    }), this.mapArrayTypeChildrenToProps(l, i);
  }, r.render = function() {
    var n = this.props, i = n.children, o = Hs(n, $h), l = be({}, o), u = o.helmetData;
    return i && (l = this.mapChildrenToProps(i, l)), !u || u instanceof Wo || (u = new Wo(u.context, u.instances)), u ? /* @__PURE__ */ s.createElement(
    nn, be({}, l, { context: u.value, helmetData: void 0 })) : /* @__PURE__ */ s.createElement(qs.Consumer, null, function(c) {
      return s.createElement(nn, be({}, l, { context: c }));
    });
  }, t;
}(Re);
_r.propTypes = { base: oe.default.object, bodyAttributes: oe.default.object, children: oe.default.oneOfType([oe.default.arrayOf(oe.default.node),
oe.default.node]), defaultTitle: oe.default.string, defer: oe.default.bool, encodeSpecialCharacters: oe.default.bool, htmlAttributes: oe.default.
object, link: oe.default.arrayOf(oe.default.object), meta: oe.default.arrayOf(oe.default.object), noscript: oe.default.arrayOf(oe.default.object),
onChangeClientState: oe.default.func, script: oe.default.arrayOf(oe.default.object), style: oe.default.arrayOf(oe.default.object), title: oe.default.
string, titleAttributes: oe.default.object, titleTemplate: oe.default.string, prioritizeSeoTags: oe.default.bool, helmetData: oe.default.object },
_r.defaultProps = { defer: !0, encodeSpecialCharacters: !0, prioritizeSeoTags: !1 }, _r.displayName = "Helmet";

// src/manager/constants.ts
var lt = "@media (min-width: 600px)";

// global-externals:@storybook/core/components
var AC = __STORYBOOK_COMPONENTS__, { A: MC, ActionBar: DC, AddonPanel: LC, Badge: on, Bar: NC, Blockquote: FC, Button: we, ClipboardCode: BC,
Code: HC, DL: RC, Div: zC, DocumentWrapper: $C, EmptyTabContent: Gs, ErrorFormatter: Ys, FlexBar: WC, Form: an, H1: VC, H2: KC, H3: jC, H4: UC,
H5: qC, H6: GC, HR: YC, IconButton: te, IconButtonSkeleton: QC, Icons: Qs, Img: XC, LI: ZC, Link: Le, ListItem: JC, Loader: sn, Modal: Et, OL: e_,
P: t_, Placeholder: r_, Pre: n_, ResetWrapper: o_, ScrollArea: ln, Separator: Zt, Spaced: ut, Span: i_, StorybookIcon: a_, StorybookLogo: un,
Symbols: s_, SyntaxHighlighter: l_, TT: u_, TabBar: cn, TabButton: pn, TabWrapper: c_, Table: p_, Tabs: Xs, TabsState: d_, TooltipLinkList: Ct,
TooltipMessage: f_, TooltipNote: dn, UL: m_, WithTooltip: ze, WithTooltipPure: h_, Zoom: Zs, codeCommon: g_, components: y_, createCopyToClipboardFunction: v_,
getStoryHref: Jt, icons: b_, interleaveSeparators: I_, nameSpaceClassNames: S_, resetComponents: x_, withReset: w_ } = __STORYBOOK_COMPONENTS__;

// global-externals:@storybook/icons
var C_ = __STORYBOOK_ICONS__, { AccessibilityAltIcon: __, AccessibilityIcon: T_, AddIcon: k_, AdminIcon: O_, AlertAltIcon: P_, AlertIcon: fn,
AlignLeftIcon: A_, AlignRightIcon: M_, AppleIcon: D_, ArrowBottomLeftIcon: L_, ArrowBottomRightIcon: N_, ArrowDownIcon: F_, ArrowLeftIcon: Js,
ArrowRightIcon: B_, ArrowSolidDownIcon: H_, ArrowSolidLeftIcon: R_, ArrowSolidRightIcon: z_, ArrowSolidUpIcon: $_, ArrowTopLeftIcon: W_, ArrowTopRightIcon: V_,
ArrowUpIcon: K_, AzureDevOpsIcon: j_, BackIcon: U_, BasketIcon: q_, BatchAcceptIcon: G_, BatchDenyIcon: Y_, BeakerIcon: Q_, BellIcon: X_, BitbucketIcon: Z_,
BoldIcon: J_, BookIcon: eT, BookmarkHollowIcon: tT, BookmarkIcon: rT, BottomBarIcon: mn, BottomBarToggleIcon: el, BoxIcon: nT, BranchIcon: oT,
BrowserIcon: iT, ButtonIcon: aT, CPUIcon: sT, CalendarIcon: lT, CameraIcon: uT, CategoryIcon: cT, CertificateIcon: pT, ChangedIcon: dT, ChatIcon: fT,
CheckIcon: rt, ChevronDownIcon: er, ChevronLeftIcon: mT, ChevronRightIcon: tl, ChevronSmallDownIcon: hT, ChevronSmallLeftIcon: gT, ChevronSmallRightIcon: yT,
ChevronSmallUpIcon: vT, ChevronUpIcon: bT, ChromaticIcon: IT, ChromeIcon: ST, CircleHollowIcon: xT, CircleIcon: rl, ClearIcon: wT, CloseAltIcon: hn,
CloseIcon: Ze, CloudHollowIcon: ET, CloudIcon: CT, CogIcon: Ko, CollapseIcon: nl, CommandIcon: _T, CommentAddIcon: TT, CommentIcon: kT, CommentsIcon: OT,
CommitIcon: PT, CompassIcon: AT, ComponentDrivenIcon: MT, ComponentIcon: jo, ContrastIcon: DT, ControlsIcon: LT, CopyIcon: NT, CreditIcon: FT,
CrossIcon: BT, DashboardIcon: HT, DatabaseIcon: RT, DeleteIcon: zT, DiamondIcon: $T, DirectionIcon: WT, DiscordIcon: VT, DocChartIcon: KT, DocListIcon: jT,
DocumentIcon: tr, DownloadIcon: UT, DragIcon: qT, EditIcon: GT, EllipsisIcon: YT, EmailIcon: QT, ExpandAltIcon: ol, ExpandIcon: il, EyeCloseIcon: al,
EyeIcon: sl, FaceHappyIcon: XT, FaceNeutralIcon: ZT, FaceSadIcon: JT, FacebookIcon: e1, FailedIcon: t1, FastForwardIcon: r1, FigmaIcon: n1, FilterIcon: o1,
FlagIcon: i1, FolderIcon: a1, FormIcon: s1, GDriveIcon: l1, GithubIcon: gn, GitlabIcon: u1, GlobeIcon: Uo, GoogleIcon: c1, GraphBarIcon: p1,
GraphLineIcon: d1, GraphqlIcon: f1, GridAltIcon: m1, GridIcon: h1, GrowIcon: g1, HeartHollowIcon: y1, HeartIcon: ll, HomeIcon: v1, HourglassIcon: b1,
InfoIcon: ul, ItalicIcon: I1, JumpToIcon: S1, KeyIcon: x1, LightningIcon: cl, LightningOffIcon: w1, LinkBrokenIcon: E1, LinkIcon: pl, LinkedinIcon: C1,
LinuxIcon: _1, ListOrderedIcon: T1, ListUnorderedIcon: k1, LocationIcon: O1, LockIcon: yn, MarkdownIcon: P1, MarkupIcon: dl, MediumIcon: A1,
MemoryIcon: M1, MenuIcon: vn, MergeIcon: D1, MirrorIcon: L1, MobileIcon: N1, MoonIcon: F1, NutIcon: B1, OutboxIcon: H1, OutlineIcon: R1, PaintBrushIcon: z1,
PaperClipIcon: $1, ParagraphIcon: W1, PassedIcon: V1, PhoneIcon: K1, PhotoDragIcon: j1, PhotoIcon: U1, PinAltIcon: q1, PinIcon: G1, PlayBackIcon: Y1,
PlayIcon: Q1, PlayNextIcon: X1, PlusIcon: fl, PointerDefaultIcon: Z1, PointerHandIcon: J1, PowerIcon: ek, PrintIcon: tk, ProceedIcon: rk, ProfileIcon: nk,
PullRequestIcon: ok, QuestionIcon: ik, RSSIcon: ak, RedirectIcon: sk, ReduxIcon: lk, RefreshIcon: uk, ReplyIcon: ck, RepoIcon: pk, RequestChangeIcon: dk,
RewindIcon: fk, RulerIcon: mk, SearchIcon: bn, ShareAltIcon: _t, ShareIcon: hk, ShieldIcon: gk, SideBySideIcon: yk, SidebarAltIcon: In, SidebarAltToggleIcon: vk,
SidebarIcon: bk, SidebarToggleIcon: Ik, SpeakerIcon: Sk, StackedIcon: xk, StarHollowIcon: wk, StarIcon: Ek, StatusFailIcon: qo, StatusPassIcon: ml,
StatusWarnIcon: Go, StickerIcon: Ck, StopAltIcon: _k, StopIcon: Tk, StorybookIcon: hl, StructureIcon: kk, SubtractIcon: Ok, SunIcon: Pk, SupportIcon: Ak,
SwitchAltIcon: Mk, SyncIcon: mt, TabletIcon: Dk, ThumbsUpIcon: Lk, TimeIcon: gl, TimerIcon: Nk, TransferIcon: Fk, TrashIcon: yl, TwitterIcon: Bk,
TypeIcon: Hk, UbuntuIcon: Rk, UndoIcon: zk, UnfoldIcon: $k, UnlockIcon: Wk, UnpinIcon: Vk, UploadIcon: Kk, UserAddIcon: jk, UserAltIcon: Uk,
UserIcon: qk, UsersIcon: Gk, VSCodeIcon: Yk, VerifiedIcon: Qk, VideoIcon: Xk, WandIcon: vl, WatchIcon: Zk, WindowsIcon: Jk, WrenchIcon: eO, XIcon: tO,
YoutubeIcon: rO, ZoomIcon: bl, ZoomOutIcon: Il, ZoomResetIcon: Sl, iconList: nO } = __STORYBOOK_ICONS__;

// ../node_modules/@babel/runtime/helpers/esm/extends.js
function U() {
  return U = Object.assign ? Object.assign.bind() : function(e) {
    for (var t = 1; t < arguments.length; t++) {
      var r = arguments[t];
      for (var n in r) ({}).hasOwnProperty.call(r, n) && (e[n] = r[n]);
    }
    return e;
  }, U.apply(null, arguments);
}
a(U, "_extends");

// ../node_modules/@babel/runtime/helpers/esm/assertThisInitialized.js
function xl(e) {
  if (e === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  return e;
}
a(xl, "_assertThisInitialized");

// ../node_modules/@babel/runtime/helpers/esm/setPrototypeOf.js
function ht(e, t) {
  return ht = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(r, n) {
    return r.__proto__ = n, r;
  }, ht(e, t);
}
a(ht, "_setPrototypeOf");

// ../node_modules/@babel/runtime/helpers/esm/inheritsLoose.js
function rr(e, t) {
  e.prototype = Object.create(t.prototype), e.prototype.constructor = e, ht(e, t);
}
a(rr, "_inheritsLoose");

// ../node_modules/@babel/runtime/helpers/esm/getPrototypeOf.js
function Sn(e) {
  return Sn = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(t) {
    return t.__proto__ || Object.getPrototypeOf(t);
  }, Sn(e);
}
a(Sn, "_getPrototypeOf");

// ../node_modules/@babel/runtime/helpers/esm/isNativeFunction.js
function wl(e) {
  try {
    return Function.toString.call(e).indexOf("[native code]") !== -1;
  } catch {
    return typeof e == "function";
  }
}
a(wl, "_isNativeFunction");

// ../node_modules/@babel/runtime/helpers/esm/isNativeReflectConstruct.js
function Yo() {
  try {
    var e = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
    }));
  } catch {
  }
  return (Yo = /* @__PURE__ */ a(function() {
    return !!e;
  }, "_isNativeReflectConstruct"))();
}
a(Yo, "_isNativeReflectConstruct");

// ../node_modules/@babel/runtime/helpers/esm/construct.js
function El(e, t, r) {
  if (Yo()) return Reflect.construct.apply(null, arguments);
  var n = [null];
  n.push.apply(n, t);
  var i = new (e.bind.apply(e, n))();
  return r && ht(i, r.prototype), i;
}
a(El, "_construct");

// ../node_modules/@babel/runtime/helpers/esm/wrapNativeSuper.js
function xn(e) {
  var t = typeof Map == "function" ? /* @__PURE__ */ new Map() : void 0;
  return xn = /* @__PURE__ */ a(function(n) {
    if (n === null || !wl(n)) return n;
    if (typeof n != "function") throw new TypeError("Super expression must either be null or a function");
    if (t !== void 0) {
      if (t.has(n)) return t.get(n);
      t.set(n, i);
    }
    function i() {
      return El(n, arguments, Sn(this).constructor);
    }
    return a(i, "Wrapper"), i.prototype = Object.create(n.prototype, {
      constructor: {
        value: i,
        enumerable: !1,
        writable: !0,
        configurable: !0
      }
    }), ht(i, n);
  }, "_wrapNativeSuper"), xn(e);
}
a(xn, "_wrapNativeSuper");

// ../node_modules/polished/dist/polished.esm.js
var or = /* @__PURE__ */ function(e) {
  rr(t, e);
  function t(r) {
    var n;
    if (1)
      n = e.call(this, "An error occurred. See https://github.com/styled-components/polished/blob/main/src/internalHelpers/errors.md#" + r +
      " for more information.") || this;
    else
      for (var i, o, l; l < i; l++)
        ;
    return xl(n);
  }
  return a(t, "PolishedError"), t;
}(/* @__PURE__ */ xn(Error));
function Qo(e) {
  return Math.round(e * 255);
}
a(Qo, "colorToInt");
function Wh(e, t, r) {
  return Qo(e) + "," + Qo(t) + "," + Qo(r);
}
a(Wh, "convertToInt");
function Cl(e, t, r, n) {
  if (n === void 0 && (n = Wh), t === 0)
    return n(r, r, r);
  var i = (e % 360 + 360) % 360 / 60, o = (1 - Math.abs(2 * r - 1)) * t, l = o * (1 - Math.abs(i % 2 - 1)), u = 0, c = 0, p = 0;
  i >= 0 && i < 1 ? (u = o, c = l) : i >= 1 && i < 2 ? (u = l, c = o) : i >= 2 && i < 3 ? (c = o, p = l) : i >= 3 && i < 4 ? (c = l, p = o) :
  i >= 4 && i < 5 ? (u = l, p = o) : i >= 5 && i < 6 && (u = o, p = l);
  var d = r - o / 2, h = u + d, f = c + d, y = p + d;
  return n(h, f, y);
}
a(Cl, "hslToRgb");
var _l = {
  aliceblue: "f0f8ff",
  antiquewhite: "faebd7",
  aqua: "00ffff",
  aquamarine: "7fffd4",
  azure: "f0ffff",
  beige: "f5f5dc",
  bisque: "ffe4c4",
  black: "000",
  blanchedalmond: "ffebcd",
  blue: "0000ff",
  blueviolet: "8a2be2",
  brown: "a52a2a",
  burlywood: "deb887",
  cadetblue: "5f9ea0",
  chartreuse: "7fff00",
  chocolate: "d2691e",
  coral: "ff7f50",
  cornflowerblue: "6495ed",
  cornsilk: "fff8dc",
  crimson: "dc143c",
  cyan: "00ffff",
  darkblue: "00008b",
  darkcyan: "008b8b",
  darkgoldenrod: "b8860b",
  darkgray: "a9a9a9",
  darkgreen: "006400",
  darkgrey: "a9a9a9",
  darkkhaki: "bdb76b",
  darkmagenta: "8b008b",
  darkolivegreen: "556b2f",
  darkorange: "ff8c00",
  darkorchid: "9932cc",
  darkred: "8b0000",
  darksalmon: "e9967a",
  darkseagreen: "8fbc8f",
  darkslateblue: "483d8b",
  darkslategray: "2f4f4f",
  darkslategrey: "2f4f4f",
  darkturquoise: "00ced1",
  darkviolet: "9400d3",
  deeppink: "ff1493",
  deepskyblue: "00bfff",
  dimgray: "696969",
  dimgrey: "696969",
  dodgerblue: "1e90ff",
  firebrick: "b22222",
  floralwhite: "fffaf0",
  forestgreen: "228b22",
  fuchsia: "ff00ff",
  gainsboro: "dcdcdc",
  ghostwhite: "f8f8ff",
  gold: "ffd700",
  goldenrod: "daa520",
  gray: "808080",
  green: "008000",
  greenyellow: "adff2f",
  grey: "808080",
  honeydew: "f0fff0",
  hotpink: "ff69b4",
  indianred: "cd5c5c",
  indigo: "4b0082",
  ivory: "fffff0",
  khaki: "f0e68c",
  lavender: "e6e6fa",
  lavenderblush: "fff0f5",
  lawngreen: "7cfc00",
  lemonchiffon: "fffacd",
  lightblue: "add8e6",
  lightcoral: "f08080",
  lightcyan: "e0ffff",
  lightgoldenrodyellow: "fafad2",
  lightgray: "d3d3d3",
  lightgreen: "90ee90",
  lightgrey: "d3d3d3",
  lightpink: "ffb6c1",
  lightsalmon: "ffa07a",
  lightseagreen: "20b2aa",
  lightskyblue: "87cefa",
  lightslategray: "789",
  lightslategrey: "789",
  lightsteelblue: "b0c4de",
  lightyellow: "ffffe0",
  lime: "0f0",
  limegreen: "32cd32",
  linen: "faf0e6",
  magenta: "f0f",
  maroon: "800000",
  mediumaquamarine: "66cdaa",
  mediumblue: "0000cd",
  mediumorchid: "ba55d3",
  mediumpurple: "9370db",
  mediumseagreen: "3cb371",
  mediumslateblue: "7b68ee",
  mediumspringgreen: "00fa9a",
  mediumturquoise: "48d1cc",
  mediumvioletred: "c71585",
  midnightblue: "191970",
  mintcream: "f5fffa",
  mistyrose: "ffe4e1",
  moccasin: "ffe4b5",
  navajowhite: "ffdead",
  navy: "000080",
  oldlace: "fdf5e6",
  olive: "808000",
  olivedrab: "6b8e23",
  orange: "ffa500",
  orangered: "ff4500",
  orchid: "da70d6",
  palegoldenrod: "eee8aa",
  palegreen: "98fb98",
  paleturquoise: "afeeee",
  palevioletred: "db7093",
  papayawhip: "ffefd5",
  peachpuff: "ffdab9",
  peru: "cd853f",
  pink: "ffc0cb",
  plum: "dda0dd",
  powderblue: "b0e0e6",
  purple: "800080",
  rebeccapurple: "639",
  red: "f00",
  rosybrown: "bc8f8f",
  royalblue: "4169e1",
  saddlebrown: "8b4513",
  salmon: "fa8072",
  sandybrown: "f4a460",
  seagreen: "2e8b57",
  seashell: "fff5ee",
  sienna: "a0522d",
  silver: "c0c0c0",
  skyblue: "87ceeb",
  slateblue: "6a5acd",
  slategray: "708090",
  slategrey: "708090",
  snow: "fffafa",
  springgreen: "00ff7f",
  steelblue: "4682b4",
  tan: "d2b48c",
  teal: "008080",
  thistle: "d8bfd8",
  tomato: "ff6347",
  turquoise: "40e0d0",
  violet: "ee82ee",
  wheat: "f5deb3",
  white: "fff",
  whitesmoke: "f5f5f5",
  yellow: "ff0",
  yellowgreen: "9acd32"
};
function Vh(e) {
  if (typeof e != "string") return e;
  var t = e.toLowerCase();
  return _l[t] ? "#" + _l[t] : e;
}
a(Vh, "nameToHex");
var Kh = /^#[a-fA-F0-9]{6}$/, jh = /^#[a-fA-F0-9]{8}$/, Uh = /^#[a-fA-F0-9]{3}$/, qh = /^#[a-fA-F0-9]{4}$/, Xo = /^rgb\(\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*\)$/i,
Gh = /^rgb(?:a)?\(\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,)?\s*(\d{1,3})\s*(?:,|\/)\s*([-+]?\d*[.]?\d+[%]?)\s*\)$/i, Yh = /^hsl\(\s*(\d{0,3}[.]?[0-9]+(?:deg)?)\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*\)$/i,
Qh = /^hsl(?:a)?\(\s*(\d{0,3}[.]?[0-9]+(?:deg)?)\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,)?\s*(\d{1,3}[.]?[0-9]?)%\s*(?:,|\/)\s*([-+]?\d*[.]?\d+[%]?)\s*\)$/i;
function Ol(e) {
  if (typeof e != "string")
    throw new or(3);
  var t = Vh(e);
  if (t.match(Kh))
    return {
      red: parseInt("" + t[1] + t[2], 16),
      green: parseInt("" + t[3] + t[4], 16),
      blue: parseInt("" + t[5] + t[6], 16)
    };
  if (t.match(jh)) {
    var r = parseFloat((parseInt("" + t[7] + t[8], 16) / 255).toFixed(2));
    return {
      red: parseInt("" + t[1] + t[2], 16),
      green: parseInt("" + t[3] + t[4], 16),
      blue: parseInt("" + t[5] + t[6], 16),
      alpha: r
    };
  }
  if (t.match(Uh))
    return {
      red: parseInt("" + t[1] + t[1], 16),
      green: parseInt("" + t[2] + t[2], 16),
      blue: parseInt("" + t[3] + t[3], 16)
    };
  if (t.match(qh)) {
    var n = parseFloat((parseInt("" + t[4] + t[4], 16) / 255).toFixed(2));
    return {
      red: parseInt("" + t[1] + t[1], 16),
      green: parseInt("" + t[2] + t[2], 16),
      blue: parseInt("" + t[3] + t[3], 16),
      alpha: n
    };
  }
  var i = Xo.exec(t);
  if (i)
    return {
      red: parseInt("" + i[1], 10),
      green: parseInt("" + i[2], 10),
      blue: parseInt("" + i[3], 10)
    };
  var o = Gh.exec(t.substring(0, 50));
  if (o)
    return {
      red: parseInt("" + o[1], 10),
      green: parseInt("" + o[2], 10),
      blue: parseInt("" + o[3], 10),
      alpha: parseFloat("" + o[4]) > 1 ? parseFloat("" + o[4]) / 100 : parseFloat("" + o[4])
    };
  var l = Yh.exec(t);
  if (l) {
    var u = parseInt("" + l[1], 10), c = parseInt("" + l[2], 10) / 100, p = parseInt("" + l[3], 10) / 100, d = "rgb(" + Cl(u, c, p) + ")", h = Xo.
    exec(d);
    if (!h)
      throw new or(4, t, d);
    return {
      red: parseInt("" + h[1], 10),
      green: parseInt("" + h[2], 10),
      blue: parseInt("" + h[3], 10)
    };
  }
  var f = Qh.exec(t.substring(0, 50));
  if (f) {
    var y = parseInt("" + f[1], 10), m = parseInt("" + f[2], 10) / 100, b = parseInt("" + f[3], 10) / 100, x = "rgb(" + Cl(y, m, b) + ")", _ = Xo.
    exec(x);
    if (!_)
      throw new or(4, t, x);
    return {
      red: parseInt("" + _[1], 10),
      green: parseInt("" + _[2], 10),
      blue: parseInt("" + _[3], 10),
      alpha: parseFloat("" + f[4]) > 1 ? parseFloat("" + f[4]) / 100 : parseFloat("" + f[4])
    };
  }
  throw new or(5);
}
a(Ol, "parseToRgb");
var Xh = /* @__PURE__ */ a(function(t) {
  return t.length === 7 && t[1] === t[2] && t[3] === t[4] && t[5] === t[6] ? "#" + t[1] + t[3] + t[5] : t;
}, "reduceHexValue"), Tl = Xh;
function nr(e) {
  var t = e.toString(16);
  return t.length === 1 ? "0" + t : t;
}
a(nr, "numberToHex");
function kl(e, t, r) {
  if (typeof e == "number" && typeof t == "number" && typeof r == "number")
    return Tl("#" + nr(e) + nr(t) + nr(r));
  if (typeof e == "object" && t === void 0 && r === void 0)
    return Tl("#" + nr(e.red) + nr(e.green) + nr(e.blue));
  throw new or(6);
}
a(kl, "rgb");
function Zo(e, t, r, n) {
  if (typeof e == "string" && typeof t == "number") {
    var i = Ol(e);
    return "rgba(" + i.red + "," + i.green + "," + i.blue + "," + t + ")";
  } else {
    if (typeof e == "number" && typeof t == "number" && typeof r == "number" && typeof n == "number")
      return n >= 1 ? kl(e, t, r) : "rgba(" + e + "," + t + "," + r + "," + n + ")";
    if (typeof e == "object" && t === void 0 && r === void 0 && n === void 0)
      return e.alpha >= 1 ? kl(e.red, e.green, e.blue) : "rgba(" + e.red + "," + e.green + "," + e.blue + "," + e.alpha + ")";
  }
  throw new or(7);
}
a(Zo, "rgba");
function Pl(e, t, r) {
  return /* @__PURE__ */ a(function() {
    var i = r.concat(Array.prototype.slice.call(arguments));
    return i.length >= t ? e.apply(this, i) : Pl(e, t, i);
  }, "fn");
}
a(Pl, "curried");
function Zh(e) {
  return Pl(e, e.length, []);
}
a(Zh, "curry");
function Jh(e, t, r) {
  return Math.max(e, Math.min(t, r));
}
a(Jh, "guard");
function eg(e, t) {
  if (t === "transparent") return t;
  var r = Ol(t), n = typeof r.alpha == "number" ? r.alpha : 1, i = U({}, r, {
    alpha: Jh(0, 1, +(n * 100 - parseFloat(e) * 100).toFixed(2) / 100)
  });
  return Zo(i);
}
a(eg, "transparentize");
var tg = /* @__PURE__ */ Zh(eg), ye = tg;

// src/manager/components/notifications/NotificationItem.tsx
var rg = wr({
  "0%": {
    opacity: 0,
    transform: "translateY(30px)"
  },
  "100%": {
    opacity: 1,
    transform: "translateY(0)"
  }
}), ng = wr({
  "0%": {
    width: "0%"
  },
  "100%": {
    width: "100%"
  }
}), Al = I.div(
  ({ theme: e }) => ({
    position: "relative",
    display: "flex",
    padding: 15,
    width: 280,
    borderRadius: 4,
    alignItems: "center",
    animation: `${rg} 500ms`,
    background: e.base === "light" ? "hsla(203, 50%, 20%, .97)" : "hsla(203, 30%, 95%, .97)",
    boxShadow: "0 2px 5px 0 rgba(0,0,0,0.05), 0 5px 15px 0 rgba(0,0,0,0.1)",
    color: e.color.inverseText,
    textDecoration: "none",
    overflow: "hidden"
  }),
  ({ duration: e, theme: t }) => e && {
    "&::after": {
      content: '""',
      display: "block",
      position: "absolute",
      bottom: 0,
      left: 0,
      height: 3,
      background: t.color.secondary,
      animation: `${ng} ${e}ms linear forwards reverse`
    }
  }
), Ml = I(Al)({
  cursor: "pointer",
  border: "none",
  outline: "none",
  textAlign: "left",
  transition: "all 150ms ease-out",
  transform: "translate3d(0, 0, 0)",
  "&:hover": {
    transform: "translate3d(0, -3px, 0)",
    boxShadow: "0 1px 3px 0 rgba(30,167,253,0.5), 0 2px 5px 0 rgba(0,0,0,0.05), 0 5px 15px 0 rgba(0,0,0,0.1)"
  },
  "&:active": {
    transform: "translate3d(0, 0, 0)",
    boxShadow: "0 1px 3px 0 rgba(30,167,253,0.5), 0 2px 5px 0 rgba(0,0,0,0.05), 0 5px 15px 0 rgba(0,0,0,0.1)"
  },
  "&:focus": {
    boxShadow: "rgba(2,156,253,1) 0 0 0 1px inset, 0 1px 3px 0 rgba(30,167,253,0.5), 0 2px 5px 0 rgba(0,0,0,0.05), 0 5px 15px 0 rgba(0,0,0,0\
.1)"
  }
}), og = Ml.withComponent("div"), ig = Ml.withComponent(Xr), ag = I.div(() => ({
  display: "flex",
  marginRight: 10,
  alignItems: "center",
  svg: {
    width: 16,
    height: 16
  }
})), sg = I.div(({ theme: e }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "column",
  color: e.base === "dark" ? e.color.mediumdark : e.color.mediumlight
})), lg = I.div(({ theme: e, hasIcon: t }) => ({
  height: "100%",
  width: t ? 205 : 230,
  alignItems: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  fontSize: e.typography.size.s1,
  lineHeight: "16px",
  fontWeight: e.typography.weight.bold
})), ug = I.div(({ theme: e }) => ({
  color: ye(0.25, e.color.inverseText),
  fontSize: e.typography.size.s1 - 1,
  lineHeight: "14px",
  marginTop: 2
})), Jo = /* @__PURE__ */ a(({
  icon: e,
  content: { headline: t, subHeadline: r }
}) => {
  let n = De(), i = n.base === "dark" ? n.color.mediumdark : n.color.mediumlight;
  return /* @__PURE__ */ s.createElement(s.Fragment, null, !e || /* @__PURE__ */ s.createElement(ag, null, s.isValidElement(e) ? e : typeof e ==
  "object" && "name" in e && /* @__PURE__ */ s.createElement(Qs, { icon: e.name, color: e.color || i })), /* @__PURE__ */ s.createElement(sg,
  null, /* @__PURE__ */ s.createElement(lg, { title: t, hasIcon: !!e }, t), r && /* @__PURE__ */ s.createElement(ug, null, r)));
}, "ItemContent"), cg = I(te)(({ theme: e }) => ({
  alignSelf: "center",
  marginTop: 0,
  color: e.base === "light" ? "rgba(255,255,255,0.7)" : " #999999"
})), ei = /* @__PURE__ */ a(({ onDismiss: e }) => /* @__PURE__ */ s.createElement(
  cg,
  {
    title: "Dismiss notification",
    onClick: (t) => {
      t.preventDefault(), t.stopPropagation(), e();
    }
  },
  /* @__PURE__ */ s.createElement(hn, { size: 12 })
), "DismissNotificationItem"), UO = I.div({
  height: 48
}), pg = /* @__PURE__ */ a(({
  notification: { content: e, duration: t, link: r, onClear: n, onClick: i, id: o, icon: l },
  onDismissNotification: u
}) => {
  let c = A(() => {
    u(o), n && n({ dismissed: !1, timeout: !0 });
  }, [u, n]), p = X(null);
  K(() => {
    if (t)
      return p.current = setTimeout(c, t), () => clearTimeout(p.current);
  }, [t, c]);
  let d = A(() => {
    clearTimeout(p.current), u(o), n && n({ dismissed: !0, timeout: !1 });
  }, [u, n]);
  return r ? /* @__PURE__ */ s.createElement(ig, { to: r, duration: t }, /* @__PURE__ */ s.createElement(Jo, { icon: l, content: e }), /* @__PURE__ */ s.
  createElement(ei, { onDismiss: d })) : i ? /* @__PURE__ */ s.createElement(og, { duration: t, onClick: () => i({ onDismiss: d }) }, /* @__PURE__ */ s.
  createElement(Jo, { icon: l, content: e }), /* @__PURE__ */ s.createElement(ei, { onDismiss: d })) : /* @__PURE__ */ s.createElement(Al, {
  duration: t }, /* @__PURE__ */ s.createElement(Jo, { icon: l, content: e }), /* @__PURE__ */ s.createElement(ei, { onDismiss: d }));
}, "NotificationItem"), Dl = pg;

// src/manager/components/notifications/NotificationList.tsx
var Ll = /* @__PURE__ */ a(({
  notifications: e,
  clearNotification: t
}) => /* @__PURE__ */ s.createElement(dg, null, e && e.map((r) => /* @__PURE__ */ s.createElement(
  Dl,
  {
    key: r.id,
    onDismissNotification: (n) => t(n),
    notification: r
  }
))), "NotificationList"), dg = I.div({
  zIndex: 200,
  position: "fixed",
  left: 20,
  bottom: 60,
  [lt]: {
    bottom: 20
  },
  "> * + *": {
    marginTop: 10
  },
  "&:empty": {
    display: "none"
  }
});

// src/manager/container/Notifications.tsx
var fg = /* @__PURE__ */ a(({ state: e, api: t }) => ({
  notifications: e.notifications,
  clearNotification: t.clearNotification
}), "mapper"), Nl = /* @__PURE__ */ a((e) => /* @__PURE__ */ s.createElement(he, { filter: fg }, (t) => /* @__PURE__ */ s.createElement(Ll, {
...e, ...t })), "Notifications");

// src/manager/components/hooks/useMedia.tsx
function Fl(e) {
  let t = /* @__PURE__ */ a((o) => typeof window < "u" ? window.matchMedia(o).matches : !1, "getMatches"), [r, n] = J(t(e));
  function i() {
    n(t(e));
  }
  return a(i, "handleChange"), K(() => {
    let o = window.matchMedia(e);
    return i(), o.addEventListener("change", i), () => {
      o.removeEventListener("change", i);
    };
  }, [e]), r;
}
a(Fl, "useMediaQuery");

// src/manager/components/layout/LayoutProvider.tsx
var Bl = Ut({
  isMobileMenuOpen: !1,
  setMobileMenuOpen: /* @__PURE__ */ a(() => {
  }, "setMobileMenuOpen"),
  isMobileAboutOpen: !1,
  setMobileAboutOpen: /* @__PURE__ */ a(() => {
  }, "setMobileAboutOpen"),
  isMobilePanelOpen: !1,
  setMobilePanelOpen: /* @__PURE__ */ a(() => {
  }, "setMobilePanelOpen"),
  isDesktop: !1,
  isMobile: !1
}), Hl = /* @__PURE__ */ a(({ children: e }) => {
  let [t, r] = J(!1), [n, i] = J(!1), [o, l] = J(!1), u = Fl(`(min-width: ${600}px)`), c = !u, p = j(
    () => ({
      isMobileMenuOpen: t,
      setMobileMenuOpen: r,
      isMobileAboutOpen: n,
      setMobileAboutOpen: i,
      isMobilePanelOpen: o,
      setMobilePanelOpen: l,
      isDesktop: u,
      isMobile: c
    }),
    [
      t,
      r,
      n,
      i,
      o,
      l,
      u,
      c
    ]
  );
  return /* @__PURE__ */ s.createElement(Bl.Provider, { value: p }, e);
}, "LayoutProvider"), Ee = /* @__PURE__ */ a(() => Qr(Bl), "useLayout");

// src/manager/components/mobile/navigation/MobileAddonsDrawer.tsx
var mg = I.div(({ theme: e }) => ({
  position: "relative",
  boxSizing: "border-box",
  width: "100%",
  background: e.background.content,
  height: "42vh",
  zIndex: 11,
  overflow: "hidden"
})), Rl = /* @__PURE__ */ a(({ children: e }) => /* @__PURE__ */ s.createElement(mg, null, e), "MobileAddonsDrawer");

// ../node_modules/@babel/runtime/helpers/esm/objectWithoutPropertiesLoose.js
function ke(e, t) {
  if (e == null) return {};
  var r = {};
  for (var n in e) if ({}.hasOwnProperty.call(e, n)) {
    if (t.indexOf(n) >= 0) continue;
    r[n] = e[n];
  }
  return r;
}
a(ke, "_objectWithoutPropertiesLoose");

// global-externals:react-dom
var Tr = __REACT_DOM__, { __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: IP, createPortal: SP, createRoot: xP, findDOMNode: wP, flushSync: kr,
hydrate: EP, hydrateRoot: CP, render: _P, unmountComponentAtNode: TP, unstable_batchedUpdates: kP, unstable_renderSubtreeIntoContainer: OP, version: PP } = __REACT_DOM__;

// ../node_modules/react-transition-group/esm/config.js
var ti = {
  disabled: !1
};

// ../node_modules/react-transition-group/esm/TransitionGroupContext.js
var ri = s.createContext(null);

// ../node_modules/react-transition-group/esm/utils/reflow.js
var zl = /* @__PURE__ */ a(function(t) {
  return t.scrollTop;
}, "forceReflow");

// ../node_modules/react-transition-group/esm/Transition.js
var Or = "unmounted", Tt = "exited", kt = "entering", ar = "entered", ni = "exiting", ct = /* @__PURE__ */ function(e) {
  rr(t, e);
  function t(n, i) {
    var o;
    o = e.call(this, n, i) || this;
    var l = i, u = l && !l.isMounting ? n.enter : n.appear, c;
    return o.appearStatus = null, n.in ? u ? (c = Tt, o.appearStatus = kt) : c = ar : n.unmountOnExit || n.mountOnEnter ? c = Or : c = Tt, o.
    state = {
      status: c
    }, o.nextCallback = null, o;
  }
  a(t, "Transition"), t.getDerivedStateFromProps = /* @__PURE__ */ a(function(i, o) {
    var l = i.in;
    return l && o.status === Or ? {
      status: Tt
    } : null;
  }, "getDerivedStateFromProps");
  var r = t.prototype;
  return r.componentDidMount = /* @__PURE__ */ a(function() {
    this.updateStatus(!0, this.appearStatus);
  }, "componentDidMount"), r.componentDidUpdate = /* @__PURE__ */ a(function(i) {
    var o = null;
    if (i !== this.props) {
      var l = this.state.status;
      this.props.in ? l !== kt && l !== ar && (o = kt) : (l === kt || l === ar) && (o = ni);
    }
    this.updateStatus(!1, o);
  }, "componentDidUpdate"), r.componentWillUnmount = /* @__PURE__ */ a(function() {
    this.cancelNextCallback();
  }, "componentWillUnmount"), r.getTimeouts = /* @__PURE__ */ a(function() {
    var i = this.props.timeout, o, l, u;
    return o = l = u = i, i != null && typeof i != "number" && (o = i.exit, l = i.enter, u = i.appear !== void 0 ? i.appear : l), {
      exit: o,
      enter: l,
      appear: u
    };
  }, "getTimeouts"), r.updateStatus = /* @__PURE__ */ a(function(i, o) {
    if (i === void 0 && (i = !1), o !== null)
      if (this.cancelNextCallback(), o === kt) {
        if (this.props.unmountOnExit || this.props.mountOnEnter) {
          var l = this.props.nodeRef ? this.props.nodeRef.current : Tr.findDOMNode(this);
          l && zl(l);
        }
        this.performEnter(i);
      } else
        this.performExit();
    else this.props.unmountOnExit && this.state.status === Tt && this.setState({
      status: Or
    });
  }, "updateStatus"), r.performEnter = /* @__PURE__ */ a(function(i) {
    var o = this, l = this.props.enter, u = this.context ? this.context.isMounting : i, c = this.props.nodeRef ? [u] : [Tr.findDOMNode(this),
    u], p = c[0], d = c[1], h = this.getTimeouts(), f = u ? h.appear : h.enter;
    if (!i && !l || ti.disabled) {
      this.safeSetState({
        status: ar
      }, function() {
        o.props.onEntered(p);
      });
      return;
    }
    this.props.onEnter(p, d), this.safeSetState({
      status: kt
    }, function() {
      o.props.onEntering(p, d), o.onTransitionEnd(f, function() {
        o.safeSetState({
          status: ar
        }, function() {
          o.props.onEntered(p, d);
        });
      });
    });
  }, "performEnter"), r.performExit = /* @__PURE__ */ a(function() {
    var i = this, o = this.props.exit, l = this.getTimeouts(), u = this.props.nodeRef ? void 0 : Tr.findDOMNode(this);
    if (!o || ti.disabled) {
      this.safeSetState({
        status: Tt
      }, function() {
        i.props.onExited(u);
      });
      return;
    }
    this.props.onExit(u), this.safeSetState({
      status: ni
    }, function() {
      i.props.onExiting(u), i.onTransitionEnd(l.exit, function() {
        i.safeSetState({
          status: Tt
        }, function() {
          i.props.onExited(u);
        });
      });
    });
  }, "performExit"), r.cancelNextCallback = /* @__PURE__ */ a(function() {
    this.nextCallback !== null && (this.nextCallback.cancel(), this.nextCallback = null);
  }, "cancelNextCallback"), r.safeSetState = /* @__PURE__ */ a(function(i, o) {
    o = this.setNextCallback(o), this.setState(i, o);
  }, "safeSetState"), r.setNextCallback = /* @__PURE__ */ a(function(i) {
    var o = this, l = !0;
    return this.nextCallback = function(u) {
      l && (l = !1, o.nextCallback = null, i(u));
    }, this.nextCallback.cancel = function() {
      l = !1;
    }, this.nextCallback;
  }, "setNextCallback"), r.onTransitionEnd = /* @__PURE__ */ a(function(i, o) {
    this.setNextCallback(o);
    var l = this.props.nodeRef ? this.props.nodeRef.current : Tr.findDOMNode(this), u = i == null && !this.props.addEndListener;
    if (!l || u) {
      setTimeout(this.nextCallback, 0);
      return;
    }
    if (this.props.addEndListener) {
      var c = this.props.nodeRef ? [this.nextCallback] : [l, this.nextCallback], p = c[0], d = c[1];
      this.props.addEndListener(p, d);
    }
    i != null && setTimeout(this.nextCallback, i);
  }, "onTransitionEnd"), r.render = /* @__PURE__ */ a(function() {
    var i = this.state.status;
    if (i === Or)
      return null;
    var o = this.props, l = o.children, u = o.in, c = o.mountOnEnter, p = o.unmountOnExit, d = o.appear, h = o.enter, f = o.exit, y = o.timeout,
    m = o.addEndListener, b = o.onEnter, x = o.onEntering, _ = o.onEntered, g = o.onExit, v = o.onExiting, S = o.onExited, C = o.nodeRef, E = ke(
    o, ["children", "in", "mountOnEnter", "unmountOnExit", "appear", "enter", "exit", "timeout", "addEndListener", "onEnter", "onEntering", "\
onEntered", "onExit", "onExiting", "onExited", "nodeRef"]);
    return (
      // allows for nested Transitions
      /* @__PURE__ */ s.createElement(ri.Provider, {
        value: null
      }, typeof l == "function" ? l(i, E) : s.cloneElement(s.Children.only(l), E))
    );
  }, "render"), t;
}(s.Component);
ct.contextType = ri;
ct.propTypes = {};
function ir() {
}
a(ir, "noop");
ct.defaultProps = {
  in: !1,
  mountOnEnter: !1,
  unmountOnExit: !1,
  appear: !1,
  enter: !0,
  exit: !0,
  onEnter: ir,
  onEntering: ir,
  onEntered: ir,
  onExit: ir,
  onExiting: ir,
  onExited: ir
};
ct.UNMOUNTED = Or;
ct.EXITED = Tt;
ct.ENTERING = kt;
ct.ENTERED = ar;
ct.EXITING = ni;
var Ot = ct;

// src/manager/components/upgrade/UpgradeBlock.tsx
var wn = /* @__PURE__ */ a(({ onNavigateToWhatsNew: e }) => {
  let t = de(), [r, n] = J("npm");
  return /* @__PURE__ */ s.createElement(hg, null, /* @__PURE__ */ s.createElement("strong", null, "You are on Storybook ", t.getCurrentVersion().
  version), /* @__PURE__ */ s.createElement("p", null, "Run the following script to check for updates and upgrade to the latest version."), /* @__PURE__ */ s.
  createElement(gg, null, /* @__PURE__ */ s.createElement($l, { active: r === "npm", onClick: () => n("npm") }, "npm"), /* @__PURE__ */ s.createElement(
  $l, { active: r === "pnpm", onClick: () => n("pnpm") }, "pnpm")), /* @__PURE__ */ s.createElement(yg, null, r === "npm" ? "npx storybook@l\
atest upgrade" : "pnpm dlx storybook@latest upgrade"), e && // eslint-disable-next-line jsx-a11y/anchor-is-valid
  /* @__PURE__ */ s.createElement(Le, { onClick: e }, "See what's new in Storybook"));
}, "UpgradeBlock"), hg = I.div(({ theme: e }) => ({
  border: "1px solid",
  borderRadius: 5,
  padding: 20,
  marginTop: 0,
  borderColor: e.appBorderColor,
  fontSize: e.typography.size.s2,
  width: "100%",
  [lt]: {
    maxWidth: 400
  }
})), gg = I.div({
  display: "flex",
  gap: 2
}), yg = I.pre(({ theme: e }) => ({
  background: e.base === "light" ? "rgba(0, 0, 0, 0.05)" : e.appBorderColor,
  fontSize: e.typography.size.s2 - 1,
  margin: "4px 0 16px"
})), $l = I.button(({ theme: e, active: t }) => ({
  all: "unset",
  alignItems: "center",
  gap: 10,
  color: e.color.defaultText,
  fontSize: e.typography.size.s2 - 1,
  borderBottom: "2px solid transparent",
  borderBottomColor: t ? e.color.secondary : "none",
  padding: "0 10px 5px",
  marginBottom: "5px",
  cursor: "pointer"
}));

// src/manager/components/mobile/about/MobileAbout.tsx
var Kl = /* @__PURE__ */ a(() => {
  let { isMobileAboutOpen: e, setMobileAboutOpen: t } = Ee(), r = X(null);
  return /* @__PURE__ */ s.createElement(
    Ot,
    {
      nodeRef: r,
      in: e,
      timeout: 300,
      appear: !0,
      mountOnEnter: !0,
      unmountOnExit: !0
    },
    (n) => /* @__PURE__ */ s.createElement(vg, { ref: r, state: n, transitionDuration: 300 }, /* @__PURE__ */ s.createElement(Sg, { onClick: () => t(
    !1), title: "Close about section" }, /* @__PURE__ */ s.createElement(Js, null), "Back"), /* @__PURE__ */ s.createElement(bg, null, /* @__PURE__ */ s.
    createElement(Wl, { href: "https://github.com/storybookjs/storybook", target: "_blank" }, /* @__PURE__ */ s.createElement(Vl, null, /* @__PURE__ */ s.
    createElement(gn, null), /* @__PURE__ */ s.createElement("span", null, "Github")), /* @__PURE__ */ s.createElement(_t, { width: 12 })), /* @__PURE__ */ s.
    createElement(
      Wl,
      {
        href: "https://storybook.js.org/docs/react/get-started/install/",
        target: "_blank"
      },
      /* @__PURE__ */ s.createElement(Vl, null, /* @__PURE__ */ s.createElement(hl, null), /* @__PURE__ */ s.createElement("span", null, "Do\
cumentation")),
      /* @__PURE__ */ s.createElement(_t, { width: 12 })
    )), /* @__PURE__ */ s.createElement(wn, null), /* @__PURE__ */ s.createElement(Ig, null, "Open source software maintained by", " ", /* @__PURE__ */ s.
    createElement(Le, { href: "https://chromatic.com", target: "_blank" }, "Chromatic"), " ", "and the", " ", /* @__PURE__ */ s.createElement(
    Le, { href: "https://github.com/storybookjs/storybook/graphs/contributors" }, "Storybook Community")))
  );
}, "MobileAbout"), vg = I.div(
  ({ theme: e, state: t, transitionDuration: r }) => ({
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    zIndex: 11,
    transition: `all ${r}ms ease-in-out`,
    overflow: "scroll",
    padding: "25px 10px 10px",
    color: e.color.defaultText,
    background: e.background.content,
    opacity: `${(() => {
      switch (t) {
        case "entering":
        case "entered":
          return 1;
        case "exiting":
        case "exited":
          return 0;
        default:
          return 0;
      }
    })()}`,
    transform: `${(() => {
      switch (t) {
        case "entering":
        case "entered":
          return "translateX(0)";
        case "exiting":
        case "exited":
          return "translateX(20px)";
        default:
          return "translateX(0)";
      }
    })()}`
  })
), bg = I.div({
  marginTop: 20,
  marginBottom: 20
}), Wl = I.a(({ theme: e }) => ({
  all: "unset",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: e.typography.size.s2 - 1,
  height: 52,
  borderBottom: `1px solid ${e.appBorderColor}`,
  cursor: "pointer",
  padding: "0 10px",
  "&:last-child": {
    borderBottom: "none"
  }
})), Vl = I.div(({ theme: e }) => ({
  display: "flex",
  alignItems: "center",
  fontSize: e.typography.size.s2 - 1,
  height: 40,
  gap: 5
})), Ig = I.div(({ theme: e }) => ({
  fontSize: e.typography.size.s2 - 1,
  marginTop: 30
})), Sg = I.button(({ theme: e }) => ({
  all: "unset",
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "currentColor",
  fontSize: e.typography.size.s2 - 1,
  padding: "0 10px"
}));

// src/manager/components/mobile/navigation/MobileMenuDrawer.tsx
var jl = /* @__PURE__ */ a(({ children: e }) => {
  let t = X(null), r = X(null), n = X(null), { isMobileMenuOpen: i, setMobileMenuOpen: o, isMobileAboutOpen: l, setMobileAboutOpen: u } = Ee();
  return /* @__PURE__ */ s.createElement(s.Fragment, null, /* @__PURE__ */ s.createElement(
    Ot,
    {
      nodeRef: t,
      in: i,
      timeout: 300,
      mountOnEnter: !0,
      unmountOnExit: !0,
      onExited: () => u(!1)
    },
    (c) => /* @__PURE__ */ s.createElement(xg, { ref: t, state: c }, /* @__PURE__ */ s.createElement(
      Ot,
      {
        nodeRef: r,
        in: !l,
        timeout: 300
      },
      (p) => /* @__PURE__ */ s.createElement(wg, { ref: r, state: p }, e)
    ), /* @__PURE__ */ s.createElement(Kl, null))
  ), /* @__PURE__ */ s.createElement(
    Ot,
    {
      nodeRef: n,
      in: i,
      timeout: 300,
      mountOnEnter: !0,
      unmountOnExit: !0
    },
    (c) => /* @__PURE__ */ s.createElement(
      Eg,
      {
        ref: n,
        state: c,
        onClick: () => o(!1),
        "aria-label": "Close navigation menu"
      }
    )
  ));
}, "MobileMenuDrawer"), xg = I.div(({ theme: e, state: t }) => ({
  position: "fixed",
  boxSizing: "border-box",
  width: "100%",
  background: e.background.content,
  height: "80%",
  bottom: 0,
  left: 0,
  zIndex: 11,
  borderRadius: "10px 10px 0 0",
  transition: `all ${300}ms ease-in-out`,
  overflow: "hidden",
  transform: `${t === "entering" || t === "entered" ? "translateY(0)" : t === "exiting" || t === "exited" ? "translateY(100%)" : "translateY\
(0)"}`
})), wg = I.div(({ theme: e, state: t }) => ({
  position: "absolute",
  width: "100%",
  height: "100%",
  top: 0,
  left: 0,
  zIndex: 1,
  transition: `all ${300}ms ease-in-out`,
  overflow: "hidden",
  opacity: `${t === "entered" || t === "entering" ? 1 : t === "exiting" || t === "exited" ? 0 : 1}`,
  transform: `${(() => {
    switch (t) {
      case "entering":
      case "entered":
        return "translateX(0)";
      case "exiting":
      case "exited":
        return "translateX(-20px)";
      default:
        return "translateX(0)";
    }
  })()}`
})), Eg = I.div(({ state: e }) => ({
  position: "fixed",
  boxSizing: "border-box",
  background: "rgba(0, 0, 0, 0.5)",
  top: 0,
  bottom: 0,
  right: 0,
  left: 0,
  zIndex: 10,
  transition: `all ${300}ms ease-in-out`,
  cursor: "pointer",
  opacity: `${(() => {
    switch (e) {
      case "entering":
      case "entered":
        return 1;
      case "exiting":
      case "exited":
        return 0;
      default:
        return 0;
    }
  })()}`,
  "&:hover": {
    background: "rgba(0, 0, 0, 0.6)"
  }
}));

// src/manager/components/mobile/navigation/MobileNavigation.tsx
var Cg = /* @__PURE__ */ a(() => {
  let { index: e } = Ke(), t = de(), r = t.getCurrentStoryData();
  if (!r)
    return "";
  let n = r.renderLabel?.(r, t) || r.name, i = e[r.id];
  for (; "parent" in i && i.parent && e[i.parent] && n.length < 24; )
    i = e[i.parent], n = `${i.renderLabel?.(i, t) || i.name}/${n}`;
  return n;
}, "useFullStoryName"), Ul = /* @__PURE__ */ a(({ menu: e, panel: t, showPanel: r }) => {
  let { isMobileMenuOpen: n, isMobilePanelOpen: i, setMobileMenuOpen: o, setMobilePanelOpen: l } = Ee(), u = Cg();
  return /* @__PURE__ */ s.createElement(_g, null, /* @__PURE__ */ s.createElement(jl, null, e), i ? /* @__PURE__ */ s.createElement(Rl, null,
  t) : /* @__PURE__ */ s.createElement(Tg, { className: "sb-bar" }, /* @__PURE__ */ s.createElement(kg, { onClick: () => o(!n), title: "Open\
 navigation menu" }, /* @__PURE__ */ s.createElement(vn, null), /* @__PURE__ */ s.createElement(Og, null, u)), r && /* @__PURE__ */ s.createElement(
  te, { onClick: () => l(!0), title: "Open addon panel" }, /* @__PURE__ */ s.createElement(el, null))));
}, "MobileNavigation"), _g = I.div(({ theme: e }) => ({
  bottom: 0,
  left: 0,
  width: "100%",
  zIndex: 10,
  background: e.barBg,
  borderTop: `1px solid ${e.appBorderColor}`
})), Tg = I.div({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  height: 40,
  padding: "0 6px"
}), kg = I.button(({ theme: e }) => ({
  all: "unset",
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: e.barTextColor,
  fontSize: `${e.typography.size.s2 - 1}px`,
  padding: "0 7px",
  fontWeight: e.typography.weight.bold,
  WebkitLineClamp: 1,
  "> svg": {
    width: 14,
    height: 14,
    flexShrink: 0
  }
})), Og = I.p({
  display: "-webkit-box",
  WebkitLineClamp: 1,
  WebkitBoxOrient: "vertical",
  overflow: "hidden"
});

// src/manager/components/layout/useDragging.ts
var ql = 30, En = 240, Cn = 270, Gl = 0.9;
function Yl(e, t, r) {
  return Math.min(Math.max(e, t), r);
}
a(Yl, "clamp");
function Ql(e, t, r) {
  return t + (r - t) * e;
}
a(Ql, "interpolate");
function Xl({
  setState: e,
  isPanelShown: t,
  isDesktop: r
}) {
  let n = X(null), i = X(null);
  return K(() => {
    let o = n.current, l = i.current, u = document.querySelector("#storybook-preview-wrapper"), c = null, p = /* @__PURE__ */ a((f) => {
      f.preventDefault(), e((y) => ({
        ...y,
        isDragging: !0
      })), f.currentTarget === o ? c = o : f.currentTarget === l && (c = l), window.addEventListener("mousemove", h), window.addEventListener(
      "mouseup", d), u && (u.style.pointerEvents = "none");
    }, "onDragStart"), d = /* @__PURE__ */ a((f) => {
      e((y) => c === l && y.navSize < En && y.navSize > 0 ? {
        ...y,
        isDragging: !1,
        navSize: En
      } : c === o && y.panelPosition === "right" && y.rightPanelWidth < Cn && y.rightPanelWidth > 0 ? {
        ...y,
        isDragging: !1,
        rightPanelWidth: Cn
      } : {
        ...y,
        isDragging: !1
      }), window.removeEventListener("mousemove", h), window.removeEventListener("mouseup", d), u?.removeAttribute("style"), c = null;
    }, "onDragEnd"), h = /* @__PURE__ */ a((f) => {
      if (f.buttons === 0) {
        d(f);
        return;
      }
      e((y) => {
        if (c === l) {
          let m = f.clientX;
          return m === y.navSize ? y : m <= ql ? {
            ...y,
            navSize: 0
          } : m <= En ? {
            ...y,
            navSize: Ql(Gl, m, En)
          } : {
            ...y,
            // @ts-expect-error (non strict)
            navSize: Yl(m, 0, f.view.innerWidth)
          };
        }
        if (c === o) {
          let m = y.panelPosition === "bottom" ? "bottomPanelHeight" : "rightPanelWidth", b = y.panelPosition === "bottom" ? (
            // @ts-expect-error (non strict)
            f.view.innerHeight - f.clientY
          ) : (
            // @ts-expect-error (non strict)
            f.view.innerWidth - f.clientX
          );
          if (b === y[m])
            return y;
          if (b <= ql)
            return {
              ...y,
              [m]: 0
            };
          if (y.panelPosition === "right" && b <= Cn)
            return {
              ...y,
              [m]: Ql(
                Gl,
                b,
                Cn
              )
            };
          let x = (
            // @ts-expect-error (non strict)
            y.panelPosition === "bottom" ? f.view.innerHeight : f.view.innerWidth
          );
          return {
            ...y,
            [m]: Yl(b, 0, x)
          };
        }
        return y;
      });
    }, "onDrag");
    return o?.addEventListener("mousedown", p), l?.addEventListener("mousedown", p), () => {
      o?.removeEventListener("mousedown", p), l?.removeEventListener("mousedown", p), u?.removeAttribute("style");
    };
  }, [
    // we need to rerun this effect when the panel is shown/hidden or when changing between mobile/desktop to re-attach the event listeners
    t,
    r,
    e
  ]), { panelResizerRef: n, sidebarResizerRef: i };
}
a(Xl, "useDragging");

// src/manager/components/layout/Layout.tsx
var Pg = 100, Zl = /* @__PURE__ */ a((e, t) => e.navSize === t.navSize && e.bottomPanelHeight === t.bottomPanelHeight && e.rightPanelWidth ===
t.rightPanelWidth && e.panelPosition === t.panelPosition, "layoutStateIsEqual"), Ag = /* @__PURE__ */ a(({
  managerLayoutState: e,
  setManagerLayoutState: t,
  isDesktop: r,
  hasTab: n
}) => {
  let i = s.useRef(e), [o, l] = J({
    ...e,
    isDragging: !1
  });
  K(() => {
    o.isDragging || // don't interrupt user's drag
    Zl(e, i.current) || (i.current = e, l((m) => ({ ...m, ...e })));
  }, [o.isDragging, e, l]), qt(() => {
    if (o.isDragging || // wait with syncing managerLayoutState until user is done dragging
    Zl(e, o))
      return;
    let m = {
      navSize: o.navSize,
      bottomPanelHeight: o.bottomPanelHeight,
      rightPanelWidth: o.rightPanelWidth
    };
    i.current = {
      ...i.current,
      ...m
    }, t(m);
  }, [o, t]);
  let u = e.viewMode !== "story" && e.viewMode !== "docs", c = e.viewMode === "story" && !n, { panelResizerRef: p, sidebarResizerRef: d } = Xl(
  {
    setState: l,
    isPanelShown: c,
    isDesktop: r
  }), { navSize: h, rightPanelWidth: f, bottomPanelHeight: y } = o.isDragging ? o : e;
  return {
    navSize: h,
    rightPanelWidth: f,
    bottomPanelHeight: y,
    panelPosition: e.panelPosition,
    panelResizerRef: p,
    sidebarResizerRef: d,
    showPages: u,
    showPanel: c,
    isDragging: o.isDragging
  };
}, "useLayoutSyncingState"), eu = /* @__PURE__ */ a(({ managerLayoutState: e, setManagerLayoutState: t, hasTab: r, ...n }) => {
  let { isDesktop: i, isMobile: o } = Ee(), {
    navSize: l,
    rightPanelWidth: u,
    bottomPanelHeight: c,
    panelPosition: p,
    panelResizerRef: d,
    sidebarResizerRef: h,
    showPages: f,
    showPanel: y,
    isDragging: m
  } = Ag({ managerLayoutState: e, setManagerLayoutState: t, isDesktop: i, hasTab: r });
  return /* @__PURE__ */ s.createElement(
    Mg,
    {
      navSize: l,
      rightPanelWidth: u,
      bottomPanelHeight: c,
      panelPosition: e.panelPosition,
      isDragging: m,
      viewMode: e.viewMode,
      showPanel: y
    },
    /* @__PURE__ */ s.createElement(Nl, null),
    f && /* @__PURE__ */ s.createElement(Ng, null, n.slotPages),
    /* @__PURE__ */ s.createElement(vs, { path: /(^\/story|docs|onboarding\/|^\/$)/, startsWith: !1 }, ({ match: b }) => /* @__PURE__ */ s.createElement(
    Lg, { shown: !!b }, n.slotMain)),
    i && /* @__PURE__ */ s.createElement(s.Fragment, null, /* @__PURE__ */ s.createElement(Dg, null, /* @__PURE__ */ s.createElement(Jl, { ref: h }),
    n.slotSidebar), y && /* @__PURE__ */ s.createElement(Fg, { position: p }, /* @__PURE__ */ s.createElement(
      Jl,
      {
        orientation: p === "bottom" ? "horizontal" : "vertical",
        position: p === "bottom" ? "left" : "right",
        ref: d
      }
    ), n.slotPanel)),
    o && /* @__PURE__ */ s.createElement(Ul, { menu: n.slotSidebar, panel: n.slotPanel, showPanel: y })
  );
}, "Layout"), Mg = I.div(
  ({ navSize: e, rightPanelWidth: t, bottomPanelHeight: r, viewMode: n, panelPosition: i, showPanel: o }) => ({
    width: "100%",
    height: ["100vh", "100dvh"],
    // This array is a special Emotion syntax to set a fallback if 100dvh is not supported
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    [lt]: {
      display: "grid",
      gap: 0,
      gridTemplateColumns: `minmax(0, ${e}px) minmax(${Pg}px, 1fr) minmax(0, ${t}px)`,
      gridTemplateRows: `1fr minmax(0, ${r}px)`,
      gridTemplateAreas: n === "docs" || !o ? `"sidebar content content"
                  "sidebar content content"` : i === "right" ? `"sidebar content panel"
                  "sidebar content panel"` : `"sidebar content content"
                "sidebar panel   panel"`
    }
  })
), Dg = I.div(({ theme: e }) => ({
  backgroundColor: e.background.app,
  gridArea: "sidebar",
  position: "relative",
  borderRight: `1px solid ${e.color.border}`
})), Lg = I.div(({ theme: e, shown: t }) => ({
  flex: 1,
  position: "relative",
  backgroundColor: e.background.content,
  display: t ? "grid" : "none",
  // This is needed to make the content container fill the available space
  overflow: "auto",
  [lt]: {
    flex: "auto",
    gridArea: "content"
  }
})), Ng = I.div(({ theme: e }) => ({
  gridRowStart: "sidebar-start",
  gridRowEnd: "-1",
  gridColumnStart: "sidebar-end",
  gridColumnEnd: "-1",
  backgroundColor: e.background.content,
  zIndex: 1
})), Fg = I.div(
  ({ theme: e, position: t }) => ({
    gridArea: "panel",
    position: "relative",
    backgroundColor: e.background.content,
    borderTop: t === "bottom" ? `1px solid ${e.color.border}` : void 0,
    borderLeft: t === "right" ? `1px solid ${e.color.border}` : void 0
  })
), Jl = I.div(
  ({ theme: e }) => ({
    position: "absolute",
    opacity: 0,
    transition: "opacity 0.2s ease-in-out",
    zIndex: 100,
    "&:after": {
      content: '""',
      display: "block",
      backgroundColor: e.color.secondary
    },
    "&:hover": {
      opacity: 1
    }
  }),
  ({ orientation: e = "vertical", position: t = "left" }) => e === "vertical" ? {
    width: t === "left" ? 10 : 13,
    height: "100%",
    top: 0,
    right: t === "left" ? "-7px" : void 0,
    left: t === "right" ? "-7px" : void 0,
    "&:after": {
      width: 1,
      height: "100%",
      marginLeft: t === "left" ? 3 : 6
    },
    "&:hover": {
      cursor: "col-resize"
    }
  } : {
    width: "100%",
    height: "13px",
    top: "-7px",
    left: 0,
    "&:after": {
      width: "100%",
      height: 1,
      marginTop: 6
    },
    "&:hover": {
      cursor: "row-resize"
    }
  }
);

// global-externals:@storybook/core/types
var zA = __STORYBOOK_TYPES__, { Addon_TypesEnum: Ae } = __STORYBOOK_TYPES__;

// src/manager/container/Panel.tsx
var ru = Be(_n(), 1);

// src/manager/components/panel/Panel.tsx
var si = class si extends Re {
  constructor(t) {
    super(t), this.state = { hasError: !1 };
  }
  componentDidCatch(t, r) {
    this.setState({ hasError: !0 }), console.error(t, r);
  }
  // @ts-expect-error (we know this is broken)
  render() {
    let { hasError: t } = this.state, { children: r } = this.props;
    return t ? /* @__PURE__ */ s.createElement("h1", null, "Something went wrong.") : r;
  }
};
a(si, "SafeTab");
var ii = si, ai = s.memo(
  ({
    panels: e,
    shortcuts: t,
    actions: r,
    selectedPanel: n = null,
    panelPosition: i = "right",
    absolute: o = !0
  }) => {
    let { isDesktop: l, setMobilePanelOpen: u } = Ee();
    return /* @__PURE__ */ s.createElement(
      Xs,
      {
        absolute: o,
        ...n ? { selected: n } : {},
        menuName: "Addons",
        actions: r,
        showToolsWhenEmpty: !0,
        emptyState: /* @__PURE__ */ s.createElement(
          Gs,
          {
            title: "Storybook add-ons",
            description: /* @__PURE__ */ s.createElement(s.Fragment, null, "Integrate your tools with Storybook to connect workflows and unl\
ock advanced features."),
            footer: /* @__PURE__ */ s.createElement(Le, { href: "https://storybook.js.org/integrations", target: "_blank", withArrow: !0 }, /* @__PURE__ */ s.
            createElement(tr, null), " Explore integrations catalog")
          }
        ),
        tools: /* @__PURE__ */ s.createElement(Bg, null, l ? /* @__PURE__ */ s.createElement(s.Fragment, null, /* @__PURE__ */ s.createElement(
          te,
          {
            key: "position",
            onClick: r.togglePosition,
            title: `Change addon orientation [${Xe(
              t.panelPosition
            )}]`
          },
          i === "bottom" ? /* @__PURE__ */ s.createElement(In, null) : /* @__PURE__ */ s.createElement(mn, null)
        ), /* @__PURE__ */ s.createElement(
          te,
          {
            key: "visibility",
            onClick: r.toggleVisibility,
            title: `Hide addons [${Xe(t.togglePanel)}]`
          },
          /* @__PURE__ */ s.createElement(Ze, null)
        )) : /* @__PURE__ */ s.createElement(te, { onClick: () => u(!1), title: "Close addon panel" }, /* @__PURE__ */ s.createElement(Ze, null))),
        id: "storybook-panel-root"
      },
      Object.entries(e).map(([c, p]) => (
        // @ts-expect-error (we know this is broken)
        /* @__PURE__ */ s.createElement(ii, { key: c, id: c, title: typeof p.title == "function" ? /* @__PURE__ */ s.createElement(p.title, null) :
        p.title }, p.render)
      ))
    );
  }
);
ai.displayName = "AddonPanel";
var Bg = I.div({
  display: "flex",
  alignItems: "center",
  gap: 6
});

// src/manager/container/Panel.tsx
var Hg = (0, ru.default)(1)((e) => ({
  onSelect: /* @__PURE__ */ a((t) => e.setSelectedPanel(t), "onSelect"),
  toggleVisibility: /* @__PURE__ */ a(() => e.togglePanel(), "toggleVisibility"),
  togglePosition: /* @__PURE__ */ a(() => e.togglePanelPosition(), "togglePosition")
})), Rg = /* @__PURE__ */ a((e) => {
  let t = e.getElements(Ae.PANEL), r = e.getCurrentStoryData();
  if (!t || !r || r.type !== "story")
    return t;
  let { parameters: n } = r, i = {};
  return Object.entries(t).forEach(([o, l]) => {
    let { paramKey: u } = l;
    u && n && n[u] && n[u].disable || (i[o] = l);
  }), i;
}, "getPanels"), zg = /* @__PURE__ */ a(({ state: e, api: t }) => ({
  panels: Rg(t),
  selectedPanel: t.getSelectedPanel(),
  panelPosition: e.layout.panelPosition,
  actions: Hg(t),
  shortcuts: t.getShortcutKeys()
}), "mapper"), $g = /* @__PURE__ */ a((e) => /* @__PURE__ */ s.createElement(he, { filter: zg }, (t) => /* @__PURE__ */ s.createElement(ai, {
...e, ...t })), "Panel"), nu = $g;

// src/manager/container/Preview.tsx
var Fr = Be(_n(), 1);

// src/manager/components/preview/Iframe.tsx
var Wg = I.iframe(({ theme: e }) => ({
  backgroundColor: e.background.preview,
  display: "block",
  boxSizing: "content-box",
  height: "100%",
  width: "100%",
  border: "0 none",
  transition: "background-position 0s, visibility 0s",
  backgroundPosition: "-1px -1px, -1px -1px, -1px -1px, -1px -1px",
  margin: "auto",
  boxShadow: "0 0 100px 100vw rgba(0,0,0,0.5)"
}));
function ou(e) {
  let { active: t, id: r, title: n, src: i, allowFullScreen: o, scale: l, ...u } = e, c = s.useRef(null);
  return /* @__PURE__ */ s.createElement(Zs.IFrame, { scale: l, active: t, iFrameRef: c }, /* @__PURE__ */ s.createElement(
    Wg,
    {
      "data-is-storybook": t ? "true" : "false",
      onLoad: (p) => p.currentTarget.setAttribute("data-is-loaded", "true"),
      id: r,
      title: n,
      src: i,
      allow: "clipboard-write;",
      allowFullScreen: o,
      ref: c,
      ...u
    }
  ));
}
a(ou, "IFrame");

// src/manager/components/preview/utils/stringifyQueryParams.tsx
var Vc = Be(Wc(), 1);
var Kc = /* @__PURE__ */ a((e) => Vc.default.stringify(e, { addQueryPrefix: !0, encode: !1 }).replace(/^\?/, "&"), "stringifyQueryParams");

// src/manager/components/preview/FramesRenderer.tsx
var $v = /* @__PURE__ */ a((e, t) => e && t[e] ? `storybook-ref-${e}` : "storybook-preview-iframe", "getActive"), Wv = I(we)(({ theme: e }) => ({
  display: "none",
  "@media (min-width: 600px)": {
    position: "absolute",
    display: "block",
    top: 10,
    right: 15,
    padding: "10px 15px",
    fontSize: e.typography.size.s1,
    transform: "translateY(-100px)",
    "&:focus": {
      transform: "translateY(0)",
      zIndex: 1
    }
  }
})), Vv = /* @__PURE__ */ a(({ api: e, state: t }) => ({
  isFullscreen: e.getIsFullscreen(),
  isNavShown: e.getIsNavShown(),
  selectedStoryId: t.storyId
}), "whenSidebarIsVisible"), Kv = {
  '#root [data-is-storybook="false"]': {
    display: "none"
  },
  '#root [data-is-storybook="true"]': {
    display: "block"
  }
}, jc = /* @__PURE__ */ a(({
  refs: e,
  scale: t,
  viewMode: r = "story",
  refId: n,
  queryParams: i = {},
  baseUrl: o,
  storyId: l = "*"
}) => {
  let u = e[n]?.version, c = Kc({
    ...i,
    ...u && { version: u }
  }), p = $v(n, e), { current: d } = X({}), h = Object.values(e).filter((f) => f.type === "auto-inject" || f.id === n, {});
  return d["storybook-preview-iframe"] || (d["storybook-preview-iframe"] = Jt(o, l, {
    ...i,
    ...u && { version: u },
    viewMode: r
  })), h.forEach((f) => {
    let y = `storybook-ref-${f.id}`, m = d[y]?.split("/iframe.html")[0];
    if (!m || f.url !== m) {
      let b = `${f.url}/iframe.html?id=${l}&viewMode=${r}&refId=${f.id}${c}`;
      d[y] = b;
    }
  }), /* @__PURE__ */ s.createElement(Te, null, /* @__PURE__ */ s.createElement(Yt, { styles: Kv }), /* @__PURE__ */ s.createElement(he, { filter: Vv },
  ({ isFullscreen: f, isNavShown: y, selectedStoryId: m }) => f || !y || !m ? null : /* @__PURE__ */ s.createElement(Wv, { asChild: !0 }, /* @__PURE__ */ s.
  createElement("a", { href: `#${m}`, tabIndex: 0, title: "Skip to sidebar" }, "Skip to sidebar"))), Object.entries(d).map(([f, y]) => /* @__PURE__ */ s.
  createElement(Te, { key: f }, /* @__PURE__ */ s.createElement(
    ou,
    {
      active: f === p,
      key: f,
      id: f,
      title: f,
      src: y,
      allowFullScreen: !0,
      scale: t
    }
  ))));
}, "FramesRenderer");

// src/manager/components/preview/tools/addons.tsx
var jv = /* @__PURE__ */ a(({ api: e, state: t }) => ({
  isVisible: e.getIsPanelShown(),
  singleStory: t.singleStory,
  panelPosition: t.layout.panelPosition,
  toggle: /* @__PURE__ */ a(() => e.togglePanel(), "toggle")
}), "menuMapper"), Uc = {
  title: "addons",
  id: "addons",
  type: ve.TOOL,
  match: /* @__PURE__ */ a(({ viewMode: e, tabId: t }) => e === "story" && !t, "match"),
  render: /* @__PURE__ */ a(() => /* @__PURE__ */ s.createElement(he, { filter: jv }, ({ isVisible: e, toggle: t, singleStory: r, panelPosition: n }) => !r &&
  !e && /* @__PURE__ */ s.createElement(s.Fragment, null, /* @__PURE__ */ s.createElement(te, { "aria-label": "Show addons", key: "addons", onClick: t,
  title: "Show addons" }, n === "bottom" ? /* @__PURE__ */ s.createElement(mn, null) : /* @__PURE__ */ s.createElement(In, null)))), "render")
};

// src/manager/components/preview/tools/copy.tsx
var Zc = Be(Xc(), 1);
var { PREVIEW_URL: Qv, document: Xv } = ae, Zv = /* @__PURE__ */ a(({ state: e }) => {
  let { storyId: t, refId: r, refs: n } = e, { location: i } = Xv, o = n[r], l = `${i.origin}${i.pathname}`;
  return l.endsWith("/") || (l += "/"), {
    refId: r,
    baseUrl: o ? `${o.url}/iframe.html` : Qv || `${l}iframe.html`,
    storyId: t,
    queryParams: e.customQueryParams
  };
}, "copyMapper"), Jc = {
  title: "copy",
  id: "copy",
  type: ve.TOOL,
  match: /* @__PURE__ */ a(({ viewMode: e, tabId: t }) => e === "story" && !t, "match"),
  render: /* @__PURE__ */ a(() => /* @__PURE__ */ s.createElement(he, { filter: Zv }, ({ baseUrl: e, storyId: t, queryParams: r }) => t ? /* @__PURE__ */ s.
  createElement(
    te,
    {
      key: "copy",
      onClick: () => (0, Zc.default)(Jt(e, t, r)),
      title: "Copy canvas link"
    },
    /* @__PURE__ */ s.createElement(pl, null)
  ) : null), "render")
};

// src/manager/components/preview/tools/eject.tsx
var { PREVIEW_URL: Jv } = ae, eb = /* @__PURE__ */ a(({ state: e }) => {
  let { storyId: t, refId: r, refs: n } = e, i = n[r];
  return {
    refId: r,
    baseUrl: i ? `${i.url}/iframe.html` : Jv || "iframe.html",
    storyId: t,
    queryParams: e.customQueryParams
  };
}, "ejectMapper"), ep = {
  title: "eject",
  id: "eject",
  type: ve.TOOL,
  match: /* @__PURE__ */ a(({ viewMode: e, tabId: t }) => e === "story" && !t, "match"),
  render: /* @__PURE__ */ a(() => /* @__PURE__ */ s.createElement(he, { filter: eb }, ({ baseUrl: e, storyId: t, queryParams: r }) => t ? /* @__PURE__ */ s.
  createElement(te, { key: "opener", asChild: !0 }, /* @__PURE__ */ s.createElement(
    "a",
    {
      href: Jt(e, t, r),
      target: "_blank",
      rel: "noopener noreferrer",
      title: "Open canvas in new tab"
    },
    /* @__PURE__ */ s.createElement(_t, null)
  )) : null), "render")
};

// src/manager/components/preview/tools/remount.tsx
var tb = I(te)(({ theme: e, animating: t, disabled: r }) => ({
  opacity: r ? 0.5 : 1,
  svg: {
    animation: t ? `${e.animation.rotate360} 1000ms ease-out` : void 0
  }
})), rb = /* @__PURE__ */ a(({ api: e, state: t }) => {
  let { storyId: r } = t;
  return {
    storyId: r,
    remount: /* @__PURE__ */ a(() => e.emit(Ao, { storyId: t.storyId }), "remount"),
    api: e
  };
}, "menuMapper"), tp = {
  title: "remount",
  id: "remount",
  type: ve.TOOL,
  match: /* @__PURE__ */ a(({ viewMode: e, tabId: t }) => e === "story" && !t, "match"),
  render: /* @__PURE__ */ a(() => /* @__PURE__ */ s.createElement(he, { filter: rb }, ({ remount: e, storyId: t, api: r }) => {
    let [n, i] = J(!1), o = /* @__PURE__ */ a(() => {
      t && e();
    }, "remountComponent");
    return r.on(Ao, () => {
      i(!0);
    }), /* @__PURE__ */ s.createElement(
      tb,
      {
        key: "remount",
        title: "Remount component",
        onClick: o,
        onAnimationEnd: () => i(!1),
        animating: n,
        disabled: !t
      },
      /* @__PURE__ */ s.createElement(mt, null)
    );
  }), "render")
};

// src/manager/components/preview/tools/zoom.tsx
var Nr = 1, rp = Ut({ value: Nr, set: /* @__PURE__ */ a((e) => {
}, "set") }), Ni = class Ni extends Re {
  constructor() {
    super(...arguments);
    this.state = {
      value: Nr
    };
    this.set = /* @__PURE__ */ a((r) => this.setState({ value: r }), "set");
  }
  render() {
    let { children: r, shouldScale: n } = this.props, { set: i } = this, { value: o } = this.state;
    return /* @__PURE__ */ s.createElement(rp.Provider, { value: { value: n ? o : Nr, set: i } }, r);
  }
};
a(Ni, "ZoomProvider");
var Wn = Ni, { Consumer: Li } = rp, nb = Sr(/* @__PURE__ */ a(function({ zoomIn: t, zoomOut: r, reset: n }) {
  return /* @__PURE__ */ s.createElement(s.Fragment, null, /* @__PURE__ */ s.createElement(te, { key: "zoomin", onClick: t, title: "Zoom in" },
  /* @__PURE__ */ s.createElement(bl, null)), /* @__PURE__ */ s.createElement(te, { key: "zoomout", onClick: r, title: "Zoom out" }, /* @__PURE__ */ s.
  createElement(Il, null)), /* @__PURE__ */ s.createElement(te, { key: "zoomreset", onClick: n, title: "Reset zoom" }, /* @__PURE__ */ s.createElement(
  Sl, null)));
}, "Zoom"));
var ob = Sr(/* @__PURE__ */ a(function({
  set: t,
  value: r
}) {
  let n = A(
    (l) => {
      l.preventDefault(), t(0.8 * r);
    },
    [t, r]
  ), i = A(
    (l) => {
      l.preventDefault(), t(1.25 * r);
    },
    [t, r]
  ), o = A(
    (l) => {
      l.preventDefault(), t(Nr);
    },
    [t, Nr]
  );
  return /* @__PURE__ */ s.createElement(nb, { key: "zoom", zoomIn: n, zoomOut: i, reset: o });
}, "ZoomWrapper"));
function ib() {
  return /* @__PURE__ */ s.createElement(s.Fragment, null, /* @__PURE__ */ s.createElement(Li, null, ({ set: e, value: t }) => /* @__PURE__ */ s.
  createElement(ob, { set: e, value: t })), /* @__PURE__ */ s.createElement(Zt, null));
}
a(ib, "ZoomToolRenderer");
var np = {
  title: "zoom",
  id: "zoom",
  type: ve.TOOL,
  match: /* @__PURE__ */ a(({ viewMode: e, tabId: t }) => e === "story" && !t, "match"),
  render: ib
};

// src/manager/components/preview/Toolbar.tsx
var ab = /* @__PURE__ */ a(({ api: e, state: t }) => ({
  toggle: e.toggleFullscreen,
  isFullscreen: e.getIsFullscreen(),
  shortcut: Xe(e.getShortcutKeys().fullScreen),
  hasPanel: Object.keys(e.getElements(Ae.PANEL)).length > 0,
  singleStory: t.singleStory
}), "fullScreenMapper"), ip = {
  title: "fullscreen",
  id: "fullscreen",
  type: ve.TOOL,
  // @ts-expect-error (non strict)
  match: /* @__PURE__ */ a((e) => ["story", "docs"].includes(e.viewMode), "match"),
  render: /* @__PURE__ */ a(() => {
    let { isMobile: e } = Ee();
    return e ? null : /* @__PURE__ */ s.createElement(he, { filter: ab }, ({ toggle: t, isFullscreen: r, shortcut: n, hasPanel: i, singleStory: o }) => (!o ||
    o && i) && /* @__PURE__ */ s.createElement(
      te,
      {
        key: "full",
        onClick: t,
        title: `${r ? "Exit full screen" : "Go full screen"} [${n}]`,
        "aria-label": r ? "Exit full screen" : "Go full screen"
      },
      r ? /* @__PURE__ */ s.createElement(Ze, null) : /* @__PURE__ */ s.createElement(il, null)
    ));
  }, "render")
};
var ap = s.memo(/* @__PURE__ */ a(function({
  isShown: t,
  tools: r,
  toolsExtra: n,
  tabs: i,
  tabId: o,
  api: l
}) {
  return i || r || n ? /* @__PURE__ */ s.createElement(lb, { className: "sb-bar", key: "toolbar", shown: t, "data-test-id": "sb-preview-tool\
bar" }, /* @__PURE__ */ s.createElement(ub, null, /* @__PURE__ */ s.createElement(sp, null, i.length > 1 ? /* @__PURE__ */ s.createElement(Te,
  null, /* @__PURE__ */ s.createElement(cn, { key: "tabs" }, i.map((u, c) => /* @__PURE__ */ s.createElement(
    pn,
    {
      disabled: u.disabled,
      active: u.id === o || u.id === "canvas" && !o,
      onClick: () => {
        l.applyQueryParams({ tab: u.id === "canvas" ? void 0 : u.id });
      },
      key: u.id || `tab-${c}`
    },
    u.title
  ))), /* @__PURE__ */ s.createElement(Zt, null)) : null, /* @__PURE__ */ s.createElement(op, { key: "left", list: r })), /* @__PURE__ */ s.
  createElement(cb, null, /* @__PURE__ */ s.createElement(op, { key: "right", list: n })))) : null;
}, "ToolbarComp")), op = s.memo(/* @__PURE__ */ a(function({ list: t }) {
  return /* @__PURE__ */ s.createElement(s.Fragment, null, t.filter(Boolean).map(({ render: r, id: n, ...i }, o) => (
    // @ts-expect-error (Converted from ts-ignore)
    /* @__PURE__ */ s.createElement(r, { key: n || i.key || `f-${o}` })
  )));
}, "Tools"));
function sb(e, t) {
  let r = t?.type === "story" && t?.prepared ? t?.parameters : {}, n = "toolbar" in r ? r.toolbar : void 0, { toolbar: i } = Qe.getConfig(),
  o = Yr(i, n);
  return o ? !!o[e?.id]?.hidden : !1;
}
a(sb, "toolbarItemHasBeenExcluded");
function Fi(e, t, r, n, i, o) {
  let l = /* @__PURE__ */ a((u) => u && (!u.match || u.match({
    storyId: t?.id,
    refId: t?.refId,
    viewMode: r,
    location: n,
    path: i,
    tabId: o
  })) && !sb(u, t), "filter");
  return e.filter(l);
}
a(Fi, "filterToolsSide");
var lb = I.div(({ theme: e, shown: t }) => ({
  position: "relative",
  color: e.barTextColor,
  width: "100%",
  height: 40,
  flexShrink: 0,
  overflowX: "auto",
  overflowY: "hidden",
  marginTop: t ? 0 : -40,
  boxShadow: `${e.appBorderColor}  0 -1px 0 0 inset`,
  background: e.barBg,
  zIndex: 4
})), ub = I.div({
  position: "absolute",
  width: "calc(100% - 20px)",
  display: "flex",
  justifyContent: "space-between",
  flexWrap: "nowrap",
  flexShrink: 0,
  height: 40,
  marginLeft: 10,
  marginRight: 10
}), sp = I.div({
  display: "flex",
  whiteSpace: "nowrap",
  flexBasis: "auto",
  gap: 6,
  alignItems: "center"
}), cb = I(sp)({
  marginLeft: 30
});

// src/manager/components/preview/utils/components.ts
var lp = I.main({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  overflow: "hidden"
}), up = I.div({
  overflow: "auto",
  width: "100%",
  zIndex: 3,
  background: "transparent",
  flex: 1
}), cp = I.div(
  {
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
    justifyItems: "center",
    overflow: "auto",
    gridTemplateColumns: "100%",
    gridTemplateRows: "100%",
    position: "relative",
    width: "100%",
    height: "100%"
  },
  ({ show: e }) => ({ display: e ? "grid" : "none" })
), oL = I(Xr)({
  color: "inherit",
  textDecoration: "inherit",
  display: "inline-block"
}), iL = I.span({
  // Hides full screen icon at mobile breakpoint defined in app.js
  "@media (max-width: 599px)": {
    display: "none"
  }
}), Vn = I.div(({ theme: e }) => ({
  alignContent: "center",
  alignItems: "center",
  justifyContent: "center",
  justifyItems: "center",
  overflow: "auto",
  display: "grid",
  gridTemplateColumns: "100%",
  gridTemplateRows: "100%",
  position: "relative",
  width: "100%",
  height: "100%"
})), pp = I.div(({ theme: e }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  background: e.background.preview,
  zIndex: 1
}));

// src/manager/components/preview/Wrappers.tsx
var dp = /* @__PURE__ */ a(({
  wrappers: e,
  id: t,
  storyId: r,
  children: n
}) => /* @__PURE__ */ s.createElement(Te, null, e.reduceRight(
  (i, o, l) => /* @__PURE__ */ s.createElement(o.render, { index: l, children: i, id: t, storyId: r }),
  n
)), "ApplyWrappers"), fp = [
  {
    id: "iframe-wrapper",
    type: Ae.PREVIEW,
    render: /* @__PURE__ */ a((e) => /* @__PURE__ */ s.createElement(Vn, { id: "storybook-preview-wrapper" }, e.children), "render")
  }
];

// src/manager/components/preview/Preview.tsx
var db = /* @__PURE__ */ a(({ state: e, api: t }) => ({
  storyId: e.storyId,
  refId: e.refId,
  viewMode: e.viewMode,
  customCanvas: t.renderPreview,
  queryParams: e.customQueryParams,
  getElements: t.getElements,
  entry: t.getData(e.storyId, e.refId),
  previewInitialized: e.previewInitialized,
  refs: e.refs
}), "canvasMapper"), mp = /* @__PURE__ */ a(() => ({
  id: "canvas",
  type: ve.TAB,
  title: "Canvas",
  route: /* @__PURE__ */ a(({ storyId: e, refId: t }) => t ? `/story/${t}_${e}` : `/story/${e}`, "route"),
  match: /* @__PURE__ */ a(({ viewMode: e }) => !!(e && e.match(/^(story|docs)$/)), "match"),
  render: /* @__PURE__ */ a(() => null, "render")
}), "createCanvasTab"), hp = s.memo(/* @__PURE__ */ a(function(t) {
  let {
    api: r,
    id: n,
    options: i,
    viewMode: o,
    storyId: l,
    entry: u = void 0,
    description: c,
    baseUrl: p,
    withLoader: d = !0,
    tools: h,
    toolsExtra: f,
    tabs: y,
    wrappers: m,
    tabId: b
  } = t, x = y.find((S) => S.id === b)?.render, _ = o === "story", { showToolbar: g } = i, v = X(l);
  return K(() => {
    if (u && o) {
      if (l === v.current)
        return;
      if (v.current = l, o.match(/docs|story/)) {
        let { refId: S, id: C } = u;
        r.emit(ls, {
          storyId: C,
          viewMode: o,
          options: { target: S }
        });
      }
    }
  }, [u, o, l, r]), /* @__PURE__ */ s.createElement(Te, null, n === "main" && /* @__PURE__ */ s.createElement(_r, { key: "description" }, /* @__PURE__ */ s.
  createElement("title", null, c)), /* @__PURE__ */ s.createElement(Wn, { shouldScale: _ }, /* @__PURE__ */ s.createElement(lp, null, /* @__PURE__ */ s.
  createElement(
    ap,
    {
      key: "tools",
      isShown: g,
      tabId: b,
      tabs: y,
      tools: h,
      toolsExtra: f,
      api: r
    }
  ), /* @__PURE__ */ s.createElement(up, { key: "frame" }, x && /* @__PURE__ */ s.createElement(Vn, null, x({ active: !0 })), /* @__PURE__ */ s.
  createElement(cp, { show: !b }, /* @__PURE__ */ s.createElement(fb, { withLoader: d, baseUrl: p, wrappers: m }))))));
}, "Preview"));
var fb = /* @__PURE__ */ a(({ baseUrl: e, withLoader: t, wrappers: r }) => /* @__PURE__ */ s.createElement(he, { filter: db }, ({
  entry: n,
  refs: i,
  customCanvas: o,
  storyId: l,
  refId: u,
  viewMode: c,
  queryParams: p,
  previewInitialized: d
}) => {
  let h = "canvas", [f, y] = J(void 0);
  K(() => {
    if (ae.CONFIG_TYPE === "DEVELOPMENT")
      try {
        Qe.getChannel().on(is, (v) => {
          y(v);
        });
      } catch {
      }
  }, []);
  let m = !!i[u] && !i[u].previewInitialized, b = !(f?.value === 1 || f === void 0), x = !u && (!d || b), _ = n && m || x;
  return /* @__PURE__ */ s.createElement(Li, null, ({ value: g }) => /* @__PURE__ */ s.createElement(s.Fragment, null, t && _ && /* @__PURE__ */ s.
  createElement(pp, null, /* @__PURE__ */ s.createElement(sn, { id: "preview-loader", role: "progressbar", progress: f })), /* @__PURE__ */ s.
  createElement(dp, { id: h, storyId: l, viewMode: c, wrappers: r }, o ? o(l, c, h, e, g, p) : /* @__PURE__ */ s.createElement(
    jc,
    {
      baseUrl: e,
      refs: i,
      scale: g,
      entry: n,
      viewMode: c,
      refId: u,
      queryParams: p,
      storyId: l
    }
  ))));
}), "Canvas");
function gp(e, t) {
  let { previewTabs: r } = Qe.getConfig(), n = t ? t.previewTabs : void 0;
  if (r || n) {
    let i = Yr(r, n), o = Object.keys(i).map((l, u) => ({
      index: u,
      ...typeof i[l] == "string" ? { title: i[l] } : i[l],
      id: l
    }));
    return e.filter((l) => {
      let u = o.find((c) => c.id === l.id);
      return u === void 0 || u.id === "canvas" || !u.hidden;
    }).map((l, u) => ({ ...l, index: u })).sort((l, u) => {
      let c = o.find((f) => f.id === l.id), p = c ? c.index : o.length + l.index, d = o.find((f) => f.id === u.id), h = d ? d.index : o.length +
      u.index;
      return p - h;
    }).map((l) => {
      let u = o.find((c) => c.id === l.id);
      return u ? {
        ...l,
        title: u.title || l.title,
        disabled: u.disabled,
        hidden: u.hidden
      } : l;
    });
  }
  return e;
}
a(gp, "filterTabs");

// src/manager/components/preview/tools/menu.tsx
var mb = /* @__PURE__ */ a(({ api: e, state: t }) => ({
  isVisible: e.getIsNavShown(),
  singleStory: t.singleStory,
  toggle: /* @__PURE__ */ a(() => e.toggleNav(), "toggle")
}), "menuMapper"), yp = {
  title: "menu",
  id: "menu",
  type: ve.TOOL,
  // @ts-expect-error (non strict)
  match: /* @__PURE__ */ a(({ viewMode: e }) => ["story", "docs"].includes(e), "match"),
  render: /* @__PURE__ */ a(() => /* @__PURE__ */ s.createElement(he, { filter: mb }, ({ isVisible: e, toggle: t, singleStory: r }) => !r &&
  !e && /* @__PURE__ */ s.createElement(s.Fragment, null, /* @__PURE__ */ s.createElement(te, { "aria-label": "Show sidebar", key: "menu", onClick: t,
  title: "Show sidebar" }, /* @__PURE__ */ s.createElement(vn, null)), /* @__PURE__ */ s.createElement(Zt, null))), "render")
};

// src/manager/container/Preview.tsx
var hb = [mp()], gb = [yp, tp, np], yb = [Uc, ip, ep, Jc], vb = [], bb = (0, Fr.default)(1)(
  (e, t, r, n) => n ? gp([...hb, ...Object.values(t)], r) : vb
), Ib = (0, Fr.default)(1)(
  (e, t, r) => Fi([...gb, ...Object.values(t)], ...r)
), Sb = (0, Fr.default)(1)(
  (e, t, r) => Fi([...yb, ...Object.values(t)], ...r)
), xb = (0, Fr.default)(1)((e, t) => [
  ...fp,
  ...Object.values(t)
]), { PREVIEW_URL: wb } = ae, Eb = /* @__PURE__ */ a((e) => e.split("/").join(" / ").replace(/\s\s/, " "), "splitTitleAddExtraSpace"), Cb = /* @__PURE__ */ a(
(e) => {
  if (e?.type === "story" || e?.type === "docs") {
    let { title: t, name: r } = e;
    return t && r ? Eb(`${t} - ${r} \u22C5 Storybook`) : "Storybook";
  }
  return e?.name ? `${e.name} \u22C5 Storybook` : "Storybook";
}, "getDescription"), _b = /* @__PURE__ */ a(({
  api: e,
  state: t
  // @ts-expect-error (non strict)
}) => {
  let { layout: r, location: n, customQueryParams: i, storyId: o, refs: l, viewMode: u, path: c, refId: p } = t, d = e.getData(o, p), h = Object.
  values(e.getElements(Ae.TAB)), f = Object.values(e.getElements(Ae.PREVIEW)), y = Object.values(e.getElements(Ae.TOOL)), m = Object.values(
  e.getElements(Ae.TOOLEXTRA)), b = e.getQueryParam("tab"), x = Ib(y.length, e.getElements(Ae.TOOL), [
    d,
    u,
    n,
    c,
    // @ts-expect-error (non strict)
    b
  ]), _ = Sb(
    m.length,
    e.getElements(Ae.TOOLEXTRA),
    // @ts-expect-error (non strict)
    [d, u, n, c, b]
  );
  return {
    api: e,
    entry: d,
    options: r,
    description: Cb(d),
    viewMode: u,
    refs: l,
    storyId: o,
    baseUrl: wb || "iframe.html",
    queryParams: i,
    tools: x,
    toolsExtra: _,
    tabs: bb(
      h.length,
      e.getElements(Ae.TAB),
      d ? d.parameters : void 0,
      r.showTabs
    ),
    wrappers: xb(
      f.length,
      e.getElements(Ae.PREVIEW)
    ),
    tabId: b
  };
}, "mapper"), Tb = s.memo(/* @__PURE__ */ a(function(t) {
  return /* @__PURE__ */ s.createElement(he, { filter: _b }, (r) => /* @__PURE__ */ s.createElement(hp, { ...t, ...r }));
}, "PreviewConnected")), vp = Tb;

// src/manager/components/sidebar/HighlightStyles.tsx
var bp = /* @__PURE__ */ a(({ refId: e, itemId: t }) => /* @__PURE__ */ s.createElement(
  Yt,
  {
    styles: ({ color: r }) => {
      let n = ye(0.85, r.secondary);
      return {
        [`[data-ref-id="${e}"][data-item-id="${t}"]:not([data-selected="true"])`]: {
          '&[data-nodetype="component"], &[data-nodetype="group"]': {
            background: n,
            "&:hover, &:focus": { background: n }
          },
          '&[data-nodetype="story"], &[data-nodetype="document"]': {
            color: r.defaultText,
            background: n,
            "&:hover, &:focus": { background: n }
          }
        }
      };
    }
  }
), "HighlightStyles");

// src/manager/utils/tree.ts
var gr = Be(_n(), 1);
var { document: xp, window: kb } = ae, Kn = /* @__PURE__ */ a((e, t) => !t || t === st ? e : `${t}_${e}`, "createId"), wp = /* @__PURE__ */ a(
(e, t) => `${xp.location.pathname}?path=/${e.type}/${Kn(e.id, t)}`, "getLink");
var Ip = (0, gr.default)(1e3)((e, t) => t[e]), Ob = (0, gr.default)(1e3)((e, t) => {
  let r = Ip(e, t);
  return r && r.type !== "root" ? Ip(r.parent, t) : void 0;
}), Ep = (0, gr.default)(1e3)((e, t) => {
  let r = Ob(e, t);
  return r ? [r, ...Ep(r.id, t)] : [];
}), Br = (0, gr.default)(1e3)(
  (e, t) => Ep(t, e).map((r) => r.id)
), at = (0, gr.default)(1e3)((e, t, r) => {
  let n = e[t];
  return (n.type === "story" || n.type === "docs" ? [] : n.children).reduce((o, l) => {
    let u = e[l];
    return !u || r && (u.type === "story" || u.type === "docs") || o.push(l, ...at(e, l, r)), o;
  }, []);
});
function Cp(e, t) {
  let r = e.type !== "root" && e.parent ? t.index[e.parent] : null;
  return r ? [...Cp(r, t), r.name] : t.id === st ? [] : [t.title || t.id];
}
a(Cp, "getPath");
var Bi = /* @__PURE__ */ a((e, t) => ({ ...e, refId: t.id, path: Cp(e, t) }), "searchItem");
function _p(e, t, r) {
  let n = t + r % e.length;
  return n < 0 && (n = e.length + n), n >= e.length && (n -= e.length), n;
}
a(_p, "cycle");
var Nt = /* @__PURE__ */ a((e, t = !1) => {
  if (!e)
    return;
  let { top: r, bottom: n } = e.getBoundingClientRect();
  r >= 0 && n <= (kb.innerHeight || xp.documentElement.clientHeight) || e.scrollIntoView({ block: t ? "center" : "nearest" });
}, "scrollIntoView"), Tp = /* @__PURE__ */ a((e, t, r, n) => {
  switch (!0) {
    case t:
      return "auth";
    case r:
      return "error";
    case e:
      return "loading";
    case n:
      return "empty";
    default:
      return "ready";
  }
}, "getStateType"), Ft = /* @__PURE__ */ a((e, t) => !e || !t ? !1 : e === t ? !0 : Ft(e.parentElement || void 0, t), "isAncestor"), Sp = /* @__PURE__ */ a(
(e) => e.replaceAll(/(\s|-|_)/gi, ""), "removeNoiseFromName"), kp = /* @__PURE__ */ a((e, t) => Sp(e) === Sp(t), "isStoryHoistable");

// global-externals:@storybook/core/client-logger
var JL = __STORYBOOK_CLIENT_LOGGER__, { deprecate: eN, logger: Op, once: tN, pretty: rN } = __STORYBOOK_CLIENT_LOGGER__;

// src/manager/components/sidebar/Loader.tsx
var Pp = [0, 0, 1, 1, 2, 3, 3, 3, 1, 1, 1, 2, 2, 2, 3], Pb = I.div(
  {
    cursor: "progress",
    fontSize: 13,
    height: "16px",
    marginTop: 4,
    marginBottom: 4,
    alignItems: "center",
    overflow: "hidden"
  },
  ({ depth: e = 0 }) => ({
    marginLeft: e * 15,
    maxWidth: 85 - e * 5
  }),
  ({ theme: e }) => e.animation.inlineGlow,
  ({ theme: e }) => ({
    background: e.appBorderColor
  })
), Hr = I.div({
  display: "flex",
  flexDirection: "column",
  paddingLeft: 20,
  paddingRight: 20
}), Ap = /* @__PURE__ */ a(({ size: e }) => {
  let t = Math.ceil(e / Pp.length), r = Array.from(Array(t)).fill(Pp).flat().slice(0, e);
  return /* @__PURE__ */ s.createElement(Te, null, r.map((n, i) => /* @__PURE__ */ s.createElement(Pb, { depth: n, key: i })));
}, "Loader");

// src/manager/components/sidebar/RefBlocks.tsx
var { window: Mp } = ae, Ab = I.div(({ theme: e }) => ({
  fontSize: e.typography.size.s2,
  lineHeight: "20px",
  margin: 0
})), Hi = I.div(({ theme: e }) => ({
  fontSize: e.typography.size.s2,
  lineHeight: "20px",
  margin: 0,
  code: {
    fontSize: e.typography.size.s1
  },
  ul: {
    paddingLeft: 20,
    marginTop: 8,
    marginBottom: 8
  }
})), Mb = I.pre(
  {
    width: 420,
    boxSizing: "border-box",
    borderRadius: 8,
    overflow: "auto",
    whiteSpace: "pre"
  },
  ({ theme: e }) => ({
    color: e.color.dark
  })
), Dp = /* @__PURE__ */ a(({ loginUrl: e, id: t }) => {
  let [r, n] = J(!1), i = A(() => {
    Mp.document.location.reload();
  }, []), o = A((l) => {
    l.preventDefault();
    let u = Mp.open(e, `storybook_auth_${t}`, "resizable,scrollbars"), c = setInterval(() => {
      u ? u.closed && (clearInterval(c), n(!0)) : (Op.error("unable to access loginUrl window"), clearInterval(c));
    }, 1e3);
  }, []);
  return /* @__PURE__ */ s.createElement(Hr, null, /* @__PURE__ */ s.createElement(ut, null, r ? /* @__PURE__ */ s.createElement(Te, null, /* @__PURE__ */ s.
  createElement(Hi, null, "Authentication on ", /* @__PURE__ */ s.createElement("strong", null, e), " concluded. Refresh the page to fetch t\
his Storybook."), /* @__PURE__ */ s.createElement("div", null, /* @__PURE__ */ s.createElement(we, { small: !0, gray: !0, onClick: i }, /* @__PURE__ */ s.
  createElement(mt, null), "Refresh now"))) : /* @__PURE__ */ s.createElement(Te, null, /* @__PURE__ */ s.createElement(Hi, null, "Sign in t\
o browse this Storybook."), /* @__PURE__ */ s.createElement("div", null, /* @__PURE__ */ s.createElement(we, { small: !0, gray: !0, onClick: o },
  /* @__PURE__ */ s.createElement(yn, null), "Sign in")))));
}, "AuthBlock"), Lp = /* @__PURE__ */ a(({ error: e }) => /* @__PURE__ */ s.createElement(Hr, null, /* @__PURE__ */ s.createElement(ut, null,
/* @__PURE__ */ s.createElement(Ab, null, "Oh no! Something went wrong loading this Storybook.", /* @__PURE__ */ s.createElement("br", null),
/* @__PURE__ */ s.createElement(
  ze,
  {
    tooltip: /* @__PURE__ */ s.createElement(Mb, null, /* @__PURE__ */ s.createElement(Ys, { error: e }))
  },
  /* @__PURE__ */ s.createElement(Le, { isButton: !0 }, "View error ", /* @__PURE__ */ s.createElement(er, null))
), " ", /* @__PURE__ */ s.createElement(Le, { withArrow: !0, href: "https://storybook.js.org/docs", cancel: !1, target: "_blank" }, "View do\
cs")))), "ErrorBlock"), Db = I(ut)({
  display: "flex"
}), Lb = I(ut)({
  flex: 1
}), Np = /* @__PURE__ */ a(({ isMain: e }) => /* @__PURE__ */ s.createElement(Hr, null, /* @__PURE__ */ s.createElement(Db, { col: 1 }, /* @__PURE__ */ s.
createElement(Lb, null, /* @__PURE__ */ s.createElement(Hi, null, e ? /* @__PURE__ */ s.createElement(s.Fragment, null, "Oh no! Your Storybo\
ok is empty. Possible reasons why:", /* @__PURE__ */ s.createElement("ul", null, /* @__PURE__ */ s.createElement("li", null, "The glob speci\
fied in ", /* @__PURE__ */ s.createElement("code", null, "main.js"), " isn't correct."), /* @__PURE__ */ s.createElement("li", null, "No sto\
ries are defined in your story files."), /* @__PURE__ */ s.createElement("li", null, "You're using filter-functions, and all stories are fil\
tered away.")), " ") : /* @__PURE__ */ s.createElement(s.Fragment, null, "This composed storybook is empty, maybe you're using filter-functi\
ons, and all stories are filtered away."))))), "EmptyBlock"), Fp = /* @__PURE__ */ a(({ isMain: e }) => /* @__PURE__ */ s.createElement(Hr, null,
/* @__PURE__ */ s.createElement(Ap, { size: e ? 17 : 5 })), "LoaderBlock");

// src/manager/components/sidebar/RefIndicator.tsx
var { document: Nb, window: Fb } = ae, Bb = I.aside(({ theme: e }) => ({
  height: 16,
  display: "flex",
  alignItems: "center",
  "& > * + *": {
    marginLeft: e.layoutMargin
  }
})), Hb = I.button(({ theme: e }) => ({
  height: 20,
  width: 20,
  padding: 0,
  margin: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  outline: "none",
  border: "1px solid transparent",
  borderRadius: "100%",
  cursor: "pointer",
  color: e.base === "light" ? ye(0.3, e.color.defaultText) : ye(0.6, e.color.defaultText),
  "&:hover": {
    color: e.barSelectedColor
  },
  "&:focus": {
    color: e.barSelectedColor,
    borderColor: e.color.secondary
  },
  svg: {
    height: 10,
    width: 10,
    transition: "all 150ms ease-out",
    color: "inherit"
  }
})), Bt = I.span(({ theme: e }) => ({
  fontWeight: e.typography.weight.bold
})), Ht = I.a(({ theme: e }) => ({
  textDecoration: "none",
  lineHeight: "16px",
  padding: 15,
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  color: e.color.defaultText,
  "&:not(:last-child)": {
    borderBottom: `1px solid ${e.appBorderColor}`
  },
  "&:hover": {
    background: e.background.hoverable,
    color: e.color.darker
  },
  "&:link": {
    color: e.color.darker
  },
  "&:active": {
    color: e.color.darker
  },
  "&:focus": {
    color: e.color.darker
  },
  "& > *": {
    flex: 1
  },
  "& > svg": {
    marginTop: 3,
    width: 16,
    height: 16,
    marginRight: 10,
    flex: "unset"
  }
})), Rb = I.div({
  width: 280,
  boxSizing: "border-box",
  borderRadius: 8,
  overflow: "hidden"
}), zb = I.div(({ theme: e }) => ({
  display: "flex",
  alignItems: "center",
  fontSize: e.typography.size.s1,
  fontWeight: e.typography.weight.regular,
  color: e.base === "light" ? ye(0.3, e.color.defaultText) : ye(0.6, e.color.defaultText),
  "& > * + *": {
    marginLeft: 4
  },
  svg: {
    height: 10,
    width: 10
  }
})), $b = /* @__PURE__ */ a(({ url: e, versions: t }) => {
  let r = j(() => {
    let n = Object.entries(t).find(([i, o]) => o === e);
    return n && n[0] ? n[0] : "current";
  }, [e, t]);
  return /* @__PURE__ */ s.createElement(zb, null, /* @__PURE__ */ s.createElement("span", null, r), /* @__PURE__ */ s.createElement(er, null));
}, "CurrentVersion"), Bp = s.memo(
  fs(
    ({ state: e, ...t }, r) => {
      let n = de(), i = j(() => Object.values(t.index || {}), [t.index]), o = j(
        () => i.filter((u) => u.type === "component").length,
        [i]
      ), l = j(
        () => i.filter((u) => u.type === "docs" || u.type === "story").length,
        [i]
      );
      return /* @__PURE__ */ s.createElement(Bb, { ref: r }, /* @__PURE__ */ s.createElement(
        ze,
        {
          placement: "bottom-start",
          trigger: "click",
          closeOnOutsideClick: !0,
          tooltip: /* @__PURE__ */ s.createElement(Rb, null, /* @__PURE__ */ s.createElement(ut, { row: 0 }, e === "loading" && /* @__PURE__ */ s.
          createElement(qb, { url: t.url }), (e === "error" || e === "empty") && /* @__PURE__ */ s.createElement(Ub, { url: t.url }), e === "\
ready" && /* @__PURE__ */ s.createElement(s.Fragment, null, /* @__PURE__ */ s.createElement(Wb, { url: t.url, componentCount: o, leafCount: l }),
          t.sourceUrl && /* @__PURE__ */ s.createElement(Vb, { url: t.sourceUrl })), e === "auth" && /* @__PURE__ */ s.createElement(Kb, { ...t }),
          t.type === "auto-inject" && e !== "error" && /* @__PURE__ */ s.createElement(Gb, null), e !== "loading" && /* @__PURE__ */ s.createElement(
          jb, null)))
        },
        /* @__PURE__ */ s.createElement(Hb, { "data-action": "toggle-indicator", "aria-label": "toggle indicator" }, /* @__PURE__ */ s.createElement(
        Uo, null))
      ), t.versions && Object.keys(t.versions).length ? /* @__PURE__ */ s.createElement(
        ze,
        {
          placement: "bottom-start",
          trigger: "click",
          closeOnOutsideClick: !0,
          tooltip: (u) => /* @__PURE__ */ s.createElement(
            Ct,
            {
              links: Object.entries(t.versions).map(([c, p]) => ({
                icon: p === t.url ? "check" : void 0,
                id: c,
                title: c,
                href: p,
                onClick: /* @__PURE__ */ a((d, h) => {
                  d.preventDefault(), n.changeRefVersion(t.id, h.href), u.onHide();
                }, "onClick")
              }))
            }
          )
        },
        /* @__PURE__ */ s.createElement($b, { url: t.url, versions: t.versions })
      ) : null);
    }
  )
), Wb = /* @__PURE__ */ a(({ url: e, componentCount: t, leafCount: r }) => {
  let n = De();
  return /* @__PURE__ */ s.createElement(Ht, { href: e.replace(/\/?$/, "/index.html"), target: "_blank" }, /* @__PURE__ */ s.createElement(Uo,
  { color: n.color.secondary }), /* @__PURE__ */ s.createElement("div", null, /* @__PURE__ */ s.createElement(Bt, null, "View external Story\
book"), /* @__PURE__ */ s.createElement("div", null, "Explore ", t, " components and ", r, " stories in a new browser tab.")));
}, "ReadyMessage"), Vb = /* @__PURE__ */ a(({ url: e }) => {
  let t = De();
  return /* @__PURE__ */ s.createElement(Ht, { href: e, target: "_blank" }, /* @__PURE__ */ s.createElement(dl, { color: t.color.secondary }),
  /* @__PURE__ */ s.createElement("div", null, /* @__PURE__ */ s.createElement(Bt, null, "View source code")));
}, "SourceCodeMessage"), Kb = /* @__PURE__ */ a(({ loginUrl: e, id: t }) => {
  let r = De(), n = A((i) => {
    i.preventDefault();
    let o = Fb.open(e, `storybook_auth_${t}`, "resizable,scrollbars"), l = setInterval(() => {
      o ? o.closed && (clearInterval(l), Nb.location.reload()) : clearInterval(l);
    }, 1e3);
  }, []);
  return /* @__PURE__ */ s.createElement(Ht, { onClick: n }, /* @__PURE__ */ s.createElement(yn, { color: r.color.gold }), /* @__PURE__ */ s.
  createElement("div", null, /* @__PURE__ */ s.createElement(Bt, null, "Log in required"), /* @__PURE__ */ s.createElement("div", null, "You\
 need to authenticate to view this Storybook's components.")));
}, "LoginRequiredMessage"), jb = /* @__PURE__ */ a(() => {
  let e = De();
  return /* @__PURE__ */ s.createElement(
    Ht,
    {
      href: "https://storybook.js.org/docs/react/sharing/storybook-composition",
      target: "_blank"
    },
    /* @__PURE__ */ s.createElement(tr, { color: e.color.green }),
    /* @__PURE__ */ s.createElement("div", null, /* @__PURE__ */ s.createElement(Bt, null, "Read Composition docs"), /* @__PURE__ */ s.createElement(
    "div", null, "Learn how to combine multiple Storybooks into one."))
  );
}, "ReadDocsMessage"), Ub = /* @__PURE__ */ a(({ url: e }) => {
  let t = De();
  return /* @__PURE__ */ s.createElement(Ht, { href: e.replace(/\/?$/, "/index.html"), target: "_blank" }, /* @__PURE__ */ s.createElement(fn,
  { color: t.color.negative }), /* @__PURE__ */ s.createElement("div", null, /* @__PURE__ */ s.createElement(Bt, null, "Something went wrong"),
  /* @__PURE__ */ s.createElement("div", null, "This external Storybook didn't load. Debug it in a new tab now.")));
}, "ErrorOccurredMessage"), qb = /* @__PURE__ */ a(({ url: e }) => {
  let t = De();
  return /* @__PURE__ */ s.createElement(Ht, { href: e.replace(/\/?$/, "/index.html"), target: "_blank" }, /* @__PURE__ */ s.createElement(gl,
  { color: t.color.secondary }), /* @__PURE__ */ s.createElement("div", null, /* @__PURE__ */ s.createElement(Bt, null, "Please wait"), /* @__PURE__ */ s.
  createElement("div", null, "This Storybook is loading.")));
}, "LoadingMessage"), Gb = /* @__PURE__ */ a(() => {
  let e = De();
  return /* @__PURE__ */ s.createElement(
    Ht,
    {
      href: "https://storybook.js.org/docs/react/sharing/storybook-composition#improve-your-storybook-composition",
      target: "_blank"
    },
    /* @__PURE__ */ s.createElement(cl, { color: e.color.gold }),
    /* @__PURE__ */ s.createElement("div", null, /* @__PURE__ */ s.createElement(Bt, null, "Reduce lag"), /* @__PURE__ */ s.createElement("d\
iv", null, "Learn how to speed up Composition performance."))
  );
}, "PerformanceDegradedMessage");

// src/manager/components/sidebar/IconSymbols.tsx
var Yb = I.svg`
  position: absolute;
  width: 0;
  height: 0;
  display: inline-block;
  shape-rendering: inherit;
  vertical-align: middle;
`, Hp = "icon--group", Rp = "icon--component", zp = "icon--document", $p = "icon--story", Wp = "icon--success", Vp = "icon--error", Kp = "ic\
on--warning", jp = "icon--dot", Up = /* @__PURE__ */ a(() => /* @__PURE__ */ s.createElement(Yb, { "data-chromatic": "ignore" }, /* @__PURE__ */ s.
createElement("symbol", { id: Hp }, /* @__PURE__ */ s.createElement(
  "path",
  {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M6.586 3.504l-1.5-1.5H1v9h12v-7.5H6.586zm.414-1L5.793 1.297a1 1 0 00-.707-.293H.5a.5.5 0 00-.5.5v10a.5.5 0 00.5.5h13a.5.5 0 00.5-.5v\
-8.5a.5.5 0 00-.5-.5H7z",
    fill: "currentColor"
  }
)), /* @__PURE__ */ s.createElement("symbol", { id: Rp }, /* @__PURE__ */ s.createElement(
  "path",
  {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M3.5 1.004a2.5 2.5 0 00-2.5 2.5v7a2.5 2.5 0 002.5 2.5h7a2.5 2.5 0 002.5-2.5v-7a2.5 2.5 0 00-2.5-2.5h-7zm8.5 5.5H7.5v-4.5h3a1.5 1.5 0\
 011.5 1.5v3zm0 1v3a1.5 1.5 0 01-1.5 1.5h-3v-4.5H12zm-5.5 4.5v-4.5H2v3a1.5 1.5 0 001.5 1.5h3zM2 6.504h4.5v-4.5h-3a1.5 1.5 0 00-1.5 1.5v3z",
    fill: "currentColor"
  }
)), /* @__PURE__ */ s.createElement("symbol", { id: zp }, /* @__PURE__ */ s.createElement(
  "path",
  {
    d: "M4 5.5a.5.5 0 01.5-.5h5a.5.5 0 010 1h-5a.5.5 0 01-.5-.5zM4.5 7.5a.5.5 0 000 1h5a.5.5 0 000-1h-5zM4 10.5a.5.5 0 01.5-.5h5a.5.5 0 010 \
1h-5a.5.5 0 01-.5-.5z",
    fill: "currentColor"
  }
), /* @__PURE__ */ s.createElement(
  "path",
  {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M1.5 0a.5.5 0 00-.5.5v13a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V3.207a.5.5 0 00-.146-.353L10.146.146A.5.5 0 009.793 0H1.5zM2 1h7.5v2a.5.5 0\
 00.5.5h2V13H2V1z",
    fill: "currentColor"
  }
)), /* @__PURE__ */ s.createElement("symbol", { id: $p }, /* @__PURE__ */ s.createElement(
  "path",
  {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M3.5 0h7a.5.5 0 01.5.5v13a.5.5 0 01-.454.498.462.462 0 01-.371-.118L7 11.159l-3.175 2.72a.46.46 0 01-.379.118A.5.5 0 013 13.5V.5a.5.\
5 0 01.5-.5zM4 12.413l2.664-2.284a.454.454 0 01.377-.128.498.498 0 01.284.12L10 12.412V1H4v11.413z",
    fill: "currentColor"
  }
)), /* @__PURE__ */ s.createElement("symbol", { id: Wp }, /* @__PURE__ */ s.createElement(
  "path",
  {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M10.854 4.146a.5.5 0 010 .708l-5 5a.5.5 0 01-.708 0l-2-2a.5.5 0 11.708-.708L5.5 8.793l4.646-4.647a.5.5 0 01.708 0z",
    fill: "currentColor"
  }
)), /* @__PURE__ */ s.createElement("symbol", { id: Vp }, /* @__PURE__ */ s.createElement(
  "path",
  {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M7 4a3 3 0 100 6 3 3 0 000-6zM3 7a4 4 0 118 0 4 4 0 01-8 0z",
    fill: "currentColor"
  }
)), /* @__PURE__ */ s.createElement("symbol", { id: Kp }, /* @__PURE__ */ s.createElement(
  "path",
  {
    fillRule: "evenodd",
    clipRule: "evenodd",
    d: "M7.206 3.044a.498.498 0 01.23.212l3.492 5.985a.494.494 0 01.006.507.497.497 0 01-.443.252H3.51a.499.499 0 01-.437-.76l3.492-5.984a.4\
97.497 0 01.642-.212zM7 4.492L4.37 9h5.26L7 4.492z",
    fill: "currentColor"
  }
)), /* @__PURE__ */ s.createElement("symbol", { id: jp }, /* @__PURE__ */ s.createElement("circle", { cx: "3", cy: "3", r: "3", fill: "curre\
ntColor" }))), "IconSymbols"), He = /* @__PURE__ */ a(({ type: e }) => e === "group" ? /* @__PURE__ */ s.createElement("use", { xlinkHref: `\
#${Hp}` }) : e === "component" ? /* @__PURE__ */ s.createElement("use", { xlinkHref: `#${Rp}` }) : e === "document" ? /* @__PURE__ */ s.createElement(
"use", { xlinkHref: `#${zp}` }) : e === "story" ? /* @__PURE__ */ s.createElement("use", { xlinkHref: `#${$p}` }) : e === "success" ? /* @__PURE__ */ s.
createElement("use", { xlinkHref: `#${Wp}` }) : e === "error" ? /* @__PURE__ */ s.createElement("use", { xlinkHref: `#${Vp}` }) : e === "war\
ning" ? /* @__PURE__ */ s.createElement("use", { xlinkHref: `#${Kp}` }) : e === "dot" ? /* @__PURE__ */ s.createElement("use", { xlinkHref: `\
#${jp}` }) : null, "UseSymbol");

// src/manager/utils/status.tsx
var Qb = I(rl)({
  // specificity hack
  "&&&": {
    width: 6,
    height: 6
  }
}), Xb = I(Qb)(({ theme: { animation: e, color: t, base: r } }) => ({
  // specificity hack
  animation: `${e.glow} 1.5s ease-in-out infinite`,
  color: r === "light" ? t.mediumdark : t.darker
})), Zb = ["unknown", "pending", "success", "warn", "error"], Rr = {
  unknown: [null, null],
  pending: [/* @__PURE__ */ s.createElement(Xb, { key: "icon" }), "currentColor"],
  success: [
    /* @__PURE__ */ s.createElement("svg", { key: "icon", viewBox: "0 0 14 14", width: "14", height: "14" }, /* @__PURE__ */ s.createElement(
    He, { type: "success" })),
    "currentColor"
  ],
  warn: [
    /* @__PURE__ */ s.createElement("svg", { key: "icon", viewBox: "0 0 14 14", width: "14", height: "14" }, /* @__PURE__ */ s.createElement(
    He, { type: "warning" })),
    "#A15C20"
  ],
  error: [
    /* @__PURE__ */ s.createElement("svg", { key: "icon", viewBox: "0 0 14 14", width: "14", height: "14" }, /* @__PURE__ */ s.createElement(
    He, { type: "error" })),
    "brown"
  ]
}, zr = /* @__PURE__ */ a((e) => Zb.reduce(
  (t, r) => e.includes(r) ? r : t,
  "unknown"
), "getHighestStatus");
function jn(e, t) {
  return Object.values(e).reduce((r, n) => {
    if (n.type === "group" || n.type === "component") {
      let i = at(e, n.id, !1).map((l) => e[l]).filter((l) => l.type === "story"), o = zr(
        // @ts-expect-error (non strict)
        i.flatMap((l) => Object.values(t?.[l.id] || {})).map((l) => l.status)
      );
      o && (r[n.id] = o);
    }
    return r;
  }, {});
}
a(jn, "getGroupStatus");

// src/manager/components/sidebar/StatusButton.tsx
var qp = /* @__PURE__ */ a(({ theme: e, status: t }) => {
  let r = e.base === "light" ? ye(0.3, e.color.defaultText) : ye(0.6, e.color.defaultText);
  return {
    color: {
      pending: r,
      success: e.color.positive,
      error: e.color.negative,
      warn: e.color.warning,
      unknown: r
    }[t]
  };
}, "withStatusColor"), Gp = I.div(qp, {
  margin: 3
}), Ri = I(te)(
  qp,
  ({ theme: e, height: t, width: r }) => ({
    transition: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: r || 28,
    height: t || 28,
    "&:hover": {
      color: e.color.secondary
    },
    "&:focus": {
      color: e.color.secondary,
      borderColor: e.color.secondary,
      "&:not(:focus-visible)": {
        borderColor: "transparent"
      }
    }
  }),
  ({ theme: e, selectedItem: t }) => t && {
    "&:hover": {
      boxShadow: `inset 0 0 0 2px ${e.color.secondary}`,
      background: "rgba(255, 255, 255, 0.2)"
    }
  }
);

// src/manager/components/sidebar/StatusContext.tsx
var zi = Ut({}), Yp = /* @__PURE__ */ a((e) => {
  let { data: t, status: r, groupStatus: n } = Qr(zi), i = {
    counts: { pending: 0, success: 0, error: 0, warn: 0, unknown: 0 },
    statuses: { pending: {}, success: {}, error: {}, warn: {}, unknown: {} }
  };
  if (t && r && n && ["pending", "warn", "error"].includes(n[e.id]))
    for (let o of at(t, e.id, !1))
      for (let l of Object.values(r[o] || {}))
        i.counts[l.status]++, i.statuses[l.status][o] = i.statuses[l.status][o] || [], i.statuses[l.status][o].push(l);
  return i;
}, "useStatusSummary");

// src/manager/components/sidebar/components/CollapseIcon.tsx
var Jb = I.div(({ theme: e, isExpanded: t }) => ({
  width: 8,
  height: 8,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  color: ye(0.4, e.textMutedColor),
  transform: t ? "rotateZ(90deg)" : "none",
  transition: "transform .1s ease-out"
})), Rt = /* @__PURE__ */ a(({ isExpanded: e }) => /* @__PURE__ */ s.createElement(Jb, { isExpanded: e }, /* @__PURE__ */ s.createElement("s\
vg", { xmlns: "http://www.w3.org/2000/svg", width: "8", height: "8", fill: "none" }, /* @__PURE__ */ s.createElement(
  "path",
  {
    fill: "#73828C",
    fillRule: "evenodd",
    d: "M1.896 7.146a.5.5 0 1 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 1 0-.708.708L5.043 4 1.896 7.146Z",
    clipRule: "evenodd"
  }
))), "CollapseIcon");

// src/manager/components/sidebar/TreeNode.tsx
var bt = I.svg(
  ({ theme: e, type: t }) => ({
    width: 14,
    height: 14,
    flex: "0 0 auto",
    color: t === "group" ? e.base === "dark" ? e.color.primary : e.color.ultraviolet : t === "component" ? e.color.secondary : t === "docume\
nt" ? e.base === "dark" ? e.color.gold : "#ff8300" : t === "story" ? e.color.seafoam : "currentColor"
  })
), Qp = I.button(({ theme: e, depth: t = 0, isExpandable: r = !1 }) => ({
  width: "100%",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "start",
  textAlign: "left",
  paddingLeft: `${(r ? 8 : 22) + t * 18}px`,
  color: "inherit",
  fontSize: `${e.typography.size.s2}px`,
  background: "transparent",
  minHeight: 28,
  borderRadius: 4,
  gap: 6,
  paddingTop: 5,
  paddingBottom: 4
})), Xp = I.a(({ theme: e, depth: t = 0 }) => ({
  width: "100%",
  cursor: "pointer",
  color: "inherit",
  display: "flex",
  gap: 6,
  flex: 1,
  alignItems: "start",
  paddingLeft: `${22 + t * 18}px`,
  paddingTop: 5,
  paddingBottom: 4,
  fontSize: `${e.typography.size.s2}px`,
  textDecoration: "none",
  overflowWrap: "break-word",
  wordWrap: "break-word",
  wordBreak: "break-word"
})), Zp = I.div(({ theme: e }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 16,
  marginBottom: 4,
  fontSize: `${e.typography.size.s1 - 1}px`,
  fontWeight: e.typography.weight.bold,
  lineHeight: "16px",
  minHeight: 28,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: e.textMutedColor
})), Un = I.div({
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginTop: 2
}), Jp = s.memo(/* @__PURE__ */ a(function({
  children: t,
  isExpanded: r = !1,
  isExpandable: n = !1,
  ...i
}) {
  return /* @__PURE__ */ s.createElement(Qp, { isExpandable: n, tabIndex: -1, ...i }, /* @__PURE__ */ s.createElement(Un, null, n && /* @__PURE__ */ s.
  createElement(Rt, { isExpanded: r }), /* @__PURE__ */ s.createElement(bt, { viewBox: "0 0 14 14", width: "14", height: "14", type: "group" },
  /* @__PURE__ */ s.createElement(He, { type: "group" }))), t);
}, "GroupNode")), ed = s.memo(
  /* @__PURE__ */ a(function({ theme: t, children: r, isExpanded: n, isExpandable: i, isSelected: o, ...l }) {
    return /* @__PURE__ */ s.createElement(Qp, { isExpandable: i, tabIndex: -1, ...l }, /* @__PURE__ */ s.createElement(Un, null, i && /* @__PURE__ */ s.
    createElement(Rt, { isExpanded: n }), /* @__PURE__ */ s.createElement(bt, { viewBox: "0 0 14 14", width: "12", height: "12", type: "comp\
onent" }, /* @__PURE__ */ s.createElement(He, { type: "component" }))), r);
  }, "ComponentNode")
), td = s.memo(
  /* @__PURE__ */ a(function({ theme: t, children: r, docsMode: n, ...i }) {
    return /* @__PURE__ */ s.createElement(Xp, { tabIndex: -1, ...i }, /* @__PURE__ */ s.createElement(Un, null, /* @__PURE__ */ s.createElement(
    bt, { viewBox: "0 0 14 14", width: "12", height: "12", type: "document" }, /* @__PURE__ */ s.createElement(He, { type: "document" }))), r);
  }, "DocumentNode")
), rd = s.memo(/* @__PURE__ */ a(function({
  theme: t,
  children: r,
  ...n
}) {
  return /* @__PURE__ */ s.createElement(Xp, { tabIndex: -1, ...n }, /* @__PURE__ */ s.createElement(Un, null, /* @__PURE__ */ s.createElement(
  bt, { viewBox: "0 0 14 14", width: "12", height: "12", type: "story" }, /* @__PURE__ */ s.createElement(He, { type: "story" }))), r);
}, "StoryNode"));

// src/manager/components/sidebar/useExpanded.ts
var Fd = Be(Nd(), 1);

// src/manager/keybinding.ts
var U0 = {
  // event.code => event.key
  Space: " ",
  Slash: "/",
  ArrowLeft: "ArrowLeft",
  ArrowUp: "ArrowUp",
  ArrowRight: "ArrowRight",
  ArrowDown: "ArrowDown",
  Escape: "Escape",
  Enter: "Enter"
}, q0 = { alt: !1, ctrl: !1, meta: !1, shift: !1 }, It = /* @__PURE__ */ a((e, t) => {
  let { alt: r, ctrl: n, meta: i, shift: o } = e === !1 ? q0 : e;
  return !(typeof r == "boolean" && r !== t.altKey || typeof n == "boolean" && n !== t.ctrlKey || typeof i == "boolean" && i !== t.metaKey ||
  typeof o == "boolean" && o !== t.shiftKey);
}, "matchesModifiers"), Ue = /* @__PURE__ */ a((e, t) => t.code ? t.code === e : t.key === U0[e], "matchesKeyCode");

// src/manager/components/sidebar/useExpanded.ts
var { document: ji } = ae, G0 = /* @__PURE__ */ a(({
  refId: e,
  data: t,
  initialExpanded: r,
  highlightedRef: n,
  rootIds: i
}) => {
  let o = n.current?.refId === e ? Br(t, n.current?.itemId) : [];
  return [...i, ...o].reduce(
    // @ts-expect-error (non strict)
    (l, u) => Object.assign(l, { [u]: u in r ? r[u] : !0 }),
    {}
  );
}, "initializeExpanded"), Y0 = /* @__PURE__ */ a(() => {
}, "noop"), Bd = /* @__PURE__ */ a(({
  containerRef: e,
  isBrowsing: t,
  refId: r,
  data: n,
  initialExpanded: i,
  rootIds: o,
  highlightedRef: l,
  setHighlightedItemId: u,
  selectedStoryId: c,
  onSelectStoryId: p
}) => {
  let d = de(), [h, f] = Gt(
    (g, { ids: v, value: S }) => v.reduce((C, E) => Object.assign(C, { [E]: S }), { ...g }),
    // @ts-expect-error (non strict)
    { refId: r, data: n, highlightedRef: l, rootIds: o, initialExpanded: i },
    G0
  ), y = A(
    (g) => e.current?.querySelector(`[data-item-id="${g}"]`),
    [e]
  ), m = A(
    (g) => {
      u(g.getAttribute("data-item-id")), Nt(g);
    },
    [u]
  ), b = A(
    ({ ids: g, value: v }) => {
      if (f({ ids: g, value: v }), g.length === 1) {
        let S = e.current?.querySelector(
          `[data-item-id="${g[0]}"][data-ref-id="${r}"]`
        );
        S && m(S);
      }
    },
    [e, m, r]
  );
  K(() => {
    f({ ids: Br(n, c), value: !0 });
  }, [n, c]);
  let x = A(() => {
    let g = Object.keys(n).filter((v) => !o.includes(v));
    f({ ids: g, value: !1 });
  }, [n, o]), _ = A(() => {
    f({ ids: Object.keys(n), value: !0 });
  }, [n]);
  return K(() => d ? (d.on(Ir, x), d.on(Mo, _), () => {
    d.off(Ir, x), d.off(Mo, _);
  }) : Y0, [d, x, _]), K(() => {
    let g = ji.getElementById("storybook-explorer-menu"), v = (0, Fd.default)((S) => {
      let C = l.current?.refId === r && l.current?.itemId;
      if (!t || !e.current || !C || S.repeat || !It(!1, S))
        return;
      let E = Ue("Enter", S), k = Ue("Space", S), O = Ue("ArrowLeft", S), w = Ue("ArrowRight", S);
      if (!(E || k || O || w))
        return;
      let T = y(C);
      if (!T || T.getAttribute("data-ref-id") !== r)
        return;
      let P = S.target;
      if (!Ft(g, P) && !Ft(P, g))
        return;
      if (P.hasAttribute("data-action")) {
        if (E || k)
          return;
        P.blur();
      }
      let M = T.getAttribute("data-nodetype");
      (E || k) && ["component", "story", "document"].includes(M) && p(C);
      let D = T.getAttribute("aria-expanded");
      if (O) {
        if (D === "true") {
          f({ ids: [C], value: !1 });
          return;
        }
        let L = T.getAttribute("data-parent-id"), W = L && y(L);
        if (W && W.getAttribute("data-highlightable") === "true") {
          m(W);
          return;
        }
        f({ ids: at(n, C, !0), value: !1 });
        return;
      }
      w && (D === "false" ? b({ ids: [C], value: !0 }) : D === "true" && b({ ids: at(n, C, !0), value: !0 }));
    }, 60);
    return ji.addEventListener("keydown", v), () => ji.removeEventListener("keydown", v);
  }, [
    e,
    t,
    r,
    n,
    l,
    u,
    p
  ]), [h, b];
}, "useExpanded");

// src/manager/components/sidebar/Tree.tsx
var Q0 = I.div((e) => ({
  marginTop: e.hasOrphans ? 20 : 0,
  marginBottom: 20
})), X0 = I.button(({ theme: e }) => ({
  all: "unset",
  display: "flex",
  padding: "0px 8px",
  borderRadius: 4,
  transition: "color 150ms, box-shadow 150ms",
  gap: 6,
  alignItems: "center",
  cursor: "pointer",
  height: 28,
  "&:hover, &:focus": {
    outline: "none",
    background: ye(0.93, e.color.secondary)
  }
})), Hd = I.div(({ theme: e }) => ({
  position: "relative",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: e.color.defaultText,
  background: "transparent",
  minHeight: 28,
  borderRadius: 4,
  "&:hover, &:focus": {
    background: ye(0.93, e.color.secondary),
    outline: "none"
  },
  '&[data-selected="true"]': {
    color: e.color.lightest,
    background: e.color.secondary,
    fontWeight: e.typography.weight.bold,
    "&&:hover, &&:focus": {
      background: e.color.secondary
    },
    svg: { color: e.color.lightest }
  },
  a: { color: "currentColor" }
})), Z0 = I(we)(({ theme: e }) => ({
  display: "none",
  "@media (min-width: 600px)": {
    display: "block",
    fontSize: "10px",
    overflow: "hidden",
    width: 1,
    height: "20px",
    boxSizing: "border-box",
    opacity: 0,
    padding: 0,
    "&:focus": {
      opacity: 1,
      padding: "5px 10px",
      background: "white",
      color: e.color.secondary,
      width: "auto"
    }
  }
})), Rd = s.memo(/* @__PURE__ */ a(function({
  item: t,
  status: r,
  groupStatus: n,
  refId: i,
  docsMode: o,
  isOrphan: l,
  isDisplayed: u,
  isSelected: c,
  isFullyExpanded: p,
  setFullyExpanded: d,
  isExpanded: h,
  setExpanded: f,
  onSelectStoryId: y,
  api: m
}) {
  let { isDesktop: b, isMobile: x, setMobileMenuOpen: _ } = Ee(), g = De(), { counts: v, statuses: S } = Yp(t);
  if (!u)
    return null;
  let C = Kn(t.id, i);
  if (t.type === "story" || t.type === "docs") {
    let E = t.type === "docs" ? td : rd, k = zr(Object.values(r || {}).map((P) => P.status)), [O, w] = Rr[k], T = ["success", "error", "warn",
    "pending", "unknown"];
    return /* @__PURE__ */ s.createElement(
      Hd,
      {
        key: C,
        className: "sidebar-item",
        "data-selected": c,
        "data-ref-id": i,
        "data-item-id": t.id,
        "data-parent-id": t.parent,
        "data-nodetype": t.type === "docs" ? "document" : "story",
        "data-highlightable": u
      },
      /* @__PURE__ */ s.createElement(
        E,
        {
          style: c ? {} : { color: w },
          href: wp(t, i),
          id: C,
          depth: l ? t.depth : t.depth - 1,
          onClick: (P) => {
            P.preventDefault(), y(t.id), x && _(!1);
          },
          ...t.type === "docs" && { docsMode: o }
        },
        t.renderLabel?.(t, m) || t.name
      ),
      c && /* @__PURE__ */ s.createElement(Z0, { asChild: !0 }, /* @__PURE__ */ s.createElement("a", { href: "#storybook-preview-wrapper" },
      "Skip to canvas")),
      O ? /* @__PURE__ */ s.createElement(
        ze,
        {
          closeOnOutsideClick: !0,
          onClick: (P) => P.stopPropagation(),
          placement: "bottom",
          tooltip: () => /* @__PURE__ */ s.createElement(
            Ct,
            {
              links: Object.entries(r || {}).sort(
                (P, M) => T.indexOf(P[1].status) - T.indexOf(M[1].status)
              ).map(([P, M]) => ({
                id: P,
                title: M.title,
                description: M.description,
                icon: {
                  success: /* @__PURE__ */ s.createElement(ml, { color: g.color.positive }),
                  error: /* @__PURE__ */ s.createElement(qo, { color: g.color.negative }),
                  warn: /* @__PURE__ */ s.createElement(Go, { color: g.color.warning }),
                  pending: /* @__PURE__ */ s.createElement(mt, { size: 12, color: g.color.defaultText }),
                  unknown: null
                }[M.status],
                onClick: /* @__PURE__ */ a(() => {
                  y(t.id), M.onClick?.();
                }, "onClick")
              }))
            }
          )
        },
        /* @__PURE__ */ s.createElement(Ri, { type: "button", status: k, selectedItem: c }, O)
      ) : null
    );
  }
  if (t.type === "root")
    return /* @__PURE__ */ s.createElement(
      Zp,
      {
        key: C,
        id: C,
        className: "sidebar-subheading",
        "data-ref-id": i,
        "data-item-id": t.id,
        "data-nodetype": "root"
      },
      /* @__PURE__ */ s.createElement(
        X0,
        {
          type: "button",
          "data-action": "collapse-root",
          onClick: (E) => {
            E.preventDefault(), f({ ids: [t.id], value: !h });
          },
          "aria-expanded": h
        },
        /* @__PURE__ */ s.createElement(Rt, { isExpanded: h }),
        t.renderLabel?.(t, m) || t.name
      ),
      h && /* @__PURE__ */ s.createElement(
        te,
        {
          className: "sidebar-subheading-action",
          "aria-label": p ? "Expand" : "Collapse",
          "data-action": "expand-all",
          "data-expanded": p,
          onClick: (E) => {
            E.preventDefault(), d();
          }
        },
        p ? /* @__PURE__ */ s.createElement(nl, null) : /* @__PURE__ */ s.createElement(ol, null)
      )
    );
  if (t.type === "component" || t.type === "group") {
    let E = n?.[t.id], k = E ? Rr[E][1] : null, O = t.type === "component" ? ed : Jp, w = /* @__PURE__ */ a((T) => {
      let P = [];
      return v.error && P.push({
        id: "errors",
        icon: /* @__PURE__ */ s.createElement(qo, { color: g.color.negative }),
        title: `${v.error} ${v.error === 1 ? "story" : "stories"} with errors`,
        onClick: /* @__PURE__ */ a(() => {
          let [M, [D]] = Object.entries(S.error)[0];
          y(M), D.onClick?.(), T();
        }, "onClick")
      }), v.warn && P.push({
        id: "warnings",
        icon: /* @__PURE__ */ s.createElement(Go, { color: g.color.gold }),
        title: `${v.warn} ${v.warn === 1 ? "story" : "stories"} with warnings`,
        onClick: /* @__PURE__ */ a(() => {
          let [M, [D]] = Object.entries(S.warn)[0];
          y(M), D.onClick?.(), T();
        }, "onClick")
      }), P;
    }, "createLinks");
    return /* @__PURE__ */ s.createElement(
      Hd,
      {
        key: C,
        className: "sidebar-item",
        "data-ref-id": i,
        "data-item-id": t.id,
        "data-parent-id": t.parent,
        "data-nodetype": t.type === "component" ? "component" : "group",
        "data-highlightable": u
      },
      /* @__PURE__ */ s.createElement(
        O,
        {
          id: C,
          style: k ? { color: k } : {},
          "aria-controls": t.children && t.children[0],
          "aria-expanded": h,
          depth: l ? t.depth : t.depth - 1,
          isComponent: t.type === "component",
          isExpandable: t.children && t.children.length > 0,
          isExpanded: h,
          onClick: (T) => {
            T.preventDefault(), f({ ids: [t.id], value: !h }), t.type === "component" && !h && b && y(t.id);
          },
          onMouseEnter: () => {
            t.type === "component" && m.emit(wt, {
              ids: [t.children[0]],
              options: { target: i }
            });
          }
        },
        t.renderLabel?.(t, m) || t.name
      ),
      ["error", "warn"].includes(E) && /* @__PURE__ */ s.createElement(
        ze,
        {
          closeOnOutsideClick: !0,
          onClick: (T) => T.stopPropagation(),
          placement: "bottom",
          tooltip: ({ onHide: T }) => /* @__PURE__ */ s.createElement(Ct, { links: w(T) })
        },
        /* @__PURE__ */ s.createElement(Ri, { type: "button", status: E }, /* @__PURE__ */ s.createElement("svg", { key: "icon", viewBox: "0\
 0 6 6", width: "6", height: "6", type: "dot" }, /* @__PURE__ */ s.createElement(He, { type: "dot" })))
      )
    );
  }
  return null;
}, "Node")), J0 = s.memo(/* @__PURE__ */ a(function({
  setExpanded: t,
  isFullyExpanded: r,
  expandableDescendants: n,
  ...i
}) {
  let o = A(
    () => t({ ids: n, value: !r }),
    [t, r, n]
  );
  return /* @__PURE__ */ s.createElement(
    Rd,
    {
      ...i,
      setExpanded: t,
      isFullyExpanded: r,
      setFullyExpanded: o
    }
  );
}, "Root")), zd = s.memo(/* @__PURE__ */ a(function({
  isBrowsing: t,
  isMain: r,
  refId: n,
  data: i,
  status: o,
  docsMode: l,
  highlightedRef: u,
  setHighlightedItemId: c,
  selectedStoryId: p,
  onSelectStoryId: d
}) {
  let h = X(null), f = de(), [y, m, b] = j(
    () => Object.keys(i).reduce(
      (w, T) => {
        let P = i[T];
        return P.type === "root" ? w[0].push(T) : P.parent || w[1].push(T), P.type === "root" && P.startCollapsed && (w[2][T] = !1), w;
      },
      [[], [], {}]
    ),
    [i]
  ), { expandableDescendants: x } = j(() => [...m, ...y].reduce(
    (w, T) => (w.expandableDescendants[T] = at(i, T, !1).filter(
      (P) => !["story", "docs"].includes(i[P].type)
    ), w),
    { orphansFirst: [], expandableDescendants: {} }
  ), [i, y, m]), _ = j(() => Object.keys(i).filter((w) => {
    let T = i[w];
    if (T.type !== "component")
      return !1;
    let { children: P = [], name: M } = T;
    if (P.length !== 1)
      return !1;
    let D = i[P[0]];
    return D.type === "docs" ? !0 : D.type === "story" ? kp(D.name, M) : !1;
  }), [i]), g = j(
    () => Object.keys(i).filter((w) => !_.includes(w)),
    [_]
  ), v = j(() => _.reduce(
    (w, T) => {
      let { children: P, parent: M, name: D } = i[T], [L] = P;
      if (M) {
        let W = [...i[M].children];
        W[W.indexOf(T)] = L, w[M] = { ...i[M], children: W };
      }
      return w[L] = {
        ...i[L],
        name: D,
        parent: M,
        depth: i[L].depth - 1
      }, w;
    },
    { ...i }
  ), [i]), S = j(() => g.reduce(
    (w, T) => Object.assign(w, { [T]: Br(v, T) }),
    {}
  ), [g, v]), [C, E] = Bd({
    // @ts-expect-error (non strict)
    containerRef: h,
    isBrowsing: t,
    refId: n,
    data: v,
    initialExpanded: b,
    rootIds: y,
    highlightedRef: u,
    setHighlightedItemId: c,
    selectedStoryId: p,
    onSelectStoryId: d
  }), k = j(() => jn(v, o), [v, o]), O = j(() => g.map((w) => {
    let T = v[w], P = Kn(w, n);
    if (T.type === "root") {
      let D = x[T.id], L = D.every((W) => C[W]);
      return (
        // @ts-expect-error (TODO)
        /* @__PURE__ */ s.createElement(
          J0,
          {
            key: P,
            item: T,
            refId: n,
            isOrphan: !1,
            isDisplayed: !0,
            isSelected: p === w,
            isExpanded: !!C[w],
            setExpanded: E,
            isFullyExpanded: L,
            expandableDescendants: D,
            onSelectStoryId: d
          }
        )
      );
    }
    let M = !T.parent || S[w].every((D) => C[D]);
    return /* @__PURE__ */ s.createElement(
      Rd,
      {
        api: f,
        key: P,
        item: T,
        status: o?.[w],
        groupStatus: k,
        refId: n,
        docsMode: l,
        isOrphan: m.some((D) => w === D || w.startsWith(`${D}-`)),
        isDisplayed: M,
        isSelected: p === w,
        isExpanded: !!C[w],
        setExpanded: E,
        onSelectStoryId: d
      }
    );
  }), [
    S,
    f,
    v,
    g,
    l,
    x,
    C,
    k,
    d,
    m,
    n,
    p,
    E,
    o
  ]);
  return /* @__PURE__ */ s.createElement(zi.Provider, { value: { data: i, status: o, groupStatus: k } }, /* @__PURE__ */ s.createElement(Q0,
  { ref: h, hasOrphans: r && m.length > 0 }, /* @__PURE__ */ s.createElement(Up, null), O));
}, "Tree"));

// src/manager/components/sidebar/Refs.tsx
var eI = I.div(({ isMain: e }) => ({
  position: "relative",
  marginTop: e ? void 0 : 0
})), tI = I.div(({ theme: e }) => ({
  fontWeight: e.typography.weight.bold,
  fontSize: e.typography.size.s2,
  // Similar to ListItem.tsx
  textDecoration: "none",
  lineHeight: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  background: "transparent",
  width: "100%",
  marginTop: 20,
  paddingTop: 16,
  paddingBottom: 12,
  borderTop: `1px solid ${e.appBorderColor}`,
  color: e.base === "light" ? e.color.defaultText : ye(0.2, e.color.defaultText)
})), rI = I.div({
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  flex: 1,
  overflow: "hidden",
  marginLeft: 2
}), nI = I.button(({ theme: e }) => ({
  all: "unset",
  display: "flex",
  padding: "0px 8px",
  gap: 6,
  alignItems: "center",
  cursor: "pointer",
  overflow: "hidden",
  "&:focus": {
    borderColor: e.color.secondary,
    "span:first-of-type": {
      borderLeftColor: e.color.secondary
    }
  }
})), $d = s.memo(
  /* @__PURE__ */ a(function(t) {
    let { docsOptions: r } = Ke(), n = de(), {
      index: i,
      id: o,
      title: l = o,
      isLoading: u,
      isBrowsing: c,
      selectedStoryId: p,
      highlightedRef: d,
      setHighlighted: h,
      loginUrl: f,
      type: y,
      expanded: m = !0,
      indexError: b,
      previewInitialized: x
    } = t, _ = j(() => i ? Object.keys(i).length : 0, [i]), g = X(null), v = o === st, C = u || (y === "auto-inject" && !x || y === "server-\
checked") || y === "unknown", w = Tp(C, !!f && _ === 0, !!b, !C && _ === 0), [T, P] = J(m);
    K(() => {
      i && p && i[p] && P(!0);
    }, [P, i, p]);
    let M = A(() => P((W) => !W), [P]), D = A(
      (W) => h({ itemId: W, refId: o }),
      [h]
    ), L = A(
      // @ts-expect-error (non strict)
      (W) => n && n.selectStory(W, void 0, { ref: !v && o }),
      [n, v, o]
    );
    return /* @__PURE__ */ s.createElement(s.Fragment, null, v || /* @__PURE__ */ s.createElement(
      tI,
      {
        "aria-label": `${T ? "Hide" : "Show"} ${l} stories`,
        "aria-expanded": T
      },
      /* @__PURE__ */ s.createElement(nI, { "data-action": "collapse-ref", onClick: M }, /* @__PURE__ */ s.createElement(Rt, { isExpanded: T }),
      /* @__PURE__ */ s.createElement(rI, { title: l }, l)),
      /* @__PURE__ */ s.createElement(Bp, { ...t, state: w, ref: g })
    ), T && /* @__PURE__ */ s.createElement(eI, { "data-title": l, isMain: v }, w === "auth" && /* @__PURE__ */ s.createElement(Dp, { id: o,
    loginUrl: f }), w === "error" && /* @__PURE__ */ s.createElement(Lp, { error: b }), w === "loading" && /* @__PURE__ */ s.createElement(Fp,
    { isMain: v }), w === "empty" && /* @__PURE__ */ s.createElement(Np, { isMain: v }), w === "ready" && /* @__PURE__ */ s.createElement(
      zd,
      {
        status: t.status,
        isBrowsing: c,
        isMain: v,
        refId: o,
        data: i,
        docsMode: r.docsMode,
        selectedStoryId: p,
        onSelectStoryId: L,
        highlightedRef: d,
        setHighlightedItemId: D
      }
    )));
  }, "Ref")
);

// src/manager/components/sidebar/useHighlighted.ts
var { document: Ui, window: Wd } = ae, Vd = /* @__PURE__ */ a((e) => e ? { itemId: e.storyId, refId: e.refId } : null, "fromSelection"), Kd = /* @__PURE__ */ a(
({
  containerRef: e,
  isLoading: t,
  isBrowsing: r,
  dataset: n,
  selected: i
}) => {
  let o = Vd(i), l = X(o), [u, c] = J(o), p = de(), d = A(
    (f) => {
      l.current = f, c(f);
    },
    [l]
  ), h = A(
    (f, y = !1) => {
      let m = f.getAttribute("data-item-id"), b = f.getAttribute("data-ref-id");
      !m || !b || (d({ itemId: m, refId: b }), Nt(f, y));
    },
    [d]
  );
  return K(() => {
    let f = Vd(i);
    if (d(f), f) {
      let { itemId: y, refId: m } = f;
      setTimeout(() => {
        Nt(
          // @ts-expect-error (non strict)
          e.current?.querySelector(`[data-item-id="${y}"][data-ref-id="${m}"]`),
          !0
          // make sure it's clearly visible by centering it
        );
      }, 0);
    }
  }, [n, l, e, i]), K(() => {
    let f = Ui.getElementById("storybook-explorer-menu"), y, m = /* @__PURE__ */ a((b) => {
      if (t || !r || !e.current || !It(!1, b))
        return;
      let x = Ue("ArrowUp", b), _ = Ue("ArrowDown", b);
      if (!(x || _))
        return;
      let g = Wd.requestAnimationFrame(() => {
        Wd.cancelAnimationFrame(y), y = g;
        let v = b.target;
        if (!Ft(f, v) && !Ft(v, f))
          return;
        v.hasAttribute("data-action") && v.blur();
        let S = Array.from(
          e.current.querySelectorAll("[data-highlightable=true]")
        ), C = S.findIndex(
          (O) => O.getAttribute("data-item-id") === l.current?.itemId && O.getAttribute("data-ref-id") === l.current?.refId
        ), E = _p(S, C, x ? -1 : 1), k = x ? E === S.length - 1 : E === 0;
        if (h(S[E], k), S[E].getAttribute("data-nodetype") === "component") {
          let { itemId: O, refId: w } = l.current, T = p.resolveStory(O, w === "storybook_internal" ? void 0 : w);
          T.type === "component" && p.emit(wt, {
            // @ts-expect-error (non strict)
            ids: [T.children[0]],
            options: { target: w }
          });
        }
      });
    }, "navigateTree");
    return Ui.addEventListener("keydown", m), () => Ui.removeEventListener("keydown", m);
  }, [t, r, l, h]), [u, d, l];
}, "useHighlighted");

// src/manager/components/sidebar/Explorer.tsx
var jd = s.memo(/* @__PURE__ */ a(function({
  isLoading: t,
  isBrowsing: r,
  dataset: n,
  selected: i
}) {
  let o = X(null), [l, u, c] = Kd({
    // @ts-expect-error (non strict)
    containerRef: o,
    isLoading: t,
    isBrowsing: r,
    dataset: n,
    selected: i
  });
  return /* @__PURE__ */ s.createElement(
    "div",
    {
      ref: o,
      id: "storybook-explorer-tree",
      "data-highlighted-ref-id": l?.refId,
      "data-highlighted-item-id": l?.itemId
    },
    l && /* @__PURE__ */ s.createElement(bp, { ...l }),
    n.entries.map(([p, d]) => /* @__PURE__ */ s.createElement(
      $d,
      {
        ...d,
        key: p,
        isLoading: t,
        isBrowsing: r,
        selectedStoryId: i?.refId === d.id ? i.storyId : null,
        highlightedRef: c,
        setHighlighted: u
      }
    ))
  );
}, "Explorer"));

// src/manager/components/sidebar/Brand.tsx
var oI = I(un)(({ theme: e }) => ({
  width: "auto",
  height: "22px !important",
  display: "block",
  color: e.base === "light" ? e.color.defaultText : e.color.lightest
})), iI = I.img({
  display: "block",
  maxWidth: "150px",
  maxHeight: "100px"
}), Ud = I.a(({ theme: e }) => ({
  display: "inline-block",
  height: "100%",
  margin: "-3px -4px",
  padding: "2px 3px",
  border: "1px solid transparent",
  borderRadius: 3,
  color: "inherit",
  textDecoration: "none",
  "&:focus": {
    outline: 0,
    borderColor: e.color.secondary
  }
})), qd = ws(({ theme: e }) => {
  let { title: t = "Storybook", url: r = "./", image: n, target: i } = e.brand, o = i || (r === "./" ? "" : "_blank");
  if (n === null)
    return t === null ? null : r ? /* @__PURE__ */ s.createElement(Ud, { href: r, target: o, dangerouslySetInnerHTML: { __html: t } }) : /* @__PURE__ */ s.
    createElement("div", { dangerouslySetInnerHTML: { __html: t } });
  let l = n ? /* @__PURE__ */ s.createElement(iI, { src: n, alt: t }) : /* @__PURE__ */ s.createElement(oI, { alt: t });
  return r ? /* @__PURE__ */ s.createElement(Ud, { title: t, href: r, target: o }, l) : /* @__PURE__ */ s.createElement("div", null, l);
});

// src/manager/components/sidebar/Menu.tsx
var Gd = I(te)(({ highlighted: e, theme: t }) => ({
  position: "relative",
  overflow: "visible",
  marginTop: 0,
  zIndex: 1,
  ...e && {
    "&:before, &:after": {
      content: '""',
      position: "absolute",
      top: 6,
      right: 6,
      width: 5,
      height: 5,
      zIndex: 2,
      borderRadius: "50%",
      background: t.background.app,
      border: `1px solid ${t.background.app}`,
      boxShadow: `0 0 0 2px ${t.background.app}`
    },
    "&:after": {
      background: t.color.positive,
      border: "1px solid rgba(0, 0, 0, 0.1)",
      boxShadow: `0 0 0 2px ${t.background.app}`
    },
    "&:hover:after, &:focus-visible:after": {
      boxShadow: `0 0 0 2px ${ye(0.88, t.color.secondary)}`
    }
  }
})), aI = I.div({
  display: "flex",
  gap: 4
}), sI = /* @__PURE__ */ a(({ menu: e, onHide: t }) => {
  let r = j(() => e.map(({ onClick: n, ...i }) => ({
    ...i,
    onClick: /* @__PURE__ */ a((o, l) => {
      n && n(o, l), t();
    }, "onClick")
  })), [e, t]);
  return /* @__PURE__ */ s.createElement(Ct, { links: r });
}, "SidebarMenuList"), Yd = /* @__PURE__ */ a(({ menu: e, isHighlighted: t, onClick: r }) => {
  let [n, i] = J(!1), { isMobile: o, setMobileMenuOpen: l } = Ee();
  return o ? /* @__PURE__ */ s.createElement(aI, null, /* @__PURE__ */ s.createElement(
    Gd,
    {
      title: "About Storybook",
      "aria-label": "About Storybook",
      highlighted: t,
      active: !1,
      onClick: r
    },
    /* @__PURE__ */ s.createElement(Ko, null)
  ), /* @__PURE__ */ s.createElement(
    te,
    {
      title: "Close menu",
      "aria-label": "Close menu",
      onClick: () => l(!1)
    },
    /* @__PURE__ */ s.createElement(Ze, null)
  )) : /* @__PURE__ */ s.createElement(
    ze,
    {
      placement: "top",
      closeOnOutsideClick: !0,
      tooltip: ({ onHide: u }) => /* @__PURE__ */ s.createElement(sI, { onHide: u, menu: e }),
      onVisibleChange: i
    },
    /* @__PURE__ */ s.createElement(
      Gd,
      {
        title: "Shortcuts",
        "aria-label": "Shortcuts",
        highlighted: t,
        active: n
      },
      /* @__PURE__ */ s.createElement(Ko, null)
    )
  );
}, "SidebarMenu");

// src/manager/components/sidebar/Heading.tsx
var lI = I.div(({ theme: e }) => ({
  fontSize: e.typography.size.s2,
  fontWeight: e.typography.weight.bold,
  color: e.color.defaultText,
  marginRight: 20,
  display: "flex",
  width: "100%",
  alignItems: "center",
  minHeight: 22,
  "& > * > *": {
    maxWidth: "100%"
  },
  "& > *": {
    maxWidth: "100%",
    height: "auto",
    display: "block",
    flex: "1 1 auto"
  }
})), uI = I.div({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  position: "relative",
  minHeight: 42,
  paddingLeft: 8
}), cI = I(we)(({ theme: e }) => ({
  display: "none",
  "@media (min-width: 600px)": {
    display: "block",
    position: "absolute",
    fontSize: e.typography.size.s1,
    zIndex: 3,
    border: 0,
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    wordWrap: "normal",
    opacity: 0,
    transition: "opacity 150ms ease-out",
    "&:focus": {
      width: "100%",
      height: "inherit",
      padding: "10px 15px",
      margin: 0,
      clip: "unset",
      overflow: "unset",
      opacity: 1
    }
  }
})), Qd = /* @__PURE__ */ a(({
  menuHighlighted: e = !1,
  menu: t,
  skipLinkHref: r,
  extra: n,
  isLoading: i,
  onMenuClick: o,
  ...l
}) => /* @__PURE__ */ s.createElement(uI, { ...l }, r && /* @__PURE__ */ s.createElement(cI, { asChild: !0 }, /* @__PURE__ */ s.createElement(
"a", { href: r, tabIndex: 0 }, "Skip to canvas")), /* @__PURE__ */ s.createElement(lI, null, /* @__PURE__ */ s.createElement(qd, null)), i ?
null : n.map(({ id: u, render: c }) => /* @__PURE__ */ s.createElement(c, { key: u })), /* @__PURE__ */ s.createElement(Yd, { menu: t, isHighlighted: e,
onClick: o })), "Heading");

// ../node_modules/downshift/dist/downshift.esm.js
var q = Be(Lo());
var mI = Be(ef());

// ../node_modules/compute-scroll-into-view/dist/index.js
var tf = /* @__PURE__ */ a((e) => typeof e == "object" && e != null && e.nodeType === 1, "t"), rf = /* @__PURE__ */ a((e, t) => (!t || e !==
"hidden") && e !== "visible" && e !== "clip", "e"), Yi = /* @__PURE__ */ a((e, t) => {
  if (e.clientHeight < e.scrollHeight || e.clientWidth < e.scrollWidth) {
    let r = getComputedStyle(e, null);
    return rf(r.overflowY, t) || rf(r.overflowX, t) || ((n) => {
      let i = ((o) => {
        if (!o.ownerDocument || !o.ownerDocument.defaultView) return null;
        try {
          return o.ownerDocument.defaultView.frameElement;
        } catch {
          return null;
        }
      })(n);
      return !!i && (i.clientHeight < n.scrollHeight || i.clientWidth < n.scrollWidth);
    })(e);
  }
  return !1;
}, "n"), oo = /* @__PURE__ */ a((e, t, r, n, i, o, l, u) => o < e && l > t || o > e && l < t ? 0 : o <= e && u <= r || l >= t && u >= r ? o -
e - n : l > t && u < r || o < e && u > r ? l - t + i : 0, "o"), fI = /* @__PURE__ */ a((e) => {
  let t = e.parentElement;
  return t ?? (e.getRootNode().host || null);
}, "l"), nf = /* @__PURE__ */ a((e, t) => {
  var r, n, i, o;
  if (typeof document > "u") return [];
  let { scrollMode: l, block: u, inline: c, boundary: p, skipOverflowHiddenElements: d } = t, h = typeof p == "function" ? p : (Z) => Z !== p;
  if (!tf(e)) throw new TypeError("Invalid target");
  let f = document.scrollingElement || document.documentElement, y = [], m = e;
  for (; tf(m) && h(m); ) {
    if (m = fI(m), m === f) {
      y.push(m);
      break;
    }
    m != null && m === document.body && Yi(m) && !Yi(document.documentElement) || m != null && Yi(m, d) && y.push(m);
  }
  let b = (n = (r = window.visualViewport) == null ? void 0 : r.width) != null ? n : innerWidth, x = (o = (i = window.visualViewport) == null ?
  void 0 : i.height) != null ? o : innerHeight, { scrollX: _, scrollY: g } = window, { height: v, width: S, top: C, right: E, bottom: k, left: O } = e.
  getBoundingClientRect(), { top: w, right: T, bottom: P, left: M } = ((Z) => {
    let G = window.getComputedStyle(Z);
    return { top: parseFloat(G.scrollMarginTop) || 0, right: parseFloat(G.scrollMarginRight) || 0, bottom: parseFloat(G.scrollMarginBottom) ||
    0, left: parseFloat(G.scrollMarginLeft) || 0 };
  })(e), D = u === "start" || u === "nearest" ? C - w : u === "end" ? k + P : C + v / 2 - w + P, L = c === "center" ? O + S / 2 - M + T : c ===
  "end" ? E + T : O - M, W = [];
  for (let Z = 0; Z < y.length; Z++) {
    let G = y[Z], { height: R, width: z, top: B, right: re, bottom: H, left: N } = G.getBoundingClientRect();
    if (l === "if-needed" && C >= 0 && O >= 0 && k <= x && E <= b && C >= B && k <= H && O >= N && E <= re) return W;
    let F = getComputedStyle(G), $ = parseInt(F.borderLeftWidth, 10), Q = parseInt(F.borderTopWidth, 10), ne = parseInt(F.borderRightWidth, 10),
    ee = parseInt(F.borderBottomWidth, 10), le = 0, se = 0, pe = "offsetWidth" in G ? G.offsetWidth - G.clientWidth - $ - ne : 0, ce = "offs\
etHeight" in G ? G.offsetHeight - G.clientHeight - Q - ee : 0, Se = "offsetWidth" in G ? G.offsetWidth === 0 ? 0 : z / G.offsetWidth : 0, ge = "\
offsetHeight" in G ? G.offsetHeight === 0 ? 0 : R / G.offsetHeight : 0;
    if (f === G) le = u === "start" ? D : u === "end" ? D - x : u === "nearest" ? oo(g, g + x, x, Q, ee, g + D, g + D + v, v) : D - x / 2, se =
    c === "start" ? L : c === "center" ? L - b / 2 : c === "end" ? L - b : oo(_, _ + b, b, $, ne, _ + L, _ + L + S, S), le = Math.max(0, le +
    g), se = Math.max(0, se + _);
    else {
      le = u === "start" ? D - B - Q : u === "end" ? D - H + ee + ce : u === "nearest" ? oo(B, H, R, Q, ee + ce, D, D + v, v) : D - (B + R /
      2) + ce / 2, se = c === "start" ? L - N - $ : c === "center" ? L - (N + z / 2) + pe / 2 : c === "end" ? L - re + ne + pe : oo(N, re, z,
      $, ne + pe, L, L + S, S);
      let { scrollLeft: Pe, scrollTop: me } = G;
      le = ge === 0 ? 0 : Math.max(0, Math.min(me + le / ge, G.scrollHeight - R / ge + ce)), se = Se === 0 ? 0 : Math.max(0, Math.min(Pe + se /
      Se, G.scrollWidth - z / Se + pe)), D += me - le, L += Pe - se;
    }
    W.push({ el: G, top: le, left: se });
  }
  return W;
}, "r");

// ../node_modules/tslib/tslib.es6.mjs
var zt = /* @__PURE__ */ a(function() {
  return zt = Object.assign || /* @__PURE__ */ a(function(t) {
    for (var r, n = 1, i = arguments.length; n < i; n++) {
      r = arguments[n];
      for (var o in r) Object.prototype.hasOwnProperty.call(r, o) && (t[o] = r[o]);
    }
    return t;
  }, "__assign"), zt.apply(this, arguments);
}, "__assign");

// ../node_modules/downshift/dist/downshift.esm.js
var hI = 0;
function of(e) {
  return typeof e == "function" ? e : $e;
}
a(of, "cbToCb");
function $e() {
}
a($e, "noop");
function df(e, t) {
  if (e) {
    var r = nf(e, {
      boundary: t,
      block: "nearest",
      scrollMode: "if-needed"
    });
    r.forEach(function(n) {
      var i = n.el, o = n.top, l = n.left;
      i.scrollTop = o, i.scrollLeft = l;
    });
  }
}
a(df, "scrollIntoView");
function af(e, t, r) {
  var n = e === t || t instanceof r.Node && e.contains && e.contains(t);
  return n;
}
a(af, "isOrContainsNode");
function yo(e, t) {
  var r;
  function n() {
    r && clearTimeout(r);
  }
  a(n, "cancel");
  function i() {
    for (var o = arguments.length, l = new Array(o), u = 0; u < o; u++)
      l[u] = arguments[u];
    n(), r = setTimeout(function() {
      r = null, e.apply(void 0, l);
    }, t);
  }
  return a(i, "wrapper"), i.cancel = n, i;
}
a(yo, "debounce");
function ue() {
  for (var e = arguments.length, t = new Array(e), r = 0; r < e; r++)
    t[r] = arguments[r];
  return function(n) {
    for (var i = arguments.length, o = new Array(i > 1 ? i - 1 : 0), l = 1; l < i; l++)
      o[l - 1] = arguments[l];
    return t.some(function(u) {
      return u && u.apply(void 0, [n].concat(o)), n.preventDownshiftDefault || n.hasOwnProperty("nativeEvent") && n.nativeEvent.preventDownshiftDefault;
    });
  };
}
a(ue, "callAllEventHandlers");
function Je() {
  for (var e = arguments.length, t = new Array(e), r = 0; r < e; r++)
    t[r] = arguments[r];
  return function(n) {
    t.forEach(function(i) {
      typeof i == "function" ? i(n) : i && (i.current = n);
    });
  };
}
a(Je, "handleRefs");
function ff() {
  return String(hI++);
}
a(ff, "generateId");
function gI(e) {
  var t = e.isOpen, r = e.resultCount, n = e.previousResultCount;
  return t ? r ? r !== n ? r + " result" + (r === 1 ? " is" : "s are") + " available, use up and down arrow keys to navigate. Press Enter ke\
y to select." : "" : "No results are available." : "";
}
a(gI, "getA11yStatusMessage");
function sf(e, t) {
  return e = Array.isArray(e) ? (
    /* istanbul ignore next (preact) */
    e[0]
  ) : e, !e && t ? t : e;
}
a(sf, "unwrapArray");
function yI(e) {
  return typeof e.type == "string";
}
a(yI, "isDOMElement");
function vI(e) {
  return e.props;
}
a(vI, "getElementProps");
var bI = ["highlightedIndex", "inputValue", "isOpen", "selectedItem", "type"];
function io(e) {
  e === void 0 && (e = {});
  var t = {};
  return bI.forEach(function(r) {
    e.hasOwnProperty(r) && (t[r] = e[r]);
  }), t;
}
a(io, "pickState");
function Vr(e, t) {
  return !e || !t ? e : Object.keys(e).reduce(function(r, n) {
    return r[n] = co(t, n) ? t[n] : e[n], r;
  }, {});
}
a(Vr, "getState");
function co(e, t) {
  return e[t] !== void 0;
}
a(co, "isControlledProp");
function yr(e) {
  var t = e.key, r = e.keyCode;
  return r >= 37 && r <= 40 && t.indexOf("Arrow") !== 0 ? "Arrow" + t : t;
}
a(yr, "normalizeArrowKey");
function et(e, t, r, n, i) {
  i === void 0 && (i = !1);
  var o = r.length;
  if (o === 0)
    return -1;
  var l = o - 1;
  (typeof e != "number" || e < 0 || e > l) && (e = t > 0 ? -1 : l + 1);
  var u = e + t;
  u < 0 ? u = i ? l : 0 : u > l && (u = i ? 0 : l);
  var c = St(u, t < 0, r, n, i);
  return c === -1 ? e >= o ? -1 : e : c;
}
a(et, "getHighlightedIndex");
function St(e, t, r, n, i) {
  i === void 0 && (i = !1);
  var o = r.length;
  if (t) {
    for (var l = e; l >= 0; l--)
      if (!n(r[l], l))
        return l;
  } else
    for (var u = e; u < o; u++)
      if (!n(r[u], u))
        return u;
  return i ? St(t ? o - 1 : 0, t, r, n) : -1;
}
a(St, "getNonDisabledIndex");
function po(e, t, r, n) {
  return n === void 0 && (n = !0), r && t.some(function(i) {
    return i && (af(i, e, r) || n && af(i, r.document.activeElement, r));
  });
}
a(po, "targetWithinDownshift");
var II = yo(function(e) {
  mf(e).textContent = "";
}, 500);
function mf(e) {
  var t = e.getElementById("a11y-status-message");
  return t || (t = e.createElement("div"), t.setAttribute("id", "a11y-status-message"), t.setAttribute("role", "status"), t.setAttribute("ar\
ia-live", "polite"), t.setAttribute("aria-relevant", "additions text"), Object.assign(t.style, {
    border: "0",
    clip: "rect(0 0 0 0)",
    height: "1px",
    margin: "-1px",
    overflow: "hidden",
    padding: "0",
    position: "absolute",
    width: "1px"
  }), e.body.appendChild(t), t);
}
a(mf, "getStatusDiv");
function hf(e, t) {
  if (!(!e || !t)) {
    var r = mf(t);
    r.textContent = e, II(t);
  }
}
a(hf, "setStatus");
function SI(e) {
  var t = e?.getElementById("a11y-status-message");
  t && t.remove();
}
a(SI, "cleanupStatusDiv");
var gf = 0, yf = 1, vf = 2, ao = 3, so = 4, bf = 5, If = 6, Sf = 7, xf = 8, wf = 9, Ef = 10, Cf = 11, _f = 12, Tf = 13, kf = 14, Of = 15, Pf = 16,
xI = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  unknown: gf,
  mouseUp: yf,
  itemMouseEnter: vf,
  keyDownArrowUp: ao,
  keyDownArrowDown: so,
  keyDownEscape: bf,
  keyDownEnter: If,
  keyDownHome: Sf,
  keyDownEnd: xf,
  clickItem: wf,
  blurInput: Ef,
  changeInput: Cf,
  keyDownSpaceButton: _f,
  clickButton: Tf,
  blurButton: kf,
  controlledPropUpdatedSelectedItem: Of,
  touchEnd: Pf
}), wI = ["refKey", "ref"], EI = ["onClick", "onPress", "onKeyDown", "onKeyUp", "onBlur"], CI = ["onKeyDown", "onBlur", "onChange", "onInput",
"onChangeText"], _I = ["refKey", "ref"], TI = ["onMouseMove", "onMouseDown", "onClick", "onPress", "index", "item"], kI = /* @__PURE__ */ function() {
  var e = /* @__PURE__ */ function(t) {
    function r(i) {
      var o;
      o = t.call(this, i) || this, o.id = o.props.id || "downshift-" + ff(), o.menuId = o.props.menuId || o.id + "-menu", o.labelId = o.props.
      labelId || o.id + "-label", o.inputId = o.props.inputId || o.id + "-input", o.getItemId = o.props.getItemId || function(g) {
        return o.id + "-item-" + g;
      }, o.items = [], o.itemCount = null, o.previousResultCount = 0, o.timeoutIds = [], o.internalSetTimeout = function(g, v) {
        var S = setTimeout(function() {
          o.timeoutIds = o.timeoutIds.filter(function(C) {
            return C !== S;
          }), g();
        }, v);
        o.timeoutIds.push(S);
      }, o.setItemCount = function(g) {
        o.itemCount = g;
      }, o.unsetItemCount = function() {
        o.itemCount = null;
      }, o.isItemDisabled = function(g, v) {
        var S = o.getItemNodeFromIndex(v);
        return S && S.hasAttribute("disabled");
      }, o.setHighlightedIndex = function(g, v) {
        g === void 0 && (g = o.props.defaultHighlightedIndex), v === void 0 && (v = {}), v = io(v), o.internalSetState(U({
          highlightedIndex: g
        }, v));
      }, o.clearSelection = function(g) {
        o.internalSetState({
          selectedItem: null,
          inputValue: "",
          highlightedIndex: o.props.defaultHighlightedIndex,
          isOpen: o.props.defaultIsOpen
        }, g);
      }, o.selectItem = function(g, v, S) {
        v = io(v), o.internalSetState(U({
          isOpen: o.props.defaultIsOpen,
          highlightedIndex: o.props.defaultHighlightedIndex,
          selectedItem: g,
          inputValue: o.props.itemToString(g)
        }, v), S);
      }, o.selectItemAtIndex = function(g, v, S) {
        var C = o.items[g];
        C != null && o.selectItem(C, v, S);
      }, o.selectHighlightedItem = function(g, v) {
        return o.selectItemAtIndex(o.getState().highlightedIndex, g, v);
      }, o.internalSetState = function(g, v) {
        var S, C, E = {}, k = typeof g == "function";
        return !k && g.hasOwnProperty("inputValue") && o.props.onInputValueChange(g.inputValue, U({}, o.getStateAndHelpers(), g)), o.setState(
        function(O) {
          var w;
          O = o.getState(O);
          var T = k ? g(O) : g;
          T = o.props.stateReducer(O, T), S = T.hasOwnProperty("selectedItem");
          var P = {};
          return S && T.selectedItem !== O.selectedItem && (C = T.selectedItem), (w = T).type || (w.type = gf), Object.keys(T).forEach(function(M) {
            O[M] !== T[M] && (E[M] = T[M]), M !== "type" && (T[M], co(o.props, M) || (P[M] = T[M]));
          }), k && T.hasOwnProperty("inputValue") && o.props.onInputValueChange(T.inputValue, U({}, o.getStateAndHelpers(), T)), P;
        }, function() {
          of(v)();
          var O = Object.keys(E).length > 1;
          O && o.props.onStateChange(E, o.getStateAndHelpers()), S && o.props.onSelect(g.selectedItem, o.getStateAndHelpers()), C !== void 0 &&
          o.props.onChange(C, o.getStateAndHelpers()), o.props.onUserAction(E, o.getStateAndHelpers());
        });
      }, o.rootRef = function(g) {
        return o._rootNode = g;
      }, o.getRootProps = function(g, v) {
        var S, C = g === void 0 ? {} : g, E = C.refKey, k = E === void 0 ? "ref" : E, O = C.ref, w = ke(C, wI), T = v === void 0 ? {} : v, P = T.
        suppressRefError, M = P === void 0 ? !1 : P;
        o.getRootProps.called = !0, o.getRootProps.refKey = k, o.getRootProps.suppressRefError = M;
        var D = o.getState(), L = D.isOpen;
        return U((S = {}, S[k] = Je(O, o.rootRef), S.role = "combobox", S["aria-expanded"] = L, S["aria-haspopup"] = "listbox", S["aria-owns"] =
        L ? o.menuId : void 0, S["aria-labelledby"] = o.labelId, S), w);
      }, o.keyDownHandlers = {
        ArrowDown: /* @__PURE__ */ a(function(v) {
          var S = this;
          if (v.preventDefault(), this.getState().isOpen) {
            var C = v.shiftKey ? 5 : 1;
            this.moveHighlightedIndex(C, {
              type: so
            });
          } else
            this.internalSetState({
              isOpen: !0,
              type: so
            }, function() {
              var E = S.getItemCount();
              if (E > 0) {
                var k = S.getState(), O = k.highlightedIndex, w = et(O, 1, {
                  length: E
                }, S.isItemDisabled, !0);
                S.setHighlightedIndex(w, {
                  type: so
                });
              }
            });
        }, "ArrowDown"),
        ArrowUp: /* @__PURE__ */ a(function(v) {
          var S = this;
          if (v.preventDefault(), this.getState().isOpen) {
            var C = v.shiftKey ? -5 : -1;
            this.moveHighlightedIndex(C, {
              type: ao
            });
          } else
            this.internalSetState({
              isOpen: !0,
              type: ao
            }, function() {
              var E = S.getItemCount();
              if (E > 0) {
                var k = S.getState(), O = k.highlightedIndex, w = et(O, -1, {
                  length: E
                }, S.isItemDisabled, !0);
                S.setHighlightedIndex(w, {
                  type: ao
                });
              }
            });
        }, "ArrowUp"),
        Enter: /* @__PURE__ */ a(function(v) {
          if (v.which !== 229) {
            var S = this.getState(), C = S.isOpen, E = S.highlightedIndex;
            if (C && E != null) {
              v.preventDefault();
              var k = this.items[E], O = this.getItemNodeFromIndex(E);
              if (k == null || O && O.hasAttribute("disabled"))
                return;
              this.selectHighlightedItem({
                type: If
              });
            }
          }
        }, "Enter"),
        Escape: /* @__PURE__ */ a(function(v) {
          v.preventDefault(), this.reset(U({
            type: bf
          }, !this.state.isOpen && {
            selectedItem: null,
            inputValue: ""
          }));
        }, "Escape")
      }, o.buttonKeyDownHandlers = U({}, o.keyDownHandlers, {
        " ": /* @__PURE__ */ a(function(v) {
          v.preventDefault(), this.toggleMenu({
            type: _f
          });
        }, "_")
      }), o.inputKeyDownHandlers = U({}, o.keyDownHandlers, {
        Home: /* @__PURE__ */ a(function(v) {
          var S = this.getState(), C = S.isOpen;
          if (C) {
            v.preventDefault();
            var E = this.getItemCount();
            if (!(E <= 0 || !C)) {
              var k = St(0, !1, {
                length: E
              }, this.isItemDisabled);
              this.setHighlightedIndex(k, {
                type: Sf
              });
            }
          }
        }, "Home"),
        End: /* @__PURE__ */ a(function(v) {
          var S = this.getState(), C = S.isOpen;
          if (C) {
            v.preventDefault();
            var E = this.getItemCount();
            if (!(E <= 0 || !C)) {
              var k = St(E - 1, !0, {
                length: E
              }, this.isItemDisabled);
              this.setHighlightedIndex(k, {
                type: xf
              });
            }
          }
        }, "End")
      }), o.getToggleButtonProps = function(g) {
        var v = g === void 0 ? {} : g, S = v.onClick;
        v.onPress;
        var C = v.onKeyDown, E = v.onKeyUp, k = v.onBlur, O = ke(v, EI), w = o.getState(), T = w.isOpen, P = {
          onClick: ue(S, o.buttonHandleClick),
          onKeyDown: ue(C, o.buttonHandleKeyDown),
          onKeyUp: ue(E, o.buttonHandleKeyUp),
          onBlur: ue(k, o.buttonHandleBlur)
        }, M = O.disabled ? {} : P;
        return U({
          type: "button",
          role: "button",
          "aria-label": T ? "close menu" : "open menu",
          "aria-haspopup": !0,
          "data-toggle": !0
        }, M, O);
      }, o.buttonHandleKeyUp = function(g) {
        g.preventDefault();
      }, o.buttonHandleKeyDown = function(g) {
        var v = yr(g);
        o.buttonKeyDownHandlers[v] && o.buttonKeyDownHandlers[v].call(o, g);
      }, o.buttonHandleClick = function(g) {
        if (g.preventDefault(), o.props.environment) {
          var v = o.props.environment.document, S = v.body, C = v.activeElement;
          S && S === C && g.target.focus();
        }
        o.internalSetTimeout(function() {
          return o.toggleMenu({
            type: Tf
          });
        });
      }, o.buttonHandleBlur = function(g) {
        var v = g.target;
        o.internalSetTimeout(function() {
          if (!(o.isMouseDown || !o.props.environment)) {
            var S = o.props.environment.document.activeElement;
            (S == null || S.id !== o.inputId) && S !== v && o.reset({
              type: kf
            });
          }
        });
      }, o.getLabelProps = function(g) {
        return U({
          htmlFor: o.inputId,
          id: o.labelId
        }, g);
      }, o.getInputProps = function(g) {
        var v = g === void 0 ? {} : g, S = v.onKeyDown, C = v.onBlur, E = v.onChange, k = v.onInput;
        v.onChangeText;
        var O = ke(v, CI), w, T = {};
        w = "onChange";
        var P = o.getState(), M = P.inputValue, D = P.isOpen, L = P.highlightedIndex;
        if (!O.disabled) {
          var W;
          T = (W = {}, W[w] = ue(E, k, o.inputHandleChange), W.onKeyDown = ue(S, o.inputHandleKeyDown), W.onBlur = ue(C, o.inputHandleBlur),
          W);
        }
        return U({
          "aria-autocomplete": "list",
          "aria-activedescendant": D && typeof L == "number" && L >= 0 ? o.getItemId(L) : void 0,
          "aria-controls": D ? o.menuId : void 0,
          "aria-labelledby": O && O["aria-label"] ? void 0 : o.labelId,
          // https://developer.mozilla.org/en-US/docs/Web/Security/Securing_your_site/Turning_off_form_autocompletion
          // revert back since autocomplete="nope" is ignored on latest Chrome and Opera
          autoComplete: "off",
          value: M,
          id: o.inputId
        }, T, O);
      }, o.inputHandleKeyDown = function(g) {
        var v = yr(g);
        v && o.inputKeyDownHandlers[v] && o.inputKeyDownHandlers[v].call(o, g);
      }, o.inputHandleChange = function(g) {
        o.internalSetState({
          type: Cf,
          isOpen: !0,
          inputValue: g.target.value,
          highlightedIndex: o.props.defaultHighlightedIndex
        });
      }, o.inputHandleBlur = function() {
        o.internalSetTimeout(function() {
          var g;
          if (!(o.isMouseDown || !o.props.environment)) {
            var v = o.props.environment.document.activeElement, S = (v == null || (g = v.dataset) == null ? void 0 : g.toggle) && o._rootNode &&
            o._rootNode.contains(v);
            S || o.reset({
              type: Ef
            });
          }
        });
      }, o.menuRef = function(g) {
        o._menuNode = g;
      }, o.getMenuProps = function(g, v) {
        var S, C = g === void 0 ? {} : g, E = C.refKey, k = E === void 0 ? "ref" : E, O = C.ref, w = ke(C, _I), T = v === void 0 ? {} : v, P = T.
        suppressRefError, M = P === void 0 ? !1 : P;
        return o.getMenuProps.called = !0, o.getMenuProps.refKey = k, o.getMenuProps.suppressRefError = M, U((S = {}, S[k] = Je(O, o.menuRef),
        S.role = "listbox", S["aria-labelledby"] = w && w["aria-label"] ? void 0 : o.labelId, S.id = o.menuId, S), w);
      }, o.getItemProps = function(g) {
        var v, S = g === void 0 ? {} : g, C = S.onMouseMove, E = S.onMouseDown, k = S.onClick;
        S.onPress;
        var O = S.index, w = S.item, T = w === void 0 ? (
          /* istanbul ignore next */
          void 0
        ) : w, P = ke(S, TI);
        O === void 0 ? (o.items.push(T), O = o.items.indexOf(T)) : o.items[O] = T;
        var M = "onClick", D = k, L = (v = {
          // onMouseMove is used over onMouseEnter here. onMouseMove
          // is only triggered on actual mouse movement while onMouseEnter
          // can fire on DOM changes, interrupting keyboard navigation
          onMouseMove: ue(C, function() {
            O !== o.getState().highlightedIndex && (o.setHighlightedIndex(O, {
              type: vf
            }), o.avoidScrolling = !0, o.internalSetTimeout(function() {
              return o.avoidScrolling = !1;
            }, 250));
          }),
          onMouseDown: ue(E, function(Z) {
            Z.preventDefault();
          })
        }, v[M] = ue(D, function() {
          o.selectItemAtIndex(O, {
            type: wf
          });
        }), v), W = P.disabled ? {
          onMouseDown: L.onMouseDown
        } : L;
        return U({
          id: o.getItemId(O),
          role: "option",
          "aria-selected": o.getState().highlightedIndex === O
        }, W, P);
      }, o.clearItems = function() {
        o.items = [];
      }, o.reset = function(g, v) {
        g === void 0 && (g = {}), g = io(g), o.internalSetState(function(S) {
          var C = S.selectedItem;
          return U({
            isOpen: o.props.defaultIsOpen,
            highlightedIndex: o.props.defaultHighlightedIndex,
            inputValue: o.props.itemToString(C)
          }, g);
        }, v);
      }, o.toggleMenu = function(g, v) {
        g === void 0 && (g = {}), g = io(g), o.internalSetState(function(S) {
          var C = S.isOpen;
          return U({
            isOpen: !C
          }, C && {
            highlightedIndex: o.props.defaultHighlightedIndex
          }, g);
        }, function() {
          var S = o.getState(), C = S.isOpen, E = S.highlightedIndex;
          C && o.getItemCount() > 0 && typeof E == "number" && o.setHighlightedIndex(E, g), of(v)();
        });
      }, o.openMenu = function(g) {
        o.internalSetState({
          isOpen: !0
        }, g);
      }, o.closeMenu = function(g) {
        o.internalSetState({
          isOpen: !1
        }, g);
      }, o.updateStatus = yo(function() {
        var g;
        if ((g = o.props) != null && (g = g.environment) != null && g.document) {
          var v = o.getState(), S = o.items[v.highlightedIndex], C = o.getItemCount(), E = o.props.getA11yStatusMessage(U({
            itemToString: o.props.itemToString,
            previousResultCount: o.previousResultCount,
            resultCount: C,
            highlightedItem: S
          }, v));
          o.previousResultCount = C, hf(E, o.props.environment.document);
        }
      }, 200);
      var l = o.props, u = l.defaultHighlightedIndex, c = l.initialHighlightedIndex, p = c === void 0 ? u : c, d = l.defaultIsOpen, h = l.initialIsOpen,
      f = h === void 0 ? d : h, y = l.initialInputValue, m = y === void 0 ? "" : y, b = l.initialSelectedItem, x = b === void 0 ? null : b, _ = o.
      getState({
        highlightedIndex: p,
        isOpen: f,
        inputValue: m,
        selectedItem: x
      });
      return _.selectedItem != null && o.props.initialInputValue === void 0 && (_.inputValue = o.props.itemToString(_.selectedItem)), o.state =
      _, o;
    }
    a(r, "Downshift"), rr(r, t);
    var n = r.prototype;
    return n.internalClearTimeouts = /* @__PURE__ */ a(function() {
      this.timeoutIds.forEach(function(o) {
        clearTimeout(o);
      }), this.timeoutIds = [];
    }, "internalClearTimeouts"), n.getState = /* @__PURE__ */ a(function(o) {
      return o === void 0 && (o = this.state), Vr(o, this.props);
    }, "getState$1"), n.getItemCount = /* @__PURE__ */ a(function() {
      var o = this.items.length;
      return this.itemCount != null ? o = this.itemCount : this.props.itemCount !== void 0 && (o = this.props.itemCount), o;
    }, "getItemCount"), n.getItemNodeFromIndex = /* @__PURE__ */ a(function(o) {
      return this.props.environment ? this.props.environment.document.getElementById(this.getItemId(o)) : null;
    }, "getItemNodeFromIndex"), n.scrollHighlightedItemIntoView = /* @__PURE__ */ a(function() {
      {
        var o = this.getItemNodeFromIndex(this.getState().highlightedIndex);
        this.props.scrollIntoView(o, this._menuNode);
      }
    }, "scrollHighlightedItemIntoView"), n.moveHighlightedIndex = /* @__PURE__ */ a(function(o, l) {
      var u = this.getItemCount(), c = this.getState(), p = c.highlightedIndex;
      if (u > 0) {
        var d = et(p, o, {
          length: u
        }, this.isItemDisabled, !0);
        this.setHighlightedIndex(d, l);
      }
    }, "moveHighlightedIndex"), n.getStateAndHelpers = /* @__PURE__ */ a(function() {
      var o = this.getState(), l = o.highlightedIndex, u = o.inputValue, c = o.selectedItem, p = o.isOpen, d = this.props.itemToString, h = this.
      id, f = this.getRootProps, y = this.getToggleButtonProps, m = this.getLabelProps, b = this.getMenuProps, x = this.getInputProps, _ = this.
      getItemProps, g = this.openMenu, v = this.closeMenu, S = this.toggleMenu, C = this.selectItem, E = this.selectItemAtIndex, k = this.selectHighlightedItem,
      O = this.setHighlightedIndex, w = this.clearSelection, T = this.clearItems, P = this.reset, M = this.setItemCount, D = this.unsetItemCount,
      L = this.internalSetState;
      return {
        // prop getters
        getRootProps: f,
        getToggleButtonProps: y,
        getLabelProps: m,
        getMenuProps: b,
        getInputProps: x,
        getItemProps: _,
        // actions
        reset: P,
        openMenu: g,
        closeMenu: v,
        toggleMenu: S,
        selectItem: C,
        selectItemAtIndex: E,
        selectHighlightedItem: k,
        setHighlightedIndex: O,
        clearSelection: w,
        clearItems: T,
        setItemCount: M,
        unsetItemCount: D,
        setState: L,
        // props
        itemToString: d,
        // derived
        id: h,
        // state
        highlightedIndex: l,
        inputValue: u,
        isOpen: p,
        selectedItem: c
      };
    }, "getStateAndHelpers"), n.componentDidMount = /* @__PURE__ */ a(function() {
      var o = this;
      if (!this.props.environment)
        this.cleanup = function() {
          o.internalClearTimeouts();
        };
      else {
        var l = /* @__PURE__ */ a(function() {
          o.isMouseDown = !0;
        }, "onMouseDown"), u = /* @__PURE__ */ a(function(y) {
          o.isMouseDown = !1;
          var m = po(y.target, [o._rootNode, o._menuNode], o.props.environment);
          !m && o.getState().isOpen && o.reset({
            type: yf
          }, function() {
            return o.props.onOuterClick(o.getStateAndHelpers());
          });
        }, "onMouseUp"), c = /* @__PURE__ */ a(function() {
          o.isTouchMove = !1;
        }, "onTouchStart"), p = /* @__PURE__ */ a(function() {
          o.isTouchMove = !0;
        }, "onTouchMove"), d = /* @__PURE__ */ a(function(y) {
          var m = po(y.target, [o._rootNode, o._menuNode], o.props.environment, !1);
          !o.isTouchMove && !m && o.getState().isOpen && o.reset({
            type: Pf
          }, function() {
            return o.props.onOuterClick(o.getStateAndHelpers());
          });
        }, "onTouchEnd"), h = this.props.environment;
        h.addEventListener("mousedown", l), h.addEventListener("mouseup", u), h.addEventListener("touchstart", c), h.addEventListener("touch\
move", p), h.addEventListener("touchend", d), this.cleanup = function() {
          o.internalClearTimeouts(), o.updateStatus.cancel(), h.removeEventListener("mousedown", l), h.removeEventListener("mouseup", u), h.
          removeEventListener("touchstart", c), h.removeEventListener("touchmove", p), h.removeEventListener("touchend", d);
        };
      }
    }, "componentDidMount"), n.shouldScroll = /* @__PURE__ */ a(function(o, l) {
      var u = this.props.highlightedIndex === void 0 ? this.getState() : this.props, c = u.highlightedIndex, p = l.highlightedIndex === void 0 ?
      o : l, d = p.highlightedIndex, h = c && this.getState().isOpen && !o.isOpen, f = c !== d;
      return h || f;
    }, "shouldScroll"), n.componentDidUpdate = /* @__PURE__ */ a(function(o, l) {
      co(this.props, "selectedItem") && this.props.selectedItemChanged(o.selectedItem, this.props.selectedItem) && this.internalSetState({
        type: Of,
        inputValue: this.props.itemToString(this.props.selectedItem)
      }), !this.avoidScrolling && this.shouldScroll(l, o) && this.scrollHighlightedItemIntoView(), this.updateStatus();
    }, "componentDidUpdate"), n.componentWillUnmount = /* @__PURE__ */ a(function() {
      this.cleanup();
    }, "componentWillUnmount"), n.render = /* @__PURE__ */ a(function() {
      var o = sf(this.props.children, $e);
      this.clearItems(), this.getRootProps.called = !1, this.getRootProps.refKey = void 0, this.getRootProps.suppressRefError = void 0, this.
      getMenuProps.called = !1, this.getMenuProps.refKey = void 0, this.getMenuProps.suppressRefError = void 0, this.getLabelProps.called = !1,
      this.getInputProps.called = !1;
      var l = sf(o(this.getStateAndHelpers()));
      if (!l)
        return null;
      if (this.getRootProps.called || this.props.suppressRefError)
        return l;
      if (yI(l))
        return /* @__PURE__ */ ds(l, this.getRootProps(vI(l)));
    }, "render"), r;
  }(Re);
  return e.defaultProps = {
    defaultHighlightedIndex: null,
    defaultIsOpen: !1,
    getA11yStatusMessage: gI,
    itemToString: /* @__PURE__ */ a(function(r) {
      return r == null ? "" : String(r);
    }, "itemToString"),
    onStateChange: $e,
    onInputValueChange: $e,
    onUserAction: $e,
    onChange: $e,
    onSelect: $e,
    onOuterClick: $e,
    selectedItemChanged: /* @__PURE__ */ a(function(r, n) {
      return r !== n;
    }, "selectedItemChanged"),
    environment: (
      /* istanbul ignore next (ssr) */
      typeof window > "u" ? void 0 : window
    ),
    stateReducer: /* @__PURE__ */ a(function(r, n) {
      return n;
    }, "stateReducer"),
    suppressRefError: !1,
    scrollIntoView: df
  }, e.stateChangeTypes = xI, e;
}(), Vt = kI;
var Af = {
  highlightedIndex: -1,
  isOpen: !1,
  selectedItem: null,
  inputValue: ""
};
function OI(e, t, r) {
  var n = e.props, i = e.type, o = {};
  Object.keys(t).forEach(function(l) {
    PI(l, e, t, r), r[l] !== t[l] && (o[l] = r[l]);
  }), n.onStateChange && Object.keys(o).length && n.onStateChange(U({
    type: i
  }, o));
}
a(OI, "callOnChangeProps");
function PI(e, t, r, n) {
  var i = t.props, o = t.type, l = "on" + Zi(e) + "Change";
  i[l] && n[e] !== void 0 && n[e] !== r[e] && i[l](U({
    type: o
  }, n));
}
a(PI, "invokeOnChangeHandler");
function AI(e, t) {
  return t.changes;
}
a(AI, "stateReducer");
var lf = yo(function(e, t) {
  hf(e, t);
}, 200), MI = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u" ? qt : K, Mf = "useId" in s ?
/* @__PURE__ */ a(function(t) {
  var r = t.id, n = t.labelId, i = t.menuId, o = t.getItemId, l = t.toggleButtonId, u = t.inputId, c = "downshift-" + s.useId();
  r || (r = c);
  var p = X({
    labelId: n || r + "-label",
    menuId: i || r + "-menu",
    getItemId: o || function(d) {
      return r + "-item-" + d;
    },
    toggleButtonId: l || r + "-toggle-button",
    inputId: u || r + "-input"
  });
  return p.current;
}, "useElementIds") : /* @__PURE__ */ a(function(t) {
  var r = t.id, n = r === void 0 ? "downshift-" + ff() : r, i = t.labelId, o = t.menuId, l = t.getItemId, u = t.toggleButtonId, c = t.inputId,
  p = X({
    labelId: i || n + "-label",
    menuId: o || n + "-menu",
    getItemId: l || function(d) {
      return n + "-item-" + d;
    },
    toggleButtonId: u || n + "-toggle-button",
    inputId: c || n + "-input"
  });
  return p.current;
}, "useElementIds");
function Xi(e, t, r, n) {
  var i, o;
  if (e === void 0) {
    if (t === void 0)
      throw new Error(n);
    i = r[t], o = t;
  } else
    o = t === void 0 ? r.indexOf(e) : t, i = e;
  return [i, o];
}
a(Xi, "getItemAndIndex");
function DI(e) {
  return /^\S{1}$/.test(e);
}
a(DI, "isAcceptedCharacterKey");
function Zi(e) {
  return "" + e.slice(0, 1).toUpperCase() + e.slice(1);
}
a(Zi, "capitalizeString");
function vo(e) {
  var t = X(e);
  return t.current = e, t;
}
a(vo, "useLatestRef");
function Df(e, t, r, n) {
  var i = X(), o = X(), l = A(function(y, m) {
    o.current = m, y = Vr(y, m.props);
    var b = e(y, m), x = m.props.stateReducer(y, U({}, m, {
      changes: b
    }));
    return x;
  }, [e]), u = Gt(l, t, r), c = u[0], p = u[1], d = vo(t), h = A(function(y) {
    return p(U({
      props: d.current
    }, y));
  }, [d]), f = o.current;
  return K(function() {
    var y = Vr(i.current, f?.props), m = f && i.current && !n(y, c);
    m && OI(f, y, c), i.current = c;
  }, [c, f, n]), [c, h];
}
a(Df, "useEnhancedReducer");
function Lf(e, t, r, n) {
  var i = Df(e, t, r, n), o = i[0], l = i[1];
  return [Vr(o, t), l];
}
a(Lf, "useControlledReducer$1");
var Wr = {
  itemToString: /* @__PURE__ */ a(function(t) {
    return t ? String(t) : "";
  }, "itemToString"),
  itemToKey: /* @__PURE__ */ a(function(t) {
    return t;
  }, "itemToKey"),
  stateReducer: AI,
  scrollIntoView: df,
  environment: (
    /* istanbul ignore next (ssr) */
    typeof window > "u" ? void 0 : window
  )
};
function We(e, t, r) {
  r === void 0 && (r = Af);
  var n = e["default" + Zi(t)];
  return n !== void 0 ? n : r[t];
}
a(We, "getDefaultValue$1");
function $t(e, t, r) {
  r === void 0 && (r = Af);
  var n = e[t];
  if (n !== void 0)
    return n;
  var i = e["initial" + Zi(t)];
  return i !== void 0 ? i : We(e, t, r);
}
a($t, "getInitialValue$1");
function Nf(e) {
  var t = $t(e, "selectedItem"), r = $t(e, "isOpen"), n = $t(e, "highlightedIndex"), i = $t(e, "inputValue");
  return {
    highlightedIndex: n < 0 && t && r ? e.items.findIndex(function(o) {
      return e.itemToKey(o) === e.itemToKey(t);
    }) : n,
    isOpen: r,
    selectedItem: t,
    inputValue: i
  };
}
a(Nf, "getInitialState$2");
function Wt(e, t, r) {
  var n = e.items, i = e.initialHighlightedIndex, o = e.defaultHighlightedIndex, l = e.isItemDisabled, u = e.itemToKey, c = t.selectedItem, p = t.
  highlightedIndex;
  return n.length === 0 ? -1 : i !== void 0 && p === i && !l(n[i]) ? i : o !== void 0 && !l(n[o]) ? o : c ? n.findIndex(function(d) {
    return u(c) === u(d);
  }) : r < 0 && !l(n[n.length - 1]) ? n.length - 1 : r > 0 && !l(n[0]) ? 0 : -1;
}
a(Wt, "getHighlightedIndexOnOpen");
function Ff(e, t, r) {
  var n = X({
    isMouseDown: !1,
    isTouchMove: !1,
    isTouchEnd: !1
  });
  return K(function() {
    if (!e)
      return $e;
    var i = t.map(function(d) {
      return d.current;
    });
    function o() {
      n.current.isTouchEnd = !1, n.current.isMouseDown = !0;
    }
    a(o, "onMouseDown");
    function l(d) {
      n.current.isMouseDown = !1, po(d.target, i, e) || r();
    }
    a(l, "onMouseUp");
    function u() {
      n.current.isTouchEnd = !1, n.current.isTouchMove = !1;
    }
    a(u, "onTouchStart");
    function c() {
      n.current.isTouchMove = !0;
    }
    a(c, "onTouchMove");
    function p(d) {
      n.current.isTouchEnd = !0, !n.current.isTouchMove && !po(d.target, i, e, !1) && r();
    }
    return a(p, "onTouchEnd"), e.addEventListener("mousedown", o), e.addEventListener("mouseup", l), e.addEventListener("touchstart", u), e.
    addEventListener("touchmove", c), e.addEventListener("touchend", p), /* @__PURE__ */ a(function() {
      e.removeEventListener("mousedown", o), e.removeEventListener("mouseup", l), e.removeEventListener("touchstart", u), e.removeEventListener(
      "touchmove", c), e.removeEventListener("touchend", p);
    }, "cleanup");
  }, [e, r]), n.current;
}
a(Ff, "useMouseAndTouchTracker");
var Ji = /* @__PURE__ */ a(function() {
  return $e;
}, "useGetterPropsCalledChecker");
function ea(e, t, r, n) {
  n === void 0 && (n = {});
  var i = n.document, o = bo();
  K(function() {
    if (!(!e || o || !i)) {
      var l = e(t);
      lf(l, i);
    }
  }, r), K(function() {
    return function() {
      lf.cancel(), SI(i);
    };
  }, [i]);
}
a(ea, "useA11yMessageStatus");
function Bf(e) {
  var t = e.highlightedIndex, r = e.isOpen, n = e.itemRefs, i = e.getItemNodeFromIndex, o = e.menuElement, l = e.scrollIntoView, u = X(!0);
  return MI(function() {
    t < 0 || !r || !Object.keys(n.current).length || (u.current === !1 ? u.current = !0 : l(i(t), o));
  }, [t]), u;
}
a(Bf, "useScrollIntoView");
var ta = $e;
function fo(e, t, r) {
  var n;
  r === void 0 && (r = !0);
  var i = ((n = e.items) == null ? void 0 : n.length) && t >= 0;
  return U({
    isOpen: !1,
    highlightedIndex: -1
  }, i && U({
    selectedItem: e.items[t],
    isOpen: We(e, "isOpen"),
    highlightedIndex: We(e, "highlightedIndex")
  }, r && {
    inputValue: e.itemToString(e.items[t])
  }));
}
a(fo, "getChangesOnSelection");
function Hf(e, t) {
  return e.isOpen === t.isOpen && e.inputValue === t.inputValue && e.highlightedIndex === t.highlightedIndex && e.selectedItem === t.selectedItem;
}
a(Hf, "isDropdownsStateEqual");
function bo() {
  var e = s.useRef(!0);
  return s.useEffect(function() {
    return e.current = !1, function() {
      e.current = !0;
    };
  }, []), e.current;
}
a(bo, "useIsInitialMount");
var lo = {
  environment: q.default.shape({
    addEventListener: q.default.func.isRequired,
    removeEventListener: q.default.func.isRequired,
    document: q.default.shape({
      createElement: q.default.func.isRequired,
      getElementById: q.default.func.isRequired,
      activeElement: q.default.any.isRequired,
      body: q.default.any.isRequired
    }).isRequired,
    Node: q.default.func.isRequired
  }),
  itemToString: q.default.func,
  itemToKey: q.default.func,
  stateReducer: q.default.func
}, Rf = U({}, lo, {
  getA11yStatusMessage: q.default.func,
  highlightedIndex: q.default.number,
  defaultHighlightedIndex: q.default.number,
  initialHighlightedIndex: q.default.number,
  isOpen: q.default.bool,
  defaultIsOpen: q.default.bool,
  initialIsOpen: q.default.bool,
  selectedItem: q.default.any,
  initialSelectedItem: q.default.any,
  defaultSelectedItem: q.default.any,
  id: q.default.string,
  labelId: q.default.string,
  menuId: q.default.string,
  getItemId: q.default.func,
  toggleButtonId: q.default.string,
  onSelectedItemChange: q.default.func,
  onHighlightedIndexChange: q.default.func,
  onStateChange: q.default.func,
  onIsOpenChange: q.default.func,
  scrollIntoView: q.default.func
});
function zf(e, t, r) {
  var n = t.type, i = t.props, o;
  switch (n) {
    case r.ItemMouseMove:
      o = {
        highlightedIndex: t.disabled ? -1 : t.index
      };
      break;
    case r.MenuMouseLeave:
      o = {
        highlightedIndex: -1
      };
      break;
    case r.ToggleButtonClick:
    case r.FunctionToggleMenu:
      o = {
        isOpen: !e.isOpen,
        highlightedIndex: e.isOpen ? -1 : Wt(i, e, 0)
      };
      break;
    case r.FunctionOpenMenu:
      o = {
        isOpen: !0,
        highlightedIndex: Wt(i, e, 0)
      };
      break;
    case r.FunctionCloseMenu:
      o = {
        isOpen: !1
      };
      break;
    case r.FunctionSetHighlightedIndex:
      o = {
        highlightedIndex: t.highlightedIndex
      };
      break;
    case r.FunctionSetInputValue:
      o = {
        inputValue: t.inputValue
      };
      break;
    case r.FunctionReset:
      o = {
        highlightedIndex: We(i, "highlightedIndex"),
        isOpen: We(i, "isOpen"),
        selectedItem: We(i, "selectedItem"),
        inputValue: We(i, "inputValue")
      };
      break;
    default:
      throw new Error("Reducer called without proper action type.");
  }
  return U({}, e, o);
}
a(zf, "downshiftCommonReducer");
function LI(e) {
  for (var t = e.keysSoFar, r = e.highlightedIndex, n = e.items, i = e.itemToString, o = e.isItemDisabled, l = t.toLowerCase(), u = 0; u < n.
  length; u++) {
    var c = (u + r + (t.length < 2 ? 1 : 0)) % n.length, p = n[c];
    if (p !== void 0 && i(p).toLowerCase().startsWith(l) && !o(p, c))
      return c;
  }
  return r;
}
a(LI, "getItemIndexByCharacterKey");
var l2 = zt(zt({}, Rf), { items: q.default.array.isRequired, isItemDisabled: q.default.func }), NI = zt(zt({}, Wr), { isItemDisabled: /* @__PURE__ */ a(
function() {
  return !1;
}, "isItemDisabled") }), FI = $e, uo = 0, ra = 1, na = 2, mo = 3, oa = 4, ia = 5, aa = 6, sa = 7, la = 8, ua = 9, ca = 10, ho = 11, $f = 12,
Wf = 13, pa = 14, Vf = 15, Kf = 16, jf = 17, Uf = 18, da = 19, Qi = 20, qf = 21, Gf = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  ToggleButtonClick: uo,
  ToggleButtonKeyDownArrowDown: ra,
  ToggleButtonKeyDownArrowUp: na,
  ToggleButtonKeyDownCharacter: mo,
  ToggleButtonKeyDownEscape: oa,
  ToggleButtonKeyDownHome: ia,
  ToggleButtonKeyDownEnd: aa,
  ToggleButtonKeyDownEnter: sa,
  ToggleButtonKeyDownSpaceButton: la,
  ToggleButtonKeyDownPageUp: ua,
  ToggleButtonKeyDownPageDown: ca,
  ToggleButtonBlur: ho,
  MenuMouseLeave: $f,
  ItemMouseMove: Wf,
  ItemClick: pa,
  FunctionToggleMenu: Vf,
  FunctionOpenMenu: Kf,
  FunctionCloseMenu: jf,
  FunctionSetHighlightedIndex: Uf,
  FunctionSelectItem: da,
  FunctionSetInputValue: Qi,
  FunctionReset: qf
});
function BI(e, t) {
  var r, n = t.type, i = t.props, o = t.altKey, l;
  switch (n) {
    case pa:
      l = {
        isOpen: We(i, "isOpen"),
        highlightedIndex: We(i, "highlightedIndex"),
        selectedItem: i.items[t.index]
      };
      break;
    case mo:
      {
        var u = t.key, c = "" + e.inputValue + u, p = !e.isOpen && e.selectedItem ? i.items.findIndex(function(y) {
          return i.itemToKey(y) === i.itemToKey(e.selectedItem);
        }) : e.highlightedIndex, d = LI({
          keysSoFar: c,
          highlightedIndex: p,
          items: i.items,
          itemToString: i.itemToString,
          isItemDisabled: i.isItemDisabled
        });
        l = {
          inputValue: c,
          highlightedIndex: d,
          isOpen: !0
        };
      }
      break;
    case ra:
      {
        var h = e.isOpen ? et(e.highlightedIndex, 1, i.items, i.isItemDisabled) : o && e.selectedItem == null ? -1 : Wt(i, e, 1);
        l = {
          highlightedIndex: h,
          isOpen: !0
        };
      }
      break;
    case na:
      if (e.isOpen && o)
        l = fo(i, e.highlightedIndex, !1);
      else {
        var f = e.isOpen ? et(e.highlightedIndex, -1, i.items, i.isItemDisabled) : Wt(i, e, -1);
        l = {
          highlightedIndex: f,
          isOpen: !0
        };
      }
      break;
    case sa:
    case la:
      l = fo(i, e.highlightedIndex, !1);
      break;
    case ia:
      l = {
        highlightedIndex: St(0, !1, i.items, i.isItemDisabled),
        isOpen: !0
      };
      break;
    case aa:
      l = {
        highlightedIndex: St(i.items.length - 1, !0, i.items, i.isItemDisabled),
        isOpen: !0
      };
      break;
    case ua:
      l = {
        highlightedIndex: et(e.highlightedIndex, -10, i.items, i.isItemDisabled)
      };
      break;
    case ca:
      l = {
        highlightedIndex: et(e.highlightedIndex, 10, i.items, i.isItemDisabled)
      };
      break;
    case oa:
      l = {
        isOpen: !1,
        highlightedIndex: -1
      };
      break;
    case ho:
      l = U({
        isOpen: !1,
        highlightedIndex: -1
      }, e.highlightedIndex >= 0 && ((r = i.items) == null ? void 0 : r.length) && {
        selectedItem: i.items[e.highlightedIndex]
      });
      break;
    case da:
      l = {
        selectedItem: t.selectedItem
      };
      break;
    default:
      return zf(e, t, Gf);
  }
  return U({}, e, l);
}
a(BI, "downshiftSelectReducer");
var HI = ["onClick"], RI = ["onMouseLeave", "refKey", "ref"], zI = ["onBlur", "onClick", "onPress", "onKeyDown", "refKey", "ref"], $I = ["it\
em", "index", "onMouseMove", "onClick", "onMouseDown", "onPress", "refKey", "disabled", "ref"];
Yf.stateChangeTypes = Gf;
function Yf(e) {
  e === void 0 && (e = {}), FI(e, Yf);
  var t = U({}, NI, e), r = t.scrollIntoView, n = t.environment, i = t.getA11yStatusMessage, o = Lf(BI, t, Nf, Hf), l = o[0], u = o[1], c = l.
  isOpen, p = l.highlightedIndex, d = l.selectedItem, h = l.inputValue, f = X(null), y = X(null), m = X({}), b = X(null), x = Mf(t), _ = vo(
  {
    state: l,
    props: t
  }), g = A(function(R) {
    return m.current[x.getItemId(R)];
  }, [x]);
  ea(i, l, [c, p, d, h], n);
  var v = Bf({
    menuElement: y.current,
    highlightedIndex: p,
    isOpen: c,
    itemRefs: m,
    scrollIntoView: r,
    getItemNodeFromIndex: g
  });
  K(function() {
    return b.current = yo(function(R) {
      R({
        type: Qi,
        inputValue: ""
      });
    }, 500), function() {
      b.current.cancel();
    };
  }, []), K(function() {
    h && b.current(u);
  }, [u, h]), ta({
    props: t,
    state: l
  }), K(function() {
    var R = $t(t, "isOpen");
    R && f.current && f.current.focus();
  }, []);
  var S = Ff(n, [f, y], A(/* @__PURE__ */ a(function() {
    _.current.state.isOpen && u({
      type: ho
    });
  }, "handleBlur"), [u, _])), C = Ji("getMenuProps", "getToggleButtonProps");
  K(function() {
    c || (m.current = {});
  }, [c]);
  var E = j(function() {
    return {
      ArrowDown: /* @__PURE__ */ a(function(z) {
        z.preventDefault(), u({
          type: ra,
          altKey: z.altKey
        });
      }, "ArrowDown"),
      ArrowUp: /* @__PURE__ */ a(function(z) {
        z.preventDefault(), u({
          type: na,
          altKey: z.altKey
        });
      }, "ArrowUp"),
      Home: /* @__PURE__ */ a(function(z) {
        z.preventDefault(), u({
          type: ia
        });
      }, "Home"),
      End: /* @__PURE__ */ a(function(z) {
        z.preventDefault(), u({
          type: aa
        });
      }, "End"),
      Escape: /* @__PURE__ */ a(function() {
        _.current.state.isOpen && u({
          type: oa
        });
      }, "Escape"),
      Enter: /* @__PURE__ */ a(function(z) {
        z.preventDefault(), u({
          type: _.current.state.isOpen ? sa : uo
        });
      }, "Enter"),
      PageUp: /* @__PURE__ */ a(function(z) {
        _.current.state.isOpen && (z.preventDefault(), u({
          type: ua
        }));
      }, "PageUp"),
      PageDown: /* @__PURE__ */ a(function(z) {
        _.current.state.isOpen && (z.preventDefault(), u({
          type: ca
        }));
      }, "PageDown"),
      " ": /* @__PURE__ */ a(function(z) {
        z.preventDefault();
        var B = _.current.state;
        if (!B.isOpen) {
          u({
            type: uo
          });
          return;
        }
        B.inputValue ? u({
          type: mo,
          key: " "
        }) : u({
          type: la
        });
      }, "_")
    };
  }, [u, _]), k = A(function() {
    u({
      type: Vf
    });
  }, [u]), O = A(function() {
    u({
      type: jf
    });
  }, [u]), w = A(function() {
    u({
      type: Kf
    });
  }, [u]), T = A(function(R) {
    u({
      type: Uf,
      highlightedIndex: R
    });
  }, [u]), P = A(function(R) {
    u({
      type: da,
      selectedItem: R
    });
  }, [u]), M = A(function() {
    u({
      type: qf
    });
  }, [u]), D = A(function(R) {
    u({
      type: Qi,
      inputValue: R
    });
  }, [u]), L = A(function(R) {
    var z = R === void 0 ? {} : R, B = z.onClick, re = ke(z, HI), H = /* @__PURE__ */ a(function() {
      var F;
      (F = f.current) == null || F.focus();
    }, "labelHandleClick");
    return U({
      id: x.labelId,
      htmlFor: x.toggleButtonId,
      onClick: ue(B, H)
    }, re);
  }, [x]), W = A(function(R, z) {
    var B, re = R === void 0 ? {} : R, H = re.onMouseLeave, N = re.refKey, F = N === void 0 ? "ref" : N, $ = re.ref, Q = ke(re, RI), ne = z ===
    void 0 ? {} : z, ee = ne.suppressRefError, le = ee === void 0 ? !1 : ee, se = /* @__PURE__ */ a(function() {
      u({
        type: $f
      });
    }, "menuHandleMouseLeave");
    return C("getMenuProps", le, F, y), U((B = {}, B[F] = Je($, function(pe) {
      y.current = pe;
    }), B.id = x.menuId, B.role = "listbox", B["aria-labelledby"] = Q && Q["aria-label"] ? void 0 : "" + x.labelId, B.onMouseLeave = ue(H, se),
    B), Q);
  }, [u, C, x]), Z = A(function(R, z) {
    var B, re = R === void 0 ? {} : R, H = re.onBlur, N = re.onClick;
    re.onPress;
    var F = re.onKeyDown, $ = re.refKey, Q = $ === void 0 ? "ref" : $, ne = re.ref, ee = ke(re, zI), le = z === void 0 ? {} : z, se = le.suppressRefError,
    pe = se === void 0 ? !1 : se, ce = _.current.state, Se = /* @__PURE__ */ a(function() {
      u({
        type: uo
      });
    }, "toggleButtonHandleClick"), ge = /* @__PURE__ */ a(function() {
      ce.isOpen && !S.isMouseDown && u({
        type: ho
      });
    }, "toggleButtonHandleBlur"), Pe = /* @__PURE__ */ a(function(_e) {
      var Fe = yr(_e);
      Fe && E[Fe] ? E[Fe](_e) : DI(Fe) && u({
        type: mo,
        key: Fe
      });
    }, "toggleButtonHandleKeyDown"), me = U((B = {}, B[Q] = Je(ne, function(xe) {
      f.current = xe;
    }), B["aria-activedescendant"] = ce.isOpen && ce.highlightedIndex > -1 ? x.getItemId(ce.highlightedIndex) : "", B["aria-controls"] = x.menuId,
    B["aria-expanded"] = _.current.state.isOpen, B["aria-haspopup"] = "listbox", B["aria-labelledby"] = ee && ee["aria-label"] ? void 0 : "" +
    x.labelId, B.id = x.toggleButtonId, B.role = "combobox", B.tabIndex = 0, B.onBlur = ue(H, ge), B), ee);
    return ee.disabled || (me.onClick = ue(N, Se), me.onKeyDown = ue(F, Pe)), C("getToggleButtonProps", pe, Q, f), me;
  }, [u, x, _, S, C, E]), G = A(function(R) {
    var z, B = R === void 0 ? {} : R, re = B.item, H = B.index, N = B.onMouseMove, F = B.onClick, $ = B.onMouseDown;
    B.onPress;
    var Q = B.refKey, ne = Q === void 0 ? "ref" : Q, ee = B.disabled, le = B.ref, se = ke(B, $I);
    ee !== void 0 && console.warn('Passing "disabled" as an argument to getItemProps is not supported anymore. Please use the isItemDisabled\
 prop from useSelect.');
    var pe = _.current, ce = pe.state, Se = pe.props, ge = Xi(re, H, Se.items, "Pass either item or index to getItemProps!"), Pe = ge[0], me = ge[1],
    xe = Se.isItemDisabled(Pe, me), _e = /* @__PURE__ */ a(function() {
      S.isTouchEnd || me === ce.highlightedIndex || (v.current = !1, u({
        type: Wf,
        index: me,
        disabled: xe
      }));
    }, "itemHandleMouseMove"), Fe = /* @__PURE__ */ a(function() {
      u({
        type: pa,
        index: me
      });
    }, "itemHandleClick"), tt = /* @__PURE__ */ a(function(vr) {
      return vr.preventDefault();
    }, "itemHandleMouseDown"), Me = U((z = {}, z[ne] = Je(le, function(Ge) {
      Ge && (m.current[x.getItemId(me)] = Ge);
    }), z["aria-disabled"] = xe, z["aria-selected"] = "" + (Pe === ce.selectedItem), z.id = x.getItemId(me), z.role = "option", z), se);
    return xe || (Me.onClick = ue(F, Fe)), Me.onMouseMove = ue(N, _e), Me.onMouseDown = ue($, tt), Me;
  }, [_, x, S, v, u]);
  return {
    // prop getters.
    getToggleButtonProps: Z,
    getLabelProps: L,
    getMenuProps: W,
    getItemProps: G,
    // actions.
    toggleMenu: k,
    openMenu: w,
    closeMenu: O,
    setHighlightedIndex: T,
    selectItem: P,
    reset: M,
    setInputValue: D,
    // state.
    highlightedIndex: p,
    isOpen: c,
    selectedItem: d,
    inputValue: h
  };
}
a(Yf, "useSelect");
var fa = 0, ma = 1, ha = 2, ga = 3, ya = 4, va = 5, ba = 6, Ia = 7, Sa = 8, go = 9, xa = 10, Qf = 11, Xf = 12, wa = 13, Zf = 14, Jf = 15, em = 16,
tm = 17, rm = 18, Ea = 19, nm = 20, om = 21, Ca = 22, im = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  InputKeyDownArrowDown: fa,
  InputKeyDownArrowUp: ma,
  InputKeyDownEscape: ha,
  InputKeyDownHome: ga,
  InputKeyDownEnd: ya,
  InputKeyDownPageUp: va,
  InputKeyDownPageDown: ba,
  InputKeyDownEnter: Ia,
  InputChange: Sa,
  InputBlur: go,
  InputClick: xa,
  MenuMouseLeave: Qf,
  ItemMouseMove: Xf,
  ItemClick: wa,
  ToggleButtonClick: Zf,
  FunctionToggleMenu: Jf,
  FunctionOpenMenu: em,
  FunctionCloseMenu: tm,
  FunctionSetHighlightedIndex: rm,
  FunctionSelectItem: Ea,
  FunctionSetInputValue: nm,
  FunctionReset: om,
  ControlledPropUpdatedSelectedItem: Ca
});
function WI(e) {
  var t = Nf(e), r = t.selectedItem, n = t.inputValue;
  return n === "" && r && e.defaultInputValue === void 0 && e.initialInputValue === void 0 && e.inputValue === void 0 && (n = e.itemToString(
  r)), U({}, t, {
    inputValue: n
  });
}
a(WI, "getInitialState$1");
var u2 = U({}, Rf, {
  items: q.default.array.isRequired,
  isItemDisabled: q.default.func,
  inputValue: q.default.string,
  defaultInputValue: q.default.string,
  initialInputValue: q.default.string,
  inputId: q.default.string,
  onInputValueChange: q.default.func
});
function VI(e, t, r, n) {
  var i = X(), o = Df(e, t, r, n), l = o[0], u = o[1], c = bo();
  return K(function() {
    if (co(t, "selectedItem")) {
      if (!c) {
        var p = t.itemToKey(t.selectedItem) !== t.itemToKey(i.current);
        p && u({
          type: Ca,
          inputValue: t.itemToString(t.selectedItem)
        });
      }
      i.current = l.selectedItem === i.current ? t.selectedItem : l.selectedItem;
    }
  }, [l.selectedItem, t.selectedItem]), [Vr(l, t), u];
}
a(VI, "useControlledReducer");
var KI = $e, jI = U({}, Wr, {
  isItemDisabled: /* @__PURE__ */ a(function() {
    return !1;
  }, "isItemDisabled")
});
function UI(e, t) {
  var r, n = t.type, i = t.props, o = t.altKey, l;
  switch (n) {
    case wa:
      l = {
        isOpen: We(i, "isOpen"),
        highlightedIndex: We(i, "highlightedIndex"),
        selectedItem: i.items[t.index],
        inputValue: i.itemToString(i.items[t.index])
      };
      break;
    case fa:
      e.isOpen ? l = {
        highlightedIndex: et(e.highlightedIndex, 1, i.items, i.isItemDisabled, !0)
      } : l = {
        highlightedIndex: o && e.selectedItem == null ? -1 : Wt(i, e, 1),
        isOpen: i.items.length >= 0
      };
      break;
    case ma:
      e.isOpen ? o ? l = fo(i, e.highlightedIndex) : l = {
        highlightedIndex: et(e.highlightedIndex, -1, i.items, i.isItemDisabled, !0)
      } : l = {
        highlightedIndex: Wt(i, e, -1),
        isOpen: i.items.length >= 0
      };
      break;
    case Ia:
      l = fo(i, e.highlightedIndex);
      break;
    case ha:
      l = U({
        isOpen: !1,
        highlightedIndex: -1
      }, !e.isOpen && {
        selectedItem: null,
        inputValue: ""
      });
      break;
    case va:
      l = {
        highlightedIndex: et(e.highlightedIndex, -10, i.items, i.isItemDisabled, !0)
      };
      break;
    case ba:
      l = {
        highlightedIndex: et(e.highlightedIndex, 10, i.items, i.isItemDisabled, !0)
      };
      break;
    case ga:
      l = {
        highlightedIndex: St(0, !1, i.items, i.isItemDisabled)
      };
      break;
    case ya:
      l = {
        highlightedIndex: St(i.items.length - 1, !0, i.items, i.isItemDisabled)
      };
      break;
    case go:
      l = U({
        isOpen: !1,
        highlightedIndex: -1
      }, e.highlightedIndex >= 0 && ((r = i.items) == null ? void 0 : r.length) && t.selectItem && {
        selectedItem: i.items[e.highlightedIndex],
        inputValue: i.itemToString(i.items[e.highlightedIndex])
      });
      break;
    case Sa:
      l = {
        isOpen: !0,
        highlightedIndex: We(i, "highlightedIndex"),
        inputValue: t.inputValue
      };
      break;
    case xa:
      l = {
        isOpen: !e.isOpen,
        highlightedIndex: e.isOpen ? -1 : Wt(i, e, 0)
      };
      break;
    case Ea:
      l = {
        selectedItem: t.selectedItem,
        inputValue: i.itemToString(t.selectedItem)
      };
      break;
    case Ca:
      l = {
        inputValue: t.inputValue
      };
      break;
    default:
      return zf(e, t, im);
  }
  return U({}, e, l);
}
a(UI, "downshiftUseComboboxReducer");
var qI = ["onMouseLeave", "refKey", "ref"], GI = ["item", "index", "refKey", "ref", "onMouseMove", "onMouseDown", "onClick", "onPress", "dis\
abled"], YI = ["onClick", "onPress", "refKey", "ref"], QI = ["onKeyDown", "onChange", "onInput", "onBlur", "onChangeText", "onClick", "refKe\
y", "ref"];
am.stateChangeTypes = im;
function am(e) {
  e === void 0 && (e = {}), KI(e, am);
  var t = U({}, jI, e), r = t.items, n = t.scrollIntoView, i = t.environment, o = t.getA11yStatusMessage, l = VI(UI, t, WI, Hf), u = l[0], c = l[1],
  p = u.isOpen, d = u.highlightedIndex, h = u.selectedItem, f = u.inputValue, y = X(null), m = X({}), b = X(null), x = X(null), _ = bo(), g = Mf(
  t), v = X(), S = vo({
    state: u,
    props: t
  }), C = A(function(H) {
    return m.current[g.getItemId(H)];
  }, [g]);
  ea(o, u, [p, d, h, f], i);
  var E = Bf({
    menuElement: y.current,
    highlightedIndex: d,
    isOpen: p,
    itemRefs: m,
    scrollIntoView: n,
    getItemNodeFromIndex: C
  });
  ta({
    props: t,
    state: u
  }), K(function() {
    var H = $t(t, "isOpen");
    H && b.current && b.current.focus();
  }, []), K(function() {
    _ || (v.current = r.length);
  });
  var k = Ff(i, [x, y, b], A(/* @__PURE__ */ a(function() {
    S.current.state.isOpen && c({
      type: go,
      selectItem: !1
    });
  }, "handleBlur"), [c, S])), O = Ji("getInputProps", "getMenuProps");
  K(function() {
    p || (m.current = {});
  }, [p]), K(function() {
    var H;
    !p || !(i != null && i.document) || !(b != null && (H = b.current) != null && H.focus) || i.document.activeElement !== b.current && b.current.
    focus();
  }, [p, i]);
  var w = j(function() {
    return {
      ArrowDown: /* @__PURE__ */ a(function(N) {
        N.preventDefault(), c({
          type: fa,
          altKey: N.altKey
        });
      }, "ArrowDown"),
      ArrowUp: /* @__PURE__ */ a(function(N) {
        N.preventDefault(), c({
          type: ma,
          altKey: N.altKey
        });
      }, "ArrowUp"),
      Home: /* @__PURE__ */ a(function(N) {
        S.current.state.isOpen && (N.preventDefault(), c({
          type: ga
        }));
      }, "Home"),
      End: /* @__PURE__ */ a(function(N) {
        S.current.state.isOpen && (N.preventDefault(), c({
          type: ya
        }));
      }, "End"),
      Escape: /* @__PURE__ */ a(function(N) {
        var F = S.current.state;
        (F.isOpen || F.inputValue || F.selectedItem || F.highlightedIndex > -1) && (N.preventDefault(), c({
          type: ha
        }));
      }, "Escape"),
      Enter: /* @__PURE__ */ a(function(N) {
        var F = S.current.state;
        !F.isOpen || N.which === 229 || (N.preventDefault(), c({
          type: Ia
        }));
      }, "Enter"),
      PageUp: /* @__PURE__ */ a(function(N) {
        S.current.state.isOpen && (N.preventDefault(), c({
          type: va
        }));
      }, "PageUp"),
      PageDown: /* @__PURE__ */ a(function(N) {
        S.current.state.isOpen && (N.preventDefault(), c({
          type: ba
        }));
      }, "PageDown")
    };
  }, [c, S]), T = A(function(H) {
    return U({
      id: g.labelId,
      htmlFor: g.inputId
    }, H);
  }, [g]), P = A(function(H, N) {
    var F, $ = H === void 0 ? {} : H, Q = $.onMouseLeave, ne = $.refKey, ee = ne === void 0 ? "ref" : ne, le = $.ref, se = ke($, qI), pe = N ===
    void 0 ? {} : N, ce = pe.suppressRefError, Se = ce === void 0 ? !1 : ce;
    return O("getMenuProps", Se, ee, y), U((F = {}, F[ee] = Je(le, function(ge) {
      y.current = ge;
    }), F.id = g.menuId, F.role = "listbox", F["aria-labelledby"] = se && se["aria-label"] ? void 0 : "" + g.labelId, F.onMouseLeave = ue(Q,
    function() {
      c({
        type: Qf
      });
    }), F), se);
  }, [c, O, g]), M = A(function(H) {
    var N, F, $ = H === void 0 ? {} : H, Q = $.item, ne = $.index, ee = $.refKey, le = ee === void 0 ? "ref" : ee, se = $.ref, pe = $.onMouseMove,
    ce = $.onMouseDown, Se = $.onClick;
    $.onPress;
    var ge = $.disabled, Pe = ke($, GI);
    ge !== void 0 && console.warn('Passing "disabled" as an argument to getItemProps is not supported anymore. Please use the isItemDisabled\
 prop from useCombobox.');
    var me = S.current, xe = me.props, _e = me.state, Fe = Xi(Q, ne, xe.items, "Pass either item or index to getItemProps!"), tt = Fe[0], Me = Fe[1],
    Ge = xe.isItemDisabled(tt, Me), vr = "onClick", Ur = Se, pt = /* @__PURE__ */ a(function() {
      k.isTouchEnd || Me === _e.highlightedIndex || (E.current = !1, c({
        type: Xf,
        index: Me,
        disabled: Ge
      }));
    }, "itemHandleMouseMove"), xt = /* @__PURE__ */ a(function() {
      c({
        type: wa,
        index: Me
      });
    }, "itemHandleClick"), dt = /* @__PURE__ */ a(function(mh) {
      return mh.preventDefault();
    }, "itemHandleMouseDown");
    return U((N = {}, N[le] = Je(se, function(Ye) {
      Ye && (m.current[g.getItemId(Me)] = Ye);
    }), N["aria-disabled"] = Ge, N["aria-selected"] = "" + (Me === _e.highlightedIndex), N.id = g.getItemId(Me), N.role = "option", N), !Ge &&
    (F = {}, F[vr] = ue(Ur, xt), F), {
      onMouseMove: ue(pe, pt),
      onMouseDown: ue(ce, dt)
    }, Pe);
  }, [c, g, S, k, E]), D = A(function(H) {
    var N, F = H === void 0 ? {} : H, $ = F.onClick;
    F.onPress;
    var Q = F.refKey, ne = Q === void 0 ? "ref" : Q, ee = F.ref, le = ke(F, YI), se = S.current.state, pe = /* @__PURE__ */ a(function() {
      c({
        type: Zf
      });
    }, "toggleButtonHandleClick");
    return U((N = {}, N[ne] = Je(ee, function(ce) {
      x.current = ce;
    }), N["aria-controls"] = g.menuId, N["aria-expanded"] = se.isOpen, N.id = g.toggleButtonId, N.tabIndex = -1, N), !le.disabled && U({}, {
      onClick: ue($, pe)
    }), le);
  }, [c, S, g]), L = A(function(H, N) {
    var F, $ = H === void 0 ? {} : H, Q = $.onKeyDown, ne = $.onChange, ee = $.onInput, le = $.onBlur;
    $.onChangeText;
    var se = $.onClick, pe = $.refKey, ce = pe === void 0 ? "ref" : pe, Se = $.ref, ge = ke($, QI), Pe = N === void 0 ? {} : N, me = Pe.suppressRefError,
    xe = me === void 0 ? !1 : me;
    O("getInputProps", xe, ce, b);
    var _e = S.current.state, Fe = /* @__PURE__ */ a(function(dt) {
      var Ye = yr(dt);
      Ye && w[Ye] && w[Ye](dt);
    }, "inputHandleKeyDown"), tt = /* @__PURE__ */ a(function(dt) {
      c({
        type: Sa,
        inputValue: dt.target.value
      });
    }, "inputHandleChange"), Me = /* @__PURE__ */ a(function(dt) {
      if (i != null && i.document && _e.isOpen && !k.isMouseDown) {
        var Ye = dt.relatedTarget === null && i.document.activeElement !== i.document.body;
        c({
          type: go,
          selectItem: !Ye
        });
      }
    }, "inputHandleBlur"), Ge = /* @__PURE__ */ a(function() {
      c({
        type: xa
      });
    }, "inputHandleClick"), vr = "onChange", Ur = {};
    if (!ge.disabled) {
      var pt;
      Ur = (pt = {}, pt[vr] = ue(ne, ee, tt), pt.onKeyDown = ue(Q, Fe), pt.onBlur = ue(le, Me), pt.onClick = ue(se, Ge), pt);
    }
    return U((F = {}, F[ce] = Je(Se, function(xt) {
      b.current = xt;
    }), F["aria-activedescendant"] = _e.isOpen && _e.highlightedIndex > -1 ? g.getItemId(_e.highlightedIndex) : "", F["aria-autocomplete"] =
    "list", F["aria-controls"] = g.menuId, F["aria-expanded"] = _e.isOpen, F["aria-labelledby"] = ge && ge["aria-label"] ? void 0 : g.labelId,
    F.autoComplete = "off", F.id = g.inputId, F.role = "combobox", F.value = _e.inputValue, F), Ur, ge);
  }, [c, g, i, w, S, k, O]), W = A(function() {
    c({
      type: Jf
    });
  }, [c]), Z = A(function() {
    c({
      type: tm
    });
  }, [c]), G = A(function() {
    c({
      type: em
    });
  }, [c]), R = A(function(H) {
    c({
      type: rm,
      highlightedIndex: H
    });
  }, [c]), z = A(function(H) {
    c({
      type: Ea,
      selectedItem: H
    });
  }, [c]), B = A(function(H) {
    c({
      type: nm,
      inputValue: H
    });
  }, [c]), re = A(function() {
    c({
      type: om
    });
  }, [c]);
  return {
    // prop getters.
    getItemProps: M,
    getLabelProps: T,
    getMenuProps: P,
    getInputProps: L,
    getToggleButtonProps: D,
    // actions.
    toggleMenu: W,
    openMenu: G,
    closeMenu: Z,
    setHighlightedIndex: R,
    setInputValue: B,
    selectItem: z,
    reset: re,
    // state.
    highlightedIndex: d,
    isOpen: p,
    selectedItem: h,
    inputValue: f
  };
}
a(am, "useCombobox");
var sm = {
  activeIndex: -1,
  selectedItems: []
};
function uf(e, t) {
  return $t(e, t, sm);
}
a(uf, "getInitialValue");
function cf(e, t) {
  return We(e, t, sm);
}
a(cf, "getDefaultValue");
function XI(e) {
  var t = uf(e, "activeIndex"), r = uf(e, "selectedItems");
  return {
    activeIndex: t,
    selectedItems: r
  };
}
a(XI, "getInitialState");
function pf(e) {
  if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey)
    return !1;
  var t = e.target;
  return !(t instanceof HTMLInputElement && // if element is a text input
  t.value !== "" && // and we have text in it
  // and cursor is either not at the start or is currently highlighting text.
  (t.selectionStart !== 0 || t.selectionEnd !== 0));
}
a(pf, "isKeyDownOperationPermitted");
function ZI(e, t) {
  return e.selectedItems === t.selectedItems && e.activeIndex === t.activeIndex;
}
a(ZI, "isStateEqual");
var c2 = {
  stateReducer: lo.stateReducer,
  itemToKey: lo.itemToKey,
  environment: lo.environment,
  selectedItems: q.default.array,
  initialSelectedItems: q.default.array,
  defaultSelectedItems: q.default.array,
  getA11yStatusMessage: q.default.func,
  activeIndex: q.default.number,
  initialActiveIndex: q.default.number,
  defaultActiveIndex: q.default.number,
  onActiveIndexChange: q.default.func,
  onSelectedItemsChange: q.default.func,
  keyNavigationNext: q.default.string,
  keyNavigationPrevious: q.default.string
}, JI = {
  itemToKey: Wr.itemToKey,
  stateReducer: Wr.stateReducer,
  environment: Wr.environment,
  keyNavigationNext: "ArrowRight",
  keyNavigationPrevious: "ArrowLeft"
}, eS = $e, _a = 0, Ta = 1, ka = 2, Oa = 3, Pa = 4, Aa = 5, Ma = 6, Da = 7, La = 8, Na = 9, Fa = 10, Ba = 11, Ha = 12, tS = /* @__PURE__ */ Object.
freeze({
  __proto__: null,
  SelectedItemClick: _a,
  SelectedItemKeyDownDelete: Ta,
  SelectedItemKeyDownBackspace: ka,
  SelectedItemKeyDownNavigationNext: Oa,
  SelectedItemKeyDownNavigationPrevious: Pa,
  DropdownKeyDownNavigationPrevious: Aa,
  DropdownKeyDownBackspace: Ma,
  DropdownClick: Da,
  FunctionAddSelectedItem: La,
  FunctionRemoveSelectedItem: Na,
  FunctionSetSelectedItems: Fa,
  FunctionSetActiveIndex: Ba,
  FunctionReset: Ha
});
function rS(e, t) {
  var r = t.type, n = t.index, i = t.props, o = t.selectedItem, l = e.activeIndex, u = e.selectedItems, c;
  switch (r) {
    case _a:
      c = {
        activeIndex: n
      };
      break;
    case Pa:
      c = {
        activeIndex: l - 1 < 0 ? 0 : l - 1
      };
      break;
    case Oa:
      c = {
        activeIndex: l + 1 >= u.length ? -1 : l + 1
      };
      break;
    case ka:
    case Ta: {
      if (l < 0)
        break;
      var p = l;
      u.length === 1 ? p = -1 : l === u.length - 1 && (p = u.length - 2), c = U({
        selectedItems: [].concat(u.slice(0, l), u.slice(l + 1))
      }, {
        activeIndex: p
      });
      break;
    }
    case Aa:
      c = {
        activeIndex: u.length - 1
      };
      break;
    case Ma:
      c = {
        selectedItems: u.slice(0, u.length - 1)
      };
      break;
    case La:
      c = {
        selectedItems: [].concat(u, [o])
      };
      break;
    case Da:
      c = {
        activeIndex: -1
      };
      break;
    case Na: {
      var d = l, h = u.findIndex(function(m) {
        return i.itemToKey(m) === i.itemToKey(o);
      });
      if (h < 0)
        break;
      u.length === 1 ? d = -1 : h === u.length - 1 && (d = u.length - 2), c = {
        selectedItems: [].concat(u.slice(0, h), u.slice(h + 1)),
        activeIndex: d
      };
      break;
    }
    case Fa: {
      var f = t.selectedItems;
      c = {
        selectedItems: f
      };
      break;
    }
    case Ba: {
      var y = t.activeIndex;
      c = {
        activeIndex: y
      };
      break;
    }
    case Ha:
      c = {
        activeIndex: cf(i, "activeIndex"),
        selectedItems: cf(i, "selectedItems")
      };
      break;
    default:
      throw new Error("Reducer called without proper action type.");
  }
  return U({}, e, c);
}
a(rS, "downshiftMultipleSelectionReducer");
var nS = ["refKey", "ref", "onClick", "onKeyDown", "selectedItem", "index"], oS = ["refKey", "ref", "onKeyDown", "onClick", "preventKeyActio\
n"];
lm.stateChangeTypes = tS;
function lm(e) {
  e === void 0 && (e = {}), eS(e, lm);
  var t = U({}, JI, e), r = t.getA11yStatusMessage, n = t.environment, i = t.keyNavigationNext, o = t.keyNavigationPrevious, l = Lf(rS, t, XI,
  ZI), u = l[0], c = l[1], p = u.activeIndex, d = u.selectedItems, h = bo(), f = X(null), y = X();
  y.current = [];
  var m = vo({
    state: u,
    props: t
  });
  ea(r, u, [p, d], n), K(function() {
    h || (p === -1 && f.current ? f.current.focus() : y.current[p] && y.current[p].focus());
  }, [p]), ta({
    props: t,
    state: u
  });
  var b = Ji("getDropdownProps"), x = j(function() {
    var w;
    return w = {}, w[o] = function() {
      c({
        type: Pa
      });
    }, w[i] = function() {
      c({
        type: Oa
      });
    }, w.Delete = /* @__PURE__ */ a(function() {
      c({
        type: Ta
      });
    }, "Delete"), w.Backspace = /* @__PURE__ */ a(function() {
      c({
        type: ka
      });
    }, "Backspace"), w;
  }, [c, i, o]), _ = j(function() {
    var w;
    return w = {}, w[o] = function(T) {
      pf(T) && c({
        type: Aa
      });
    }, w.Backspace = /* @__PURE__ */ a(function(P) {
      pf(P) && c({
        type: Ma
      });
    }, "Backspace"), w;
  }, [c, o]), g = A(function(w) {
    var T, P = w === void 0 ? {} : w, M = P.refKey, D = M === void 0 ? "ref" : M, L = P.ref, W = P.onClick, Z = P.onKeyDown, G = P.selectedItem,
    R = P.index, z = ke(P, nS), B = m.current.state, re = Xi(G, R, B.selectedItems, "Pass either item or index to getSelectedItemProps!"), H = re[1],
    N = H > -1 && H === B.activeIndex, F = /* @__PURE__ */ a(function() {
      c({
        type: _a,
        index: H
      });
    }, "selectedItemHandleClick"), $ = /* @__PURE__ */ a(function(ne) {
      var ee = yr(ne);
      ee && x[ee] && x[ee](ne);
    }, "selectedItemHandleKeyDown");
    return U((T = {}, T[D] = Je(L, function(Q) {
      Q && y.current.push(Q);
    }), T.tabIndex = N ? 0 : -1, T.onClick = ue(W, F), T.onKeyDown = ue(Z, $), T), z);
  }, [c, m, x]), v = A(function(w, T) {
    var P, M = w === void 0 ? {} : w, D = M.refKey, L = D === void 0 ? "ref" : D, W = M.ref, Z = M.onKeyDown, G = M.onClick, R = M.preventKeyAction,
    z = R === void 0 ? !1 : R, B = ke(M, oS), re = T === void 0 ? {} : T, H = re.suppressRefError, N = H === void 0 ? !1 : H;
    b("getDropdownProps", N, L, f);
    var F = /* @__PURE__ */ a(function(ne) {
      var ee = yr(ne);
      ee && _[ee] && _[ee](ne);
    }, "dropdownHandleKeyDown"), $ = /* @__PURE__ */ a(function() {
      c({
        type: Da
      });
    }, "dropdownHandleClick");
    return U((P = {}, P[L] = Je(W, function(Q) {
      Q && (f.current = Q);
    }), P), !z && {
      onKeyDown: ue(Z, F),
      onClick: ue(G, $)
    }, B);
  }, [c, _, b]), S = A(function(w) {
    c({
      type: La,
      selectedItem: w
    });
  }, [c]), C = A(function(w) {
    c({
      type: Na,
      selectedItem: w
    });
  }, [c]), E = A(function(w) {
    c({
      type: Fa,
      selectedItems: w
    });
  }, [c]), k = A(function(w) {
    c({
      type: Ba,
      activeIndex: w
    });
  }, [c]), O = A(function() {
    c({
      type: Ha
    });
  }, [c]);
  return {
    getSelectedItemProps: g,
    getDropdownProps: v,
    addSelectedItem: S,
    removeSelectedItem: C,
    setSelectedItems: E,
    setActiveIndex: k,
    reset: O,
    selectedItems: d,
    activeIndex: p
  };
}
a(lm, "useMultipleSelection");

// src/manager/components/sidebar/Search.tsx
var $m = Be(um(), 1);

// src/manager/hooks/useDebounce.ts
function cm(e, t) {
  let [r, n] = J(e);
  return K(() => {
    let i = setTimeout(() => {
      n(e);
    }, t);
    return () => {
      clearTimeout(i);
    };
  }, [e, t]), r;
}
a(cm, "useDebounce");

// src/manager/hooks/useMeasure.tsx
function pm() {
  let [e, t] = s.useState({
    width: null,
    height: null
  }), r = s.useRef(null);
  return [s.useCallback((i) => {
    if (r.current && (r.current.disconnect(), r.current = null), i?.nodeType === Node.ELEMENT_NODE) {
      let o = new ResizeObserver(([l]) => {
        if (l && l.borderBoxSize) {
          let { inlineSize: u, blockSize: c } = l.borderBoxSize[0];
          t({ width: u, height: c });
        }
      });
      o.observe(i), r.current = o;
    }
  }, []), e];
}
a(pm, "useMeasure");

// ../node_modules/@tanstack/virtual-core/dist/esm/utils.js
function Kt(e, t, r) {
  let n = r.initialDeps ?? [], i;
  return () => {
    var o, l, u, c;
    let p;
    r.key && ((o = r.debug) != null && o.call(r)) && (p = Date.now());
    let d = e();
    if (!(d.length !== n.length || d.some((y, m) => n[m] !== y)))
      return i;
    n = d;
    let f;
    if (r.key && ((l = r.debug) != null && l.call(r)) && (f = Date.now()), i = t(...d), r.key && ((u = r.debug) != null && u.call(r))) {
      let y = Math.round((Date.now() - p) * 100) / 100, m = Math.round((Date.now() - f) * 100) / 100, b = m / 16, x = /* @__PURE__ */ a((_, g) => {
        for (_ = String(_); _.length < g; )
          _ = " " + _;
        return _;
      }, "pad");
      console.info(
        `%c\u23F1 ${x(m, 5)} /${x(y, 5)} ms`,
        `
            font-size: .6rem;
            font-weight: bold;
            color: hsl(${Math.max(
          0,
          Math.min(120 - 120 * b, 120)
        )}deg 100% 31%);`,
        r?.key
      );
    }
    return (c = r?.onChange) == null || c.call(r, i), i;
  };
}
a(Kt, "memo");
function Io(e, t) {
  if (e === void 0)
    throw new Error(`Unexpected undefined${t ? `: ${t}` : ""}`);
  return e;
}
a(Io, "notUndefined");
var dm = /* @__PURE__ */ a((e, t) => Math.abs(e - t) < 1, "approxEqual");

// ../node_modules/@tanstack/virtual-core/dist/esm/index.js
var iS = /* @__PURE__ */ a((e) => e, "defaultKeyExtractor"), aS = /* @__PURE__ */ a((e) => {
  let t = Math.max(e.startIndex - e.overscan, 0), r = Math.min(e.endIndex + e.overscan, e.count - 1), n = [];
  for (let i = t; i <= r; i++)
    n.push(i);
  return n;
}, "defaultRangeExtractor"), fm = /* @__PURE__ */ a((e, t) => {
  let r = e.scrollElement;
  if (!r)
    return;
  let n = /* @__PURE__ */ a((o) => {
    let { width: l, height: u } = o;
    t({ width: Math.round(l), height: Math.round(u) });
  }, "handler");
  if (n(r.getBoundingClientRect()), typeof ResizeObserver > "u")
    return () => {
    };
  let i = new ResizeObserver((o) => {
    let l = o[0];
    if (l?.borderBoxSize) {
      let u = l.borderBoxSize[0];
      if (u) {
        n({ width: u.inlineSize, height: u.blockSize });
        return;
      }
    }
    n(r.getBoundingClientRect());
  });
  return i.observe(r, { box: "border-box" }), () => {
    i.unobserve(r);
  };
}, "observeElementRect");
var mm = /* @__PURE__ */ a((e, t) => {
  let r = e.scrollElement;
  if (!r)
    return;
  let n = /* @__PURE__ */ a(() => {
    t(r[e.options.horizontal ? "scrollLeft" : "scrollTop"]);
  }, "handler");
  return n(), r.addEventListener("scroll", n, {
    passive: !0
  }), () => {
    r.removeEventListener("scroll", n);
  };
}, "observeElementOffset");
var sS = /* @__PURE__ */ a((e, t, r) => {
  if (t?.borderBoxSize) {
    let n = t.borderBoxSize[0];
    if (n)
      return Math.round(
        n[r.options.horizontal ? "inlineSize" : "blockSize"]
      );
  }
  return Math.round(
    e.getBoundingClientRect()[r.options.horizontal ? "width" : "height"]
  );
}, "measureElement");
var hm = /* @__PURE__ */ a((e, {
  adjustments: t = 0,
  behavior: r
}, n) => {
  var i, o;
  let l = e + t;
  (o = (i = n.scrollElement) == null ? void 0 : i.scrollTo) == null || o.call(i, {
    [n.options.horizontal ? "left" : "top"]: l,
    behavior: r
  });
}, "elementScroll"), za = class za {
  constructor(t) {
    this.unsubs = [], this.scrollElement = null, this.isScrolling = !1, this.isScrollingTimeoutId = null, this.scrollToIndexTimeoutId = null,
    this.measurementsCache = [], this.itemSizeCache = /* @__PURE__ */ new Map(), this.pendingMeasuredCacheIndexes = [], this.scrollDirection =
    null, this.scrollAdjustments = 0, this.measureElementCache = /* @__PURE__ */ new Map(), this.observer = /* @__PURE__ */ (() => {
      let r = null, n = /* @__PURE__ */ a(() => r || (typeof ResizeObserver < "u" ? r = new ResizeObserver((i) => {
        i.forEach((o) => {
          this._measureElement(o.target, o);
        });
      }) : null), "get");
      return {
        disconnect: /* @__PURE__ */ a(() => {
          var i;
          return (i = n()) == null ? void 0 : i.disconnect();
        }, "disconnect"),
        observe: /* @__PURE__ */ a((i) => {
          var o;
          return (o = n()) == null ? void 0 : o.observe(i, { box: "border-box" });
        }, "observe"),
        unobserve: /* @__PURE__ */ a((i) => {
          var o;
          return (o = n()) == null ? void 0 : o.unobserve(i);
        }, "unobserve")
      };
    })(), this.range = null, this.setOptions = (r) => {
      Object.entries(r).forEach(([n, i]) => {
        typeof i > "u" && delete r[n];
      }), this.options = {
        debug: !1,
        initialOffset: 0,
        overscan: 1,
        paddingStart: 0,
        paddingEnd: 0,
        scrollPaddingStart: 0,
        scrollPaddingEnd: 0,
        horizontal: !1,
        getItemKey: iS,
        rangeExtractor: aS,
        onChange: /* @__PURE__ */ a(() => {
        }, "onChange"),
        measureElement: sS,
        initialRect: { width: 0, height: 0 },
        scrollMargin: 0,
        gap: 0,
        scrollingDelay: 150,
        indexAttribute: "data-index",
        initialMeasurementsCache: [],
        lanes: 1,
        ...r
      };
    }, this.notify = (r) => {
      var n, i;
      (i = (n = this.options).onChange) == null || i.call(n, this, r);
    }, this.maybeNotify = Kt(
      () => (this.calculateRange(), [
        this.isScrolling,
        this.range ? this.range.startIndex : null,
        this.range ? this.range.endIndex : null
      ]),
      (r) => {
        this.notify(r);
      },
      {
        key: !1,
        debug: /* @__PURE__ */ a(() => this.options.debug, "debug"),
        initialDeps: [
          this.isScrolling,
          this.range ? this.range.startIndex : null,
          this.range ? this.range.endIndex : null
        ]
      }
    ), this.cleanup = () => {
      this.unsubs.filter(Boolean).forEach((r) => r()), this.unsubs = [], this.scrollElement = null;
    }, this._didMount = () => (this.measureElementCache.forEach(this.observer.observe), () => {
      this.observer.disconnect(), this.cleanup();
    }), this._willUpdate = () => {
      let r = this.options.getScrollElement();
      this.scrollElement !== r && (this.cleanup(), this.scrollElement = r, this._scrollToOffset(this.scrollOffset, {
        adjustments: void 0,
        behavior: void 0
      }), this.unsubs.push(
        this.options.observeElementRect(this, (n) => {
          this.scrollRect = n, this.maybeNotify();
        })
      ), this.unsubs.push(
        this.options.observeElementOffset(this, (n) => {
          this.scrollAdjustments = 0, this.scrollOffset !== n && (this.isScrollingTimeoutId !== null && (clearTimeout(this.isScrollingTimeoutId),
          this.isScrollingTimeoutId = null), this.isScrolling = !0, this.scrollDirection = this.scrollOffset < n ? "forward" : "backward", this.
          scrollOffset = n, this.maybeNotify(), this.isScrollingTimeoutId = setTimeout(() => {
            this.isScrollingTimeoutId = null, this.isScrolling = !1, this.scrollDirection = null, this.maybeNotify();
          }, this.options.scrollingDelay));
        })
      ));
    }, this.getSize = () => this.scrollRect[this.options.horizontal ? "width" : "height"], this.memoOptions = Kt(
      () => [
        this.options.count,
        this.options.paddingStart,
        this.options.scrollMargin,
        this.options.getItemKey
      ],
      (r, n, i, o) => (this.pendingMeasuredCacheIndexes = [], {
        count: r,
        paddingStart: n,
        scrollMargin: i,
        getItemKey: o
      }),
      {
        key: !1
      }
    ), this.getFurthestMeasurement = (r, n) => {
      let i = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map();
      for (let l = n - 1; l >= 0; l--) {
        let u = r[l];
        if (i.has(u.lane))
          continue;
        let c = o.get(
          u.lane
        );
        if (c == null || u.end > c.end ? o.set(u.lane, u) : u.end < c.end && i.set(u.lane, !0), i.size === this.options.lanes)
          break;
      }
      return o.size === this.options.lanes ? Array.from(o.values()).sort((l, u) => l.end === u.end ? l.index - u.index : l.end - u.end)[0] :
      void 0;
    }, this.getMeasurements = Kt(
      () => [this.memoOptions(), this.itemSizeCache],
      ({ count: r, paddingStart: n, scrollMargin: i, getItemKey: o }, l) => {
        let u = this.pendingMeasuredCacheIndexes.length > 0 ? Math.min(...this.pendingMeasuredCacheIndexes) : 0;
        this.pendingMeasuredCacheIndexes = [];
        let c = this.measurementsCache.slice(0, u);
        for (let p = u; p < r; p++) {
          let d = o(p), h = this.options.lanes === 1 ? c[p - 1] : this.getFurthestMeasurement(c, p), f = h ? h.end + this.options.gap : n + i,
          y = l.get(d), m = typeof y == "number" ? y : this.options.estimateSize(p), b = f + m, x = h ? h.lane : p % this.options.lanes;
          c[p] = {
            index: p,
            start: f,
            size: m,
            end: b,
            key: d,
            lane: x
          };
        }
        return this.measurementsCache = c, c;
      },
      {
        key: !1,
        debug: /* @__PURE__ */ a(() => this.options.debug, "debug")
      }
    ), this.calculateRange = Kt(
      () => [this.getMeasurements(), this.getSize(), this.scrollOffset],
      (r, n, i) => this.range = r.length > 0 && n > 0 ? lS({
        measurements: r,
        outerSize: n,
        scrollOffset: i
      }) : null,
      {
        key: !1,
        debug: /* @__PURE__ */ a(() => this.options.debug, "debug")
      }
    ), this.getIndexes = Kt(
      () => [
        this.options.rangeExtractor,
        this.calculateRange(),
        this.options.overscan,
        this.options.count
      ],
      (r, n, i, o) => n === null ? [] : r({
        ...n,
        overscan: i,
        count: o
      }),
      {
        key: !1,
        debug: /* @__PURE__ */ a(() => this.options.debug, "debug")
      }
    ), this.indexFromElement = (r) => {
      let n = this.options.indexAttribute, i = r.getAttribute(n);
      return i ? parseInt(i, 10) : (console.warn(
        `Missing attribute name '${n}={index}' on measured element.`
      ), -1);
    }, this._measureElement = (r, n) => {
      let i = this.measurementsCache[this.indexFromElement(r)];
      if (!i || !r.isConnected) {
        this.measureElementCache.forEach((u, c) => {
          u === r && (this.observer.unobserve(r), this.measureElementCache.delete(c));
        });
        return;
      }
      let o = this.measureElementCache.get(i.key);
      o !== r && (o && this.observer.unobserve(o), this.observer.observe(r), this.measureElementCache.set(i.key, r));
      let l = this.options.measureElement(r, n, this);
      this.resizeItem(i, l);
    }, this.resizeItem = (r, n) => {
      let i = this.itemSizeCache.get(r.key) ?? r.size, o = n - i;
      o !== 0 && ((this.shouldAdjustScrollPositionOnItemSizeChange !== void 0 ? this.shouldAdjustScrollPositionOnItemSizeChange(r, o, this) :
      r.start < this.scrollOffset + this.scrollAdjustments) && this._scrollToOffset(this.scrollOffset, {
        adjustments: this.scrollAdjustments += o,
        behavior: void 0
      }), this.pendingMeasuredCacheIndexes.push(r.index), this.itemSizeCache = new Map(this.itemSizeCache.set(r.key, n)), this.notify(!1));
    }, this.measureElement = (r) => {
      r && this._measureElement(r, void 0);
    }, this.getVirtualItems = Kt(
      () => [this.getIndexes(), this.getMeasurements()],
      (r, n) => {
        let i = [];
        for (let o = 0, l = r.length; o < l; o++) {
          let u = r[o], c = n[u];
          i.push(c);
        }
        return i;
      },
      {
        key: !1,
        debug: /* @__PURE__ */ a(() => this.options.debug, "debug")
      }
    ), this.getVirtualItemForOffset = (r) => {
      let n = this.getMeasurements();
      return Io(
        n[gm(
          0,
          n.length - 1,
          (i) => Io(n[i]).start,
          r
        )]
      );
    }, this.getOffsetForAlignment = (r, n) => {
      let i = this.getSize();
      n === "auto" && (r <= this.scrollOffset ? n = "start" : r >= this.scrollOffset + i ? n = "end" : n = "start"), n === "start" ? r = r :
      n === "end" ? r = r - i : n === "center" && (r = r - i / 2);
      let o = this.options.horizontal ? "scrollWidth" : "scrollHeight", u = (this.scrollElement ? "document" in this.scrollElement ? this.scrollElement.
      document.documentElement[o] : this.scrollElement[o] : 0) - this.getSize();
      return Math.max(Math.min(u, r), 0);
    }, this.getOffsetForIndex = (r, n = "auto") => {
      r = Math.max(0, Math.min(r, this.options.count - 1));
      let i = Io(this.getMeasurements()[r]);
      if (n === "auto")
        if (i.end >= this.scrollOffset + this.getSize() - this.options.scrollPaddingEnd)
          n = "end";
        else if (i.start <= this.scrollOffset + this.options.scrollPaddingStart)
          n = "start";
        else
          return [this.scrollOffset, n];
      let o = n === "end" ? i.end + this.options.scrollPaddingEnd : i.start - this.options.scrollPaddingStart;
      return [this.getOffsetForAlignment(o, n), n];
    }, this.isDynamicMode = () => this.measureElementCache.size > 0, this.cancelScrollToIndex = () => {
      this.scrollToIndexTimeoutId !== null && (clearTimeout(this.scrollToIndexTimeoutId), this.scrollToIndexTimeoutId = null);
    }, this.scrollToOffset = (r, { align: n = "start", behavior: i } = {}) => {
      this.cancelScrollToIndex(), i === "smooth" && this.isDynamicMode() && console.warn(
        "The `smooth` scroll behavior is not fully supported with dynamic size."
      ), this._scrollToOffset(this.getOffsetForAlignment(r, n), {
        adjustments: void 0,
        behavior: i
      });
    }, this.scrollToIndex = (r, { align: n = "auto", behavior: i } = {}) => {
      r = Math.max(0, Math.min(r, this.options.count - 1)), this.cancelScrollToIndex(), i === "smooth" && this.isDynamicMode() && console.warn(
        "The `smooth` scroll behavior is not fully supported with dynamic size."
      );
      let [o, l] = this.getOffsetForIndex(r, n);
      this._scrollToOffset(o, { adjustments: void 0, behavior: i }), i !== "smooth" && this.isDynamicMode() && (this.scrollToIndexTimeoutId =
      setTimeout(() => {
        if (this.scrollToIndexTimeoutId = null, this.measureElementCache.has(
          this.options.getItemKey(r)
        )) {
          let [c] = this.getOffsetForIndex(r, l);
          dm(c, this.scrollOffset) || this.scrollToIndex(r, { align: l, behavior: i });
        } else
          this.scrollToIndex(r, { align: l, behavior: i });
      }));
    }, this.scrollBy = (r, { behavior: n } = {}) => {
      this.cancelScrollToIndex(), n === "smooth" && this.isDynamicMode() && console.warn(
        "The `smooth` scroll behavior is not fully supported with dynamic size."
      ), this._scrollToOffset(this.scrollOffset + r, {
        adjustments: void 0,
        behavior: n
      });
    }, this.getTotalSize = () => {
      var r;
      let n = this.getMeasurements(), i;
      return n.length === 0 ? i = this.options.paddingStart : i = this.options.lanes === 1 ? ((r = n[n.length - 1]) == null ? void 0 : r.end) ??
      0 : Math.max(
        ...n.slice(-this.options.lanes).map((o) => o.end)
      ), i - this.options.scrollMargin + this.options.paddingEnd;
    }, this._scrollToOffset = (r, {
      adjustments: n,
      behavior: i
    }) => {
      this.options.scrollToFn(r, { behavior: i, adjustments: n }, this);
    }, this.measure = () => {
      this.itemSizeCache = /* @__PURE__ */ new Map(), this.notify(!1);
    }, this.setOptions(t), this.scrollRect = this.options.initialRect, this.scrollOffset = typeof this.options.initialOffset == "function" ?
    this.options.initialOffset() : this.options.initialOffset, this.measurementsCache = this.options.initialMeasurementsCache, this.measurementsCache.
    forEach((r) => {
      this.itemSizeCache.set(r.key, r.size);
    }), this.maybeNotify();
  }
};
a(za, "Virtualizer");
var So = za, gm = /* @__PURE__ */ a((e, t, r, n) => {
  for (; e <= t; ) {
    let i = (e + t) / 2 | 0, o = r(i);
    if (o < n)
      e = i + 1;
    else if (o > n)
      t = i - 1;
    else
      return i;
  }
  return e > 0 ? e - 1 : 0;
}, "findNearestBinarySearch");
function lS({
  measurements: e,
  outerSize: t,
  scrollOffset: r
}) {
  let n = e.length - 1, o = gm(0, n, /* @__PURE__ */ a((u) => e[u].start, "getOffset"), r), l = o;
  for (; l < n && e[l].end < r + t; )
    l++;
  return { startIndex: o, endIndex: l };
}
a(lS, "calculateRange");

// ../node_modules/@tanstack/react-virtual/dist/esm/index.js
var uS = typeof document < "u" ? qt : K;
function cS(e) {
  let t = Gt(() => ({}), {})[1], r = {
    ...e,
    onChange: /* @__PURE__ */ a((i, o) => {
      var l;
      o ? kr(t) : t(), (l = e.onChange) == null || l.call(e, i, o);
    }, "onChange")
  }, [n] = J(
    () => new So(r)
  );
  return n.setOptions(r), K(() => n._didMount(), []), uS(() => n._willUpdate()), n;
}
a(cS, "useVirtualizerBase");
function ym(e) {
  return cS({
    observeElementRect: fm,
    observeElementOffset: mm,
    scrollToFn: hm,
    ...e
  });
}
a(ym, "useVirtualizer");

// src/manager/components/sidebar/FIleSearchList.utils.tsx
var vm = /* @__PURE__ */ a(({
  parentRef: e,
  rowVirtualizer: t,
  selectedItem: r
}) => {
  K(() => {
    let n = /* @__PURE__ */ a((i) => {
      if (!e.current)
        return;
      let o = t.options.count, l = document.activeElement, u = parseInt(l.getAttribute("data-index") || "-1", 10), c = l.tagName === "INPUT",
      p = /* @__PURE__ */ a(() => document.querySelector('[data-index="0"]'), "getFirstElement"), d = /* @__PURE__ */ a(() => document.querySelector(
      `[data-index="${o - 1}"]`), "getLastElement");
      if (i.code === "ArrowDown" && l) {
        if (i.stopPropagation(), c) {
          p()?.focus();
          return;
        }
        if (u === o - 1) {
          kr(() => {
            t.scrollToIndex(0, { align: "start" });
          }), setTimeout(() => {
            p()?.focus();
          }, 100);
          return;
        }
        if (r === u) {
          document.querySelector(
            `[data-index-position="${r}_first"]`
          )?.focus();
          return;
        }
        if (r !== null && l.getAttribute("data-index-position")?.includes("last")) {
          document.querySelector(
            `[data-index="${r + 1}"]`
          )?.focus();
          return;
        }
        l.nextElementSibling?.focus();
      }
      if (i.code === "ArrowUp" && l) {
        if (c) {
          kr(() => {
            t.scrollToIndex(o - 1, { align: "start" });
          }), setTimeout(() => {
            d()?.focus();
          }, 100);
          return;
        }
        if (r !== null && l.getAttribute("data-index-position")?.includes("first")) {
          document.querySelector(
            `[data-index="${r}"]`
          )?.focus();
          return;
        }
        l.previousElementSibling?.focus();
      }
    }, "handleArrowKeys");
    return document.addEventListener("keydown", n, { capture: !0 }), () => {
      document.removeEventListener("keydown", n, { capture: !0 });
    };
  }, [t, r, e]);
}, "useArrowKeyNavigation");

// src/manager/components/sidebar/FileList.tsx
var bm = I("div")(({ theme: e }) => ({
  marginTop: "-16px",
  // after element which fades out the list
  "&::after": {
    content: '""',
    position: "fixed",
    pointerEvents: "none",
    bottom: 0,
    left: 0,
    right: 0,
    height: "80px",
    background: `linear-gradient(${Zo(e.barBg, 0)} 10%, ${e.barBg} 80%)`
  }
})), xo = I("div")(({ theme: e }) => ({
  height: "280px",
  overflow: "auto",
  msOverflowStyle: "none",
  scrollbarWidth: "none",
  position: "relative",
  "::-webkit-scrollbar": {
    display: "none"
  }
})), Im = I("li")(({ theme: e }) => ({
  ":focus-visible": {
    outline: "none",
    ".file-list-item": {
      borderRadius: "4px",
      background: e.base === "dark" ? "rgba(255,255,255,.1)" : e.color.mediumlight,
      "> svg": {
        display: "flex"
      }
    }
  }
})), wo = I("div")(({ theme: e }) => ({
  display: "flex",
  flexDirection: "column",
  position: "relative"
})), Sm = I.div(({ theme: e, selected: t, disabled: r, error: n }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  alignSelf: "stretch",
  padding: "8px 16px",
  cursor: "pointer",
  borderRadius: "4px",
  ...t && {
    borderRadius: "4px",
    background: e.base === "dark" ? "rgba(255,255,255,.1)" : e.color.mediumlight,
    "> svg": {
      display: "flex"
    }
  },
  ...r && {
    cursor: "not-allowed",
    div: {
      color: `${e.color.mediumdark} !important`
    }
  },
  ...n && {
    background: e.base === "light" ? "#00000011" : "#00000033"
  },
  "&:hover": {
    background: n ? "#00000022" : e.base === "dark" ? "rgba(255,255,255,.1)" : e.color.mediumlight,
    "> svg": {
      display: "flex"
    }
  }
})), xm = I("ul")({
  margin: 0,
  padding: "0 0 0 0",
  width: "100%",
  position: "relative"
}), wm = I("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  width: "calc(100% - 50px)"
}), Em = I("div")(({ theme: e, error: t }) => ({
  color: t ? e.color.negativeText : e.color.secondary
})), Cm = I("div")(({ theme: e, error: t }) => ({
  color: t ? e.color.negativeText : e.base === "dark" ? e.color.lighter : e.color.darkest,
  fontSize: "14px",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  overflow: "hidden",
  maxWidth: "100%"
})), _m = I("div")(({ theme: e }) => ({
  color: e.color.mediumdark,
  fontSize: "14px",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  overflow: "hidden",
  maxWidth: "100%"
})), Tm = I("ul")(({ theme: e }) => ({
  margin: 0,
  padding: 0
})), km = I("li")(({ theme: e, error: t }) => ({
  padding: "8px 16px 8px 16px",
  marginLeft: "30px",
  display: "flex",
  gap: "8px",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: "14px",
  cursor: "pointer",
  borderRadius: "4px",
  ":focus-visible": {
    outline: "none"
  },
  ...t && {
    background: "#F9ECEC",
    color: e.color.negativeText
  },
  "&:hover,:focus-visible": {
    background: t ? "#F9ECEC" : e.base === "dark" ? "rgba(255, 255, 255, 0.1)" : e.color.mediumlight,
    "> svg": {
      display: "flex"
    }
  },
  "> div > svg": {
    color: t ? e.color.negativeText : e.color.secondary
  }
})), Om = I("div")(({ theme: e }) => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  width: "calc(100% - 20px)"
})), Pm = I("span")(({ theme: e }) => ({
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  overflow: "hidden",
  maxWidth: "calc(100% - 160px)",
  display: "inline-block"
})), Am = I("span")(({ theme: e }) => ({
  display: "inline-block",
  padding: `1px ${e.appBorderRadius}px`,
  borderRadius: "2px",
  fontSize: "10px",
  color: e.base === "dark" ? e.color.lightest : "#727272",
  backgroundColor: e.base === "dark" ? "rgba(255, 255, 255, 0.1)" : "#F2F4F5"
})), Mm = I("div")(({ theme: e }) => ({
  textAlign: "center",
  maxWidth: "334px",
  margin: "16px auto 50px auto",
  fontSize: "14px",
  color: e.base === "dark" ? e.color.lightest : "#000"
})), Dm = I("p")(({ theme: e }) => ({
  margin: 0,
  color: e.base === "dark" ? e.color.defaultText : e.color.mediumdark
}));

// src/manager/components/sidebar/FileSearchListSkeleton.tsx
var pS = I("div")(({ theme: e }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  alignSelf: "stretch",
  padding: "8px 16px"
})), dS = I("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  width: "100%",
  borderRadius: "3px"
}), fS = I.div(({ theme: e }) => ({
  width: "14px",
  height: "14px",
  borderRadius: "3px",
  marginTop: "1px",
  background: e.base === "dark" ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)",
  animation: `${e.animation.glow} 1.5s ease-in-out infinite`
})), Lm = I.div(({ theme: e }) => ({
  height: "16px",
  borderRadius: "3px",
  background: e.base === "dark" ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)",
  animation: `${e.animation.glow} 1.5s ease-in-out infinite`,
  width: "100%",
  maxWidth: "100%",
  "+ div": {
    marginTop: "6px"
  }
})), Nm = /* @__PURE__ */ a(() => /* @__PURE__ */ s.createElement(xo, null, [1, 2, 3].map((e) => /* @__PURE__ */ s.createElement(wo, { key: e },
/* @__PURE__ */ s.createElement(pS, null, /* @__PURE__ */ s.createElement(fS, null), /* @__PURE__ */ s.createElement(dS, null, /* @__PURE__ */ s.
createElement(Lm, { style: { width: "90px" } }), /* @__PURE__ */ s.createElement(Lm, { style: { width: "300px" } })))))), "FileSearchListLoa\
dingSkeleton");

// src/manager/components/sidebar/FileSearchList.tsx
var Fm = I(tl)(({ theme: e }) => ({
  display: "none",
  alignSelf: "center",
  color: e.color.mediumdark
})), mS = I(er)(({ theme: e }) => ({
  display: "none",
  alignSelf: "center",
  color: e.color.mediumdark
})), Bm = Sr(/* @__PURE__ */ a(function({
  isLoading: t,
  searchResults: r,
  onNewStory: n,
  errorItemId: i
}) {
  let [o, l] = J(null), u = s.useRef(), c = j(() => [...r ?? []].sort((m, b) => {
    let x = m.exportedComponents === null || m.exportedComponents?.length === 0, _ = m.storyFileExists, g = b.exportedComponents === null ||
    b.exportedComponents?.length === 0, v = b.storyFileExists;
    return _ && !v ? -1 : v && !_ || x && !g ? 1 : !x && g ? -1 : 0;
  }), [r]), p = r?.length || 0, d = ym({
    count: p,
    // @ts-expect-error (non strict)
    getScrollElement: /* @__PURE__ */ a(() => u.current, "getScrollElement"),
    paddingStart: 16,
    paddingEnd: 40,
    estimateSize: /* @__PURE__ */ a(() => 54, "estimateSize"),
    overscan: 2
  });
  vm({ rowVirtualizer: d, parentRef: u, selectedItem: o });
  let h = A(
    ({ virtualItem: m, searchResult: b, itemId: x }) => {
      b?.exportedComponents?.length > 1 ? l((_) => _ === m.index ? null : m.index) : b?.exportedComponents?.length === 1 && n({
        componentExportName: b.exportedComponents[0].name,
        componentFilePath: b.filepath,
        componentIsDefaultExport: b.exportedComponents[0].default,
        selectedItemId: x,
        componentExportCount: 1
      });
    },
    [n]
  ), f = A(
    ({ searchResult: m, component: b, id: x }) => {
      n({
        componentExportName: b.name,
        componentFilePath: m.filepath,
        componentIsDefaultExport: b.default,
        selectedItemId: x,
        // @ts-expect-error (non strict)
        componentExportCount: m.exportedComponents.length
      });
    },
    [n]
  ), y = A(
    ({ virtualItem: m, selected: b, searchResult: x }) => {
      let _ = i === x.filepath, g = b === m.index;
      return /* @__PURE__ */ s.createElement(
        wo,
        {
          "aria-expanded": g,
          "aria-controls": `file-list-export-${m.index}`,
          id: `file-list-item-wrapper-${m.index}`
        },
        /* @__PURE__ */ s.createElement(
          Sm,
          {
            className: "file-list-item",
            selected: g,
            error: _,
            disabled: x.exportedComponents === null || x.exportedComponents?.length === 0
          },
          /* @__PURE__ */ s.createElement(Em, { error: _ }, /* @__PURE__ */ s.createElement(jo, null)),
          /* @__PURE__ */ s.createElement(wm, null, /* @__PURE__ */ s.createElement(Cm, { error: _ }, x.filepath.split("/").at(-1)), /* @__PURE__ */ s.
          createElement(_m, null, x.filepath)),
          g ? /* @__PURE__ */ s.createElement(mS, null) : /* @__PURE__ */ s.createElement(Fm, null)
        ),
        x?.exportedComponents?.length > 1 && g && /* @__PURE__ */ s.createElement(
          Tm,
          {
            role: "region",
            id: `file-list-export-${m.index}`,
            "aria-labelledby": `file-list-item-wrapper-${m.index}`,
            onClick: (v) => {
              v.stopPropagation();
            },
            onKeyUp: (v) => {
              v.key === "Enter" && v.stopPropagation();
            }
          },
          x.exportedComponents?.map((v, S) => {
            let C = i === `${x.filepath}_${S}`, E = S === 0 ? "first" : (
              // @ts-expect-error (non strict)
              S === x.exportedComponents.length - 1 ? "last" : "middle"
            );
            return /* @__PURE__ */ s.createElement(
              km,
              {
                tabIndex: 0,
                "data-index-position": `${m.index}_${E}`,
                key: v.name,
                error: C,
                onClick: () => {
                  f({
                    searchResult: x,
                    component: v,
                    id: `${x.filepath}_${S}`
                  });
                },
                onKeyUp: (k) => {
                  k.key === "Enter" && f({
                    searchResult: x,
                    component: v,
                    id: `${x.filepath}_${S}`
                  });
                }
              },
              /* @__PURE__ */ s.createElement(Om, null, /* @__PURE__ */ s.createElement(jo, null), v.default ? /* @__PURE__ */ s.createElement(
              s.Fragment, null, /* @__PURE__ */ s.createElement(Pm, null, x.filepath.split("/").at(-1)?.split(".")?.at(0)), /* @__PURE__ */ s.
              createElement(Am, null, "Default export")) : v.name),
              /* @__PURE__ */ s.createElement(Fm, null)
            );
          })
        )
      );
    },
    [f, i]
  );
  return t && (r === null || r?.length === 0) ? /* @__PURE__ */ s.createElement(Nm, null) : r?.length === 0 ? /* @__PURE__ */ s.createElement(
  Mm, null, /* @__PURE__ */ s.createElement("p", null, "We could not find any file with that name"), /* @__PURE__ */ s.createElement(Dm, null,
  "You may want to try using different keywords, check for typos, and adjust your filters")) : c?.length > 0 ? /* @__PURE__ */ s.createElement(
  bm, null, /* @__PURE__ */ s.createElement(xo, { ref: u }, /* @__PURE__ */ s.createElement(
    xm,
    {
      style: {
        height: `${d.getTotalSize()}px`
      }
    },
    d.getVirtualItems().map((m) => {
      let b = c[m.index], x = b.exportedComponents === null || b.exportedComponents?.length === 0, _ = {};
      return /* @__PURE__ */ s.createElement(
        Im,
        {
          key: m.key,
          "data-index": m.index,
          ref: d.measureElement,
          onClick: () => {
            h({
              virtualItem: m,
              itemId: b.filepath,
              searchResult: b
            });
          },
          onKeyUp: (g) => {
            g.key === "Enter" && h({
              virtualItem: m,
              itemId: b.filepath,
              searchResult: b
            });
          },
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${m.start}px)`
          },
          tabIndex: 0
        },
        x ? /* @__PURE__ */ s.createElement(
          ze,
          {
            ..._,
            style: { width: "100%" },
            hasChrome: !1,
            closeOnOutsideClick: !0,
            tooltip: /* @__PURE__ */ s.createElement(
              dn,
              {
                note: x ? "We can't evaluate exports for this file. You can't create a story for it automatically" : null
              }
            )
          },
          /* @__PURE__ */ s.createElement(
            y,
            {
              searchResult: b,
              selected: o,
              virtualItem: m
            }
          )
        ) : /* @__PURE__ */ s.createElement(
          y,
          {
            ..._,
            key: m.index,
            searchResult: b,
            selected: o,
            virtualItem: m
          }
        )
      );
    })
  ))) : null;
}, "FileSearchList"));

// src/manager/components/sidebar/FileSearchModal.tsx
var hS = 418, gS = I(Et)(() => ({
  boxShadow: "none",
  background: "transparent"
})), yS = I.div(({ theme: e, height: t }) => ({
  backgroundColor: e.background.bar,
  borderRadius: 6,
  boxShadow: "rgba(255, 255, 255, 0.05) 0 0 0 1px inset, rgba(14, 18, 22, 0.35) 0px 10px 18px -10px",
  padding: "16px",
  transition: "height 0.3s",
  height: t ? `${t + 32}px` : "auto",
  overflow: "hidden"
})), vS = I(Et.Content)(({ theme: e }) => ({
  margin: 0,
  color: e.base === "dark" ? e.color.lighter : e.color.mediumdark
})), bS = I(an.Input)(({ theme: e }) => ({
  paddingLeft: 40,
  paddingRight: 28,
  fontSize: 14,
  height: 40,
  ...e.base === "light" && {
    color: e.color.darkest
  },
  "::placeholder": {
    color: e.color.mediumdark
  },
  "&:invalid:not(:placeholder-shown)": {
    boxShadow: `${e.color.negative} 0 0 0 1px inset`
  },
  "&::-webkit-search-decoration, &::-webkit-search-cancel-button, &::-webkit-search-results-button, &::-webkit-search-results-decoration": {
    display: "none"
  }
})), IS = I.div({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  position: "relative"
}), SS = I.div(({ theme: e }) => ({
  position: "absolute",
  top: 0,
  left: 16,
  zIndex: 1,
  pointerEvents: "none",
  color: e.darkest,
  display: "flex",
  alignItems: "center",
  height: "100%"
})), xS = I.div(({ theme: e }) => ({
  position: "absolute",
  top: 0,
  right: 16,
  zIndex: 1,
  color: e.darkest,
  display: "flex",
  alignItems: "center",
  height: "100%",
  "@keyframes spin": {
    from: { transform: "rotate(0deg)" },
    to: { transform: "rotate(360deg)" }
  },
  animation: "spin 1s linear infinite"
})), wS = I(Et.Error)({
  position: "absolute",
  padding: "8px 40px 8px 16px",
  bottom: 0,
  maxHeight: "initial",
  width: "100%",
  div: {
    wordBreak: "break-word"
  },
  "> div": {
    padding: 0
  }
}), ES = I(hn)({
  position: "absolute",
  top: 4,
  right: -24,
  cursor: "pointer"
}), Hm = /* @__PURE__ */ a(({
  open: e,
  onOpenChange: t,
  fileSearchQuery: r,
  setFileSearchQuery: n,
  isLoading: i,
  error: o,
  searchResults: l,
  onCreateNewStory: u,
  setError: c,
  container: p
}) => {
  let [d, h] = pm(), [f, y] = J(h.height), [, m] = hs(), [b, x] = J(r);
  return K(() => {
    f < h.height && y(h.height);
  }, [h.height, f]), /* @__PURE__ */ s.createElement(
    gS,
    {
      height: hS,
      width: 440,
      open: e,
      onOpenChange: t,
      onEscapeKeyDown: () => {
        t(!1);
      },
      onInteractOutside: () => {
        t(!1);
      },
      container: p
    },
    /* @__PURE__ */ s.createElement(yS, { height: r === "" ? h.height : f }, /* @__PURE__ */ s.createElement(vS, { ref: d }, /* @__PURE__ */ s.
    createElement(Et.Header, null, /* @__PURE__ */ s.createElement(Et.Title, null, "Add a new story"), /* @__PURE__ */ s.createElement(Et.Description,
    null, "We will create a new story for your component")), /* @__PURE__ */ s.createElement(IS, null, /* @__PURE__ */ s.createElement(SS, null,
    /* @__PURE__ */ s.createElement(bn, null)), /* @__PURE__ */ s.createElement(
      bS,
      {
        placeholder: "./components/**/*.tsx",
        type: "search",
        required: !0,
        autoFocus: !0,
        value: b,
        onChange: (_) => {
          let g = _.target.value;
          x(g), m(() => {
            n(g);
          });
        }
      }
    ), i && /* @__PURE__ */ s.createElement(xS, null, /* @__PURE__ */ s.createElement(mt, null))), /* @__PURE__ */ s.createElement(
      Bm,
      {
        errorItemId: o?.selectedItemId,
        isLoading: i,
        searchResults: l,
        onNewStory: u
      }
    ))),
    o && r !== "" && /* @__PURE__ */ s.createElement(wS, null, /* @__PURE__ */ s.createElement("div", null, o.error), /* @__PURE__ */ s.createElement(
      ES,
      {
        onClick: () => {
          c(null);
        }
      }
    ))
  );
}, "FileSearchModal");

// src/manager/components/sidebar/FileSearchModal.utils.tsx
function Rm(e) {
  return Object.keys(e).reduce(
    (r, n) => {
      let i = e[n];
      if (typeof i.control == "object" && "type" in i.control)
        switch (i.control.type) {
          case "object":
            r[n] = {};
            break;
          case "inline-radio":
          case "radio":
          case "inline-check":
          case "check":
          case "select":
          case "multi-select":
            r[n] = i.control.options?.[0];
            break;
          case "color":
            r[n] = "#000000";
            break;
          default:
            break;
        }
      return Eo(i.type, r, n), r;
    },
    {}
  );
}
a(Rm, "extractSeededRequiredArgs");
function Eo(e, t, r) {
  if (!(typeof e == "string" || !e.required))
    switch (e.name) {
      case "boolean":
        t[r] = !0;
        break;
      case "number":
        t[r] = 0;
        break;
      case "string":
        t[r] = r;
        break;
      case "array":
        t[r] = [];
        break;
      case "object":
        t[r] = {}, Object.entries(e.value ?? {}).forEach(([n, i]) => {
          Eo(i, t[r], n);
        });
        break;
      case "function":
        t[r] = () => {
        };
        break;
      case "intersection":
        e.value?.every((n) => n.name === "object") && (t[r] = {}, e.value?.forEach((n) => {
          n.name === "object" && Object.entries(n.value ?? {}).forEach(([i, o]) => {
            Eo(o, t[r], i);
          });
        }));
        break;
      case "union":
        e.value?.[0] !== void 0 && Eo(e.value[0], t, r);
        break;
      case "enum":
        e.value?.[0] !== void 0 && (t[r] = e.value?.[0]);
        break;
      case "other":
        typeof e.value == "string" && e.value === "tuple" && (t[r] = []);
        break;
      default:
        break;
    }
}
a(Eo, "setArgType");
async function Co(e, t, r = 1) {
  if (r > 10)
    throw new Error("We could not select the new story. Please try again.");
  try {
    await e(t);
  } catch {
    return await new Promise((i) => setTimeout(i, 500)), Co(e, t, r + 1);
  }
}
a(Co, "trySelectNewStory");

// src/manager/components/sidebar/CreateNewStoryFileModal.tsx
var CS = /* @__PURE__ */ a((e) => JSON.stringify(e, (t, r) => typeof r == "function" ? "__sb_empty_function_arg__" : r), "stringifyArgs"), zm = /* @__PURE__ */ a(
({ open: e, onOpenChange: t }) => {
  let [r, n] = J(!1), [i, o] = J(""), l = cm(i, 600), u = ms(l), c = X(null), [p, d] = J(
    null
  ), h = de(), [f, y] = J(null), m = A(
    (g) => {
      h.addNotification({
        id: "create-new-story-file-success",
        content: {
          headline: "Story file created",
          subHeadline: `${g} was created`
        },
        duration: 8e3,
        icon: /* @__PURE__ */ s.createElement(rt, null)
      }), t(!1);
    },
    [h, t]
  ), b = A(() => {
    h.addNotification({
      id: "create-new-story-file-error",
      content: {
        headline: "Story already exists",
        subHeadline: "Successfully navigated to existing story"
      },
      duration: 8e3,
      icon: /* @__PURE__ */ s.createElement(rt, null)
    }), t(!1);
  }, [h, t]), x = A(() => {
    n(!0);
    let g = Qe.getChannel(), v = /* @__PURE__ */ a((S) => {
      S.id === u && (S.success ? y(S.payload.files) : d({ error: S.error }), g.off(qr, v), n(!1), c.current = null);
    }, "set");
    return g.on(qr, v), u !== "" && c.current !== u ? (c.current = u, g.emit(os, {
      id: u,
      payload: {}
    })) : (y(null), n(!1)), () => {
      g.off(qr, v);
    };
  }, [u]), _ = A(
    async ({
      componentExportName: g,
      componentFilePath: v,
      componentIsDefaultExport: S,
      componentExportCount: C,
      selectedItemId: E
    }) => {
      try {
        let k = Qe.getChannel(), O = await Gr(k, rs, ns, {
          componentExportName: g,
          componentFilePath: v,
          componentIsDefaultExport: S,
          componentExportCount: C
        });
        d(null);
        let w = O.storyId;
        await Co(h.selectStory, w);
        try {
          let P = (await Gr(k, Ja, es, {
            storyId: w
          })).argTypes, M = Rm(P);
          await Gr(
            k,
            as,
            ss,
            {
              args: CS(M),
              importPath: O.storyFilePath,
              csfId: w
            }
          );
        } catch {
        }
        m(g), x();
      } catch (k) {
        switch (k?.payload?.type) {
          case "STORY_FILE_EXISTS":
            let O = k;
            await Co(h.selectStory, O.payload.kind), b();
            break;
          default:
            d({ selectedItemId: E, error: k?.message });
            break;
        }
      }
    },
    [h?.selectStory, m, x, b]
  );
  return K(() => {
    d(null);
  }, [u]), K(() => x(), [x]), /* @__PURE__ */ s.createElement(
    Hm,
    {
      error: p,
      fileSearchQuery: i,
      fileSearchQueryDeferred: u,
      onCreateNewStory: _,
      isLoading: r,
      onOpenChange: t,
      open: e,
      searchResults: f,
      setError: d,
      setFileSearchQuery: o
    }
  );
}, "CreateNewStoryFileModal");

// src/manager/components/sidebar/types.ts
function jr(e) {
  return !!(e && e.showAll);
}
a(jr, "isExpandType");
function $a(e) {
  return !!(e && e.item);
}
a($a, "isSearchResult");

// src/manager/components/sidebar/Search.tsx
var { document: _S } = ae, Wa = 50, TS = {
  shouldSort: !0,
  tokenize: !0,
  findAllMatches: !0,
  includeScore: !0,
  includeMatches: !0,
  threshold: 0.2,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: [
    { name: "name", weight: 0.7 },
    { name: "path", weight: 0.3 }
  ]
}, kS = I.div({
  display: "flex",
  flexDirection: "row",
  columnGap: 6
}), OS = I(dn)({
  margin: 0
}), PS = I.label({
  position: "absolute",
  left: -1e4,
  top: "auto",
  width: 1,
  height: 1,
  overflow: "hidden"
}), AS = I(te)(({ theme: e }) => ({
  color: e.color.mediumdark
})), MS = I.div(({ theme: e }) => ({
  position: "absolute",
  top: 0,
  left: 8,
  zIndex: 1,
  pointerEvents: "none",
  color: e.textMutedColor,
  display: "flex",
  alignItems: "center",
  height: "100%"
})), DS = I.div({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  position: "relative"
}), LS = I.input(({ theme: e }) => ({
  appearance: "none",
  height: 28,
  paddingLeft: 28,
  paddingRight: 28,
  border: 0,
  boxShadow: `${e.button.border} 0 0 0 1px inset`,
  background: "transparent",
  borderRadius: 4,
  fontSize: `${e.typography.size.s1 + 1}px`,
  fontFamily: "inherit",
  transition: "all 150ms",
  color: e.color.defaultText,
  width: "100%",
  "&:focus, &:active": {
    outline: 0,
    borderColor: e.color.secondary,
    background: e.background.app
  },
  "&::placeholder": {
    color: e.textMutedColor,
    opacity: 1
  },
  "&:valid ~ code, &:focus ~ code": {
    display: "none"
  },
  "&:invalid ~ svg": {
    display: "none"
  },
  "&:valid ~ svg": {
    display: "block"
  },
  "&::-ms-clear": {
    display: "none"
  },
  "&::-webkit-search-decoration, &::-webkit-search-cancel-button, &::-webkit-search-results-button, &::-webkit-search-results-decoration": {
    display: "none"
  }
})), NS = I.code(({ theme: e }) => ({
  position: "absolute",
  top: 6,
  right: 9,
  height: 16,
  zIndex: 1,
  lineHeight: "16px",
  textAlign: "center",
  fontSize: "11px",
  color: e.base === "light" ? e.color.dark : e.textMutedColor,
  userSelect: "none",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  gap: 4
})), FS = I.span({
  fontSize: "14px"
}), BS = I.div(({ theme: e }) => ({
  position: "absolute",
  top: 0,
  right: 8,
  zIndex: 1,
  color: e.textMutedColor,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  height: "100%"
})), HS = I.div({ outline: 0 }), RS = ae.CONFIG_TYPE === "DEVELOPMENT", zS = ae.STORYBOOK_RENDERER === "react", Wm = s.memo(/* @__PURE__ */ a(
function({
  children: t,
  dataset: r,
  enableShortcuts: n = !0,
  getLastViewed: i,
  initialQuery: o = "",
  showCreateStoryButton: l = RS && zS
}) {
  let u = de(), c = X(null), [p, d] = J("Find components"), [h, f] = J(!1), y = u ? Xe(u.getShortcutKeys().search) : "/", [m, b] = J(!1), x = A(
  () => {
    let E = r.entries.reduce((k, [O, { index: w, status: T }]) => {
      let P = jn(w || {}, T);
      return w && k.push(
        ...Object.values(w).map((M) => {
          let D = T && T[M.id] ? zr(Object.values(T[M.id] || {}).map((L) => L.status)) : null;
          return {
            ...Bi(M, r.hash[O]),
            status: D || P[M.id] || null
          };
        })
      ), k;
    }, []);
    return new $m.default(E, TS);
  }, [r]), _ = A(
    (E) => {
      let k = x();
      if (!E)
        return [];
      let O = [], w = /* @__PURE__ */ new Set(), T = k.search(E).filter(({ item: P }) => !(P.type === "component" || P.type === "docs" || P.
      type === "story") || // @ts-expect-error (non strict)
      w.has(P.parent) ? !1 : (w.add(P.id), !0));
      return T.length && (O = T.slice(0, h ? 1e3 : Wa), T.length > Wa && !h && O.push({
        showAll: /* @__PURE__ */ a(() => f(!0), "showAll"),
        totalCount: T.length,
        moreCount: T.length - Wa
      })), O;
    },
    [h, x]
  ), g = A(
    (E) => {
      if ($a(E)) {
        let { id: k, refId: O } = E.item;
        u?.selectStory(k, void 0, { ref: O !== st && O }), c.current.blur(), f(!1);
        return;
      }
      jr(E) && E.showAll();
    },
    [u]
  ), v = A((E, k) => {
    f(!1);
  }, []), S = A(
    (E, k) => {
      switch (k.type) {
        case Vt.stateChangeTypes.blurInput:
          return {
            ...k,
            // Prevent clearing the input on blur
            inputValue: E.inputValue,
            // Return to the tree view after selecting an item
            isOpen: E.inputValue && !E.selectedItem
          };
        case Vt.stateChangeTypes.mouseUp:
          return E;
        case Vt.stateChangeTypes.keyDownEscape:
          return E.inputValue ? { ...k, inputValue: "", isOpen: !0, selectedItem: null } : { ...k, isOpen: !1, selectedItem: null };
        case Vt.stateChangeTypes.clickItem:
        case Vt.stateChangeTypes.keyDownEnter:
          return $a(k.selectedItem) ? { ...k, inputValue: E.inputValue } : jr(k.selectedItem) ? E : k;
        default:
          return k;
      }
    },
    []
  ), { isMobile: C } = Ee();
  return (
    // @ts-expect-error (non strict)
    /* @__PURE__ */ s.createElement(
      Vt,
      {
        initialInputValue: o,
        stateReducer: S,
        itemToString: (E) => E?.item?.name || "",
        scrollIntoView: (E) => Nt(E),
        onSelect: g,
        onInputValueChange: v
      },
      ({
        isOpen: E,
        openMenu: k,
        closeMenu: O,
        inputValue: w,
        clearSelection: T,
        getInputProps: P,
        getItemProps: M,
        getLabelProps: D,
        getMenuProps: L,
        getRootProps: W,
        highlightedIndex: Z
      }) => {
        let G = w ? w.trim() : "", R = G ? _(G) : [], z = !G && i();
        z && z.length && (R = z.reduce((N, { storyId: F, refId: $ }) => {
          let Q = r.hash[$];
          if (Q && Q.index && Q.index[F]) {
            let ne = Q.index[F], ee = ne.type === "story" ? Q.index[ne.parent] : ne;
            N.some((le) => le.item.refId === $ && le.item.id === ee.id) || N.push({ item: Bi(ee, r.hash[$]), matches: [], score: 0 });
          }
          return N;
        }, []));
        let B = "storybook-explorer-searchfield", re = P({
          id: B,
          ref: c,
          required: !0,
          type: "search",
          placeholder: p,
          onFocus: /* @__PURE__ */ a(() => {
            k(), d("Type to find...");
          }, "onFocus"),
          onBlur: /* @__PURE__ */ a(() => d("Find components"), "onBlur"),
          onKeyDown: /* @__PURE__ */ a((N) => {
            N.key === "Escape" && w.length === 0 && c.current.blur();
          }, "onKeyDown")
        }), H = D({
          htmlFor: B
        });
        return /* @__PURE__ */ s.createElement(s.Fragment, null, /* @__PURE__ */ s.createElement(PS, { ...H }, "Search for components"), /* @__PURE__ */ s.
        createElement(kS, null, /* @__PURE__ */ s.createElement(
          DS,
          {
            ...W({ refKey: "" }, { suppressRefError: !0 }),
            className: "search-field"
          },
          /* @__PURE__ */ s.createElement(MS, null, /* @__PURE__ */ s.createElement(bn, null)),
          /* @__PURE__ */ s.createElement(LS, { ...re }),
          !C && n && !E && /* @__PURE__ */ s.createElement(NS, null, y === "\u2318 K" ? /* @__PURE__ */ s.createElement(s.Fragment, null, /* @__PURE__ */ s.
          createElement(FS, null, "\u2318"), "K") : y),
          E && /* @__PURE__ */ s.createElement(BS, { onClick: () => T() }, /* @__PURE__ */ s.createElement(Ze, null))
        ), l && /* @__PURE__ */ s.createElement(s.Fragment, null, /* @__PURE__ */ s.createElement(
          ze,
          {
            trigger: "hover",
            hasChrome: !1,
            tooltip: /* @__PURE__ */ s.createElement(OS, { note: "Create a new story" })
          },
          /* @__PURE__ */ s.createElement(
            AS,
            {
              onClick: () => {
                b(!0);
              },
              variant: "outline"
            },
            /* @__PURE__ */ s.createElement(fl, null)
          )
        ), /* @__PURE__ */ s.createElement(
          zm,
          {
            open: m,
            onOpenChange: b
          }
        ))), /* @__PURE__ */ s.createElement(HS, { tabIndex: 0, id: "storybook-explorer-menu" }, t({
          query: G,
          results: R,
          isBrowsing: !E && _S.activeElement !== c.current,
          closeMenu: O,
          getMenuProps: L,
          getItemProps: M,
          highlightedIndex: Z
        })));
      }
    )
  );
}, "Search"));

// src/manager/components/sidebar/SearchResults.tsx
var { document: Vm } = ae, $S = I.ol({
  listStyle: "none",
  margin: 0,
  padding: 0
}), WS = I.li(({ theme: e, isHighlighted: t }) => ({
  width: "100%",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  textAlign: "left",
  color: "inherit",
  fontSize: `${e.typography.size.s2}px`,
  background: t ? e.background.hoverable : "transparent",
  minHeight: 28,
  borderRadius: 4,
  gap: 6,
  paddingTop: 7,
  paddingBottom: 7,
  paddingLeft: 8,
  paddingRight: 8,
  "&:hover, &:focus": {
    background: ye(0.93, e.color.secondary),
    outline: "none"
  }
})), VS = I.div({
  marginTop: 2
}), KS = I.div({
  flex: 1,
  display: "flex",
  flexDirection: "column"
}), jS = I.div(({ theme: e }) => ({
  marginTop: 20,
  textAlign: "center",
  fontSize: `${e.typography.size.s2}px`,
  lineHeight: "18px",
  color: e.color.defaultText,
  small: {
    color: e.barTextColor,
    fontSize: `${e.typography.size.s1}px`
  }
})), US = I.mark(({ theme: e }) => ({
  background: "transparent",
  color: e.color.secondary
})), qS = I.div({
  marginTop: 8
}), GS = I.div(({ theme: e }) => ({
  display: "flex",
  justifyContent: "space-between",
  fontSize: `${e.typography.size.s1 - 1}px`,
  fontWeight: e.typography.weight.bold,
  minHeight: 28,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: e.textMutedColor,
  marginTop: 16,
  marginBottom: 4,
  alignItems: "center",
  ".search-result-recentlyOpened-clear": {
    visibility: "hidden"
  },
  "&:hover": {
    ".search-result-recentlyOpened-clear": {
      visibility: "visible"
    }
  }
})), Km = s.memo(/* @__PURE__ */ a(function({
  children: t,
  match: r
}) {
  if (!r)
    return t;
  let { value: n, indices: i } = r, { nodes: o } = i.reduce(
    ({ cursor: l, nodes: u }, [c, p], d, { length: h }) => (u.push(/* @__PURE__ */ s.createElement("span", { key: `${d}-1` }, n.slice(l, c))),
    u.push(/* @__PURE__ */ s.createElement(US, { key: `${d}-2` }, n.slice(c, p + 1))), d === h - 1 && u.push(/* @__PURE__ */ s.createElement(
    "span", { key: `${d}-3` }, n.slice(p + 1))), { cursor: p + 1, nodes: u }),
    { cursor: 0, nodes: [] }
  );
  return /* @__PURE__ */ s.createElement("span", null, o);
}, "Highlight")), YS = I.div(({ theme: e }) => ({
  display: "grid",
  justifyContent: "start",
  gridAutoColumns: "auto",
  gridAutoFlow: "column",
  "& > span": {
    display: "block",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }
})), QS = I.div(({ theme: e }) => ({
  display: "grid",
  justifyContent: "start",
  gridAutoColumns: "auto",
  gridAutoFlow: "column",
  fontSize: `${e.typography.size.s1 - 1}px`,
  "& > span": {
    display: "block",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  "& > span + span": {
    "&:before": {
      content: "' / '"
    }
  }
})), XS = s.memo(/* @__PURE__ */ a(function({ item: t, matches: r, onClick: n, ...i }) {
  let o = A(
    (d) => {
      d.preventDefault(), n?.(d);
    },
    [n]
  ), l = de();
  K(() => {
    l && i.isHighlighted && t.type === "component" && l.emit(wt, { ids: [t.children[0]] }, { options: { target: t.refId } });
  }, [i.isHighlighted, t]);
  let u = r.find((d) => d.key === "name"), c = r.filter((d) => d.key === "path"), [p] = t.status ? Rr[t.status] : [];
  return /* @__PURE__ */ s.createElement(WS, { ...i, onClick: o }, /* @__PURE__ */ s.createElement(VS, null, t.type === "component" && /* @__PURE__ */ s.
  createElement(bt, { viewBox: "0 0 14 14", width: "14", height: "14", type: "component" }, /* @__PURE__ */ s.createElement(He, { type: "com\
ponent" })), t.type === "story" && /* @__PURE__ */ s.createElement(bt, { viewBox: "0 0 14 14", width: "14", height: "14", type: "story" }, /* @__PURE__ */ s.
  createElement(He, { type: "story" })), !(t.type === "component" || t.type === "story") && /* @__PURE__ */ s.createElement(bt, { viewBox: "\
0 0 14 14", width: "14", height: "14", type: "document" }, /* @__PURE__ */ s.createElement(He, { type: "document" }))), /* @__PURE__ */ s.createElement(
  KS, { className: "search-result-item--label" }, /* @__PURE__ */ s.createElement(YS, null, /* @__PURE__ */ s.createElement(Km, { match: u },
  t.name)), /* @__PURE__ */ s.createElement(QS, null, t.path.map((d, h) => /* @__PURE__ */ s.createElement("span", { key: h }, /* @__PURE__ */ s.
  createElement(Km, { match: c.find((f) => f.arrayIndex === h) }, d))))), t.status ? /* @__PURE__ */ s.createElement(Gp, { status: t.status },
  p) : null);
}, "Result")), jm = s.memo(/* @__PURE__ */ a(function({
  query: t,
  results: r,
  closeMenu: n,
  getMenuProps: i,
  getItemProps: o,
  highlightedIndex: l,
  isLoading: u = !1,
  enableShortcuts: c = !0,
  clearLastViewed: p
}) {
  let d = de();
  K(() => {
    let y = /* @__PURE__ */ a((m) => {
      if (!(!c || u || m.repeat) && It(!1, m) && Ue("Escape", m)) {
        if (m.target?.id === "storybook-explorer-searchfield")
          return;
        m.preventDefault(), n();
      }
    }, "handleEscape");
    return Vm.addEventListener("keydown", y), () => Vm.removeEventListener("keydown", y);
  }, [n, c, u]);
  let h = A((y) => {
    if (!d)
      return;
    let m = y.currentTarget, b = m.getAttribute("data-id"), x = m.getAttribute("data-refid"), _ = d.resolveStory(b, x === "storybook_interna\
l" ? void 0 : x);
    _?.type === "component" && d.emit(wt, {
      // @ts-expect-error (TODO)
      ids: [_.isLeaf ? _.id : _.children[0]],
      options: { target: x }
    });
  }, []), f = /* @__PURE__ */ a(() => {
    p(), n();
  }, "handleClearLastViewed");
  return /* @__PURE__ */ s.createElement($S, { ...i() }, r.length > 0 && !t && /* @__PURE__ */ s.createElement(GS, { className: "search-resu\
lt-recentlyOpened" }, "Recently opened", /* @__PURE__ */ s.createElement(
    te,
    {
      className: "search-result-recentlyOpened-clear",
      onClick: f
    },
    /* @__PURE__ */ s.createElement(yl, null)
  )), r.length === 0 && t && /* @__PURE__ */ s.createElement("li", null, /* @__PURE__ */ s.createElement(jS, null, /* @__PURE__ */ s.createElement(
  "strong", null, "No components found"), /* @__PURE__ */ s.createElement("br", null), /* @__PURE__ */ s.createElement("small", null, "Find \
components by name or path."))), r.map((y, m) => {
    if (jr(y))
      return /* @__PURE__ */ s.createElement(qS, { key: "search-result-expand" }, /* @__PURE__ */ s.createElement(
        we,
        {
          ...y,
          ...o({ key: m, index: m, item: y }),
          size: "small"
        },
        "Show ",
        y.moreCount,
        " more results"
      ));
    let { item: b } = y, x = `${b.refId}::${b.id}`;
    return /* @__PURE__ */ s.createElement(
      XS,
      {
        key: b.id,
        ...y,
        ...o({ key: x, index: m, item: y }),
        isHighlighted: l === m,
        "data-id": y.item.id,
        "data-refid": y.item.refId,
        onMouseOver: h,
        className: "search-result-item"
      }
    );
  }));
}, "SearchResults"));

// src/manager/components/sidebar/FilterToggle.tsx
var ZS = I(on)(({ theme: e }) => ({
  padding: "4px 8px",
  fontSize: e.typography.size.s1
})), JS = I(te)(
  ({ theme: e }) => ({
    fontSize: e.typography.size.s2,
    "&:hover [data-badge][data-status=warning], [data-badge=true][data-status=warning]": {
      background: "#E3F3FF",
      borderColor: "rgba(2, 113, 182, 0.1)",
      color: "#0271B6"
    },
    "&:hover [data-badge][data-status=critical], [data-badge=true][data-status=critical]": {
      background: e.background.negative,
      boxShadow: "inset 0 0 0 1px rgba(182, 2, 2, 0.1)",
      color: e.color.negativeText
    }
  }),
  ({ active: e, theme: t }) => !e && Ss({
    "&:hover": {
      color: t.base === "light" ? t.color.defaultText : t.color.light
    }
  })
), ex = I.span(({ theme: e }) => ({
  color: e.base === "light" ? e.color.defaultText : e.color.light
})), Va = /* @__PURE__ */ a(({
  active: e,
  count: t,
  label: r,
  status: n,
  ...i
}) => /* @__PURE__ */ s.createElement(JS, { active: e, ...i }, /* @__PURE__ */ s.createElement(ZS, { status: n, "data-badge": e, "data-statu\
s": n }, t), /* @__PURE__ */ s.createElement(ex, null, `${r}${t === 1 ? "" : "s"}`)), "FilterToggle");

// src/manager/components/sidebar/SidebarBottom.tsx
var tx = /* @__PURE__ */ a(() => !0, "filterNone"), rx = /* @__PURE__ */ a(({ status: e = {} }) => Object.values(e).some((t) => t?.status ===
"warn"), "filterWarn"), nx = /* @__PURE__ */ a(({ status: e = {} }) => Object.values(e).some((t) => t?.status === "error"), "filterError"), ox = /* @__PURE__ */ a(
({ status: e = {} }) => Object.values(e).some((t) => t?.status === "warn" || t?.status === "error"), "filterBoth"), ix = /* @__PURE__ */ a((e = !1, t = !1) => e &&
t ? ox : e ? rx : t ? nx : tx, "getFilter"), ax = I.div({
  display: "flex",
  gap: 5
}), sx = /* @__PURE__ */ a(({ api: e, status: t = {} }) => {
  let [r, n] = s.useState(!1), [i, o] = s.useState(!1), l = Object.values(t).filter(
    (f) => Object.values(f).some((y) => y?.status === "warn")
  ), u = Object.values(t).filter(
    (f) => Object.values(f).some((y) => y?.status === "error")
  ), c = l.length > 0, p = u.length > 0, d = A(() => n((f) => !f), []), h = A(() => o((f) => !f), []);
  return K(() => {
    let f = ix(c && r, p && i);
    e.experimental_setFilter("sidebar-bottom-filter", f);
  }, [e, c, p, r, i]), !c && !p ? null : /* @__PURE__ */ s.createElement(ax, { id: "sidebar-bottom-wrapper" }, p && /* @__PURE__ */ s.createElement(
    Va,
    {
      id: "errors-found-filter",
      active: i,
      count: u.length,
      label: "Error",
      status: "critical",
      onClick: h
    }
  ), c && /* @__PURE__ */ s.createElement(
    Va,
    {
      id: "warnings-found-filter",
      active: r,
      count: l.length,
      label: "Warning",
      status: "warning",
      onClick: d
    }
  ));
}, "SidebarBottomBase"), Um = /* @__PURE__ */ a(() => {
  let e = de(), { status: t } = Ke();
  return /* @__PURE__ */ s.createElement(sx, { api: e, status: t });
}, "SidebarBottom");

// src/manager/components/sidebar/useLastViewed.ts
var Ym = Be(Ki(), 1), ko = Be(qm(), 1);
var Gm = (0, Ym.default)((e) => ko.default.set("lastViewedStoryIds", e), 1e3), Qm = /* @__PURE__ */ a((e) => {
  let t = j(() => {
    let i = ko.default.get("lastViewedStoryIds");
    return !i || !Array.isArray(i) ? [] : i.some((o) => typeof o == "object" && o.storyId && o.refId) ? i : [];
  }, [ko.default]), r = X(t), n = A(
    (i) => {
      let o = r.current, l = o.findIndex(
        ({ storyId: u, refId: c }) => u === i.storyId && c === i.refId
      );
      l !== 0 && (l === -1 ? r.current = [i, ...o] : r.current = [i, ...o.slice(0, l), ...o.slice(l + 1)], Gm(r.current));
    },
    [r]
  );
  return K(() => {
    e && n(e);
  }, [e]), {
    getLastViewed: A(() => r.current, [r]),
    clearLastViewed: A(() => {
      r.current = r.current.slice(0, 1), Gm(r.current);
    }, [r])
  };
}, "useLastViewed");

// src/manager/components/sidebar/Sidebar.tsx
var st = "storybook_internal", lx = I.nav(({ theme: e }) => ({
  position: "absolute",
  zIndex: 1,
  left: 0,
  top: 0,
  bottom: 0,
  right: 0,
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  background: e.background.content,
  [lt]: {
    background: e.background.app
  }
})), ux = I(ut)({
  paddingLeft: 12,
  paddingRight: 12,
  paddingBottom: 20,
  paddingTop: 16,
  flex: 1
}), cx = I.div(({ theme: e }) => ({
  borderTop: `1px solid ${e.appBorderColor}`,
  padding: e.layoutMargin / 2,
  display: "flex",
  flexWrap: "wrap",
  gap: e.layoutMargin / 2,
  backgroundColor: e.barBg,
  "&:empty": {
    display: "none"
  }
})), px = s.memo(/* @__PURE__ */ a(function({
  children: t,
  condition: r
}) {
  let [n, i] = s.Children.toArray(t);
  return /* @__PURE__ */ s.createElement(s.Fragment, null, /* @__PURE__ */ s.createElement("div", { style: { display: r ? "block" : "none" } },
  n), /* @__PURE__ */ s.createElement("div", { style: { display: r ? "none" : "block" } }, i));
}, "Swap")), dx = /* @__PURE__ */ a((e, t, r, n, i) => {
  let o = j(
    () => ({
      [st]: {
        index: e,
        indexError: t,
        previewInitialized: r,
        status: n,
        title: null,
        id: st,
        url: "iframe.html"
      },
      ...i
    }),
    [i, e, t, r, n]
  );
  return j(() => ({ hash: o, entries: Object.entries(o) }), [o]);
}, "useCombination"), Xm = s.memo(/* @__PURE__ */ a(function({
  // @ts-expect-error (non strict)
  storyId: t = null,
  refId: r = st,
  index: n,
  indexError: i,
  status: o,
  previewInitialized: l,
  menu: u,
  extra: c,
  menuHighlighted: p = !1,
  enableShortcuts: d = !0,
  refs: h = {},
  onMenuClick: f,
  showCreateStoryButton: y
}) {
  let m = j(() => t && { storyId: t, refId: r }, [t, r]), b = dx(n, i, l, o, h), x = !n && !i, _ = Qm(m);
  return /* @__PURE__ */ s.createElement(lx, { className: "container sidebar-container" }, /* @__PURE__ */ s.createElement(ln, { vertical: !0,
  offset: 3, scrollbarSize: 6 }, /* @__PURE__ */ s.createElement(ux, { row: 1.6 }, /* @__PURE__ */ s.createElement(
    Qd,
    {
      className: "sidebar-header",
      menuHighlighted: p,
      menu: u,
      extra: c,
      skipLinkHref: "#storybook-preview-wrapper",
      isLoading: x,
      onMenuClick: f
    }
  ), /* @__PURE__ */ s.createElement(
    Wm,
    {
      dataset: b,
      enableShortcuts: d,
      showCreateStoryButton: y,
      ..._
    },
    ({
      query: g,
      results: v,
      isBrowsing: S,
      closeMenu: C,
      getMenuProps: E,
      getItemProps: k,
      highlightedIndex: O
    }) => /* @__PURE__ */ s.createElement(px, { condition: S }, /* @__PURE__ */ s.createElement(
      jd,
      {
        dataset: b,
        selected: m,
        isLoading: x,
        isBrowsing: S
      }
    ), /* @__PURE__ */ s.createElement(
      jm,
      {
        query: g,
        results: v,
        closeMenu: C,
        getMenuProps: E,
        getItemProps: k,
        highlightedIndex: O,
        enableShortcuts: d,
        isLoading: x,
        clearLastViewed: _.clearLastViewed
      }
    ))
  ))), x ? null : /* @__PURE__ */ s.createElement(cx, { className: "sb-bar" }, /* @__PURE__ */ s.createElement(Um, null)));
}, "Sidebar"));

// src/manager/container/Menu.tsx
var fx = {
  storySearchField: "storybook-explorer-searchfield",
  storyListMenu: "storybook-explorer-menu",
  storyPanelRoot: "storybook-panel-root"
}, mx = I.span(({ theme: e }) => ({
  display: "inline-block",
  height: 16,
  lineHeight: "16px",
  textAlign: "center",
  fontSize: "11px",
  background: e.base === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
  color: e.base === "light" ? e.color.dark : e.textMutedColor,
  borderRadius: 2,
  userSelect: "none",
  pointerEvents: "none",
  padding: "0 6px"
})), hx = I.code(
  ({ theme: e }) => `
  padding: 0;
  vertical-align: middle;

  & + & {
    margin-left: 6px;
  }
`
), Ve = /* @__PURE__ */ a(({ keys: e }) => /* @__PURE__ */ s.createElement(s.Fragment, null, /* @__PURE__ */ s.createElement(mx, null, e.map(
(t, r) => /* @__PURE__ */ s.createElement(hx, { key: t }, Xe([t]))))), "Shortcut"), Zm = /* @__PURE__ */ a((e, t, r, n, i, o, l) => {
  let u = De(), c = t.getShortcutKeys(), p = j(
    () => ({
      id: "about",
      title: "About your Storybook",
      onClick: /* @__PURE__ */ a(() => t.changeSettingsTab("about"), "onClick"),
      icon: /* @__PURE__ */ s.createElement(ul, null)
    }),
    [t]
  ), d = j(() => ({
    id: "documentation",
    title: "Documentation",
    href: t.getDocsUrl({ versioned: !0, renderer: !0 }),
    icon: /* @__PURE__ */ s.createElement(_t, null)
  }), [t]), h = e.whatsNewData?.status === "SUCCESS" && !e.disableWhatsNewNotifications, f = t.isWhatsNewUnread(), y = j(
    () => ({
      id: "whats-new",
      title: "What's new?",
      onClick: /* @__PURE__ */ a(() => t.changeSettingsTab("whats-new"), "onClick"),
      right: h && f && /* @__PURE__ */ s.createElement(on, { status: "positive" }, "Check it out"),
      icon: /* @__PURE__ */ s.createElement(vl, null)
    }),
    [t, h, f]
  ), m = j(
    () => ({
      id: "shortcuts",
      title: "Keyboard shortcuts",
      onClick: /* @__PURE__ */ a(() => t.changeSettingsTab("shortcuts"), "onClick"),
      right: l ? /* @__PURE__ */ s.createElement(Ve, { keys: c.shortcutsPage }) : null,
      style: {
        borderBottom: `4px solid ${u.appBorderColor}`
      }
    }),
    [t, l, c.shortcutsPage, u.appBorderColor]
  ), b = j(
    () => ({
      id: "S",
      title: "Show sidebar",
      onClick: /* @__PURE__ */ a(() => t.toggleNav(), "onClick"),
      active: o,
      right: l ? /* @__PURE__ */ s.createElement(Ve, { keys: c.toggleNav }) : null,
      icon: o ? /* @__PURE__ */ s.createElement(rt, null) : null
    }),
    [t, l, c, o]
  ), x = j(
    () => ({
      id: "T",
      title: "Show toolbar",
      onClick: /* @__PURE__ */ a(() => t.toggleToolbar(), "onClick"),
      active: r,
      right: l ? /* @__PURE__ */ s.createElement(Ve, { keys: c.toolbar }) : null,
      icon: r ? /* @__PURE__ */ s.createElement(rt, null) : null
    }),
    [t, l, c, r]
  ), _ = j(
    () => ({
      id: "A",
      title: "Show addons",
      onClick: /* @__PURE__ */ a(() => t.togglePanel(), "onClick"),
      active: i,
      right: l ? /* @__PURE__ */ s.createElement(Ve, { keys: c.togglePanel }) : null,
      icon: i ? /* @__PURE__ */ s.createElement(rt, null) : null
    }),
    [t, l, c, i]
  ), g = j(
    () => ({
      id: "D",
      title: "Change addons orientation",
      onClick: /* @__PURE__ */ a(() => t.togglePanelPosition(), "onClick"),
      right: l ? /* @__PURE__ */ s.createElement(Ve, { keys: c.panelPosition }) : null
    }),
    [t, l, c]
  ), v = j(
    () => ({
      id: "F",
      title: "Go full screen",
      onClick: /* @__PURE__ */ a(() => t.toggleFullscreen(), "onClick"),
      active: n,
      right: l ? /* @__PURE__ */ s.createElement(Ve, { keys: c.fullScreen }) : null,
      icon: n ? /* @__PURE__ */ s.createElement(rt, null) : null
    }),
    [t, l, c, n]
  ), S = j(
    () => ({
      id: "/",
      title: "Search",
      onClick: /* @__PURE__ */ a(() => t.focusOnUIElement(fx.storySearchField), "onClick"),
      right: l ? /* @__PURE__ */ s.createElement(Ve, { keys: c.search }) : null
    }),
    [t, l, c]
  ), C = j(
    () => ({
      id: "up",
      title: "Previous component",
      onClick: /* @__PURE__ */ a(() => t.jumpToComponent(-1), "onClick"),
      right: l ? /* @__PURE__ */ s.createElement(Ve, { keys: c.prevComponent }) : null
    }),
    [t, l, c]
  ), E = j(
    () => ({
      id: "down",
      title: "Next component",
      onClick: /* @__PURE__ */ a(() => t.jumpToComponent(1), "onClick"),
      right: l ? /* @__PURE__ */ s.createElement(Ve, { keys: c.nextComponent }) : null
    }),
    [t, l, c]
  ), k = j(
    () => ({
      id: "prev",
      title: "Previous story",
      onClick: /* @__PURE__ */ a(() => t.jumpToStory(-1), "onClick"),
      right: l ? /* @__PURE__ */ s.createElement(Ve, { keys: c.prevStory }) : null
    }),
    [t, l, c]
  ), O = j(
    () => ({
      id: "next",
      title: "Next story",
      onClick: /* @__PURE__ */ a(() => t.jumpToStory(1), "onClick"),
      right: l ? /* @__PURE__ */ s.createElement(Ve, { keys: c.nextStory }) : null
    }),
    [t, l, c]
  ), w = j(
    () => ({
      id: "collapse",
      title: "Collapse all",
      onClick: /* @__PURE__ */ a(() => t.emit(Ir), "onClick"),
      right: l ? /* @__PURE__ */ s.createElement(Ve, { keys: c.collapseAll }) : null
    }),
    [t, l, c]
  ), T = A(() => {
    let P = t.getAddonsShortcuts(), M = c;
    return Object.entries(P).filter(([D, { showInMenu: L }]) => L).map(([D, { label: L, action: W }]) => ({
      id: D,
      title: L,
      onClick: /* @__PURE__ */ a(() => W(), "onClick"),
      right: l ? /* @__PURE__ */ s.createElement(Ve, { keys: M[D] }) : null
    }));
  }, [t, l, c]);
  return j(
    () => [
      p,
      ...e.whatsNewData?.status === "SUCCESS" ? [y] : [],
      d,
      m,
      b,
      x,
      _,
      g,
      v,
      S,
      C,
      E,
      k,
      O,
      w,
      ...T()
    ],
    [
      p,
      e,
      y,
      d,
      m,
      b,
      x,
      _,
      g,
      v,
      S,
      C,
      E,
      k,
      O,
      w,
      T
    ]
  );
}, "useMenu");

// src/manager/container/Sidebar.tsx
var gx = s.memo(/* @__PURE__ */ a(function({ onMenuClick: t }) {
  return /* @__PURE__ */ s.createElement(he, { filter: /* @__PURE__ */ a(({ state: n, api: i }) => {
    let {
      ui: { name: o, url: l, enableShortcuts: u },
      viewMode: c,
      storyId: p,
      refId: d,
      layout: { showToolbar: h },
      index: f,
      status: y,
      indexError: m,
      previewInitialized: b,
      refs: x
    } = n, _ = Zm(
      n,
      i,
      h,
      i.getIsFullscreen(),
      i.getIsPanelShown(),
      i.getIsNavShown(),
      u
    ), g = n.whatsNewData?.status === "SUCCESS" && !n.disableWhatsNewNotifications, v = i.getElements(Ae.experimental_SIDEBAR_TOP), S = j(() => Object.
    values(v), [Object.keys(v).join("")]);
    return {
      title: o,
      url: l,
      index: f,
      indexError: m,
      status: y,
      previewInitialized: b,
      refs: x,
      storyId: p,
      refId: d,
      viewMode: c,
      menu: _,
      menuHighlighted: g && i.isWhatsNewUnread(),
      enableShortcuts: u,
      extra: S
    };
  }, "mapper") }, (n) => /* @__PURE__ */ s.createElement(Xm, { ...n, onMenuClick: t }));
}, "Sideber")), Jm = gx;

// src/manager/App.tsx
var eh = /* @__PURE__ */ a(({ managerLayoutState: e, setManagerLayoutState: t, pages: r, hasTab: n }) => {
  let { setMobileAboutOpen: i } = Ee();
  return /* @__PURE__ */ s.createElement(s.Fragment, null, /* @__PURE__ */ s.createElement(Yt, { styles: Is }), /* @__PURE__ */ s.createElement(
    eu,
    {
      hasTab: n,
      managerLayoutState: e,
      setManagerLayoutState: t,
      slotMain: /* @__PURE__ */ s.createElement(vp, { id: "main", withLoader: !0 }),
      slotSidebar: /* @__PURE__ */ s.createElement(Jm, { onMenuClick: () => i((o) => !o) }),
      slotPanel: /* @__PURE__ */ s.createElement(nu, null),
      slotPages: r.map(({ id: o, render: l }) => /* @__PURE__ */ s.createElement(l, { key: o }))
    }
  ));
}, "App");

// src/manager/provider.ts
var Ka = class Ka {
  getElements(t) {
    throw new Error("Provider.getElements() is not implemented!");
  }
  handleAPI(t) {
    throw new Error("Provider.handleAPI() is not implemented!");
  }
  getConfig() {
    return console.error("Provider.getConfig() is not implemented!"), {};
  }
};
a(Ka, "Provider");
var jt = Ka;

// src/manager/settings/About.tsx
var yx = I.div({
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
  marginTop: 40
}), vx = I.header({
  marginBottom: 32,
  alignItems: "center",
  display: "flex",
  "> svg": {
    height: 48,
    width: "auto",
    marginRight: 8
  }
}), bx = I.div(({ theme: e }) => ({
  marginBottom: 24,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  color: e.base === "light" ? e.color.dark : e.color.lightest,
  fontWeight: e.typography.weight.regular,
  fontSize: e.typography.size.s2
})), Ix = I.div({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 24,
  marginTop: 24,
  gap: 16
}), th = I(Le)(({ theme: e }) => ({
  "&&": {
    fontWeight: e.typography.weight.bold,
    color: e.base === "light" ? e.color.dark : e.color.light
  },
  "&:hover": {
    color: e.base === "light" ? e.color.darkest : e.color.lightest
  }
})), rh = /* @__PURE__ */ a(({ onNavigateToWhatsNew: e }) => /* @__PURE__ */ s.createElement(yx, null, /* @__PURE__ */ s.createElement(vx, null,
/* @__PURE__ */ s.createElement(un, { alt: "Storybook" })), /* @__PURE__ */ s.createElement(wn, { onNavigateToWhatsNew: e }), /* @__PURE__ */ s.
createElement(bx, null, /* @__PURE__ */ s.createElement(Ix, null, /* @__PURE__ */ s.createElement(we, { asChild: !0 }, /* @__PURE__ */ s.createElement(
"a", { href: "https://github.com/storybookjs/storybook" }, /* @__PURE__ */ s.createElement(gn, null), "GitHub")), /* @__PURE__ */ s.createElement(
we, { asChild: !0 }, /* @__PURE__ */ s.createElement("a", { href: "https://storybook.js.org/docs" }, /* @__PURE__ */ s.createElement(tr, { style: {
display: "inline", marginRight: 5 } }), "Documentation"))), /* @__PURE__ */ s.createElement("div", null, "Open source software maintained by",
" ", /* @__PURE__ */ s.createElement(th, { href: "https://www.chromatic.com/" }, "Chromatic"), " and the", " ", /* @__PURE__ */ s.createElement(
th, { href: "https://github.com/storybookjs/storybook/graphs/contributors" }, "Storybook Community")))), "AboutScreen");

// src/manager/settings/AboutPage.tsx
var Ua = class Ua extends Re {
  componentDidMount() {
    let { api: t, notificationId: r } = this.props;
    t.clearNotification(r);
  }
  render() {
    let { children: t } = this.props;
    return t;
  }
};
a(Ua, "NotificationClearer");
var ja = Ua, nh = /* @__PURE__ */ a(() => {
  let e = de(), t = Ke(), r = A(() => {
    e.changeSettingsTab("whats-new");
  }, [e]);
  return /* @__PURE__ */ s.createElement(ja, { api: e, notificationId: "update" }, /* @__PURE__ */ s.createElement(
    rh,
    {
      onNavigateToWhatsNew: t.whatsNewData?.status === "SUCCESS" ? r : void 0
    }
  ));
}, "AboutPage");

// src/manager/settings/SettingsFooter.tsx
var Sx = I.div(({ theme: e }) => ({
  display: "flex",
  paddingTop: 20,
  marginTop: 20,
  borderTop: `1px solid ${e.appBorderColor}`,
  fontWeight: e.typography.weight.bold,
  "& > * + *": {
    marginLeft: 20
  }
})), xx = /* @__PURE__ */ a((e) => /* @__PURE__ */ s.createElement(Sx, { ...e }, /* @__PURE__ */ s.createElement(Le, { secondary: !0, href: "\
https://storybook.js.org", cancel: !1, target: "_blank" }, "Docs"), /* @__PURE__ */ s.createElement(Le, { secondary: !0, href: "https://gith\
ub.com/storybookjs/storybook", cancel: !1, target: "_blank" }, "GitHub"), /* @__PURE__ */ s.createElement(
  Le,
  {
    secondary: !0,
    href: "https://storybook.js.org/community#support",
    cancel: !1,
    target: "_blank"
  },
  "Support"
)), "SettingsFooter"), oh = xx;

// src/manager/settings/shortcuts.tsx
var wx = I.header(({ theme: e }) => ({
  marginBottom: 20,
  fontSize: e.typography.size.m3,
  fontWeight: e.typography.weight.bold,
  alignItems: "center",
  display: "flex"
})), ih = I.div(({ theme: e }) => ({
  fontWeight: e.typography.weight.bold
})), Ex = I.div({
  alignSelf: "flex-end",
  display: "grid",
  margin: "10px 0",
  gridTemplateColumns: "1fr 1fr 12px",
  "& > *:last-of-type": {
    gridColumn: "2 / 2",
    justifySelf: "flex-end",
    gridRow: "1"
  }
}), Cx = I.div(({ theme: e }) => ({
  padding: "6px 0",
  borderTop: `1px solid ${e.appBorderColor}`,
  display: "grid",
  gridTemplateColumns: "1fr 1fr 0px"
})), _x = I.div({
  display: "grid",
  gridTemplateColumns: "1fr",
  gridAutoRows: "minmax(auto, auto)",
  marginBottom: 20
}), Tx = I.div({
  alignSelf: "center"
}), kx = I(an.Input)(
  ({ valid: e, theme: t }) => e === "error" ? {
    animation: `${t.animation.jiggle} 700ms ease-out`
  } : {},
  {
    display: "flex",
    width: 80,
    flexDirection: "column",
    justifySelf: "flex-end",
    paddingLeft: 4,
    paddingRight: 4,
    textAlign: "center"
  }
), Ox = wr`
0%,100% { opacity: 0; }
  50% { opacity: 1; }
`, Px = I(rt)(
  ({ valid: e, theme: t }) => e === "valid" ? {
    color: t.color.positive,
    animation: `${Ox} 2s ease forwards`
  } : {
    opacity: 0
  },
  {
    alignSelf: "center",
    display: "flex",
    marginLeft: 10,
    height: 14,
    width: 14
  }
), Ax = I.div(({ theme: e }) => ({
  fontSize: e.typography.size.s2,
  padding: "3rem 20px",
  maxWidth: 600,
  margin: "0 auto"
})), Mx = {
  fullScreen: "Go full screen",
  togglePanel: "Toggle addons",
  panelPosition: "Toggle addons orientation",
  toggleNav: "Toggle sidebar",
  toolbar: "Toggle canvas toolbar",
  search: "Focus search",
  focusNav: "Focus sidebar",
  focusIframe: "Focus canvas",
  focusPanel: "Focus addons",
  prevComponent: "Previous component",
  nextComponent: "Next component",
  prevStory: "Previous story",
  nextStory: "Next story",
  shortcutsPage: "Go to shortcuts page",
  aboutPage: "Go to about page",
  collapseAll: "Collapse all items on sidebar",
  expandAll: "Expand all items on sidebar",
  remount: "Remount component"
}, Dx = ["escape"];
function qa(e) {
  return Object.entries(e).reduce(
    // @ts-expect-error (non strict)
    (t, [r, n]) => Dx.includes(r) ? t : { ...t, [r]: { shortcut: n, error: !1 } },
    {}
  );
}
a(qa, "toShortcutState");
var Ga = class Ga extends Re {
  constructor(r) {
    super(r);
    this.onKeyDown = /* @__PURE__ */ a((r) => {
      let { activeFeature: n, shortcutKeys: i } = this.state;
      if (r.key === "Backspace")
        return this.restoreDefault();
      let o = cs(r);
      if (!o)
        return !1;
      let l = !!Object.entries(i).find(
        ([u, { shortcut: c }]) => u !== n && c && ps(o, c)
      );
      return this.setState({
        shortcutKeys: { ...i, [n]: { shortcut: o, error: l } }
      });
    }, "onKeyDown");
    this.onFocus = /* @__PURE__ */ a((r) => () => {
      let { shortcutKeys: n } = this.state;
      this.setState({
        activeFeature: r,
        shortcutKeys: {
          ...n,
          [r]: { shortcut: null, error: !1 }
        }
      });
    }, "onFocus");
    this.onBlur = /* @__PURE__ */ a(async () => {
      let { shortcutKeys: r, activeFeature: n } = this.state;
      if (r[n]) {
        let { shortcut: i, error: o } = r[n];
        return !i || o ? this.restoreDefault() : this.saveShortcut();
      }
      return !1;
    }, "onBlur");
    this.saveShortcut = /* @__PURE__ */ a(async () => {
      let { activeFeature: r, shortcutKeys: n } = this.state, { setShortcut: i } = this.props;
      await i(r, n[r].shortcut), this.setState({ successField: r });
    }, "saveShortcut");
    this.restoreDefaults = /* @__PURE__ */ a(async () => {
      let { restoreAllDefaultShortcuts: r } = this.props, n = await r();
      return this.setState({ shortcutKeys: qa(n) });
    }, "restoreDefaults");
    this.restoreDefault = /* @__PURE__ */ a(async () => {
      let { activeFeature: r, shortcutKeys: n } = this.state, { restoreDefaultShortcut: i } = this.props, o = await i(r);
      return this.setState({
        shortcutKeys: {
          ...n,
          ...qa({ [r]: o })
        }
      });
    }, "restoreDefault");
    this.displaySuccessMessage = /* @__PURE__ */ a((r) => {
      let { successField: n, shortcutKeys: i } = this.state;
      return r === n && i[r].error === !1 ? "valid" : void 0;
    }, "displaySuccessMessage");
    this.displayError = /* @__PURE__ */ a((r) => {
      let { activeFeature: n, shortcutKeys: i } = this.state;
      return r === n && i[r].error === !0 ? "error" : void 0;
    }, "displayError");
    this.renderKeyInput = /* @__PURE__ */ a(() => {
      let { shortcutKeys: r, addonsShortcutLabels: n } = this.state;
      return Object.entries(r).map(([o, { shortcut: l }]) => /* @__PURE__ */ s.createElement(Cx, { key: o }, /* @__PURE__ */ s.createElement(
      Tx, null, Mx[o] || n[o]), /* @__PURE__ */ s.createElement(
        kx,
        {
          spellCheck: "false",
          valid: this.displayError(o),
          className: "modalInput",
          onBlur: this.onBlur,
          onFocus: this.onFocus(o),
          onKeyDown: this.onKeyDown,
          value: l ? Xe(l) : "",
          placeholder: "Type keys",
          readOnly: !0
        }
      ), /* @__PURE__ */ s.createElement(Px, { valid: this.displaySuccessMessage(o) })));
    }, "renderKeyInput");
    this.renderKeyForm = /* @__PURE__ */ a(() => /* @__PURE__ */ s.createElement(_x, null, /* @__PURE__ */ s.createElement(Ex, null, /* @__PURE__ */ s.
    createElement(ih, null, "Commands"), /* @__PURE__ */ s.createElement(ih, null, "Shortcut")), this.renderKeyInput()), "renderKeyForm");
    this.state = {
      // @ts-expect-error (non strict)
      activeFeature: void 0,
      // @ts-expect-error (non strict)
      successField: void 0,
      // The initial shortcutKeys that come from props are the defaults/what was saved
      // As the user interacts with the page, the state stores the temporary, unsaved shortcuts
      // This object also includes the error attached to each shortcut
      // @ts-expect-error (non strict)
      shortcutKeys: qa(r.shortcutKeys),
      addonsShortcutLabels: r.addonsShortcutLabels
    };
  }
  render() {
    let r = this.renderKeyForm();
    return /* @__PURE__ */ s.createElement(Ax, null, /* @__PURE__ */ s.createElement(wx, null, "Keyboard shortcuts"), r, /* @__PURE__ */ s.createElement(
      we,
      {
        variant: "outline",
        size: "small",
        id: "restoreDefaultsHotkeys",
        onClick: this.restoreDefaults
      },
      "Restore defaults"
    ), /* @__PURE__ */ s.createElement(oh, null));
  }
};
a(Ga, "ShortcutsScreen");
var Oo = Ga;

// src/manager/settings/ShortcutsPage.tsx
var ah = /* @__PURE__ */ a(() => /* @__PURE__ */ s.createElement(he, null, ({
  api: {
    getShortcutKeys: e,
    getAddonsShortcutLabels: t,
    setShortcut: r,
    restoreDefaultShortcut: n,
    restoreAllDefaultShortcuts: i
  }
}) => /* @__PURE__ */ s.createElement(
  Oo,
  {
    shortcutKeys: e(),
    addonsShortcutLabels: t(),
    setShortcut: r,
    restoreDefaultShortcut: n,
    restoreAllDefaultShortcuts: i
  }
)), "ShortcutsPage");

// src/manager/settings/whats_new.tsx
var sh = I.div({
  top: "50%",
  position: "absolute",
  transform: "translateY(-50%)",
  width: "100%",
  textAlign: "center"
}), Lx = I.div({
  position: "relative",
  height: "32px"
}), lh = I.div(({ theme: e }) => ({
  paddingTop: "12px",
  color: e.textMutedColor,
  maxWidth: "295px",
  margin: "0 auto",
  fontSize: `${e.typography.size.s1}px`,
  lineHeight: "16px"
})), Nx = I.div(({ theme: e }) => ({
  position: "absolute",
  width: "100%",
  bottom: "40px",
  background: e.background.bar,
  fontSize: "13px",
  borderTop: "1px solid",
  borderColor: e.appBorderColor,
  padding: "8px 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between"
})), Fx = /* @__PURE__ */ a(({
  isNotificationsEnabled: e,
  onToggleNotifications: t,
  onCopyLink: r
}) => {
  let n = De(), [i, o] = J("Copy Link"), l = /* @__PURE__ */ a(() => {
    r(), o("Copied!"), setTimeout(() => o("Copy Link"), 4e3);
  }, "copyLink");
  return /* @__PURE__ */ s.createElement(Nx, null, /* @__PURE__ */ s.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10 } },
  /* @__PURE__ */ s.createElement(ll, { color: n.color.mediumdark }), /* @__PURE__ */ s.createElement("div", null, "Share this with your tea\
m."), /* @__PURE__ */ s.createElement(we, { onClick: l, size: "small", variant: "ghost" }, i)), e ? /* @__PURE__ */ s.createElement(we, { size: "\
small", variant: "ghost", onClick: t }, /* @__PURE__ */ s.createElement(al, null), "Hide notifications") : /* @__PURE__ */ s.createElement(we,
  { size: "small", variant: "ghost", onClick: t }, /* @__PURE__ */ s.createElement(sl, null), "Show notifications"));
}, "WhatsNewFooter"), Bx = I.iframe(
  {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    border: 0,
    margin: 0,
    padding: 0,
    width: "100%",
    height: "calc(100% - 80px)",
    background: "white"
  },
  ({ isLoaded: e }) => ({ visibility: e ? "visible" : "hidden" })
), Hx = I((e) => /* @__PURE__ */ s.createElement(fn, { ...e }))(({ theme: e }) => ({
  color: e.textMutedColor,
  width: 32,
  height: 32,
  margin: "0 auto"
})), Rx = /* @__PURE__ */ a(() => /* @__PURE__ */ s.createElement(sh, null, /* @__PURE__ */ s.createElement(Lx, null, /* @__PURE__ */ s.createElement(
sn, null)), /* @__PURE__ */ s.createElement(lh, null, "Loading...")), "WhatsNewLoader"), zx = /* @__PURE__ */ a(() => /* @__PURE__ */ s.createElement(
sh, null, /* @__PURE__ */ s.createElement(Hx, null), /* @__PURE__ */ s.createElement(lh, null, "The page couldn't be loaded. Check your inte\
rnet connection and try again.")), "MaxWaitTimeMessaging"), $x = /* @__PURE__ */ a(({
  didHitMaxWaitTime: e,
  isLoaded: t,
  onLoad: r,
  url: n,
  onCopyLink: i,
  onToggleNotifications: o,
  isNotificationsEnabled: l
}) => /* @__PURE__ */ s.createElement(Te, null, !t && !e && /* @__PURE__ */ s.createElement(Rx, null), e ? /* @__PURE__ */ s.createElement(zx,
null) : /* @__PURE__ */ s.createElement(s.Fragment, null, /* @__PURE__ */ s.createElement(Bx, { isLoaded: t, onLoad: r, src: n, title: "What\
's new?" }), /* @__PURE__ */ s.createElement(
  Fx,
  {
    isNotificationsEnabled: l,
    onToggleNotifications: o,
    onCopyLink: i
  }
))), "PureWhatsNewScreen"), Wx = 1e4, uh = /* @__PURE__ */ a(() => {
  let e = de(), t = Ke(), { whatsNewData: r } = t, [n, i] = J(!1), [o, l] = J(!1);
  if (K(() => {
    let c = setTimeout(() => !n && l(!0), Wx);
    return () => clearTimeout(c);
  }, [n]), r?.status !== "SUCCESS")
    return null;
  let u = !r.disableWhatsNewNotifications;
  return /* @__PURE__ */ s.createElement(
    $x,
    {
      didHitMaxWaitTime: o,
      isLoaded: n,
      onLoad: () => {
        e.whatsNewHasBeenRead(), i(!0);
      },
      url: r.url,
      isNotificationsEnabled: u,
      onCopyLink: () => {
        navigator.clipboard?.writeText(r.blogUrl ?? r.url);
      },
      onToggleNotifications: () => {
        u ? ae.confirm("All update notifications will no longer be shown. Are you sure?") && e.toggleWhatsNewNotifications() : e.toggleWhatsNewNotifications();
      }
    }
  );
}, "WhatsNewScreen");

// src/manager/settings/whats_new_page.tsx
var ch = /* @__PURE__ */ a(() => /* @__PURE__ */ s.createElement(uh, null), "WhatsNewPage");

// src/manager/settings/index.tsx
var { document: ph } = ae, Vx = I.div(({ theme: e }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  height: 40,
  boxShadow: `${e.appBorderColor}  0 -1px 0 0 inset`,
  background: e.barBg,
  paddingRight: 8
})), Ya = s.memo(/* @__PURE__ */ a(function({
  changeTab: t,
  id: r,
  title: n
}) {
  return /* @__PURE__ */ s.createElement(Zr, null, ({ path: i }) => {
    let o = i.includes(`settings/${r}`);
    return /* @__PURE__ */ s.createElement(
      pn,
      {
        id: `tabbutton-${r}`,
        className: ["tabbutton"].concat(o ? ["tabbutton-active"] : []).join(" "),
        type: "button",
        key: "id",
        active: o,
        onClick: () => t(r),
        role: "tab"
      },
      n
    );
  });
}, "TabBarButton")), Kx = I(ln)(({ theme: e }) => ({
  background: e.background.content
})), jx = /* @__PURE__ */ a(({ changeTab: e, onClose: t, enableShortcuts: r = !0, enableWhatsNew: n }) => (s.useEffect(() => {
  let i = /* @__PURE__ */ a((o) => {
    !r || o.repeat || It(!1, o) && Ue("Escape", o) && (o.preventDefault(), t());
  }, "handleEscape");
  return ph.addEventListener("keydown", i), () => ph.removeEventListener("keydown", i);
}, [r, t]), /* @__PURE__ */ s.createElement(Te, null, /* @__PURE__ */ s.createElement(Vx, { className: "sb-bar" }, /* @__PURE__ */ s.createElement(
cn, { role: "tablist" }, /* @__PURE__ */ s.createElement(Ya, { id: "about", title: "About", changeTab: e }), n && /* @__PURE__ */ s.createElement(
Ya, { id: "whats-new", title: "What's new?", changeTab: e }), /* @__PURE__ */ s.createElement(Ya, { id: "shortcuts", title: "Keyboard shortc\
uts", changeTab: e })), /* @__PURE__ */ s.createElement(
  te,
  {
    onClick: (i) => (i.preventDefault(), t()),
    title: "Close settings page"
  },
  /* @__PURE__ */ s.createElement(Ze, null)
)), /* @__PURE__ */ s.createElement(Kx, { vertical: !0, horizontal: !1 }, /* @__PURE__ */ s.createElement(xr, { path: "about" }, /* @__PURE__ */ s.
createElement(nh, { key: "about" })), /* @__PURE__ */ s.createElement(xr, { path: "whats-new" }, /* @__PURE__ */ s.createElement(ch, { key: "\
whats-new" })), /* @__PURE__ */ s.createElement(xr, { path: "shortcuts" }, /* @__PURE__ */ s.createElement(ah, { key: "shortcuts" }))))), "P\
ages"), Ux = /* @__PURE__ */ a(() => {
  let e = de(), t = Ke(), r = /* @__PURE__ */ a((n) => e.changeSettingsTab(n), "changeTab");
  return /* @__PURE__ */ s.createElement(
    jx,
    {
      enableWhatsNew: t.whatsNewData?.status === "SUCCESS",
      enableShortcuts: t.ui.enableShortcuts,
      changeTab: r,
      onClose: e.closeSettings
    }
  );
}, "SettingsPages"), dh = {
  id: "settings",
  url: "/settings/",
  title: "Settings",
  type: ve.experimental_PAGE,
  render: /* @__PURE__ */ a(() => /* @__PURE__ */ s.createElement(xr, { path: "/settings/", startsWith: !0 }, /* @__PURE__ */ s.createElement(
  Ux, null)), "render")
};

// src/manager/index.tsx
Do.displayName = "ThemeProvider";
ft.displayName = "HelmetProvider";
var qx = /* @__PURE__ */ a(({ provider: e }) => /* @__PURE__ */ s.createElement(ft, { key: "helmet.Provider" }, /* @__PURE__ */ s.createElement(
ys, { key: "location.provider" }, /* @__PURE__ */ s.createElement(Gx, { provider: e }))), "Root"), Gx = /* @__PURE__ */ a(({ provider: e }) => {
  let t = bs();
  return /* @__PURE__ */ s.createElement(Zr, { key: "location.consumer" }, (r) => /* @__PURE__ */ s.createElement(
    us,
    {
      key: "manager",
      provider: e,
      ...r,
      navigate: t,
      docsOptions: ae?.DOCS_OPTIONS || {}
    },
    (n) => {
      let { state: i, api: o } = n, l = A(
        (c) => {
          o.setSizes(c);
        },
        [o]
      ), u = j(
        () => [dh, ...Object.values(o.getElements(ve.experimental_PAGE))],
        [Object.keys(o.getElements(ve.experimental_PAGE)).join()]
      );
      return /* @__PURE__ */ s.createElement(Do, { key: "theme.provider", theme: xs(i.theme) }, /* @__PURE__ */ s.createElement(Hl, null, /* @__PURE__ */ s.
      createElement(
        eh,
        {
          key: "app",
          pages: u,
          managerLayoutState: {
            ...i.layout,
            viewMode: i.viewMode
          },
          hasTab: !!o.getQueryParam("tab"),
          setManagerLayoutState: l
        }
      )));
    }
  ));
}, "Main");
function fh(e, t) {
  if (!(t instanceof jt))
    throw new Es();
  gs(e).render(/* @__PURE__ */ s.createElement(qx, { key: "root", provider: t }));
}
a(fh, "renderStorybookUI");

// src/manager/runtime.ts
var Xa = class Xa extends jt {
  constructor() {
    super();
    let t = Za({ page: "manager" });
    Qe.setChannel(t), t.emit(ts), this.addons = Qe, this.channel = t, ae.__STORYBOOK_ADDONS_CHANNEL__ = t;
  }
  getElements(t) {
    return this.addons.getElements(t);
  }
  getConfig() {
    return this.addons.getConfig();
  }
  handleAPI(t) {
    this.addons.loadAddons(t);
  }
};
a(Xa, "ReactProvider");
var Qa = Xa, { document: Yx } = ae, Qx = Yx.getElementById("root");
setTimeout(() => {
  fh(Qx, new Qa());
}, 0);
