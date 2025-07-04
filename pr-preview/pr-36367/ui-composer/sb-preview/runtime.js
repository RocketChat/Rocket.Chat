var Bi = Object.create;
var Wr = Object.defineProperty;
var Gi = Object.getOwnPropertyDescriptor;
var Vi = Object.getOwnPropertyNames;
var Hi = Object.getPrototypeOf, zi = Object.prototype.hasOwnProperty;
var n = (r, e) => Wr(r, "name", { value: e, configurable: !0 }), nr = /* @__PURE__ */ ((r) => typeof require < "u" ? require : typeof Proxy <
"u" ? new Proxy(r, {
  get: (e, t) => (typeof require < "u" ? require : e)[t]
}) : r)(function(r) {
  if (typeof require < "u") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + r + '" is not supported');
});
var B = (r, e) => () => (e || r((e = { exports: {} }).exports, e), e.exports), Ae = (r, e) => {
  for (var t in e)
    Wr(r, t, { get: e[t], enumerable: !0 });
}, Wi = (r, e, t, o) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (let s of Vi(e))
      !zi.call(r, s) && s !== t && Wr(r, s, { get: () => e[s], enumerable: !(o = Gi(e, s)) || o.enumerable });
  return r;
};
var ue = (r, e, t) => (t = r != null ? Bi(Hi(r)) : {}, Wi(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  e || !r || !r.__esModule ? Wr(t, "default", { value: r, enumerable: !0 }) : t,
  r
));

// ../node_modules/memoizerific/memoizerific.js
var Qr = B((Qn, so) => {
  (function(r) {
    if (typeof Qn == "object" && typeof so < "u")
      so.exports = r();
    else if (typeof define == "function" && define.amd)
      define([], r);
    else {
      var e;
      typeof window < "u" ? e = window : typeof global < "u" ? e = global : typeof self < "u" ? e = self : e = this, e.memoizerific = r();
    }
  })(function() {
    var r, e, t;
    return (/* @__PURE__ */ n(function o(s, a, l) {
      function c(u, d) {
        if (!a[u]) {
          if (!s[u]) {
            var h = typeof nr == "function" && nr;
            if (!d && h) return h(u, !0);
            if (i) return i(u, !0);
            var S = new Error("Cannot find module '" + u + "'");
            throw S.code = "MODULE_NOT_FOUND", S;
          }
          var m = a[u] = { exports: {} };
          s[u][0].call(m.exports, function(T) {
            var y = s[u][1][T];
            return c(y || T);
          }, m, m.exports, o, s, a, l);
        }
        return a[u].exports;
      }
      n(c, "s");
      for (var i = typeof nr == "function" && nr, p = 0; p < l.length; p++) c(l[p]);
      return c;
    }, "e"))({ 1: [function(o, s, a) {
      s.exports = function(l) {
        if (typeof Map != "function" || l) {
          var c = o("./similar");
          return new c();
        } else
          return /* @__PURE__ */ new Map();
      };
    }, { "./similar": 2 }], 2: [function(o, s, a) {
      function l() {
        return this.list = [], this.lastItem = void 0, this.size = 0, this;
      }
      n(l, "Similar"), l.prototype.get = function(c) {
        var i;
        if (this.lastItem && this.isEqual(this.lastItem.key, c))
          return this.lastItem.val;
        if (i = this.indexOf(c), i >= 0)
          return this.lastItem = this.list[i], this.list[i].val;
      }, l.prototype.set = function(c, i) {
        var p;
        return this.lastItem && this.isEqual(this.lastItem.key, c) ? (this.lastItem.val = i, this) : (p = this.indexOf(c), p >= 0 ? (this.lastItem =
        this.list[p], this.list[p].val = i, this) : (this.lastItem = { key: c, val: i }, this.list.push(this.lastItem), this.size++, this));
      }, l.prototype.delete = function(c) {
        var i;
        if (this.lastItem && this.isEqual(this.lastItem.key, c) && (this.lastItem = void 0), i = this.indexOf(c), i >= 0)
          return this.size--, this.list.splice(i, 1)[0];
      }, l.prototype.has = function(c) {
        var i;
        return this.lastItem && this.isEqual(this.lastItem.key, c) ? !0 : (i = this.indexOf(c), i >= 0 ? (this.lastItem = this.list[i], !0) :
        !1);
      }, l.prototype.forEach = function(c, i) {
        var p;
        for (p = 0; p < this.size; p++)
          c.call(i || this, this.list[p].val, this.list[p].key, this);
      }, l.prototype.indexOf = function(c) {
        var i;
        for (i = 0; i < this.size; i++)
          if (this.isEqual(this.list[i].key, c))
            return i;
        return -1;
      }, l.prototype.isEqual = function(c, i) {
        return c === i || c !== c && i !== i;
      }, s.exports = l;
    }, {}], 3: [function(o, s, a) {
      var l = o("map-or-similar");
      s.exports = function(u) {
        var d = new l(!1), h = [];
        return function(S) {
          var m = /* @__PURE__ */ n(function() {
            var T = d, y, x, A = arguments.length - 1, g = Array(A + 1), b = !0, _;
            if ((m.numArgs || m.numArgs === 0) && m.numArgs !== A + 1)
              throw new Error("Memoizerific functions should always be called with the same number of arguments");
            for (_ = 0; _ < A; _++) {
              if (g[_] = {
                cacheItem: T,
                arg: arguments[_]
              }, T.has(arguments[_])) {
                T = T.get(arguments[_]);
                continue;
              }
              b = !1, y = new l(!1), T.set(arguments[_], y), T = y;
            }
            return b && (T.has(arguments[A]) ? x = T.get(arguments[A]) : b = !1), b || (x = S.apply(null, arguments), T.set(arguments[A], x)),
            u > 0 && (g[A] = {
              cacheItem: T,
              arg: arguments[A]
            }, b ? c(h, g) : h.push(g), h.length > u && i(h.shift())), m.wasMemoized = b, m.numArgs = A + 1, x;
          }, "memoizerific");
          return m.limit = u, m.wasMemoized = !1, m.cache = d, m.lru = h, m;
        };
      };
      function c(u, d) {
        var h = u.length, S = d.length, m, T, y;
        for (T = 0; T < h; T++) {
          for (m = !0, y = 0; y < S; y++)
            if (!p(u[T][y].arg, d[y].arg)) {
              m = !1;
              break;
            }
          if (m)
            break;
        }
        u.push(u.splice(T, 1)[0]);
      }
      n(c, "moveToMostRecentLru");
      function i(u) {
        var d = u.length, h = u[d - 1], S, m;
        for (h.cacheItem.delete(h.arg), m = d - 2; m >= 0 && (h = u[m], S = h.cacheItem.get(h.arg), !S || !S.size); m--)
          h.cacheItem.delete(h.arg);
      }
      n(i, "removeCachedResult");
      function p(u, d) {
        return u === d || u !== u && d !== d;
      }
      n(p, "isEqual");
    }, { "map-or-similar": 1 }] }, {}, [3])(3);
  });
});

// ../node_modules/picoquery/lib/string-util.js
var wn = B((_n) => {
  "use strict";
  Object.defineProperty(_n, "__esModule", { value: !0 });
  _n.encodeString = du;
  var ne = Array.from({ length: 256 }, (r, e) => "%" + ((e < 16 ? "0" : "") + e.toString(16)).toUpperCase()), pu = new Int8Array([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    1,
    0
  ]);
  function du(r) {
    let e = r.length;
    if (e === 0)
      return "";
    let t = "", o = 0, s = 0;
    e: for (; s < e; s++) {
      let a = r.charCodeAt(s);
      for (; a < 128; ) {
        if (pu[a] !== 1 && (o < s && (t += r.slice(o, s)), o = s + 1, t += ne[a]), ++s === e)
          break e;
        a = r.charCodeAt(s);
      }
      if (o < s && (t += r.slice(o, s)), a < 2048) {
        o = s + 1, t += ne[192 | a >> 6] + ne[128 | a & 63];
        continue;
      }
      if (a < 55296 || a >= 57344) {
        o = s + 1, t += ne[224 | a >> 12] + ne[128 | a >> 6 & 63] + ne[128 | a & 63];
        continue;
      }
      if (++s, s >= e)
        throw new Error("URI malformed");
      let l = r.charCodeAt(s) & 1023;
      o = s + 1, a = 65536 + ((a & 1023) << 10 | l), t += ne[240 | a >> 18] + ne[128 | a >> 12 & 63] + ne[128 | a >> 6 & 63] + ne[128 | a & 63];
    }
    return o === 0 ? r : o < e ? t + r.slice(o) : t;
  }
  n(du, "encodeString");
});

// ../node_modules/picoquery/lib/shared.js
var Tt = B((se) => {
  "use strict";
  Object.defineProperty(se, "__esModule", { value: !0 });
  se.defaultOptions = se.defaultShouldSerializeObject = se.defaultValueSerializer = void 0;
  var vn = wn(), uu = /* @__PURE__ */ n((r) => {
    switch (typeof r) {
      case "string":
        return (0, vn.encodeString)(r);
      case "bigint":
      case "boolean":
        return "" + r;
      case "number":
        if (Number.isFinite(r))
          return r < 1e21 ? "" + r : (0, vn.encodeString)("" + r);
        break;
    }
    return r instanceof Date ? (0, vn.encodeString)(r.toISOString()) : "";
  }, "defaultValueSerializer");
  se.defaultValueSerializer = uu;
  var fu = /* @__PURE__ */ n((r) => r instanceof Date, "defaultShouldSerializeObject");
  se.defaultShouldSerializeObject = fu;
  var Ma = /* @__PURE__ */ n((r) => r, "identityFunc");
  se.defaultOptions = {
    nesting: !0,
    nestingSyntax: "dot",
    arrayRepeat: !1,
    arrayRepeatSyntax: "repeat",
    delimiter: 38,
    valueDeserializer: Ma,
    valueSerializer: se.defaultValueSerializer,
    keyDeserializer: Ma,
    shouldSerializeObject: se.defaultShouldSerializeObject
  };
});

// ../node_modules/picoquery/lib/object-util.js
var Pn = B((Et) => {
  "use strict";
  Object.defineProperty(Et, "__esModule", { value: !0 });
  Et.getDeepObject = hu;
  Et.stringifyObject = qa;
  var ke = Tt(), yu = wn();
  function mu(r) {
    return r === "__proto__" || r === "constructor" || r === "prototype";
  }
  n(mu, "isPrototypeKey");
  function hu(r, e, t, o, s) {
    if (mu(e))
      return r;
    let a = r[e];
    return typeof a == "object" && a !== null ? a : !o && (s || typeof t == "number" || typeof t == "string" && t * 0 === 0 && t.indexOf(".") ===
    -1) ? r[e] = [] : r[e] = {};
  }
  n(hu, "getDeepObject");
  var gu = 20, Su = "[]", bu = "[", Tu = "]", Eu = ".";
  function qa(r, e, t = 0, o, s) {
    let { nestingSyntax: a = ke.defaultOptions.nestingSyntax, arrayRepeat: l = ke.defaultOptions.arrayRepeat, arrayRepeatSyntax: c = ke.defaultOptions.
    arrayRepeatSyntax, nesting: i = ke.defaultOptions.nesting, delimiter: p = ke.defaultOptions.delimiter, valueSerializer: u = ke.defaultOptions.
    valueSerializer, shouldSerializeObject: d = ke.defaultOptions.shouldSerializeObject } = e, h = typeof p == "number" ? String.fromCharCode(
    p) : p, S = s === !0 && l, m = a === "dot" || a === "js" && !s;
    if (t > gu)
      return "";
    let T = "", y = !0, x = !1;
    for (let A in r) {
      let g = r[A], b;
      o ? (b = o, S ? c === "bracket" && (b += Su) : m ? (b += Eu, b += A) : (b += bu, b += A, b += Tu)) : b = A, y || (T += h), typeof g ==
      "object" && g !== null && !d(g) ? (x = g.pop !== void 0, (i || l && x) && (T += qa(g, e, t + 1, b, x))) : (T += (0, yu.encodeString)(b),
      T += "=", T += u(g, A)), y && (y = !1);
    }
    return T;
  }
  n(qa, "stringifyObject");
});

// ../node_modules/fast-decode-uri-component/index.js
var Va = B((ib, Ga) => {
  "use strict";
  var Ua = 12, Ru = 0, Cn = [
    // The first part of the table maps bytes to character to a transition.
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    3,
    4,
    4,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    5,
    6,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    7,
    8,
    7,
    7,
    10,
    9,
    9,
    9,
    11,
    4,
    4,
    4,
    4,
    4,
    4,
    4,
    4,
    4,
    4,
    4,
    // The second part of the table maps a state to a new state when adding a
    // transition.
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    12,
    0,
    0,
    0,
    0,
    24,
    36,
    48,
    60,
    72,
    84,
    96,
    0,
    12,
    12,
    12,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    24,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    24,
    24,
    24,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    24,
    24,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    48,
    48,
    48,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    48,
    48,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    48,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // The third part maps the current transition to a mask that needs to apply
    // to the byte.
    127,
    63,
    63,
    63,
    0,
    31,
    15,
    15,
    15,
    7,
    7,
    7
  ];
  function xu(r) {
    var e = r.indexOf("%");
    if (e === -1) return r;
    for (var t = r.length, o = "", s = 0, a = 0, l = e, c = Ua; e > -1 && e < t; ) {
      var i = Ba(r[e + 1], 4), p = Ba(r[e + 2], 0), u = i | p, d = Cn[u];
      if (c = Cn[256 + c + d], a = a << 6 | u & Cn[364 + d], c === Ua)
        o += r.slice(s, l), o += a <= 65535 ? String.fromCharCode(a) : String.fromCharCode(
          55232 + (a >> 10),
          56320 + (a & 1023)
        ), a = 0, s = e + 3, e = l = r.indexOf("%", s);
      else {
        if (c === Ru)
          return null;
        if (e += 3, e < t && r.charCodeAt(e) === 37) continue;
        return null;
      }
    }
    return o + r.slice(s);
  }
  n(xu, "decodeURIComponent");
  var Au = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    a: 10,
    A: 10,
    b: 11,
    B: 11,
    c: 12,
    C: 12,
    d: 13,
    D: 13,
    e: 14,
    E: 14,
    f: 15,
    F: 15
  };
  function Ba(r, e) {
    var t = Au[r];
    return t === void 0 ? 255 : t << e;
  }
  n(Ba, "hexCodeToInt");
  Ga.exports = xu;
});

// ../node_modules/picoquery/lib/parse.js
var $a = B((de) => {
  "use strict";
  var _u = de && de.__importDefault || function(r) {
    return r && r.__esModule ? r : { default: r };
  };
  Object.defineProperty(de, "__esModule", { value: !0 });
  de.numberValueDeserializer = de.numberKeyDeserializer = void 0;
  de.parse = Pu;
  var Rt = Pn(), Le = Tt(), Ha = _u(Va()), wu = /* @__PURE__ */ n((r) => {
    let e = Number(r);
    return Number.isNaN(e) ? r : e;
  }, "numberKeyDeserializer");
  de.numberKeyDeserializer = wu;
  var vu = /* @__PURE__ */ n((r) => {
    let e = Number(r);
    return Number.isNaN(e) ? r : e;
  }, "numberValueDeserializer");
  de.numberValueDeserializer = vu;
  var za = /\+/g, Wa = /* @__PURE__ */ n(function() {
  }, "Empty");
  Wa.prototype = /* @__PURE__ */ Object.create(null);
  function xt(r, e, t, o, s) {
    let a = r.substring(e, t);
    return o && (a = a.replace(za, " ")), s && (a = (0, Ha.default)(a) || a), a;
  }
  n(xt, "computeKeySlice");
  function Pu(r, e) {
    let { valueDeserializer: t = Le.defaultOptions.valueDeserializer, keyDeserializer: o = Le.defaultOptions.keyDeserializer, arrayRepeatSyntax: s = Le.
    defaultOptions.arrayRepeatSyntax, nesting: a = Le.defaultOptions.nesting, arrayRepeat: l = Le.defaultOptions.arrayRepeat, nestingSyntax: c = Le.
    defaultOptions.nestingSyntax, delimiter: i = Le.defaultOptions.delimiter } = e ?? {}, p = typeof i == "string" ? i.charCodeAt(0) : i, u = c ===
    "js", d = new Wa();
    if (typeof r != "string")
      return d;
    let h = r.length, S = "", m = -1, T = -1, y = -1, x = d, A, g = "", b = "", _ = !1, w = !1, I = !1, M = !1, U = !1, z = !1, te = !1, v = 0,
    F = -1, j = -1, k = -1;
    for (let D = 0; D < h + 1; D++) {
      if (v = D !== h ? r.charCodeAt(D) : p, v === p) {
        if (te = T > m, te || (T = D), y !== T - 1 && (b = xt(r, y + 1, F > -1 ? F : T, I, _), g = o(b), A !== void 0 && (x = (0, Rt.getDeepObject)(
        x, A, g, u && U, u && z))), te || g !== "") {
          te && (S = r.slice(T + 1, D), M && (S = S.replace(za, " ")), w && (S = (0, Ha.default)(S) || S));
          let V = t(S, g);
          if (l) {
            let Q = x[g];
            Q === void 0 ? F > -1 ? x[g] = [V] : x[g] = V : Q.pop ? Q.push(V) : x[g] = [Q, V];
          } else
            x[g] = V;
        }
        S = "", m = D, T = D, _ = !1, w = !1, I = !1, M = !1, U = !1, z = !1, F = -1, y = D, x = d, A = void 0, g = "";
      } else v === 93 ? (l && s === "bracket" && k === 91 && (F = j), a && (c === "index" || u) && T <= m && (y !== j && (b = xt(r, y + 1, D,
      I, _), g = o(b), A !== void 0 && (x = (0, Rt.getDeepObject)(x, A, g, void 0, u)), A = g, I = !1, _ = !1), y = D, z = !0, U = !1)) : v ===
      46 ? a && (c === "dot" || u) && T <= m && (y !== j && (b = xt(r, y + 1, D, I, _), g = o(b), A !== void 0 && (x = (0, Rt.getDeepObject)(
      x, A, g, u)), A = g, I = !1, _ = !1), U = !0, z = !1, y = D) : v === 91 ? a && (c === "index" || u) && T <= m && (y !== j && (b = xt(r,
      y + 1, D, I, _), g = o(b), u && A !== void 0 && (x = (0, Rt.getDeepObject)(x, A, g, u)), A = g, I = !1, _ = !1, U = !1, z = !0), y = D) :
      v === 61 ? T <= m ? T = D : w = !0 : v === 43 ? T > m ? M = !0 : I = !0 : v === 37 && (T > m ? w = !0 : _ = !0);
      j = D, k = v;
    }
    return d;
  }
  n(Pu, "parse");
});

// ../node_modules/picoquery/lib/stringify.js
var Ya = B((On) => {
  "use strict";
  Object.defineProperty(On, "__esModule", { value: !0 });
  On.stringify = Ou;
  var Cu = Pn();
  function Ou(r, e) {
    if (r === null || typeof r != "object")
      return "";
    let t = e ?? {};
    return (0, Cu.stringifyObject)(r, t);
  }
  n(Ou, "stringify");
});

// ../node_modules/picoquery/lib/main.js
var At = B((re) => {
  "use strict";
  var Iu = re && re.__createBinding || (Object.create ? function(r, e, t, o) {
    o === void 0 && (o = t);
    var s = Object.getOwnPropertyDescriptor(e, t);
    (!s || ("get" in s ? !e.__esModule : s.writable || s.configurable)) && (s = { enumerable: !0, get: /* @__PURE__ */ n(function() {
      return e[t];
    }, "get") }), Object.defineProperty(r, o, s);
  } : function(r, e, t, o) {
    o === void 0 && (o = t), r[o] = e[t];
  }), Fu = re && re.__exportStar || function(r, e) {
    for (var t in r) t !== "default" && !Object.prototype.hasOwnProperty.call(e, t) && Iu(e, r, t);
  };
  Object.defineProperty(re, "__esModule", { value: !0 });
  re.stringify = re.parse = void 0;
  var Du = $a();
  Object.defineProperty(re, "parse", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Du.parse;
  }, "get") });
  var Nu = Ya();
  Object.defineProperty(re, "stringify", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Nu.stringify;
  }, "get") });
  Fu(Tt(), re);
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/maps/entities.json
var Nn = B((Ab, Bu) => {
  Bu.exports = { Aacute: "\xC1", aacute: "\xE1", Abreve: "\u0102", abreve: "\u0103", ac: "\u223E", acd: "\u223F", acE: "\u223E\u0333", Acirc: "\
\xC2", acirc: "\xE2", acute: "\xB4", Acy: "\u0410", acy: "\u0430", AElig: "\xC6", aelig: "\xE6", af: "\u2061", Afr: "\u{1D504}", afr: "\u{1D51E}",
  Agrave: "\xC0", agrave: "\xE0", alefsym: "\u2135", aleph: "\u2135", Alpha: "\u0391", alpha: "\u03B1", Amacr: "\u0100", amacr: "\u0101", amalg: "\
\u2A3F", amp: "&", AMP: "&", andand: "\u2A55", And: "\u2A53", and: "\u2227", andd: "\u2A5C", andslope: "\u2A58", andv: "\u2A5A", ang: "\u2220",
  ange: "\u29A4", angle: "\u2220", angmsdaa: "\u29A8", angmsdab: "\u29A9", angmsdac: "\u29AA", angmsdad: "\u29AB", angmsdae: "\u29AC", angmsdaf: "\
\u29AD", angmsdag: "\u29AE", angmsdah: "\u29AF", angmsd: "\u2221", angrt: "\u221F", angrtvb: "\u22BE", angrtvbd: "\u299D", angsph: "\u2222",
  angst: "\xC5", angzarr: "\u237C", Aogon: "\u0104", aogon: "\u0105", Aopf: "\u{1D538}", aopf: "\u{1D552}", apacir: "\u2A6F", ap: "\u2248", apE: "\
\u2A70", ape: "\u224A", apid: "\u224B", apos: "'", ApplyFunction: "\u2061", approx: "\u2248", approxeq: "\u224A", Aring: "\xC5", aring: "\xE5",
  Ascr: "\u{1D49C}", ascr: "\u{1D4B6}", Assign: "\u2254", ast: "*", asymp: "\u2248", asympeq: "\u224D", Atilde: "\xC3", atilde: "\xE3", Auml: "\
\xC4", auml: "\xE4", awconint: "\u2233", awint: "\u2A11", backcong: "\u224C", backepsilon: "\u03F6", backprime: "\u2035", backsim: "\u223D",
  backsimeq: "\u22CD", Backslash: "\u2216", Barv: "\u2AE7", barvee: "\u22BD", barwed: "\u2305", Barwed: "\u2306", barwedge: "\u2305", bbrk: "\
\u23B5", bbrktbrk: "\u23B6", bcong: "\u224C", Bcy: "\u0411", bcy: "\u0431", bdquo: "\u201E", becaus: "\u2235", because: "\u2235", Because: "\
\u2235", bemptyv: "\u29B0", bepsi: "\u03F6", bernou: "\u212C", Bernoullis: "\u212C", Beta: "\u0392", beta: "\u03B2", beth: "\u2136", between: "\
\u226C", Bfr: "\u{1D505}", bfr: "\u{1D51F}", bigcap: "\u22C2", bigcirc: "\u25EF", bigcup: "\u22C3", bigodot: "\u2A00", bigoplus: "\u2A01", bigotimes: "\
\u2A02", bigsqcup: "\u2A06", bigstar: "\u2605", bigtriangledown: "\u25BD", bigtriangleup: "\u25B3", biguplus: "\u2A04", bigvee: "\u22C1", bigwedge: "\
\u22C0", bkarow: "\u290D", blacklozenge: "\u29EB", blacksquare: "\u25AA", blacktriangle: "\u25B4", blacktriangledown: "\u25BE", blacktriangleleft: "\
\u25C2", blacktriangleright: "\u25B8", blank: "\u2423", blk12: "\u2592", blk14: "\u2591", blk34: "\u2593", block: "\u2588", bne: "=\u20E5", bnequiv: "\
\u2261\u20E5", bNot: "\u2AED", bnot: "\u2310", Bopf: "\u{1D539}", bopf: "\u{1D553}", bot: "\u22A5", bottom: "\u22A5", bowtie: "\u22C8", boxbox: "\
\u29C9", boxdl: "\u2510", boxdL: "\u2555", boxDl: "\u2556", boxDL: "\u2557", boxdr: "\u250C", boxdR: "\u2552", boxDr: "\u2553", boxDR: "\u2554",
  boxh: "\u2500", boxH: "\u2550", boxhd: "\u252C", boxHd: "\u2564", boxhD: "\u2565", boxHD: "\u2566", boxhu: "\u2534", boxHu: "\u2567", boxhU: "\
\u2568", boxHU: "\u2569", boxminus: "\u229F", boxplus: "\u229E", boxtimes: "\u22A0", boxul: "\u2518", boxuL: "\u255B", boxUl: "\u255C", boxUL: "\
\u255D", boxur: "\u2514", boxuR: "\u2558", boxUr: "\u2559", boxUR: "\u255A", boxv: "\u2502", boxV: "\u2551", boxvh: "\u253C", boxvH: "\u256A",
  boxVh: "\u256B", boxVH: "\u256C", boxvl: "\u2524", boxvL: "\u2561", boxVl: "\u2562", boxVL: "\u2563", boxvr: "\u251C", boxvR: "\u255E", boxVr: "\
\u255F", boxVR: "\u2560", bprime: "\u2035", breve: "\u02D8", Breve: "\u02D8", brvbar: "\xA6", bscr: "\u{1D4B7}", Bscr: "\u212C", bsemi: "\u204F",
  bsim: "\u223D", bsime: "\u22CD", bsolb: "\u29C5", bsol: "\\", bsolhsub: "\u27C8", bull: "\u2022", bullet: "\u2022", bump: "\u224E", bumpE: "\
\u2AAE", bumpe: "\u224F", Bumpeq: "\u224E", bumpeq: "\u224F", Cacute: "\u0106", cacute: "\u0107", capand: "\u2A44", capbrcup: "\u2A49", capcap: "\
\u2A4B", cap: "\u2229", Cap: "\u22D2", capcup: "\u2A47", capdot: "\u2A40", CapitalDifferentialD: "\u2145", caps: "\u2229\uFE00", caret: "\u2041",
  caron: "\u02C7", Cayleys: "\u212D", ccaps: "\u2A4D", Ccaron: "\u010C", ccaron: "\u010D", Ccedil: "\xC7", ccedil: "\xE7", Ccirc: "\u0108", ccirc: "\
\u0109", Cconint: "\u2230", ccups: "\u2A4C", ccupssm: "\u2A50", Cdot: "\u010A", cdot: "\u010B", cedil: "\xB8", Cedilla: "\xB8", cemptyv: "\u29B2",
  cent: "\xA2", centerdot: "\xB7", CenterDot: "\xB7", cfr: "\u{1D520}", Cfr: "\u212D", CHcy: "\u0427", chcy: "\u0447", check: "\u2713", checkmark: "\
\u2713", Chi: "\u03A7", chi: "\u03C7", circ: "\u02C6", circeq: "\u2257", circlearrowleft: "\u21BA", circlearrowright: "\u21BB", circledast: "\
\u229B", circledcirc: "\u229A", circleddash: "\u229D", CircleDot: "\u2299", circledR: "\xAE", circledS: "\u24C8", CircleMinus: "\u2296", CirclePlus: "\
\u2295", CircleTimes: "\u2297", cir: "\u25CB", cirE: "\u29C3", cire: "\u2257", cirfnint: "\u2A10", cirmid: "\u2AEF", cirscir: "\u29C2", ClockwiseContourIntegral: "\
\u2232", CloseCurlyDoubleQuote: "\u201D", CloseCurlyQuote: "\u2019", clubs: "\u2663", clubsuit: "\u2663", colon: ":", Colon: "\u2237", Colone: "\
\u2A74", colone: "\u2254", coloneq: "\u2254", comma: ",", commat: "@", comp: "\u2201", compfn: "\u2218", complement: "\u2201", complexes: "\u2102",
  cong: "\u2245", congdot: "\u2A6D", Congruent: "\u2261", conint: "\u222E", Conint: "\u222F", ContourIntegral: "\u222E", copf: "\u{1D554}", Copf: "\
\u2102", coprod: "\u2210", Coproduct: "\u2210", copy: "\xA9", COPY: "\xA9", copysr: "\u2117", CounterClockwiseContourIntegral: "\u2233", crarr: "\
\u21B5", cross: "\u2717", Cross: "\u2A2F", Cscr: "\u{1D49E}", cscr: "\u{1D4B8}", csub: "\u2ACF", csube: "\u2AD1", csup: "\u2AD0", csupe: "\u2AD2",
  ctdot: "\u22EF", cudarrl: "\u2938", cudarrr: "\u2935", cuepr: "\u22DE", cuesc: "\u22DF", cularr: "\u21B6", cularrp: "\u293D", cupbrcap: "\u2A48",
  cupcap: "\u2A46", CupCap: "\u224D", cup: "\u222A", Cup: "\u22D3", cupcup: "\u2A4A", cupdot: "\u228D", cupor: "\u2A45", cups: "\u222A\uFE00",
  curarr: "\u21B7", curarrm: "\u293C", curlyeqprec: "\u22DE", curlyeqsucc: "\u22DF", curlyvee: "\u22CE", curlywedge: "\u22CF", curren: "\xA4",
  curvearrowleft: "\u21B6", curvearrowright: "\u21B7", cuvee: "\u22CE", cuwed: "\u22CF", cwconint: "\u2232", cwint: "\u2231", cylcty: "\u232D",
  dagger: "\u2020", Dagger: "\u2021", daleth: "\u2138", darr: "\u2193", Darr: "\u21A1", dArr: "\u21D3", dash: "\u2010", Dashv: "\u2AE4", dashv: "\
\u22A3", dbkarow: "\u290F", dblac: "\u02DD", Dcaron: "\u010E", dcaron: "\u010F", Dcy: "\u0414", dcy: "\u0434", ddagger: "\u2021", ddarr: "\u21CA",
  DD: "\u2145", dd: "\u2146", DDotrahd: "\u2911", ddotseq: "\u2A77", deg: "\xB0", Del: "\u2207", Delta: "\u0394", delta: "\u03B4", demptyv: "\
\u29B1", dfisht: "\u297F", Dfr: "\u{1D507}", dfr: "\u{1D521}", dHar: "\u2965", dharl: "\u21C3", dharr: "\u21C2", DiacriticalAcute: "\xB4", DiacriticalDot: "\
\u02D9", DiacriticalDoubleAcute: "\u02DD", DiacriticalGrave: "`", DiacriticalTilde: "\u02DC", diam: "\u22C4", diamond: "\u22C4", Diamond: "\u22C4",
  diamondsuit: "\u2666", diams: "\u2666", die: "\xA8", DifferentialD: "\u2146", digamma: "\u03DD", disin: "\u22F2", div: "\xF7", divide: "\xF7",
  divideontimes: "\u22C7", divonx: "\u22C7", DJcy: "\u0402", djcy: "\u0452", dlcorn: "\u231E", dlcrop: "\u230D", dollar: "$", Dopf: "\u{1D53B}",
  dopf: "\u{1D555}", Dot: "\xA8", dot: "\u02D9", DotDot: "\u20DC", doteq: "\u2250", doteqdot: "\u2251", DotEqual: "\u2250", dotminus: "\u2238",
  dotplus: "\u2214", dotsquare: "\u22A1", doublebarwedge: "\u2306", DoubleContourIntegral: "\u222F", DoubleDot: "\xA8", DoubleDownArrow: "\u21D3",
  DoubleLeftArrow: "\u21D0", DoubleLeftRightArrow: "\u21D4", DoubleLeftTee: "\u2AE4", DoubleLongLeftArrow: "\u27F8", DoubleLongLeftRightArrow: "\
\u27FA", DoubleLongRightArrow: "\u27F9", DoubleRightArrow: "\u21D2", DoubleRightTee: "\u22A8", DoubleUpArrow: "\u21D1", DoubleUpDownArrow: "\
\u21D5", DoubleVerticalBar: "\u2225", DownArrowBar: "\u2913", downarrow: "\u2193", DownArrow: "\u2193", Downarrow: "\u21D3", DownArrowUpArrow: "\
\u21F5", DownBreve: "\u0311", downdownarrows: "\u21CA", downharpoonleft: "\u21C3", downharpoonright: "\u21C2", DownLeftRightVector: "\u2950",
  DownLeftTeeVector: "\u295E", DownLeftVectorBar: "\u2956", DownLeftVector: "\u21BD", DownRightTeeVector: "\u295F", DownRightVectorBar: "\u2957",
  DownRightVector: "\u21C1", DownTeeArrow: "\u21A7", DownTee: "\u22A4", drbkarow: "\u2910", drcorn: "\u231F", drcrop: "\u230C", Dscr: "\u{1D49F}",
  dscr: "\u{1D4B9}", DScy: "\u0405", dscy: "\u0455", dsol: "\u29F6", Dstrok: "\u0110", dstrok: "\u0111", dtdot: "\u22F1", dtri: "\u25BF", dtrif: "\
\u25BE", duarr: "\u21F5", duhar: "\u296F", dwangle: "\u29A6", DZcy: "\u040F", dzcy: "\u045F", dzigrarr: "\u27FF", Eacute: "\xC9", eacute: "\xE9",
  easter: "\u2A6E", Ecaron: "\u011A", ecaron: "\u011B", Ecirc: "\xCA", ecirc: "\xEA", ecir: "\u2256", ecolon: "\u2255", Ecy: "\u042D", ecy: "\
\u044D", eDDot: "\u2A77", Edot: "\u0116", edot: "\u0117", eDot: "\u2251", ee: "\u2147", efDot: "\u2252", Efr: "\u{1D508}", efr: "\u{1D522}",
  eg: "\u2A9A", Egrave: "\xC8", egrave: "\xE8", egs: "\u2A96", egsdot: "\u2A98", el: "\u2A99", Element: "\u2208", elinters: "\u23E7", ell: "\
\u2113", els: "\u2A95", elsdot: "\u2A97", Emacr: "\u0112", emacr: "\u0113", empty: "\u2205", emptyset: "\u2205", EmptySmallSquare: "\u25FB",
  emptyv: "\u2205", EmptyVerySmallSquare: "\u25AB", emsp13: "\u2004", emsp14: "\u2005", emsp: "\u2003", ENG: "\u014A", eng: "\u014B", ensp: "\
\u2002", Eogon: "\u0118", eogon: "\u0119", Eopf: "\u{1D53C}", eopf: "\u{1D556}", epar: "\u22D5", eparsl: "\u29E3", eplus: "\u2A71", epsi: "\u03B5",
  Epsilon: "\u0395", epsilon: "\u03B5", epsiv: "\u03F5", eqcirc: "\u2256", eqcolon: "\u2255", eqsim: "\u2242", eqslantgtr: "\u2A96", eqslantless: "\
\u2A95", Equal: "\u2A75", equals: "=", EqualTilde: "\u2242", equest: "\u225F", Equilibrium: "\u21CC", equiv: "\u2261", equivDD: "\u2A78", eqvparsl: "\
\u29E5", erarr: "\u2971", erDot: "\u2253", escr: "\u212F", Escr: "\u2130", esdot: "\u2250", Esim: "\u2A73", esim: "\u2242", Eta: "\u0397", eta: "\
\u03B7", ETH: "\xD0", eth: "\xF0", Euml: "\xCB", euml: "\xEB", euro: "\u20AC", excl: "!", exist: "\u2203", Exists: "\u2203", expectation: "\u2130",
  exponentiale: "\u2147", ExponentialE: "\u2147", fallingdotseq: "\u2252", Fcy: "\u0424", fcy: "\u0444", female: "\u2640", ffilig: "\uFB03",
  fflig: "\uFB00", ffllig: "\uFB04", Ffr: "\u{1D509}", ffr: "\u{1D523}", filig: "\uFB01", FilledSmallSquare: "\u25FC", FilledVerySmallSquare: "\
\u25AA", fjlig: "fj", flat: "\u266D", fllig: "\uFB02", fltns: "\u25B1", fnof: "\u0192", Fopf: "\u{1D53D}", fopf: "\u{1D557}", forall: "\u2200",
  ForAll: "\u2200", fork: "\u22D4", forkv: "\u2AD9", Fouriertrf: "\u2131", fpartint: "\u2A0D", frac12: "\xBD", frac13: "\u2153", frac14: "\xBC",
  frac15: "\u2155", frac16: "\u2159", frac18: "\u215B", frac23: "\u2154", frac25: "\u2156", frac34: "\xBE", frac35: "\u2157", frac38: "\u215C",
  frac45: "\u2158", frac56: "\u215A", frac58: "\u215D", frac78: "\u215E", frasl: "\u2044", frown: "\u2322", fscr: "\u{1D4BB}", Fscr: "\u2131",
  gacute: "\u01F5", Gamma: "\u0393", gamma: "\u03B3", Gammad: "\u03DC", gammad: "\u03DD", gap: "\u2A86", Gbreve: "\u011E", gbreve: "\u011F",
  Gcedil: "\u0122", Gcirc: "\u011C", gcirc: "\u011D", Gcy: "\u0413", gcy: "\u0433", Gdot: "\u0120", gdot: "\u0121", ge: "\u2265", gE: "\u2267",
  gEl: "\u2A8C", gel: "\u22DB", geq: "\u2265", geqq: "\u2267", geqslant: "\u2A7E", gescc: "\u2AA9", ges: "\u2A7E", gesdot: "\u2A80", gesdoto: "\
\u2A82", gesdotol: "\u2A84", gesl: "\u22DB\uFE00", gesles: "\u2A94", Gfr: "\u{1D50A}", gfr: "\u{1D524}", gg: "\u226B", Gg: "\u22D9", ggg: "\u22D9",
  gimel: "\u2137", GJcy: "\u0403", gjcy: "\u0453", gla: "\u2AA5", gl: "\u2277", glE: "\u2A92", glj: "\u2AA4", gnap: "\u2A8A", gnapprox: "\u2A8A",
  gne: "\u2A88", gnE: "\u2269", gneq: "\u2A88", gneqq: "\u2269", gnsim: "\u22E7", Gopf: "\u{1D53E}", gopf: "\u{1D558}", grave: "`", GreaterEqual: "\
\u2265", GreaterEqualLess: "\u22DB", GreaterFullEqual: "\u2267", GreaterGreater: "\u2AA2", GreaterLess: "\u2277", GreaterSlantEqual: "\u2A7E",
  GreaterTilde: "\u2273", Gscr: "\u{1D4A2}", gscr: "\u210A", gsim: "\u2273", gsime: "\u2A8E", gsiml: "\u2A90", gtcc: "\u2AA7", gtcir: "\u2A7A",
  gt: ">", GT: ">", Gt: "\u226B", gtdot: "\u22D7", gtlPar: "\u2995", gtquest: "\u2A7C", gtrapprox: "\u2A86", gtrarr: "\u2978", gtrdot: "\u22D7",
  gtreqless: "\u22DB", gtreqqless: "\u2A8C", gtrless: "\u2277", gtrsim: "\u2273", gvertneqq: "\u2269\uFE00", gvnE: "\u2269\uFE00", Hacek: "\u02C7",
  hairsp: "\u200A", half: "\xBD", hamilt: "\u210B", HARDcy: "\u042A", hardcy: "\u044A", harrcir: "\u2948", harr: "\u2194", hArr: "\u21D4", harrw: "\
\u21AD", Hat: "^", hbar: "\u210F", Hcirc: "\u0124", hcirc: "\u0125", hearts: "\u2665", heartsuit: "\u2665", hellip: "\u2026", hercon: "\u22B9",
  hfr: "\u{1D525}", Hfr: "\u210C", HilbertSpace: "\u210B", hksearow: "\u2925", hkswarow: "\u2926", hoarr: "\u21FF", homtht: "\u223B", hookleftarrow: "\
\u21A9", hookrightarrow: "\u21AA", hopf: "\u{1D559}", Hopf: "\u210D", horbar: "\u2015", HorizontalLine: "\u2500", hscr: "\u{1D4BD}", Hscr: "\
\u210B", hslash: "\u210F", Hstrok: "\u0126", hstrok: "\u0127", HumpDownHump: "\u224E", HumpEqual: "\u224F", hybull: "\u2043", hyphen: "\u2010",
  Iacute: "\xCD", iacute: "\xED", ic: "\u2063", Icirc: "\xCE", icirc: "\xEE", Icy: "\u0418", icy: "\u0438", Idot: "\u0130", IEcy: "\u0415", iecy: "\
\u0435", iexcl: "\xA1", iff: "\u21D4", ifr: "\u{1D526}", Ifr: "\u2111", Igrave: "\xCC", igrave: "\xEC", ii: "\u2148", iiiint: "\u2A0C", iiint: "\
\u222D", iinfin: "\u29DC", iiota: "\u2129", IJlig: "\u0132", ijlig: "\u0133", Imacr: "\u012A", imacr: "\u012B", image: "\u2111", ImaginaryI: "\
\u2148", imagline: "\u2110", imagpart: "\u2111", imath: "\u0131", Im: "\u2111", imof: "\u22B7", imped: "\u01B5", Implies: "\u21D2", incare: "\
\u2105", in: "\u2208", infin: "\u221E", infintie: "\u29DD", inodot: "\u0131", intcal: "\u22BA", int: "\u222B", Int: "\u222C", integers: "\u2124",
  Integral: "\u222B", intercal: "\u22BA", Intersection: "\u22C2", intlarhk: "\u2A17", intprod: "\u2A3C", InvisibleComma: "\u2063", InvisibleTimes: "\
\u2062", IOcy: "\u0401", iocy: "\u0451", Iogon: "\u012E", iogon: "\u012F", Iopf: "\u{1D540}", iopf: "\u{1D55A}", Iota: "\u0399", iota: "\u03B9",
  iprod: "\u2A3C", iquest: "\xBF", iscr: "\u{1D4BE}", Iscr: "\u2110", isin: "\u2208", isindot: "\u22F5", isinE: "\u22F9", isins: "\u22F4", isinsv: "\
\u22F3", isinv: "\u2208", it: "\u2062", Itilde: "\u0128", itilde: "\u0129", Iukcy: "\u0406", iukcy: "\u0456", Iuml: "\xCF", iuml: "\xEF", Jcirc: "\
\u0134", jcirc: "\u0135", Jcy: "\u0419", jcy: "\u0439", Jfr: "\u{1D50D}", jfr: "\u{1D527}", jmath: "\u0237", Jopf: "\u{1D541}", jopf: "\u{1D55B}",
  Jscr: "\u{1D4A5}", jscr: "\u{1D4BF}", Jsercy: "\u0408", jsercy: "\u0458", Jukcy: "\u0404", jukcy: "\u0454", Kappa: "\u039A", kappa: "\u03BA",
  kappav: "\u03F0", Kcedil: "\u0136", kcedil: "\u0137", Kcy: "\u041A", kcy: "\u043A", Kfr: "\u{1D50E}", kfr: "\u{1D528}", kgreen: "\u0138", KHcy: "\
\u0425", khcy: "\u0445", KJcy: "\u040C", kjcy: "\u045C", Kopf: "\u{1D542}", kopf: "\u{1D55C}", Kscr: "\u{1D4A6}", kscr: "\u{1D4C0}", lAarr: "\
\u21DA", Lacute: "\u0139", lacute: "\u013A", laemptyv: "\u29B4", lagran: "\u2112", Lambda: "\u039B", lambda: "\u03BB", lang: "\u27E8", Lang: "\
\u27EA", langd: "\u2991", langle: "\u27E8", lap: "\u2A85", Laplacetrf: "\u2112", laquo: "\xAB", larrb: "\u21E4", larrbfs: "\u291F", larr: "\u2190",
  Larr: "\u219E", lArr: "\u21D0", larrfs: "\u291D", larrhk: "\u21A9", larrlp: "\u21AB", larrpl: "\u2939", larrsim: "\u2973", larrtl: "\u21A2",
  latail: "\u2919", lAtail: "\u291B", lat: "\u2AAB", late: "\u2AAD", lates: "\u2AAD\uFE00", lbarr: "\u290C", lBarr: "\u290E", lbbrk: "\u2772",
  lbrace: "{", lbrack: "[", lbrke: "\u298B", lbrksld: "\u298F", lbrkslu: "\u298D", Lcaron: "\u013D", lcaron: "\u013E", Lcedil: "\u013B", lcedil: "\
\u013C", lceil: "\u2308", lcub: "{", Lcy: "\u041B", lcy: "\u043B", ldca: "\u2936", ldquo: "\u201C", ldquor: "\u201E", ldrdhar: "\u2967", ldrushar: "\
\u294B", ldsh: "\u21B2", le: "\u2264", lE: "\u2266", LeftAngleBracket: "\u27E8", LeftArrowBar: "\u21E4", leftarrow: "\u2190", LeftArrow: "\u2190",
  Leftarrow: "\u21D0", LeftArrowRightArrow: "\u21C6", leftarrowtail: "\u21A2", LeftCeiling: "\u2308", LeftDoubleBracket: "\u27E6", LeftDownTeeVector: "\
\u2961", LeftDownVectorBar: "\u2959", LeftDownVector: "\u21C3", LeftFloor: "\u230A", leftharpoondown: "\u21BD", leftharpoonup: "\u21BC", leftleftarrows: "\
\u21C7", leftrightarrow: "\u2194", LeftRightArrow: "\u2194", Leftrightarrow: "\u21D4", leftrightarrows: "\u21C6", leftrightharpoons: "\u21CB",
  leftrightsquigarrow: "\u21AD", LeftRightVector: "\u294E", LeftTeeArrow: "\u21A4", LeftTee: "\u22A3", LeftTeeVector: "\u295A", leftthreetimes: "\
\u22CB", LeftTriangleBar: "\u29CF", LeftTriangle: "\u22B2", LeftTriangleEqual: "\u22B4", LeftUpDownVector: "\u2951", LeftUpTeeVector: "\u2960",
  LeftUpVectorBar: "\u2958", LeftUpVector: "\u21BF", LeftVectorBar: "\u2952", LeftVector: "\u21BC", lEg: "\u2A8B", leg: "\u22DA", leq: "\u2264",
  leqq: "\u2266", leqslant: "\u2A7D", lescc: "\u2AA8", les: "\u2A7D", lesdot: "\u2A7F", lesdoto: "\u2A81", lesdotor: "\u2A83", lesg: "\u22DA\uFE00",
  lesges: "\u2A93", lessapprox: "\u2A85", lessdot: "\u22D6", lesseqgtr: "\u22DA", lesseqqgtr: "\u2A8B", LessEqualGreater: "\u22DA", LessFullEqual: "\
\u2266", LessGreater: "\u2276", lessgtr: "\u2276", LessLess: "\u2AA1", lesssim: "\u2272", LessSlantEqual: "\u2A7D", LessTilde: "\u2272", lfisht: "\
\u297C", lfloor: "\u230A", Lfr: "\u{1D50F}", lfr: "\u{1D529}", lg: "\u2276", lgE: "\u2A91", lHar: "\u2962", lhard: "\u21BD", lharu: "\u21BC",
  lharul: "\u296A", lhblk: "\u2584", LJcy: "\u0409", ljcy: "\u0459", llarr: "\u21C7", ll: "\u226A", Ll: "\u22D8", llcorner: "\u231E", Lleftarrow: "\
\u21DA", llhard: "\u296B", lltri: "\u25FA", Lmidot: "\u013F", lmidot: "\u0140", lmoustache: "\u23B0", lmoust: "\u23B0", lnap: "\u2A89", lnapprox: "\
\u2A89", lne: "\u2A87", lnE: "\u2268", lneq: "\u2A87", lneqq: "\u2268", lnsim: "\u22E6", loang: "\u27EC", loarr: "\u21FD", lobrk: "\u27E6", longleftarrow: "\
\u27F5", LongLeftArrow: "\u27F5", Longleftarrow: "\u27F8", longleftrightarrow: "\u27F7", LongLeftRightArrow: "\u27F7", Longleftrightarrow: "\
\u27FA", longmapsto: "\u27FC", longrightarrow: "\u27F6", LongRightArrow: "\u27F6", Longrightarrow: "\u27F9", looparrowleft: "\u21AB", looparrowright: "\
\u21AC", lopar: "\u2985", Lopf: "\u{1D543}", lopf: "\u{1D55D}", loplus: "\u2A2D", lotimes: "\u2A34", lowast: "\u2217", lowbar: "_", LowerLeftArrow: "\
\u2199", LowerRightArrow: "\u2198", loz: "\u25CA", lozenge: "\u25CA", lozf: "\u29EB", lpar: "(", lparlt: "\u2993", lrarr: "\u21C6", lrcorner: "\
\u231F", lrhar: "\u21CB", lrhard: "\u296D", lrm: "\u200E", lrtri: "\u22BF", lsaquo: "\u2039", lscr: "\u{1D4C1}", Lscr: "\u2112", lsh: "\u21B0",
  Lsh: "\u21B0", lsim: "\u2272", lsime: "\u2A8D", lsimg: "\u2A8F", lsqb: "[", lsquo: "\u2018", lsquor: "\u201A", Lstrok: "\u0141", lstrok: "\
\u0142", ltcc: "\u2AA6", ltcir: "\u2A79", lt: "<", LT: "<", Lt: "\u226A", ltdot: "\u22D6", lthree: "\u22CB", ltimes: "\u22C9", ltlarr: "\u2976",
  ltquest: "\u2A7B", ltri: "\u25C3", ltrie: "\u22B4", ltrif: "\u25C2", ltrPar: "\u2996", lurdshar: "\u294A", luruhar: "\u2966", lvertneqq: "\
\u2268\uFE00", lvnE: "\u2268\uFE00", macr: "\xAF", male: "\u2642", malt: "\u2720", maltese: "\u2720", Map: "\u2905", map: "\u21A6", mapsto: "\
\u21A6", mapstodown: "\u21A7", mapstoleft: "\u21A4", mapstoup: "\u21A5", marker: "\u25AE", mcomma: "\u2A29", Mcy: "\u041C", mcy: "\u043C", mdash: "\
\u2014", mDDot: "\u223A", measuredangle: "\u2221", MediumSpace: "\u205F", Mellintrf: "\u2133", Mfr: "\u{1D510}", mfr: "\u{1D52A}", mho: "\u2127",
  micro: "\xB5", midast: "*", midcir: "\u2AF0", mid: "\u2223", middot: "\xB7", minusb: "\u229F", minus: "\u2212", minusd: "\u2238", minusdu: "\
\u2A2A", MinusPlus: "\u2213", mlcp: "\u2ADB", mldr: "\u2026", mnplus: "\u2213", models: "\u22A7", Mopf: "\u{1D544}", mopf: "\u{1D55E}", mp: "\
\u2213", mscr: "\u{1D4C2}", Mscr: "\u2133", mstpos: "\u223E", Mu: "\u039C", mu: "\u03BC", multimap: "\u22B8", mumap: "\u22B8", nabla: "\u2207",
  Nacute: "\u0143", nacute: "\u0144", nang: "\u2220\u20D2", nap: "\u2249", napE: "\u2A70\u0338", napid: "\u224B\u0338", napos: "\u0149", napprox: "\
\u2249", natural: "\u266E", naturals: "\u2115", natur: "\u266E", nbsp: "\xA0", nbump: "\u224E\u0338", nbumpe: "\u224F\u0338", ncap: "\u2A43",
  Ncaron: "\u0147", ncaron: "\u0148", Ncedil: "\u0145", ncedil: "\u0146", ncong: "\u2247", ncongdot: "\u2A6D\u0338", ncup: "\u2A42", Ncy: "\u041D",
  ncy: "\u043D", ndash: "\u2013", nearhk: "\u2924", nearr: "\u2197", neArr: "\u21D7", nearrow: "\u2197", ne: "\u2260", nedot: "\u2250\u0338",
  NegativeMediumSpace: "\u200B", NegativeThickSpace: "\u200B", NegativeThinSpace: "\u200B", NegativeVeryThinSpace: "\u200B", nequiv: "\u2262",
  nesear: "\u2928", nesim: "\u2242\u0338", NestedGreaterGreater: "\u226B", NestedLessLess: "\u226A", NewLine: `
`, nexist: "\u2204", nexists: "\u2204", Nfr: "\u{1D511}", nfr: "\u{1D52B}", ngE: "\u2267\u0338", nge: "\u2271", ngeq: "\u2271", ngeqq: "\u2267\u0338",
  ngeqslant: "\u2A7E\u0338", nges: "\u2A7E\u0338", nGg: "\u22D9\u0338", ngsim: "\u2275", nGt: "\u226B\u20D2", ngt: "\u226F", ngtr: "\u226F",
  nGtv: "\u226B\u0338", nharr: "\u21AE", nhArr: "\u21CE", nhpar: "\u2AF2", ni: "\u220B", nis: "\u22FC", nisd: "\u22FA", niv: "\u220B", NJcy: "\
\u040A", njcy: "\u045A", nlarr: "\u219A", nlArr: "\u21CD", nldr: "\u2025", nlE: "\u2266\u0338", nle: "\u2270", nleftarrow: "\u219A", nLeftarrow: "\
\u21CD", nleftrightarrow: "\u21AE", nLeftrightarrow: "\u21CE", nleq: "\u2270", nleqq: "\u2266\u0338", nleqslant: "\u2A7D\u0338", nles: "\u2A7D\u0338",
  nless: "\u226E", nLl: "\u22D8\u0338", nlsim: "\u2274", nLt: "\u226A\u20D2", nlt: "\u226E", nltri: "\u22EA", nltrie: "\u22EC", nLtv: "\u226A\u0338",
  nmid: "\u2224", NoBreak: "\u2060", NonBreakingSpace: "\xA0", nopf: "\u{1D55F}", Nopf: "\u2115", Not: "\u2AEC", not: "\xAC", NotCongruent: "\
\u2262", NotCupCap: "\u226D", NotDoubleVerticalBar: "\u2226", NotElement: "\u2209", NotEqual: "\u2260", NotEqualTilde: "\u2242\u0338", NotExists: "\
\u2204", NotGreater: "\u226F", NotGreaterEqual: "\u2271", NotGreaterFullEqual: "\u2267\u0338", NotGreaterGreater: "\u226B\u0338", NotGreaterLess: "\
\u2279", NotGreaterSlantEqual: "\u2A7E\u0338", NotGreaterTilde: "\u2275", NotHumpDownHump: "\u224E\u0338", NotHumpEqual: "\u224F\u0338", notin: "\
\u2209", notindot: "\u22F5\u0338", notinE: "\u22F9\u0338", notinva: "\u2209", notinvb: "\u22F7", notinvc: "\u22F6", NotLeftTriangleBar: "\u29CF\u0338",
  NotLeftTriangle: "\u22EA", NotLeftTriangleEqual: "\u22EC", NotLess: "\u226E", NotLessEqual: "\u2270", NotLessGreater: "\u2278", NotLessLess: "\
\u226A\u0338", NotLessSlantEqual: "\u2A7D\u0338", NotLessTilde: "\u2274", NotNestedGreaterGreater: "\u2AA2\u0338", NotNestedLessLess: "\u2AA1\u0338",
  notni: "\u220C", notniva: "\u220C", notnivb: "\u22FE", notnivc: "\u22FD", NotPrecedes: "\u2280", NotPrecedesEqual: "\u2AAF\u0338", NotPrecedesSlantEqual: "\
\u22E0", NotReverseElement: "\u220C", NotRightTriangleBar: "\u29D0\u0338", NotRightTriangle: "\u22EB", NotRightTriangleEqual: "\u22ED", NotSquareSubset: "\
\u228F\u0338", NotSquareSubsetEqual: "\u22E2", NotSquareSuperset: "\u2290\u0338", NotSquareSupersetEqual: "\u22E3", NotSubset: "\u2282\u20D2",
  NotSubsetEqual: "\u2288", NotSucceeds: "\u2281", NotSucceedsEqual: "\u2AB0\u0338", NotSucceedsSlantEqual: "\u22E1", NotSucceedsTilde: "\u227F\u0338",
  NotSuperset: "\u2283\u20D2", NotSupersetEqual: "\u2289", NotTilde: "\u2241", NotTildeEqual: "\u2244", NotTildeFullEqual: "\u2247", NotTildeTilde: "\
\u2249", NotVerticalBar: "\u2224", nparallel: "\u2226", npar: "\u2226", nparsl: "\u2AFD\u20E5", npart: "\u2202\u0338", npolint: "\u2A14", npr: "\
\u2280", nprcue: "\u22E0", nprec: "\u2280", npreceq: "\u2AAF\u0338", npre: "\u2AAF\u0338", nrarrc: "\u2933\u0338", nrarr: "\u219B", nrArr: "\
\u21CF", nrarrw: "\u219D\u0338", nrightarrow: "\u219B", nRightarrow: "\u21CF", nrtri: "\u22EB", nrtrie: "\u22ED", nsc: "\u2281", nsccue: "\u22E1",
  nsce: "\u2AB0\u0338", Nscr: "\u{1D4A9}", nscr: "\u{1D4C3}", nshortmid: "\u2224", nshortparallel: "\u2226", nsim: "\u2241", nsime: "\u2244",
  nsimeq: "\u2244", nsmid: "\u2224", nspar: "\u2226", nsqsube: "\u22E2", nsqsupe: "\u22E3", nsub: "\u2284", nsubE: "\u2AC5\u0338", nsube: "\u2288",
  nsubset: "\u2282\u20D2", nsubseteq: "\u2288", nsubseteqq: "\u2AC5\u0338", nsucc: "\u2281", nsucceq: "\u2AB0\u0338", nsup: "\u2285", nsupE: "\
\u2AC6\u0338", nsupe: "\u2289", nsupset: "\u2283\u20D2", nsupseteq: "\u2289", nsupseteqq: "\u2AC6\u0338", ntgl: "\u2279", Ntilde: "\xD1", ntilde: "\
\xF1", ntlg: "\u2278", ntriangleleft: "\u22EA", ntrianglelefteq: "\u22EC", ntriangleright: "\u22EB", ntrianglerighteq: "\u22ED", Nu: "\u039D",
  nu: "\u03BD", num: "#", numero: "\u2116", numsp: "\u2007", nvap: "\u224D\u20D2", nvdash: "\u22AC", nvDash: "\u22AD", nVdash: "\u22AE", nVDash: "\
\u22AF", nvge: "\u2265\u20D2", nvgt: ">\u20D2", nvHarr: "\u2904", nvinfin: "\u29DE", nvlArr: "\u2902", nvle: "\u2264\u20D2", nvlt: "<\u20D2",
  nvltrie: "\u22B4\u20D2", nvrArr: "\u2903", nvrtrie: "\u22B5\u20D2", nvsim: "\u223C\u20D2", nwarhk: "\u2923", nwarr: "\u2196", nwArr: "\u21D6",
  nwarrow: "\u2196", nwnear: "\u2927", Oacute: "\xD3", oacute: "\xF3", oast: "\u229B", Ocirc: "\xD4", ocirc: "\xF4", ocir: "\u229A", Ocy: "\u041E",
  ocy: "\u043E", odash: "\u229D", Odblac: "\u0150", odblac: "\u0151", odiv: "\u2A38", odot: "\u2299", odsold: "\u29BC", OElig: "\u0152", oelig: "\
\u0153", ofcir: "\u29BF", Ofr: "\u{1D512}", ofr: "\u{1D52C}", ogon: "\u02DB", Ograve: "\xD2", ograve: "\xF2", ogt: "\u29C1", ohbar: "\u29B5",
  ohm: "\u03A9", oint: "\u222E", olarr: "\u21BA", olcir: "\u29BE", olcross: "\u29BB", oline: "\u203E", olt: "\u29C0", Omacr: "\u014C", omacr: "\
\u014D", Omega: "\u03A9", omega: "\u03C9", Omicron: "\u039F", omicron: "\u03BF", omid: "\u29B6", ominus: "\u2296", Oopf: "\u{1D546}", oopf: "\
\u{1D560}", opar: "\u29B7", OpenCurlyDoubleQuote: "\u201C", OpenCurlyQuote: "\u2018", operp: "\u29B9", oplus: "\u2295", orarr: "\u21BB", Or: "\
\u2A54", or: "\u2228", ord: "\u2A5D", order: "\u2134", orderof: "\u2134", ordf: "\xAA", ordm: "\xBA", origof: "\u22B6", oror: "\u2A56", orslope: "\
\u2A57", orv: "\u2A5B", oS: "\u24C8", Oscr: "\u{1D4AA}", oscr: "\u2134", Oslash: "\xD8", oslash: "\xF8", osol: "\u2298", Otilde: "\xD5", otilde: "\
\xF5", otimesas: "\u2A36", Otimes: "\u2A37", otimes: "\u2297", Ouml: "\xD6", ouml: "\xF6", ovbar: "\u233D", OverBar: "\u203E", OverBrace: "\u23DE",
  OverBracket: "\u23B4", OverParenthesis: "\u23DC", para: "\xB6", parallel: "\u2225", par: "\u2225", parsim: "\u2AF3", parsl: "\u2AFD", part: "\
\u2202", PartialD: "\u2202", Pcy: "\u041F", pcy: "\u043F", percnt: "%", period: ".", permil: "\u2030", perp: "\u22A5", pertenk: "\u2031", Pfr: "\
\u{1D513}", pfr: "\u{1D52D}", Phi: "\u03A6", phi: "\u03C6", phiv: "\u03D5", phmmat: "\u2133", phone: "\u260E", Pi: "\u03A0", pi: "\u03C0", pitchfork: "\
\u22D4", piv: "\u03D6", planck: "\u210F", planckh: "\u210E", plankv: "\u210F", plusacir: "\u2A23", plusb: "\u229E", pluscir: "\u2A22", plus: "\
+", plusdo: "\u2214", plusdu: "\u2A25", pluse: "\u2A72", PlusMinus: "\xB1", plusmn: "\xB1", plussim: "\u2A26", plustwo: "\u2A27", pm: "\xB1",
  Poincareplane: "\u210C", pointint: "\u2A15", popf: "\u{1D561}", Popf: "\u2119", pound: "\xA3", prap: "\u2AB7", Pr: "\u2ABB", pr: "\u227A",
  prcue: "\u227C", precapprox: "\u2AB7", prec: "\u227A", preccurlyeq: "\u227C", Precedes: "\u227A", PrecedesEqual: "\u2AAF", PrecedesSlantEqual: "\
\u227C", PrecedesTilde: "\u227E", preceq: "\u2AAF", precnapprox: "\u2AB9", precneqq: "\u2AB5", precnsim: "\u22E8", pre: "\u2AAF", prE: "\u2AB3",
  precsim: "\u227E", prime: "\u2032", Prime: "\u2033", primes: "\u2119", prnap: "\u2AB9", prnE: "\u2AB5", prnsim: "\u22E8", prod: "\u220F", Product: "\
\u220F", profalar: "\u232E", profline: "\u2312", profsurf: "\u2313", prop: "\u221D", Proportional: "\u221D", Proportion: "\u2237", propto: "\
\u221D", prsim: "\u227E", prurel: "\u22B0", Pscr: "\u{1D4AB}", pscr: "\u{1D4C5}", Psi: "\u03A8", psi: "\u03C8", puncsp: "\u2008", Qfr: "\u{1D514}",
  qfr: "\u{1D52E}", qint: "\u2A0C", qopf: "\u{1D562}", Qopf: "\u211A", qprime: "\u2057", Qscr: "\u{1D4AC}", qscr: "\u{1D4C6}", quaternions: "\
\u210D", quatint: "\u2A16", quest: "?", questeq: "\u225F", quot: '"', QUOT: '"', rAarr: "\u21DB", race: "\u223D\u0331", Racute: "\u0154", racute: "\
\u0155", radic: "\u221A", raemptyv: "\u29B3", rang: "\u27E9", Rang: "\u27EB", rangd: "\u2992", range: "\u29A5", rangle: "\u27E9", raquo: "\xBB",
  rarrap: "\u2975", rarrb: "\u21E5", rarrbfs: "\u2920", rarrc: "\u2933", rarr: "\u2192", Rarr: "\u21A0", rArr: "\u21D2", rarrfs: "\u291E", rarrhk: "\
\u21AA", rarrlp: "\u21AC", rarrpl: "\u2945", rarrsim: "\u2974", Rarrtl: "\u2916", rarrtl: "\u21A3", rarrw: "\u219D", ratail: "\u291A", rAtail: "\
\u291C", ratio: "\u2236", rationals: "\u211A", rbarr: "\u290D", rBarr: "\u290F", RBarr: "\u2910", rbbrk: "\u2773", rbrace: "}", rbrack: "]",
  rbrke: "\u298C", rbrksld: "\u298E", rbrkslu: "\u2990", Rcaron: "\u0158", rcaron: "\u0159", Rcedil: "\u0156", rcedil: "\u0157", rceil: "\u2309",
  rcub: "}", Rcy: "\u0420", rcy: "\u0440", rdca: "\u2937", rdldhar: "\u2969", rdquo: "\u201D", rdquor: "\u201D", rdsh: "\u21B3", real: "\u211C",
  realine: "\u211B", realpart: "\u211C", reals: "\u211D", Re: "\u211C", rect: "\u25AD", reg: "\xAE", REG: "\xAE", ReverseElement: "\u220B", ReverseEquilibrium: "\
\u21CB", ReverseUpEquilibrium: "\u296F", rfisht: "\u297D", rfloor: "\u230B", rfr: "\u{1D52F}", Rfr: "\u211C", rHar: "\u2964", rhard: "\u21C1",
  rharu: "\u21C0", rharul: "\u296C", Rho: "\u03A1", rho: "\u03C1", rhov: "\u03F1", RightAngleBracket: "\u27E9", RightArrowBar: "\u21E5", rightarrow: "\
\u2192", RightArrow: "\u2192", Rightarrow: "\u21D2", RightArrowLeftArrow: "\u21C4", rightarrowtail: "\u21A3", RightCeiling: "\u2309", RightDoubleBracket: "\
\u27E7", RightDownTeeVector: "\u295D", RightDownVectorBar: "\u2955", RightDownVector: "\u21C2", RightFloor: "\u230B", rightharpoondown: "\u21C1",
  rightharpoonup: "\u21C0", rightleftarrows: "\u21C4", rightleftharpoons: "\u21CC", rightrightarrows: "\u21C9", rightsquigarrow: "\u219D", RightTeeArrow: "\
\u21A6", RightTee: "\u22A2", RightTeeVector: "\u295B", rightthreetimes: "\u22CC", RightTriangleBar: "\u29D0", RightTriangle: "\u22B3", RightTriangleEqual: "\
\u22B5", RightUpDownVector: "\u294F", RightUpTeeVector: "\u295C", RightUpVectorBar: "\u2954", RightUpVector: "\u21BE", RightVectorBar: "\u2953",
  RightVector: "\u21C0", ring: "\u02DA", risingdotseq: "\u2253", rlarr: "\u21C4", rlhar: "\u21CC", rlm: "\u200F", rmoustache: "\u23B1", rmoust: "\
\u23B1", rnmid: "\u2AEE", roang: "\u27ED", roarr: "\u21FE", robrk: "\u27E7", ropar: "\u2986", ropf: "\u{1D563}", Ropf: "\u211D", roplus: "\u2A2E",
  rotimes: "\u2A35", RoundImplies: "\u2970", rpar: ")", rpargt: "\u2994", rppolint: "\u2A12", rrarr: "\u21C9", Rrightarrow: "\u21DB", rsaquo: "\
\u203A", rscr: "\u{1D4C7}", Rscr: "\u211B", rsh: "\u21B1", Rsh: "\u21B1", rsqb: "]", rsquo: "\u2019", rsquor: "\u2019", rthree: "\u22CC", rtimes: "\
\u22CA", rtri: "\u25B9", rtrie: "\u22B5", rtrif: "\u25B8", rtriltri: "\u29CE", RuleDelayed: "\u29F4", ruluhar: "\u2968", rx: "\u211E", Sacute: "\
\u015A", sacute: "\u015B", sbquo: "\u201A", scap: "\u2AB8", Scaron: "\u0160", scaron: "\u0161", Sc: "\u2ABC", sc: "\u227B", sccue: "\u227D",
  sce: "\u2AB0", scE: "\u2AB4", Scedil: "\u015E", scedil: "\u015F", Scirc: "\u015C", scirc: "\u015D", scnap: "\u2ABA", scnE: "\u2AB6", scnsim: "\
\u22E9", scpolint: "\u2A13", scsim: "\u227F", Scy: "\u0421", scy: "\u0441", sdotb: "\u22A1", sdot: "\u22C5", sdote: "\u2A66", searhk: "\u2925",
  searr: "\u2198", seArr: "\u21D8", searrow: "\u2198", sect: "\xA7", semi: ";", seswar: "\u2929", setminus: "\u2216", setmn: "\u2216", sext: "\
\u2736", Sfr: "\u{1D516}", sfr: "\u{1D530}", sfrown: "\u2322", sharp: "\u266F", SHCHcy: "\u0429", shchcy: "\u0449", SHcy: "\u0428", shcy: "\u0448",
  ShortDownArrow: "\u2193", ShortLeftArrow: "\u2190", shortmid: "\u2223", shortparallel: "\u2225", ShortRightArrow: "\u2192", ShortUpArrow: "\
\u2191", shy: "\xAD", Sigma: "\u03A3", sigma: "\u03C3", sigmaf: "\u03C2", sigmav: "\u03C2", sim: "\u223C", simdot: "\u2A6A", sime: "\u2243",
  simeq: "\u2243", simg: "\u2A9E", simgE: "\u2AA0", siml: "\u2A9D", simlE: "\u2A9F", simne: "\u2246", simplus: "\u2A24", simrarr: "\u2972", slarr: "\
\u2190", SmallCircle: "\u2218", smallsetminus: "\u2216", smashp: "\u2A33", smeparsl: "\u29E4", smid: "\u2223", smile: "\u2323", smt: "\u2AAA",
  smte: "\u2AAC", smtes: "\u2AAC\uFE00", SOFTcy: "\u042C", softcy: "\u044C", solbar: "\u233F", solb: "\u29C4", sol: "/", Sopf: "\u{1D54A}", sopf: "\
\u{1D564}", spades: "\u2660", spadesuit: "\u2660", spar: "\u2225", sqcap: "\u2293", sqcaps: "\u2293\uFE00", sqcup: "\u2294", sqcups: "\u2294\uFE00",
  Sqrt: "\u221A", sqsub: "\u228F", sqsube: "\u2291", sqsubset: "\u228F", sqsubseteq: "\u2291", sqsup: "\u2290", sqsupe: "\u2292", sqsupset: "\
\u2290", sqsupseteq: "\u2292", square: "\u25A1", Square: "\u25A1", SquareIntersection: "\u2293", SquareSubset: "\u228F", SquareSubsetEqual: "\
\u2291", SquareSuperset: "\u2290", SquareSupersetEqual: "\u2292", SquareUnion: "\u2294", squarf: "\u25AA", squ: "\u25A1", squf: "\u25AA", srarr: "\
\u2192", Sscr: "\u{1D4AE}", sscr: "\u{1D4C8}", ssetmn: "\u2216", ssmile: "\u2323", sstarf: "\u22C6", Star: "\u22C6", star: "\u2606", starf: "\
\u2605", straightepsilon: "\u03F5", straightphi: "\u03D5", strns: "\xAF", sub: "\u2282", Sub: "\u22D0", subdot: "\u2ABD", subE: "\u2AC5", sube: "\
\u2286", subedot: "\u2AC3", submult: "\u2AC1", subnE: "\u2ACB", subne: "\u228A", subplus: "\u2ABF", subrarr: "\u2979", subset: "\u2282", Subset: "\
\u22D0", subseteq: "\u2286", subseteqq: "\u2AC5", SubsetEqual: "\u2286", subsetneq: "\u228A", subsetneqq: "\u2ACB", subsim: "\u2AC7", subsub: "\
\u2AD5", subsup: "\u2AD3", succapprox: "\u2AB8", succ: "\u227B", succcurlyeq: "\u227D", Succeeds: "\u227B", SucceedsEqual: "\u2AB0", SucceedsSlantEqual: "\
\u227D", SucceedsTilde: "\u227F", succeq: "\u2AB0", succnapprox: "\u2ABA", succneqq: "\u2AB6", succnsim: "\u22E9", succsim: "\u227F", SuchThat: "\
\u220B", sum: "\u2211", Sum: "\u2211", sung: "\u266A", sup1: "\xB9", sup2: "\xB2", sup3: "\xB3", sup: "\u2283", Sup: "\u22D1", supdot: "\u2ABE",
  supdsub: "\u2AD8", supE: "\u2AC6", supe: "\u2287", supedot: "\u2AC4", Superset: "\u2283", SupersetEqual: "\u2287", suphsol: "\u27C9", suphsub: "\
\u2AD7", suplarr: "\u297B", supmult: "\u2AC2", supnE: "\u2ACC", supne: "\u228B", supplus: "\u2AC0", supset: "\u2283", Supset: "\u22D1", supseteq: "\
\u2287", supseteqq: "\u2AC6", supsetneq: "\u228B", supsetneqq: "\u2ACC", supsim: "\u2AC8", supsub: "\u2AD4", supsup: "\u2AD6", swarhk: "\u2926",
  swarr: "\u2199", swArr: "\u21D9", swarrow: "\u2199", swnwar: "\u292A", szlig: "\xDF", Tab: "	", target: "\u2316", Tau: "\u03A4", tau: "\u03C4",
  tbrk: "\u23B4", Tcaron: "\u0164", tcaron: "\u0165", Tcedil: "\u0162", tcedil: "\u0163", Tcy: "\u0422", tcy: "\u0442", tdot: "\u20DB", telrec: "\
\u2315", Tfr: "\u{1D517}", tfr: "\u{1D531}", there4: "\u2234", therefore: "\u2234", Therefore: "\u2234", Theta: "\u0398", theta: "\u03B8", thetasym: "\
\u03D1", thetav: "\u03D1", thickapprox: "\u2248", thicksim: "\u223C", ThickSpace: "\u205F\u200A", ThinSpace: "\u2009", thinsp: "\u2009", thkap: "\
\u2248", thksim: "\u223C", THORN: "\xDE", thorn: "\xFE", tilde: "\u02DC", Tilde: "\u223C", TildeEqual: "\u2243", TildeFullEqual: "\u2245", TildeTilde: "\
\u2248", timesbar: "\u2A31", timesb: "\u22A0", times: "\xD7", timesd: "\u2A30", tint: "\u222D", toea: "\u2928", topbot: "\u2336", topcir: "\u2AF1",
  top: "\u22A4", Topf: "\u{1D54B}", topf: "\u{1D565}", topfork: "\u2ADA", tosa: "\u2929", tprime: "\u2034", trade: "\u2122", TRADE: "\u2122",
  triangle: "\u25B5", triangledown: "\u25BF", triangleleft: "\u25C3", trianglelefteq: "\u22B4", triangleq: "\u225C", triangleright: "\u25B9",
  trianglerighteq: "\u22B5", tridot: "\u25EC", trie: "\u225C", triminus: "\u2A3A", TripleDot: "\u20DB", triplus: "\u2A39", trisb: "\u29CD", tritime: "\
\u2A3B", trpezium: "\u23E2", Tscr: "\u{1D4AF}", tscr: "\u{1D4C9}", TScy: "\u0426", tscy: "\u0446", TSHcy: "\u040B", tshcy: "\u045B", Tstrok: "\
\u0166", tstrok: "\u0167", twixt: "\u226C", twoheadleftarrow: "\u219E", twoheadrightarrow: "\u21A0", Uacute: "\xDA", uacute: "\xFA", uarr: "\
\u2191", Uarr: "\u219F", uArr: "\u21D1", Uarrocir: "\u2949", Ubrcy: "\u040E", ubrcy: "\u045E", Ubreve: "\u016C", ubreve: "\u016D", Ucirc: "\xDB",
  ucirc: "\xFB", Ucy: "\u0423", ucy: "\u0443", udarr: "\u21C5", Udblac: "\u0170", udblac: "\u0171", udhar: "\u296E", ufisht: "\u297E", Ufr: "\
\u{1D518}", ufr: "\u{1D532}", Ugrave: "\xD9", ugrave: "\xF9", uHar: "\u2963", uharl: "\u21BF", uharr: "\u21BE", uhblk: "\u2580", ulcorn: "\u231C",
  ulcorner: "\u231C", ulcrop: "\u230F", ultri: "\u25F8", Umacr: "\u016A", umacr: "\u016B", uml: "\xA8", UnderBar: "_", UnderBrace: "\u23DF",
  UnderBracket: "\u23B5", UnderParenthesis: "\u23DD", Union: "\u22C3", UnionPlus: "\u228E", Uogon: "\u0172", uogon: "\u0173", Uopf: "\u{1D54C}",
  uopf: "\u{1D566}", UpArrowBar: "\u2912", uparrow: "\u2191", UpArrow: "\u2191", Uparrow: "\u21D1", UpArrowDownArrow: "\u21C5", updownarrow: "\
\u2195", UpDownArrow: "\u2195", Updownarrow: "\u21D5", UpEquilibrium: "\u296E", upharpoonleft: "\u21BF", upharpoonright: "\u21BE", uplus: "\u228E",
  UpperLeftArrow: "\u2196", UpperRightArrow: "\u2197", upsi: "\u03C5", Upsi: "\u03D2", upsih: "\u03D2", Upsilon: "\u03A5", upsilon: "\u03C5",
  UpTeeArrow: "\u21A5", UpTee: "\u22A5", upuparrows: "\u21C8", urcorn: "\u231D", urcorner: "\u231D", urcrop: "\u230E", Uring: "\u016E", uring: "\
\u016F", urtri: "\u25F9", Uscr: "\u{1D4B0}", uscr: "\u{1D4CA}", utdot: "\u22F0", Utilde: "\u0168", utilde: "\u0169", utri: "\u25B5", utrif: "\
\u25B4", uuarr: "\u21C8", Uuml: "\xDC", uuml: "\xFC", uwangle: "\u29A7", vangrt: "\u299C", varepsilon: "\u03F5", varkappa: "\u03F0", varnothing: "\
\u2205", varphi: "\u03D5", varpi: "\u03D6", varpropto: "\u221D", varr: "\u2195", vArr: "\u21D5", varrho: "\u03F1", varsigma: "\u03C2", varsubsetneq: "\
\u228A\uFE00", varsubsetneqq: "\u2ACB\uFE00", varsupsetneq: "\u228B\uFE00", varsupsetneqq: "\u2ACC\uFE00", vartheta: "\u03D1", vartriangleleft: "\
\u22B2", vartriangleright: "\u22B3", vBar: "\u2AE8", Vbar: "\u2AEB", vBarv: "\u2AE9", Vcy: "\u0412", vcy: "\u0432", vdash: "\u22A2", vDash: "\
\u22A8", Vdash: "\u22A9", VDash: "\u22AB", Vdashl: "\u2AE6", veebar: "\u22BB", vee: "\u2228", Vee: "\u22C1", veeeq: "\u225A", vellip: "\u22EE",
  verbar: "|", Verbar: "\u2016", vert: "|", Vert: "\u2016", VerticalBar: "\u2223", VerticalLine: "|", VerticalSeparator: "\u2758", VerticalTilde: "\
\u2240", VeryThinSpace: "\u200A", Vfr: "\u{1D519}", vfr: "\u{1D533}", vltri: "\u22B2", vnsub: "\u2282\u20D2", vnsup: "\u2283\u20D2", Vopf: "\
\u{1D54D}", vopf: "\u{1D567}", vprop: "\u221D", vrtri: "\u22B3", Vscr: "\u{1D4B1}", vscr: "\u{1D4CB}", vsubnE: "\u2ACB\uFE00", vsubne: "\u228A\uFE00",
  vsupnE: "\u2ACC\uFE00", vsupne: "\u228B\uFE00", Vvdash: "\u22AA", vzigzag: "\u299A", Wcirc: "\u0174", wcirc: "\u0175", wedbar: "\u2A5F", wedge: "\
\u2227", Wedge: "\u22C0", wedgeq: "\u2259", weierp: "\u2118", Wfr: "\u{1D51A}", wfr: "\u{1D534}", Wopf: "\u{1D54E}", wopf: "\u{1D568}", wp: "\
\u2118", wr: "\u2240", wreath: "\u2240", Wscr: "\u{1D4B2}", wscr: "\u{1D4CC}", xcap: "\u22C2", xcirc: "\u25EF", xcup: "\u22C3", xdtri: "\u25BD",
  Xfr: "\u{1D51B}", xfr: "\u{1D535}", xharr: "\u27F7", xhArr: "\u27FA", Xi: "\u039E", xi: "\u03BE", xlarr: "\u27F5", xlArr: "\u27F8", xmap: "\
\u27FC", xnis: "\u22FB", xodot: "\u2A00", Xopf: "\u{1D54F}", xopf: "\u{1D569}", xoplus: "\u2A01", xotime: "\u2A02", xrarr: "\u27F6", xrArr: "\
\u27F9", Xscr: "\u{1D4B3}", xscr: "\u{1D4CD}", xsqcup: "\u2A06", xuplus: "\u2A04", xutri: "\u25B3", xvee: "\u22C1", xwedge: "\u22C0", Yacute: "\
\xDD", yacute: "\xFD", YAcy: "\u042F", yacy: "\u044F", Ycirc: "\u0176", ycirc: "\u0177", Ycy: "\u042B", ycy: "\u044B", yen: "\xA5", Yfr: "\u{1D51C}",
  yfr: "\u{1D536}", YIcy: "\u0407", yicy: "\u0457", Yopf: "\u{1D550}", yopf: "\u{1D56A}", Yscr: "\u{1D4B4}", yscr: "\u{1D4CE}", YUcy: "\u042E",
  yucy: "\u044E", yuml: "\xFF", Yuml: "\u0178", Zacute: "\u0179", zacute: "\u017A", Zcaron: "\u017D", zcaron: "\u017E", Zcy: "\u0417", zcy: "\
\u0437", Zdot: "\u017B", zdot: "\u017C", zeetrf: "\u2128", ZeroWidthSpace: "\u200B", Zeta: "\u0396", zeta: "\u03B6", zfr: "\u{1D537}", Zfr: "\
\u2128", ZHcy: "\u0416", zhcy: "\u0436", zigrarr: "\u21DD", zopf: "\u{1D56B}", Zopf: "\u2124", Zscr: "\u{1D4B5}", zscr: "\u{1D4CF}", zwj: "\u200D",
  zwnj: "\u200C" };
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/maps/legacy.json
var ri = B((_b, Gu) => {
  Gu.exports = { Aacute: "\xC1", aacute: "\xE1", Acirc: "\xC2", acirc: "\xE2", acute: "\xB4", AElig: "\xC6", aelig: "\xE6", Agrave: "\xC0", agrave: "\
\xE0", amp: "&", AMP: "&", Aring: "\xC5", aring: "\xE5", Atilde: "\xC3", atilde: "\xE3", Auml: "\xC4", auml: "\xE4", brvbar: "\xA6", Ccedil: "\
\xC7", ccedil: "\xE7", cedil: "\xB8", cent: "\xA2", copy: "\xA9", COPY: "\xA9", curren: "\xA4", deg: "\xB0", divide: "\xF7", Eacute: "\xC9",
  eacute: "\xE9", Ecirc: "\xCA", ecirc: "\xEA", Egrave: "\xC8", egrave: "\xE8", ETH: "\xD0", eth: "\xF0", Euml: "\xCB", euml: "\xEB", frac12: "\
\xBD", frac14: "\xBC", frac34: "\xBE", gt: ">", GT: ">", Iacute: "\xCD", iacute: "\xED", Icirc: "\xCE", icirc: "\xEE", iexcl: "\xA1", Igrave: "\
\xCC", igrave: "\xEC", iquest: "\xBF", Iuml: "\xCF", iuml: "\xEF", laquo: "\xAB", lt: "<", LT: "<", macr: "\xAF", micro: "\xB5", middot: "\xB7",
  nbsp: "\xA0", not: "\xAC", Ntilde: "\xD1", ntilde: "\xF1", Oacute: "\xD3", oacute: "\xF3", Ocirc: "\xD4", ocirc: "\xF4", Ograve: "\xD2", ograve: "\
\xF2", ordf: "\xAA", ordm: "\xBA", Oslash: "\xD8", oslash: "\xF8", Otilde: "\xD5", otilde: "\xF5", Ouml: "\xD6", ouml: "\xF6", para: "\xB6",
  plusmn: "\xB1", pound: "\xA3", quot: '"', QUOT: '"', raquo: "\xBB", reg: "\xAE", REG: "\xAE", sect: "\xA7", shy: "\xAD", sup1: "\xB9", sup2: "\
\xB2", sup3: "\xB3", szlig: "\xDF", THORN: "\xDE", thorn: "\xFE", times: "\xD7", Uacute: "\xDA", uacute: "\xFA", Ucirc: "\xDB", ucirc: "\xFB",
  Ugrave: "\xD9", ugrave: "\xF9", uml: "\xA8", Uuml: "\xDC", uuml: "\xFC", Yacute: "\xDD", yacute: "\xFD", yen: "\xA5", yuml: "\xFF" };
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/maps/xml.json
var kn = B((wb, Vu) => {
  Vu.exports = { amp: "&", apos: "'", gt: ">", lt: "<", quot: '"' };
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/maps/decode.json
var ti = B((vb, Hu) => {
  Hu.exports = { "0": 65533, "128": 8364, "130": 8218, "131": 402, "132": 8222, "133": 8230, "134": 8224, "135": 8225, "136": 710, "137": 8240,
  "138": 352, "139": 8249, "140": 338, "142": 381, "145": 8216, "146": 8217, "147": 8220, "148": 8221, "149": 8226, "150": 8211, "151": 8212,
  "152": 732, "153": 8482, "154": 353, "155": 8250, "156": 339, "158": 382, "159": 376 };
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/decode_codepoint.js
var ni = B((jr) => {
  "use strict";
  var zu = jr && jr.__importDefault || function(r) {
    return r && r.__esModule ? r : { default: r };
  };
  Object.defineProperty(jr, "__esModule", { value: !0 });
  var oi = zu(ti()), Wu = (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    String.fromCodePoint || function(r) {
      var e = "";
      return r > 65535 && (r -= 65536, e += String.fromCharCode(r >>> 10 & 1023 | 55296), r = 56320 | r & 1023), e += String.fromCharCode(r),
      e;
    }
  );
  function $u(r) {
    return r >= 55296 && r <= 57343 || r > 1114111 ? "\uFFFD" : (r in oi.default && (r = oi.default[r]), Wu(r));
  }
  n($u, "decodeCodePoint");
  jr.default = $u;
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/decode.js
var jn = B((ae) => {
  "use strict";
  var _t = ae && ae.__importDefault || function(r) {
    return r && r.__esModule ? r : { default: r };
  };
  Object.defineProperty(ae, "__esModule", { value: !0 });
  ae.decodeHTML = ae.decodeHTMLStrict = ae.decodeXML = void 0;
  var Ln = _t(Nn()), Yu = _t(ri()), Ku = _t(kn()), si = _t(ni()), Xu = /&(?:[a-zA-Z0-9]+|#[xX][\da-fA-F]+|#\d+);/g;
  ae.decodeXML = ii(Ku.default);
  ae.decodeHTMLStrict = ii(Ln.default);
  function ii(r) {
    var e = li(r);
    return function(t) {
      return String(t).replace(Xu, e);
    };
  }
  n(ii, "getStrictDecoder");
  var ai = /* @__PURE__ */ n(function(r, e) {
    return r < e ? 1 : -1;
  }, "sorter");
  ae.decodeHTML = function() {
    for (var r = Object.keys(Yu.default).sort(ai), e = Object.keys(Ln.default).sort(ai), t = 0, o = 0; t < e.length; t++)
      r[o] === e[t] ? (e[t] += ";?", o++) : e[t] += ";";
    var s = new RegExp("&(?:" + e.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g"), a = li(Ln.default);
    function l(c) {
      return c.substr(-1) !== ";" && (c += ";"), a(c);
    }
    return n(l, "replacer"), function(c) {
      return String(c).replace(s, l);
    };
  }();
  function li(r) {
    return /* @__PURE__ */ n(function(t) {
      if (t.charAt(1) === "#") {
        var o = t.charAt(2);
        return o === "X" || o === "x" ? si.default(parseInt(t.substr(3), 16)) : si.default(parseInt(t.substr(2), 10));
      }
      return r[t.slice(1, -1)] || t;
    }, "replace");
  }
  n(li, "getReplacer");
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/encode.js
var qn = B((X) => {
  "use strict";
  var ci = X && X.__importDefault || function(r) {
    return r && r.__esModule ? r : { default: r };
  };
  Object.defineProperty(X, "__esModule", { value: !0 });
  X.escapeUTF8 = X.escape = X.encodeNonAsciiHTML = X.encodeHTML = X.encodeXML = void 0;
  var Ju = ci(kn()), pi = ui(Ju.default), di = fi(pi);
  X.encodeXML = hi(pi);
  var Qu = ci(Nn()), Mn = ui(Qu.default), Zu = fi(Mn);
  X.encodeHTML = rf(Mn, Zu);
  X.encodeNonAsciiHTML = hi(Mn);
  function ui(r) {
    return Object.keys(r).sort().reduce(function(e, t) {
      return e[r[t]] = "&" + t + ";", e;
    }, {});
  }
  n(ui, "getInverseObj");
  function fi(r) {
    for (var e = [], t = [], o = 0, s = Object.keys(r); o < s.length; o++) {
      var a = s[o];
      a.length === 1 ? e.push("\\" + a) : t.push(a);
    }
    e.sort();
    for (var l = 0; l < e.length - 1; l++) {
      for (var c = l; c < e.length - 1 && e[c].charCodeAt(1) + 1 === e[c + 1].charCodeAt(1); )
        c += 1;
      var i = 1 + c - l;
      i < 3 || e.splice(l, i, e[l] + "-" + e[c]);
    }
    return t.unshift("[" + e.join("") + "]"), new RegExp(t.join("|"), "g");
  }
  n(fi, "getInverseReplacer");
  var yi = /(?:[\x80-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g,
  ef = (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    String.prototype.codePointAt != null ? (
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      function(r) {
        return r.codePointAt(0);
      }
    ) : (
      // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      function(r) {
        return (r.charCodeAt(0) - 55296) * 1024 + r.charCodeAt(1) - 56320 + 65536;
      }
    )
  );
  function wt(r) {
    return "&#x" + (r.length > 1 ? ef(r) : r.charCodeAt(0)).toString(16).toUpperCase() + ";";
  }
  n(wt, "singleCharReplacer");
  function rf(r, e) {
    return function(t) {
      return t.replace(e, function(o) {
        return r[o];
      }).replace(yi, wt);
    };
  }
  n(rf, "getInverse");
  var mi = new RegExp(di.source + "|" + yi.source, "g");
  function tf(r) {
    return r.replace(mi, wt);
  }
  n(tf, "escape");
  X.escape = tf;
  function of(r) {
    return r.replace(di, wt);
  }
  n(of, "escapeUTF8");
  X.escapeUTF8 = of;
  function hi(r) {
    return function(e) {
      return e.replace(mi, function(t) {
        return r[t] || wt(t);
      });
    };
  }
  n(hi, "getASCIIEncoder");
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/index.js
var Si = B((C) => {
  "use strict";
  Object.defineProperty(C, "__esModule", { value: !0 });
  C.decodeXMLStrict = C.decodeHTML5Strict = C.decodeHTML4Strict = C.decodeHTML5 = C.decodeHTML4 = C.decodeHTMLStrict = C.decodeHTML = C.decodeXML =
  C.encodeHTML5 = C.encodeHTML4 = C.escapeUTF8 = C.escape = C.encodeNonAsciiHTML = C.encodeHTML = C.encodeXML = C.encode = C.decodeStrict = C.
  decode = void 0;
  var vt = jn(), gi = qn();
  function nf(r, e) {
    return (!e || e <= 0 ? vt.decodeXML : vt.decodeHTML)(r);
  }
  n(nf, "decode");
  C.decode = nf;
  function sf(r, e) {
    return (!e || e <= 0 ? vt.decodeXML : vt.decodeHTMLStrict)(r);
  }
  n(sf, "decodeStrict");
  C.decodeStrict = sf;
  function af(r, e) {
    return (!e || e <= 0 ? gi.encodeXML : gi.encodeHTML)(r);
  }
  n(af, "encode");
  C.encode = af;
  var Me = qn();
  Object.defineProperty(C, "encodeXML", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Me.encodeXML;
  }, "get") });
  Object.defineProperty(C, "encodeHTML", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Me.encodeHTML;
  }, "get") });
  Object.defineProperty(C, "encodeNonAsciiHTML", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Me.encodeNonAsciiHTML;
  }, "get") });
  Object.defineProperty(C, "escape", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Me.escape;
  }, "get") });
  Object.defineProperty(C, "escapeUTF8", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Me.escapeUTF8;
  }, "get") });
  Object.defineProperty(C, "encodeHTML4", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Me.encodeHTML;
  }, "get") });
  Object.defineProperty(C, "encodeHTML5", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Me.encodeHTML;
  }, "get") });
  var Re = jn();
  Object.defineProperty(C, "decodeXML", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Re.decodeXML;
  }, "get") });
  Object.defineProperty(C, "decodeHTML", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Re.decodeHTML;
  }, "get") });
  Object.defineProperty(C, "decodeHTMLStrict", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Re.decodeHTMLStrict;
  }, "get") });
  Object.defineProperty(C, "decodeHTML4", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Re.decodeHTML;
  }, "get") });
  Object.defineProperty(C, "decodeHTML5", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Re.decodeHTML;
  }, "get") });
  Object.defineProperty(C, "decodeHTML4Strict", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Re.decodeHTMLStrict;
  }, "get") });
  Object.defineProperty(C, "decodeHTML5Strict", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Re.decodeHTMLStrict;
  }, "get") });
  Object.defineProperty(C, "decodeXMLStrict", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Re.decodeXML;
  }, "get") });
});

// ../node_modules/ansi-to-html/lib/ansi_to_html.js
var Ci = B((Lb, Pi) => {
  "use strict";
  function lf(r, e) {
    if (!(r instanceof e))
      throw new TypeError("Cannot call a class as a function");
  }
  n(lf, "_classCallCheck");
  function bi(r, e) {
    for (var t = 0; t < e.length; t++) {
      var o = e[t];
      o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(r, o.key, o);
    }
  }
  n(bi, "_defineProperties");
  function cf(r, e, t) {
    return e && bi(r.prototype, e), t && bi(r, t), r;
  }
  n(cf, "_createClass");
  function _i(r, e) {
    var t = typeof Symbol < "u" && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
      if (Array.isArray(r) || (t = pf(r)) || e && r && typeof r.length == "number") {
        t && (r = t);
        var o = 0, s = /* @__PURE__ */ n(function() {
        }, "F");
        return { s, n: /* @__PURE__ */ n(function() {
          return o >= r.length ? { done: !0 } : { done: !1, value: r[o++] };
        }, "n"), e: /* @__PURE__ */ n(function(p) {
          throw p;
        }, "e"), f: s };
      }
      throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
    }
    var a = !0, l = !1, c;
    return { s: /* @__PURE__ */ n(function() {
      t = t.call(r);
    }, "s"), n: /* @__PURE__ */ n(function() {
      var p = t.next();
      return a = p.done, p;
    }, "n"), e: /* @__PURE__ */ n(function(p) {
      l = !0, c = p;
    }, "e"), f: /* @__PURE__ */ n(function() {
      try {
        !a && t.return != null && t.return();
      } finally {
        if (l) throw c;
      }
    }, "f") };
  }
  n(_i, "_createForOfIteratorHelper");
  function pf(r, e) {
    if (r) {
      if (typeof r == "string") return Ti(r, e);
      var t = Object.prototype.toString.call(r).slice(8, -1);
      if (t === "Object" && r.constructor && (t = r.constructor.name), t === "Map" || t === "Set") return Array.from(r);
      if (t === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)) return Ti(r, e);
    }
  }
  n(pf, "_unsupportedIterableToArray");
  function Ti(r, e) {
    (e == null || e > r.length) && (e = r.length);
    for (var t = 0, o = new Array(e); t < e; t++)
      o[t] = r[t];
    return o;
  }
  n(Ti, "_arrayLikeToArray");
  var df = Si(), Ei = {
    fg: "#FFF",
    bg: "#000",
    newline: !1,
    escapeXML: !1,
    stream: !1,
    colors: uf()
  };
  function uf() {
    var r = {
      0: "#000",
      1: "#A00",
      2: "#0A0",
      3: "#A50",
      4: "#00A",
      5: "#A0A",
      6: "#0AA",
      7: "#AAA",
      8: "#555",
      9: "#F55",
      10: "#5F5",
      11: "#FF5",
      12: "#55F",
      13: "#F5F",
      14: "#5FF",
      15: "#FFF"
    };
    return Pt(0, 5).forEach(function(e) {
      Pt(0, 5).forEach(function(t) {
        Pt(0, 5).forEach(function(o) {
          return ff(e, t, o, r);
        });
      });
    }), Pt(0, 23).forEach(function(e) {
      var t = e + 232, o = wi(e * 10 + 8);
      r[t] = "#" + o + o + o;
    }), r;
  }
  n(uf, "getDefaultColors");
  function ff(r, e, t, o) {
    var s = 16 + r * 36 + e * 6 + t, a = r > 0 ? r * 40 + 55 : 0, l = e > 0 ? e * 40 + 55 : 0, c = t > 0 ? t * 40 + 55 : 0;
    o[s] = yf([a, l, c]);
  }
  n(ff, "setStyleColor");
  function wi(r) {
    for (var e = r.toString(16); e.length < 2; )
      e = "0" + e;
    return e;
  }
  n(wi, "toHexString");
  function yf(r) {
    var e = [], t = _i(r), o;
    try {
      for (t.s(); !(o = t.n()).done; ) {
        var s = o.value;
        e.push(wi(s));
      }
    } catch (a) {
      t.e(a);
    } finally {
      t.f();
    }
    return "#" + e.join("");
  }
  n(yf, "toColorHexString");
  function Ri(r, e, t, o) {
    var s;
    return e === "text" ? s = Sf(t, o) : e === "display" ? s = hf(r, t, o) : e === "xterm256Foreground" ? s = Ot(r, o.colors[t]) : e === "xt\
erm256Background" ? s = It(r, o.colors[t]) : e === "rgb" && (s = mf(r, t)), s;
  }
  n(Ri, "generateOutput");
  function mf(r, e) {
    e = e.substring(2).slice(0, -1);
    var t = +e.substr(0, 2), o = e.substring(5).split(";"), s = o.map(function(a) {
      return ("0" + Number(a).toString(16)).substr(-2);
    }).join("");
    return Ct(r, (t === 38 ? "color:#" : "background-color:#") + s);
  }
  n(mf, "handleRgb");
  function hf(r, e, t) {
    e = parseInt(e, 10);
    var o = {
      "-1": /* @__PURE__ */ n(function() {
        return "<br/>";
      }, "_"),
      0: /* @__PURE__ */ n(function() {
        return r.length && vi(r);
      }, "_"),
      1: /* @__PURE__ */ n(function() {
        return xe(r, "b");
      }, "_"),
      3: /* @__PURE__ */ n(function() {
        return xe(r, "i");
      }, "_"),
      4: /* @__PURE__ */ n(function() {
        return xe(r, "u");
      }, "_"),
      8: /* @__PURE__ */ n(function() {
        return Ct(r, "display:none");
      }, "_"),
      9: /* @__PURE__ */ n(function() {
        return xe(r, "strike");
      }, "_"),
      22: /* @__PURE__ */ n(function() {
        return Ct(r, "font-weight:normal;text-decoration:none;font-style:normal");
      }, "_"),
      23: /* @__PURE__ */ n(function() {
        return Ai(r, "i");
      }, "_"),
      24: /* @__PURE__ */ n(function() {
        return Ai(r, "u");
      }, "_"),
      39: /* @__PURE__ */ n(function() {
        return Ot(r, t.fg);
      }, "_"),
      49: /* @__PURE__ */ n(function() {
        return It(r, t.bg);
      }, "_"),
      53: /* @__PURE__ */ n(function() {
        return Ct(r, "text-decoration:overline");
      }, "_")
    }, s;
    return o[e] ? s = o[e]() : 4 < e && e < 7 ? s = xe(r, "blink") : 29 < e && e < 38 ? s = Ot(r, t.colors[e - 30]) : 39 < e && e < 48 ? s =
    It(r, t.colors[e - 40]) : 89 < e && e < 98 ? s = Ot(r, t.colors[8 + (e - 90)]) : 99 < e && e < 108 && (s = It(r, t.colors[8 + (e - 100)])),
    s;
  }
  n(hf, "handleDisplay");
  function vi(r) {
    var e = r.slice(0);
    return r.length = 0, e.reverse().map(function(t) {
      return "</" + t + ">";
    }).join("");
  }
  n(vi, "resetStyles");
  function Pt(r, e) {
    for (var t = [], o = r; o <= e; o++)
      t.push(o);
    return t;
  }
  n(Pt, "range");
  function gf(r) {
    return function(e) {
      return (r === null || e.category !== r) && r !== "all";
    };
  }
  n(gf, "notCategory");
  function xi(r) {
    r = parseInt(r, 10);
    var e = null;
    return r === 0 ? e = "all" : r === 1 ? e = "bold" : 2 < r && r < 5 ? e = "underline" : 4 < r && r < 7 ? e = "blink" : r === 8 ? e = "hid\
e" : r === 9 ? e = "strike" : 29 < r && r < 38 || r === 39 || 89 < r && r < 98 ? e = "foreground-color" : (39 < r && r < 48 || r === 49 || 99 <
    r && r < 108) && (e = "background-color"), e;
  }
  n(xi, "categoryForCode");
  function Sf(r, e) {
    return e.escapeXML ? df.encodeXML(r) : r;
  }
  n(Sf, "pushText");
  function xe(r, e, t) {
    return t || (t = ""), r.push(e), "<".concat(e).concat(t ? ' style="'.concat(t, '"') : "", ">");
  }
  n(xe, "pushTag");
  function Ct(r, e) {
    return xe(r, "span", e);
  }
  n(Ct, "pushStyle");
  function Ot(r, e) {
    return xe(r, "span", "color:" + e);
  }
  n(Ot, "pushForegroundColor");
  function It(r, e) {
    return xe(r, "span", "background-color:" + e);
  }
  n(It, "pushBackgroundColor");
  function Ai(r, e) {
    var t;
    if (r.slice(-1)[0] === e && (t = r.pop()), t)
      return "</" + e + ">";
  }
  n(Ai, "closeTag");
  function bf(r, e, t) {
    var o = !1, s = 3;
    function a() {
      return "";
    }
    n(a, "remove");
    function l(_, w) {
      return t("xterm256Foreground", w), "";
    }
    n(l, "removeXterm256Foreground");
    function c(_, w) {
      return t("xterm256Background", w), "";
    }
    n(c, "removeXterm256Background");
    function i(_) {
      return e.newline ? t("display", -1) : t("text", _), "";
    }
    n(i, "newline");
    function p(_, w) {
      o = !0, w.trim().length === 0 && (w = "0"), w = w.trimRight(";").split(";");
      var I = _i(w), M;
      try {
        for (I.s(); !(M = I.n()).done; ) {
          var U = M.value;
          t("display", U);
        }
      } catch (z) {
        I.e(z);
      } finally {
        I.f();
      }
      return "";
    }
    n(p, "ansiMess");
    function u(_) {
      return t("text", _), "";
    }
    n(u, "realText");
    function d(_) {
      return t("rgb", _), "";
    }
    n(d, "rgb");
    var h = [{
      pattern: /^\x08+/,
      sub: a
    }, {
      pattern: /^\x1b\[[012]?K/,
      sub: a
    }, {
      pattern: /^\x1b\[\(B/,
      sub: a
    }, {
      pattern: /^\x1b\[[34]8;2;\d+;\d+;\d+m/,
      sub: d
    }, {
      pattern: /^\x1b\[38;5;(\d+)m/,
      sub: l
    }, {
      pattern: /^\x1b\[48;5;(\d+)m/,
      sub: c
    }, {
      pattern: /^\n/,
      sub: i
    }, {
      pattern: /^\r+\n/,
      sub: i
    }, {
      pattern: /^\r/,
      sub: i
    }, {
      pattern: /^\x1b\[((?:\d{1,3};?)+|)m/,
      sub: p
    }, {
      // CSI n J
      // ED - Erase in Display Clears part of the screen.
      // If n is 0 (or missing), clear from cursor to end of screen.
      // If n is 1, clear from cursor to beginning of the screen.
      // If n is 2, clear entire screen (and moves cursor to upper left on DOS ANSI.SYS).
      // If n is 3, clear entire screen and delete all lines saved in the scrollback buffer
      //   (this feature was added for xterm and is supported by other terminal applications).
      pattern: /^\x1b\[\d?J/,
      sub: a
    }, {
      // CSI n ; m f
      // HVP - Horizontal Vertical Position Same as CUP
      pattern: /^\x1b\[\d{0,3};\d{0,3}f/,
      sub: a
    }, {
      // catch-all for CSI sequences?
      pattern: /^\x1b\[?[\d;]{0,3}/,
      sub: a
    }, {
      /**
       * extracts real text - not containing:
       * - `\x1b' - ESC - escape (Ascii 27)
       * - '\x08' - BS - backspace (Ascii 8)
       * - `\n` - Newline - linefeed (LF) (ascii 10)
       * - `\r` - Windows Carriage Return (CR)
       */
      pattern: /^(([^\x1b\x08\r\n])+)/,
      sub: u
    }];
    function S(_, w) {
      w > s && o || (o = !1, r = r.replace(_.pattern, _.sub));
    }
    n(S, "process");
    var m = [], T = r, y = T.length;
    e: for (; y > 0; ) {
      for (var x = 0, A = 0, g = h.length; A < g; x = ++A) {
        var b = h[x];
        if (S(b, x), r.length !== y) {
          y = r.length;
          continue e;
        }
      }
      if (r.length === y)
        break;
      m.push(0), y = r.length;
    }
    return m;
  }
  n(bf, "tokenize");
  function Tf(r, e, t) {
    return e !== "text" && (r = r.filter(gf(xi(t))), r.push({
      token: e,
      data: t,
      category: xi(t)
    })), r;
  }
  n(Tf, "updateStickyStack");
  var Ef = /* @__PURE__ */ function() {
    function r(e) {
      lf(this, r), e = e || {}, e.colors && (e.colors = Object.assign({}, Ei.colors, e.colors)), this.options = Object.assign({}, Ei, e), this.
      stack = [], this.stickyStack = [];
    }
    return n(r, "Filter"), cf(r, [{
      key: "toHtml",
      value: /* @__PURE__ */ n(function(t) {
        var o = this;
        t = typeof t == "string" ? [t] : t;
        var s = this.stack, a = this.options, l = [];
        return this.stickyStack.forEach(function(c) {
          var i = Ri(s, c.token, c.data, a);
          i && l.push(i);
        }), bf(t.join(""), a, function(c, i) {
          var p = Ri(s, c, i, a);
          p && l.push(p), a.stream && (o.stickyStack = Tf(o.stickyStack, c, i));
        }), s.length && l.push(vi(s)), l.join("");
      }, "toHtml")
    }]), r;
  }();
  Pi.exports = Ef;
});

// ../node_modules/browser-dtector/browser-dtector.umd.min.js
var Mi = B((zn, Wn) => {
  (function(r, e) {
    typeof zn == "object" && typeof Wn < "u" ? Wn.exports = e() : typeof define == "function" && define.amd ? define(e) : (r = typeof globalThis <
    "u" ? globalThis : r || self).BrowserDetector = e();
  })(zn, function() {
    "use strict";
    function r(l, c) {
      for (var i = 0; i < c.length; i++) {
        var p = c[i];
        p.enumerable = p.enumerable || !1, p.configurable = !0, "value" in p && (p.writable = !0), Object.defineProperty(l, (u = p.key, d = void 0,
        typeof (d = function(h, S) {
          if (typeof h != "object" || h === null) return h;
          var m = h[Symbol.toPrimitive];
          if (m !== void 0) {
            var T = m.call(h, S || "default");
            if (typeof T != "object") return T;
            throw new TypeError("@@toPrimitive must return a primitive value.");
          }
          return (S === "string" ? String : Number)(h);
        }(u, "string")) == "symbol" ? d : String(d)), p);
      }
      var u, d;
    }
    n(r, "e");
    var e = { chrome: "Google Chrome", brave: "Brave", crios: "Google Chrome", edge: "Microsoft Edge", edg: "Microsoft Edge", edgios: "Micro\
soft Edge", fennec: "Mozilla Firefox", jsdom: "JsDOM", mozilla: "Mozilla Firefox", fxios: "Mozilla Firefox", msie: "Microsoft Internet Explo\
rer", opera: "Opera", opios: "Opera", opr: "Opera", opt: "Opera", rv: "Microsoft Internet Explorer", safari: "Safari", samsungbrowser: "Sams\
ung Browser", electron: "Electron" }, t = { android: "Android", androidTablet: "Android Tablet", cros: "Chrome OS", fennec: "Android Tablet",
    ipad: "IPad", iphone: "IPhone", jsdom: "JsDOM", linux: "Linux", mac: "Macintosh", tablet: "Android Tablet", win: "Windows", "windows pho\
ne": "Windows Phone", xbox: "Microsoft Xbox" }, o = /* @__PURE__ */ n(function(l) {
      var c = new RegExp("^-?\\d+(?:.\\d{0,".concat(arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : -1, "})?")), i = Number(
      l).toString().match(c);
      return i ? i[0] : null;
    }, "n"), s = /* @__PURE__ */ n(function() {
      return typeof window < "u" ? window.navigator : null;
    }, "i"), a = function() {
      function l(u) {
        var d;
        (function(h, S) {
          if (!(h instanceof S)) throw new TypeError("Cannot call a class as a function");
        })(this, l), this.userAgent = u || ((d = s()) === null || d === void 0 ? void 0 : d.userAgent) || null;
      }
      n(l, "t");
      var c, i, p;
      return c = l, i = [{ key: "parseUserAgent", value: /* @__PURE__ */ n(function(u) {
        var d, h, S, m = {}, T = u || this.userAgent || "", y = T.toLowerCase().replace(/\s\s+/g, " "), x = /(edge)\/([\w.]+)/.exec(y) || /(edg)[/]([\w.]+)/.
        exec(y) || /(opr)[/]([\w.]+)/.exec(y) || /(opt)[/]([\w.]+)/.exec(y) || /(fxios)[/]([\w.]+)/.exec(y) || /(edgios)[/]([\w.]+)/.exec(y) ||
        /(jsdom)[/]([\w.]+)/.exec(y) || /(samsungbrowser)[/]([\w.]+)/.exec(y) || /(electron)[/]([\w.]+)/.exec(y) || /(chrome)[/]([\w.]+)/.exec(
        y) || /(crios)[/]([\w.]+)/.exec(y) || /(opios)[/]([\w.]+)/.exec(y) || /(version)(applewebkit)[/]([\w.]+).*(safari)[/]([\w.]+)/.exec(
        y) || /(webkit)[/]([\w.]+).*(version)[/]([\w.]+).*(safari)[/]([\w.]+)/.exec(y) || /(applewebkit)[/]([\w.]+).*(safari)[/]([\w.]+)/.exec(
        y) || /(webkit)[/]([\w.]+)/.exec(y) || /(opera)(?:.*version|)[/]([\w.]+)/.exec(y) || /(msie) ([\w.]+)/.exec(y) || /(fennec)[/]([\w.]+)/.
        exec(y) || y.indexOf("trident") >= 0 && /(rv)(?::| )([\w.]+)/.exec(y) || y.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.
        exec(y) || [], A = /(ipad)/.exec(y) || /(ipod)/.exec(y) || /(iphone)/.exec(y) || /(jsdom)/.exec(y) || /(windows phone)/.exec(y) || /(xbox)/.
        exec(y) || /(win)/.exec(y) || /(tablet)/.exec(y) || /(android)/.test(y) && /(mobile)/.test(y) === !1 && ["androidTablet"] || /(android)/.
        exec(y) || /(mac)/.exec(y) || /(linux)/.exec(y) || /(cros)/.exec(y) || [], g = x[5] || x[3] || x[1] || null, b = A[0] || null, _ = x[4] ||
        x[2] || null, w = s();
        g === "chrome" && typeof (w == null || (d = w.brave) === null || d === void 0 ? void 0 : d.isBrave) == "function" && (g = "brave"), g &&
        (m[g] = !0), b && (m[b] = !0);
        var I = !!(m.tablet || m.android || m.androidTablet), M = !!(m.ipad || m.tablet || m.androidTablet), U = !!(m.android || m.androidTablet ||
        m.tablet || m.ipad || m.ipod || m.iphone || m["windows phone"]), z = !!(m.cros || m.mac || m.linux || m.win), te = !!(m.brave || m.chrome ||
        m.crios || m.opr || m.safari || m.edg || m.electron), v = !!(m.msie || m.rv);
        return { name: (h = e[g]) !== null && h !== void 0 ? h : null, platform: (S = t[b]) !== null && S !== void 0 ? S : null, userAgent: T,
        version: _, shortVersion: _ ? o(parseFloat(_), 2) : null, isAndroid: I, isTablet: M, isMobile: U, isDesktop: z, isWebkit: te, isIE: v };
      }, "value") }, { key: "getBrowserInfo", value: /* @__PURE__ */ n(function() {
        var u = this.parseUserAgent();
        return { name: u.name, platform: u.platform, userAgent: u.userAgent, version: u.version, shortVersion: u.shortVersion };
      }, "value") }], p = [{ key: "VERSION", get: /* @__PURE__ */ n(function() {
        return "3.4.0";
      }, "get") }], i && r(c.prototype, i), p && r(c, p), Object.defineProperty(c, "prototype", { writable: !1 }), l;
    }();
    return a;
  });
});

// ../node_modules/@storybook/global/dist/index.mjs
var Dt = {};
Ae(Dt, {
  global: () => R
});
var R = (() => {
  let r;
  return typeof window < "u" ? r = window : typeof globalThis < "u" ? r = globalThis : typeof global < "u" ? r = global : typeof self < "u" ?
  r = self : r = {}, r;
})();

// src/core-events/index.ts
var fe = {};
Ae(fe, {
  ARGTYPES_INFO_REQUEST: () => ro,
  ARGTYPES_INFO_RESPONSE: () => Xr,
  CHANNEL_CREATED: () => Yi,
  CHANNEL_WS_DISCONNECT: () => kt,
  CONFIG_ERROR: () => Lt,
  CREATE_NEW_STORYFILE_REQUEST: () => Ki,
  CREATE_NEW_STORYFILE_RESPONSE: () => Xi,
  CURRENT_STORY_WAS_SET: () => $r,
  DOCS_PREPARED: () => jt,
  DOCS_RENDERED: () => sr,
  FILE_COMPONENT_SEARCH_REQUEST: () => Ji,
  FILE_COMPONENT_SEARCH_RESPONSE: () => Qi,
  FORCE_REMOUNT: () => Mt,
  FORCE_RE_RENDER: () => ar,
  GLOBALS_UPDATED: () => _e,
  NAVIGATE_URL: () => Zi,
  PLAY_FUNCTION_THREW_EXCEPTION: () => qt,
  PRELOAD_ENTRIES: () => Bt,
  PREVIEW_BUILDER_PROGRESS: () => el,
  PREVIEW_KEYDOWN: () => Gt,
  REGISTER_SUBSCRIPTION: () => rl,
  REQUEST_WHATS_NEW_DATA: () => dl,
  RESET_STORY_ARGS: () => ir,
  RESULT_WHATS_NEW_DATA: () => ul,
  SAVE_STORY_REQUEST: () => ml,
  SAVE_STORY_RESPONSE: () => hl,
  SELECT_STORY: () => tl,
  SET_CONFIG: () => ol,
  SET_CURRENT_STORY: () => Vt,
  SET_FILTER: () => nl,
  SET_GLOBALS: () => Ht,
  SET_INDEX: () => sl,
  SET_STORIES: () => al,
  SET_WHATS_NEW_CACHE: () => fl,
  SHARED_STATE_CHANGED: () => il,
  SHARED_STATE_SET: () => ll,
  STORIES_COLLAPSE_ALL: () => cl,
  STORIES_EXPAND_ALL: () => pl,
  STORY_ARGS_UPDATED: () => zt,
  STORY_CHANGED: () => Wt,
  STORY_ERRORED: () => $t,
  STORY_FINISHED: () => Kr,
  STORY_INDEX_INVALIDATED: () => Yt,
  STORY_MISSING: () => Yr,
  STORY_PREPARED: () => Kt,
  STORY_RENDERED: () => Be,
  STORY_RENDER_PHASE_CHANGED: () => we,
  STORY_SPECIFIED: () => Xt,
  STORY_THREW_EXCEPTION: () => Jt,
  STORY_UNCHANGED: () => Qt,
  TELEMETRY_ERROR: () => eo,
  TESTING_MODULE_CANCEL_TEST_RUN_REQUEST: () => El,
  TESTING_MODULE_CANCEL_TEST_RUN_RESPONSE: () => Rl,
  TESTING_MODULE_CONFIG_CHANGE: () => Al,
  TESTING_MODULE_CRASH_REPORT: () => gl,
  TESTING_MODULE_PROGRESS_REPORT: () => Sl,
  TESTING_MODULE_RUN_ALL_REQUEST: () => Tl,
  TESTING_MODULE_RUN_REQUEST: () => bl,
  TESTING_MODULE_WATCH_MODE_REQUEST: () => xl,
  TOGGLE_WHATS_NEW_NOTIFICATIONS: () => yl,
  UNHANDLED_ERRORS_WHILE_PLAYING: () => Ut,
  UPDATE_GLOBALS: () => lr,
  UPDATE_QUERY_PARAMS: () => Zt,
  UPDATE_STORY_ARGS: () => cr,
  default: () => $i
});
var Nt = /* @__PURE__ */ ((E) => (E.CHANNEL_WS_DISCONNECT = "channelWSDisconnect", E.CHANNEL_CREATED = "channelCreated", E.CONFIG_ERROR = "c\
onfigError", E.STORY_INDEX_INVALIDATED = "storyIndexInvalidated", E.STORY_SPECIFIED = "storySpecified", E.SET_CONFIG = "setConfig", E.SET_STORIES =
"setStories", E.SET_INDEX = "setIndex", E.SET_CURRENT_STORY = "setCurrentStory", E.CURRENT_STORY_WAS_SET = "currentStoryWasSet", E.FORCE_RE_RENDER =
"forceReRender", E.FORCE_REMOUNT = "forceRemount", E.PRELOAD_ENTRIES = "preloadStories", E.STORY_PREPARED = "storyPrepared", E.DOCS_PREPARED =
"docsPrepared", E.STORY_CHANGED = "storyChanged", E.STORY_UNCHANGED = "storyUnchanged", E.STORY_RENDERED = "storyRendered", E.STORY_FINISHED =
"storyFinished", E.STORY_MISSING = "storyMissing", E.STORY_ERRORED = "storyErrored", E.STORY_THREW_EXCEPTION = "storyThrewException", E.STORY_RENDER_PHASE_CHANGED =
"storyRenderPhaseChanged", E.PLAY_FUNCTION_THREW_EXCEPTION = "playFunctionThrewException", E.UNHANDLED_ERRORS_WHILE_PLAYING = "unhandledErro\
rsWhilePlaying", E.UPDATE_STORY_ARGS = "updateStoryArgs", E.STORY_ARGS_UPDATED = "storyArgsUpdated", E.RESET_STORY_ARGS = "resetStoryArgs", E.
SET_FILTER = "setFilter", E.SET_GLOBALS = "setGlobals", E.UPDATE_GLOBALS = "updateGlobals", E.GLOBALS_UPDATED = "globalsUpdated", E.REGISTER_SUBSCRIPTION =
"registerSubscription", E.PREVIEW_KEYDOWN = "previewKeydown", E.PREVIEW_BUILDER_PROGRESS = "preview_builder_progress", E.SELECT_STORY = "sel\
ectStory", E.STORIES_COLLAPSE_ALL = "storiesCollapseAll", E.STORIES_EXPAND_ALL = "storiesExpandAll", E.DOCS_RENDERED = "docsRendered", E.SHARED_STATE_CHANGED =
"sharedStateChanged", E.SHARED_STATE_SET = "sharedStateSet", E.NAVIGATE_URL = "navigateUrl", E.UPDATE_QUERY_PARAMS = "updateQueryParams", E.
REQUEST_WHATS_NEW_DATA = "requestWhatsNewData", E.RESULT_WHATS_NEW_DATA = "resultWhatsNewData", E.SET_WHATS_NEW_CACHE = "setWhatsNewCache", E.
TOGGLE_WHATS_NEW_NOTIFICATIONS = "toggleWhatsNewNotifications", E.TELEMETRY_ERROR = "telemetryError", E.FILE_COMPONENT_SEARCH_REQUEST = "fil\
eComponentSearchRequest", E.FILE_COMPONENT_SEARCH_RESPONSE = "fileComponentSearchResponse", E.SAVE_STORY_REQUEST = "saveStoryRequest", E.SAVE_STORY_RESPONSE =
"saveStoryResponse", E.ARGTYPES_INFO_REQUEST = "argtypesInfoRequest", E.ARGTYPES_INFO_RESPONSE = "argtypesInfoResponse", E.CREATE_NEW_STORYFILE_REQUEST =
"createNewStoryfileRequest", E.CREATE_NEW_STORYFILE_RESPONSE = "createNewStoryfileResponse", E.TESTING_MODULE_CRASH_REPORT = "testingModuleC\
rashReport", E.TESTING_MODULE_PROGRESS_REPORT = "testingModuleProgressReport", E.TESTING_MODULE_RUN_REQUEST = "testingModuleRunRequest", E.TESTING_MODULE_RUN_ALL_REQUEST =
"testingModuleRunAllRequest", E.TESTING_MODULE_CANCEL_TEST_RUN_REQUEST = "testingModuleCancelTestRunRequest", E.TESTING_MODULE_CANCEL_TEST_RUN_RESPONSE =
"testingModuleCancelTestRunResponse", E.TESTING_MODULE_WATCH_MODE_REQUEST = "testingModuleWatchModeRequest", E.TESTING_MODULE_CONFIG_CHANGE =
"testingModuleConfigChange", E))(Nt || {}), $i = Nt, {
  CHANNEL_WS_DISCONNECT: kt,
  CHANNEL_CREATED: Yi,
  CONFIG_ERROR: Lt,
  CREATE_NEW_STORYFILE_REQUEST: Ki,
  CREATE_NEW_STORYFILE_RESPONSE: Xi,
  CURRENT_STORY_WAS_SET: $r,
  DOCS_PREPARED: jt,
  DOCS_RENDERED: sr,
  FILE_COMPONENT_SEARCH_REQUEST: Ji,
  FILE_COMPONENT_SEARCH_RESPONSE: Qi,
  FORCE_RE_RENDER: ar,
  FORCE_REMOUNT: Mt,
  GLOBALS_UPDATED: _e,
  NAVIGATE_URL: Zi,
  PLAY_FUNCTION_THREW_EXCEPTION: qt,
  UNHANDLED_ERRORS_WHILE_PLAYING: Ut,
  PRELOAD_ENTRIES: Bt,
  PREVIEW_BUILDER_PROGRESS: el,
  PREVIEW_KEYDOWN: Gt,
  REGISTER_SUBSCRIPTION: rl,
  RESET_STORY_ARGS: ir,
  SELECT_STORY: tl,
  SET_CONFIG: ol,
  SET_CURRENT_STORY: Vt,
  SET_FILTER: nl,
  SET_GLOBALS: Ht,
  SET_INDEX: sl,
  SET_STORIES: al,
  SHARED_STATE_CHANGED: il,
  SHARED_STATE_SET: ll,
  STORIES_COLLAPSE_ALL: cl,
  STORIES_EXPAND_ALL: pl,
  STORY_ARGS_UPDATED: zt,
  STORY_CHANGED: Wt,
  STORY_ERRORED: $t,
  STORY_INDEX_INVALIDATED: Yt,
  STORY_MISSING: Yr,
  STORY_PREPARED: Kt,
  STORY_RENDER_PHASE_CHANGED: we,
  STORY_RENDERED: Be,
  STORY_FINISHED: Kr,
  STORY_SPECIFIED: Xt,
  STORY_THREW_EXCEPTION: Jt,
  STORY_UNCHANGED: Qt,
  UPDATE_GLOBALS: lr,
  UPDATE_QUERY_PARAMS: Zt,
  UPDATE_STORY_ARGS: cr,
  REQUEST_WHATS_NEW_DATA: dl,
  RESULT_WHATS_NEW_DATA: ul,
  SET_WHATS_NEW_CACHE: fl,
  TOGGLE_WHATS_NEW_NOTIFICATIONS: yl,
  TELEMETRY_ERROR: eo,
  SAVE_STORY_REQUEST: ml,
  SAVE_STORY_RESPONSE: hl,
  ARGTYPES_INFO_REQUEST: ro,
  ARGTYPES_INFO_RESPONSE: Xr,
  TESTING_MODULE_CRASH_REPORT: gl,
  TESTING_MODULE_PROGRESS_REPORT: Sl,
  TESTING_MODULE_RUN_REQUEST: bl,
  TESTING_MODULE_RUN_ALL_REQUEST: Tl,
  TESTING_MODULE_CANCEL_TEST_RUN_REQUEST: El,
  TESTING_MODULE_CANCEL_TEST_RUN_RESPONSE: Rl,
  TESTING_MODULE_WATCH_MODE_REQUEST: xl,
  TESTING_MODULE_CONFIG_CHANGE: Al
} = Nt;

// src/preview/globals/globals.ts
var to = {
  "@storybook/global": "__STORYBOOK_MODULE_GLOBAL__",
  "storybook/internal/channels": "__STORYBOOK_MODULE_CHANNELS__",
  "@storybook/channels": "__STORYBOOK_MODULE_CHANNELS__",
  "@storybook/core/channels": "__STORYBOOK_MODULE_CHANNELS__",
  "storybook/internal/client-logger": "__STORYBOOK_MODULE_CLIENT_LOGGER__",
  "@storybook/client-logger": "__STORYBOOK_MODULE_CLIENT_LOGGER__",
  "@storybook/core/client-logger": "__STORYBOOK_MODULE_CLIENT_LOGGER__",
  "storybook/internal/core-events": "__STORYBOOK_MODULE_CORE_EVENTS__",
  "@storybook/core-events": "__STORYBOOK_MODULE_CORE_EVENTS__",
  "@storybook/core/core-events": "__STORYBOOK_MODULE_CORE_EVENTS__",
  "storybook/internal/preview-errors": "__STORYBOOK_MODULE_CORE_EVENTS_PREVIEW_ERRORS__",
  "@storybook/core-events/preview-errors": "__STORYBOOK_MODULE_CORE_EVENTS_PREVIEW_ERRORS__",
  "@storybook/core/preview-errors": "__STORYBOOK_MODULE_CORE_EVENTS_PREVIEW_ERRORS__",
  "storybook/internal/preview-api": "__STORYBOOK_MODULE_PREVIEW_API__",
  "@storybook/preview-api": "__STORYBOOK_MODULE_PREVIEW_API__",
  "@storybook/core/preview-api": "__STORYBOOK_MODULE_PREVIEW_API__",
  "storybook/internal/types": "__STORYBOOK_MODULE_TYPES__",
  "@storybook/types": "__STORYBOOK_MODULE_TYPES__",
  "@storybook/core/types": "__STORYBOOK_MODULE_TYPES__"
}, Yn = Object.keys(to);

// src/channels/index.ts
var yr = {};
Ae(yr, {
  Channel: () => ye,
  PostMessageTransport: () => $e,
  WebsocketTransport: () => Ye,
  createBrowserChannel: () => Ed,
  default: () => Td
});

// src/channels/main.ts
var _l = /* @__PURE__ */ n((r) => r.transports !== void 0, "isMulti"), wl = /* @__PURE__ */ n(() => Math.random().toString(16).slice(2), "ge\
nerateRandomId"), oo = class oo {
  constructor(e = {}) {
    this.sender = wl();
    this.events = {};
    this.data = {};
    this.transports = [];
    this.isAsync = e.async || !1, _l(e) ? (this.transports = e.transports || [], this.transports.forEach((t) => {
      t.setHandler((o) => this.handleEvent(o));
    })) : this.transports = e.transport ? [e.transport] : [], this.transports.forEach((t) => {
      t.setHandler((o) => this.handleEvent(o));
    });
  }
  get hasTransport() {
    return this.transports.length > 0;
  }
  addListener(e, t) {
    this.events[e] = this.events[e] || [], this.events[e].push(t);
  }
  emit(e, ...t) {
    let o = { type: e, args: t, from: this.sender }, s = {};
    t.length >= 1 && t[0] && t[0].options && (s = t[0].options);
    let a = /* @__PURE__ */ n(() => {
      this.transports.forEach((l) => {
        l.send(o, s);
      }), this.handleEvent(o);
    }, "handler");
    this.isAsync ? setImmediate(a) : a();
  }
  last(e) {
    return this.data[e];
  }
  eventNames() {
    return Object.keys(this.events);
  }
  listenerCount(e) {
    let t = this.listeners(e);
    return t ? t.length : 0;
  }
  listeners(e) {
    return this.events[e] || void 0;
  }
  once(e, t) {
    let o = this.onceListener(e, t);
    this.addListener(e, o);
  }
  removeAllListeners(e) {
    e ? this.events[e] && delete this.events[e] : this.events = {};
  }
  removeListener(e, t) {
    let o = this.listeners(e);
    o && (this.events[e] = o.filter((s) => s !== t));
  }
  on(e, t) {
    this.addListener(e, t);
  }
  off(e, t) {
    this.removeListener(e, t);
  }
  handleEvent(e) {
    let t = this.listeners(e.type);
    t && t.length && t.forEach((o) => {
      o.apply(e, e.args);
    }), this.data[e.type] = e.args;
  }
  onceListener(e, t) {
    let o = /* @__PURE__ */ n((...s) => (this.removeListener(e, o), t(...s)), "onceListener");
    return o;
  }
};
n(oo, "Channel");
var ye = oo;

// src/client-logger/index.ts
var pr = {};
Ae(pr, {
  deprecate: () => oe,
  logger: () => O,
  once: () => L,
  pretty: () => K
});
var { LOGLEVEL: vl } = R, me = {
  trace: 1,
  debug: 2,
  info: 3,
  warn: 4,
  error: 5,
  silent: 10
}, Pl = vl, Ge = me[Pl] || me.info, O = {
  trace: /* @__PURE__ */ n((r, ...e) => {
    Ge <= me.trace && console.trace(r, ...e);
  }, "trace"),
  debug: /* @__PURE__ */ n((r, ...e) => {
    Ge <= me.debug && console.debug(r, ...e);
  }, "debug"),
  info: /* @__PURE__ */ n((r, ...e) => {
    Ge <= me.info && console.info(r, ...e);
  }, "info"),
  warn: /* @__PURE__ */ n((r, ...e) => {
    Ge <= me.warn && console.warn(r, ...e);
  }, "warn"),
  error: /* @__PURE__ */ n((r, ...e) => {
    Ge <= me.error && console.error(r, ...e);
  }, "error"),
  log: /* @__PURE__ */ n((r, ...e) => {
    Ge < me.silent && console.log(r, ...e);
  }, "log")
}, no = /* @__PURE__ */ new Set(), L = /* @__PURE__ */ n((r) => (e, ...t) => {
  if (!no.has(e))
    return no.add(e), O[r](e, ...t);
}, "once");
L.clear = () => no.clear();
L.trace = L("trace");
L.debug = L("debug");
L.info = L("info");
L.warn = L("warn");
L.error = L("error");
L.log = L("log");
var oe = L("warn"), K = /* @__PURE__ */ n((r) => (...e) => {
  let t = [];
  if (e.length) {
    let o = /<span\s+style=(['"])([^'"]*)\1\s*>/gi, s = /<\/span>/gi, a;
    for (t.push(e[0].replace(o, "%c").replace(s, "%c")); a = o.exec(e[0]); )
      t.push(a[2]), t.push("");
    for (let l = 1; l < e.length; l++)
      t.push(e[l]);
  }
  O[r].apply(O, t);
}, "pretty");
K.trace = K("trace");
K.debug = K("debug");
K.info = K("info");
K.warn = K("warn");
K.error = K("error");

// ../node_modules/telejson/dist/chunk-465TF3XA.mjs
var Cl = Object.create, Kn = Object.defineProperty, Ol = Object.getOwnPropertyDescriptor, Xn = Object.getOwnPropertyNames, Il = Object.getPrototypeOf,
Fl = Object.prototype.hasOwnProperty, J = /* @__PURE__ */ n((r, e) => /* @__PURE__ */ n(function() {
  return e || (0, r[Xn(r)[0]])((e = { exports: {} }).exports, e), e.exports;
}, "__require"), "__commonJS"), Dl = /* @__PURE__ */ n((r, e, t, o) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (let s of Xn(e))
      !Fl.call(r, s) && s !== t && Kn(r, s, { get: /* @__PURE__ */ n(() => e[s], "get"), enumerable: !(o = Ol(e, s)) || o.enumerable });
  return r;
}, "__copyProps"), Jr = /* @__PURE__ */ n((r, e, t) => (t = r != null ? Cl(Il(r)) : {}, Dl(
  e || !r || !r.__esModule ? Kn(t, "default", { value: r, enumerable: !0 }) : t,
  r
)), "__toESM"), Nl = [
  "bubbles",
  "cancelBubble",
  "cancelable",
  "composed",
  "currentTarget",
  "defaultPrevented",
  "eventPhase",
  "isTrusted",
  "returnValue",
  "srcElement",
  "target",
  "timeStamp",
  "type"
], kl = ["detail"];
function Jn(r) {
  let e = Nl.filter((t) => r[t] !== void 0).reduce((t, o) => ({ ...t, [o]: r[o] }), {});
  return r instanceof CustomEvent && kl.filter((t) => r[t] !== void 0).forEach((t) => {
    e[t] = r[t];
  }), e;
}
n(Jn, "extractEventHiddenProperties");

// ../node_modules/telejson/dist/index.mjs
var fs = ue(Qr(), 1);
var ns = J({
  "node_modules/has-symbols/shams.js"(r, e) {
    "use strict";
    e.exports = /* @__PURE__ */ n(function() {
      if (typeof Symbol != "function" || typeof Object.getOwnPropertySymbols != "function")
        return !1;
      if (typeof Symbol.iterator == "symbol")
        return !0;
      var o = {}, s = Symbol("test"), a = Object(s);
      if (typeof s == "string" || Object.prototype.toString.call(s) !== "[object Symbol]" || Object.prototype.toString.call(a) !== "[object \
Symbol]")
        return !1;
      var l = 42;
      o[s] = l;
      for (s in o)
        return !1;
      if (typeof Object.keys == "function" && Object.keys(o).length !== 0 || typeof Object.getOwnPropertyNames == "function" && Object.getOwnPropertyNames(
      o).length !== 0)
        return !1;
      var c = Object.getOwnPropertySymbols(o);
      if (c.length !== 1 || c[0] !== s || !Object.prototype.propertyIsEnumerable.call(o, s))
        return !1;
      if (typeof Object.getOwnPropertyDescriptor == "function") {
        var i = Object.getOwnPropertyDescriptor(o, s);
        if (i.value !== l || i.enumerable !== !0)
          return !1;
      }
      return !0;
    }, "hasSymbols");
  }
}), ss = J({
  "node_modules/has-symbols/index.js"(r, e) {
    "use strict";
    var t = typeof Symbol < "u" && Symbol, o = ns();
    e.exports = /* @__PURE__ */ n(function() {
      return typeof t != "function" || typeof Symbol != "function" || typeof t("foo") != "symbol" || typeof Symbol("bar") != "symbol" ? !1 :
      o();
    }, "hasNativeSymbols");
  }
}), Ll = J({
  "node_modules/function-bind/implementation.js"(r, e) {
    "use strict";
    var t = "Function.prototype.bind called on incompatible ", o = Array.prototype.slice, s = Object.prototype.toString, a = "[object Functi\
on]";
    e.exports = /* @__PURE__ */ n(function(c) {
      var i = this;
      if (typeof i != "function" || s.call(i) !== a)
        throw new TypeError(t + i);
      for (var p = o.call(arguments, 1), u, d = /* @__PURE__ */ n(function() {
        if (this instanceof u) {
          var y = i.apply(
            this,
            p.concat(o.call(arguments))
          );
          return Object(y) === y ? y : this;
        } else
          return i.apply(
            c,
            p.concat(o.call(arguments))
          );
      }, "binder"), h = Math.max(0, i.length - p.length), S = [], m = 0; m < h; m++)
        S.push("$" + m);
      if (u = Function("binder", "return function (" + S.join(",") + "){ return binder.apply(this,arguments); }")(d), i.prototype) {
        var T = /* @__PURE__ */ n(function() {
        }, "Empty2");
        T.prototype = i.prototype, u.prototype = new T(), T.prototype = null;
      }
      return u;
    }, "bind");
  }
}), io = J({
  "node_modules/function-bind/index.js"(r, e) {
    "use strict";
    var t = Ll();
    e.exports = Function.prototype.bind || t;
  }
}), jl = J({
  "node_modules/has/src/index.js"(r, e) {
    "use strict";
    var t = io();
    e.exports = t.call(Function.call, Object.prototype.hasOwnProperty);
  }
}), as = J({
  "node_modules/get-intrinsic/index.js"(r, e) {
    "use strict";
    var t, o = SyntaxError, s = Function, a = TypeError, l = /* @__PURE__ */ n(function(v) {
      try {
        return s('"use strict"; return (' + v + ").constructor;")();
      } catch {
      }
    }, "getEvalledConstructor"), c = Object.getOwnPropertyDescriptor;
    if (c)
      try {
        c({}, "");
      } catch {
        c = null;
      }
    var i = /* @__PURE__ */ n(function() {
      throw new a();
    }, "throwTypeError"), p = c ? function() {
      try {
        return arguments.callee, i;
      } catch {
        try {
          return c(arguments, "callee").get;
        } catch {
          return i;
        }
      }
    }() : i, u = ss()(), d = Object.getPrototypeOf || function(v) {
      return v.__proto__;
    }, h = {}, S = typeof Uint8Array > "u" ? t : d(Uint8Array), m = {
      "%AggregateError%": typeof AggregateError > "u" ? t : AggregateError,
      "%Array%": Array,
      "%ArrayBuffer%": typeof ArrayBuffer > "u" ? t : ArrayBuffer,
      "%ArrayIteratorPrototype%": u ? d([][Symbol.iterator]()) : t,
      "%AsyncFromSyncIteratorPrototype%": t,
      "%AsyncFunction%": h,
      "%AsyncGenerator%": h,
      "%AsyncGeneratorFunction%": h,
      "%AsyncIteratorPrototype%": h,
      "%Atomics%": typeof Atomics > "u" ? t : Atomics,
      "%BigInt%": typeof BigInt > "u" ? t : BigInt,
      "%Boolean%": Boolean,
      "%DataView%": typeof DataView > "u" ? t : DataView,
      "%Date%": Date,
      "%decodeURI%": decodeURI,
      "%decodeURIComponent%": decodeURIComponent,
      "%encodeURI%": encodeURI,
      "%encodeURIComponent%": encodeURIComponent,
      "%Error%": Error,
      "%eval%": eval,
      "%EvalError%": EvalError,
      "%Float32Array%": typeof Float32Array > "u" ? t : Float32Array,
      "%Float64Array%": typeof Float64Array > "u" ? t : Float64Array,
      "%FinalizationRegistry%": typeof FinalizationRegistry > "u" ? t : FinalizationRegistry,
      "%Function%": s,
      "%GeneratorFunction%": h,
      "%Int8Array%": typeof Int8Array > "u" ? t : Int8Array,
      "%Int16Array%": typeof Int16Array > "u" ? t : Int16Array,
      "%Int32Array%": typeof Int32Array > "u" ? t : Int32Array,
      "%isFinite%": isFinite,
      "%isNaN%": isNaN,
      "%IteratorPrototype%": u ? d(d([][Symbol.iterator]())) : t,
      "%JSON%": typeof JSON == "object" ? JSON : t,
      "%Map%": typeof Map > "u" ? t : Map,
      "%MapIteratorPrototype%": typeof Map > "u" || !u ? t : d((/* @__PURE__ */ new Map())[Symbol.iterator]()),
      "%Math%": Math,
      "%Number%": Number,
      "%Object%": Object,
      "%parseFloat%": parseFloat,
      "%parseInt%": parseInt,
      "%Promise%": typeof Promise > "u" ? t : Promise,
      "%Proxy%": typeof Proxy > "u" ? t : Proxy,
      "%RangeError%": RangeError,
      "%ReferenceError%": ReferenceError,
      "%Reflect%": typeof Reflect > "u" ? t : Reflect,
      "%RegExp%": RegExp,
      "%Set%": typeof Set > "u" ? t : Set,
      "%SetIteratorPrototype%": typeof Set > "u" || !u ? t : d((/* @__PURE__ */ new Set())[Symbol.iterator]()),
      "%SharedArrayBuffer%": typeof SharedArrayBuffer > "u" ? t : SharedArrayBuffer,
      "%String%": String,
      "%StringIteratorPrototype%": u ? d(""[Symbol.iterator]()) : t,
      "%Symbol%": u ? Symbol : t,
      "%SyntaxError%": o,
      "%ThrowTypeError%": p,
      "%TypedArray%": S,
      "%TypeError%": a,
      "%Uint8Array%": typeof Uint8Array > "u" ? t : Uint8Array,
      "%Uint8ClampedArray%": typeof Uint8ClampedArray > "u" ? t : Uint8ClampedArray,
      "%Uint16Array%": typeof Uint16Array > "u" ? t : Uint16Array,
      "%Uint32Array%": typeof Uint32Array > "u" ? t : Uint32Array,
      "%URIError%": URIError,
      "%WeakMap%": typeof WeakMap > "u" ? t : WeakMap,
      "%WeakRef%": typeof WeakRef > "u" ? t : WeakRef,
      "%WeakSet%": typeof WeakSet > "u" ? t : WeakSet
    }, T = /* @__PURE__ */ n(function v(F) {
      var j;
      if (F === "%AsyncFunction%")
        j = l("async function () {}");
      else if (F === "%GeneratorFunction%")
        j = l("function* () {}");
      else if (F === "%AsyncGeneratorFunction%")
        j = l("async function* () {}");
      else if (F === "%AsyncGenerator%") {
        var k = v("%AsyncGeneratorFunction%");
        k && (j = k.prototype);
      } else if (F === "%AsyncIteratorPrototype%") {
        var D = v("%AsyncGenerator%");
        D && (j = d(D.prototype));
      }
      return m[F] = j, j;
    }, "doEval2"), y = {
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
    }, x = io(), A = jl(), g = x.call(Function.call, Array.prototype.concat), b = x.call(Function.apply, Array.prototype.splice), _ = x.call(
    Function.call, String.prototype.replace), w = x.call(Function.call, String.prototype.slice), I = x.call(Function.call, RegExp.prototype.
    exec), M = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g, U = /\\(\\)?/g, z = /* @__PURE__ */ n(
    function(F) {
      var j = w(F, 0, 1), k = w(F, -1);
      if (j === "%" && k !== "%")
        throw new o("invalid intrinsic syntax, expected closing `%`");
      if (k === "%" && j !== "%")
        throw new o("invalid intrinsic syntax, expected opening `%`");
      var D = [];
      return _(F, M, function(V, Q, Y, Br) {
        D[D.length] = Y ? _(Br, U, "$1") : Q || V;
      }), D;
    }, "stringToPath3"), te = /* @__PURE__ */ n(function(F, j) {
      var k = F, D;
      if (A(y, k) && (D = y[k], k = "%" + D[0] + "%"), A(m, k)) {
        var V = m[k];
        if (V === h && (V = T(k)), typeof V > "u" && !j)
          throw new a("intrinsic " + F + " exists, but is not available. Please file an issue!");
        return {
          alias: D,
          name: k,
          value: V
        };
      }
      throw new o("intrinsic " + F + " does not exist!");
    }, "getBaseIntrinsic2");
    e.exports = /* @__PURE__ */ n(function(F, j) {
      if (typeof F != "string" || F.length === 0)
        throw new a("intrinsic name must be a non-empty string");
      if (arguments.length > 1 && typeof j != "boolean")
        throw new a('"allowMissing" argument must be a boolean');
      if (I(/^%?[^%]*%?$/, F) === null)
        throw new o("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
      var k = z(F), D = k.length > 0 ? k[0] : "", V = te("%" + D + "%", j), Q = V.name, Y = V.value, Br = !1, Ft = V.alias;
      Ft && (D = Ft[0], b(k, g([0, 1], Ft)));
      for (var Gr = 1, or = !0; Gr < k.length; Gr += 1) {
        var ie = k[Gr], Vr = w(ie, 0, 1), Hr = w(ie, -1);
        if ((Vr === '"' || Vr === "'" || Vr === "`" || Hr === '"' || Hr === "'" || Hr === "`") && Vr !== Hr)
          throw new o("property names with quotes must have matching quotes");
        if ((ie === "constructor" || !or) && (Br = !0), D += "." + ie, Q = "%" + D + "%", A(m, Q))
          Y = m[Q];
        else if (Y != null) {
          if (!(ie in Y)) {
            if (!j)
              throw new a("base intrinsic for " + F + " exists, but the property is not available.");
            return;
          }
          if (c && Gr + 1 >= k.length) {
            var zr = c(Y, ie);
            or = !!zr, or && "get" in zr && !("originalValue" in zr.get) ? Y = zr.get : Y = Y[ie];
          } else
            or = A(Y, ie), Y = Y[ie];
          or && !Br && (m[Q] = Y);
        }
      }
      return Y;
    }, "GetIntrinsic");
  }
}), Ml = J({
  "node_modules/call-bind/index.js"(r, e) {
    "use strict";
    var t = io(), o = as(), s = o("%Function.prototype.apply%"), a = o("%Function.prototype.call%"), l = o("%Reflect.apply%", !0) || t.call(
    a, s), c = o("%Object.getOwnPropertyDescriptor%", !0), i = o("%Object.defineProperty%", !0), p = o("%Math.max%");
    if (i)
      try {
        i({}, "a", { value: 1 });
      } catch {
        i = null;
      }
    e.exports = /* @__PURE__ */ n(function(h) {
      var S = l(t, a, arguments);
      if (c && i) {
        var m = c(S, "length");
        m.configurable && i(
          S,
          "length",
          { value: 1 + p(0, h.length - (arguments.length - 1)) }
        );
      }
      return S;
    }, "callBind");
    var u = /* @__PURE__ */ n(function() {
      return l(t, s, arguments);
    }, "applyBind2");
    i ? i(e.exports, "apply", { value: u }) : e.exports.apply = u;
  }
}), ql = J({
  "node_modules/call-bind/callBound.js"(r, e) {
    "use strict";
    var t = as(), o = Ml(), s = o(t("String.prototype.indexOf"));
    e.exports = /* @__PURE__ */ n(function(l, c) {
      var i = t(l, !!c);
      return typeof i == "function" && s(l, ".prototype.") > -1 ? o(i) : i;
    }, "callBoundIntrinsic");
  }
}), Ul = J({
  "node_modules/has-tostringtag/shams.js"(r, e) {
    "use strict";
    var t = ns();
    e.exports = /* @__PURE__ */ n(function() {
      return t() && !!Symbol.toStringTag;
    }, "hasToStringTagShams");
  }
}), Bl = J({
  "node_modules/is-regex/index.js"(r, e) {
    "use strict";
    var t = ql(), o = Ul()(), s, a, l, c;
    o && (s = t("Object.prototype.hasOwnProperty"), a = t("RegExp.prototype.exec"), l = {}, i = /* @__PURE__ */ n(function() {
      throw l;
    }, "throwRegexMarker"), c = {
      toString: i,
      valueOf: i
    }, typeof Symbol.toPrimitive == "symbol" && (c[Symbol.toPrimitive] = i));
    var i, p = t("Object.prototype.toString"), u = Object.getOwnPropertyDescriptor, d = "[object RegExp]";
    e.exports = /* @__PURE__ */ n(o ? function(S) {
      if (!S || typeof S != "object")
        return !1;
      var m = u(S, "lastIndex"), T = m && s(m, "value");
      if (!T)
        return !1;
      try {
        a(S, c);
      } catch (y) {
        return y === l;
      }
    } : function(S) {
      return !S || typeof S != "object" && typeof S != "function" ? !1 : p(S) === d;
    }, "isRegex");
  }
}), Gl = J({
  "node_modules/is-function/index.js"(r, e) {
    e.exports = o;
    var t = Object.prototype.toString;
    function o(s) {
      if (!s)
        return !1;
      var a = t.call(s);
      return a === "[object Function]" || typeof s == "function" && a !== "[object RegExp]" || typeof window < "u" && (s === window.setTimeout ||
      s === window.alert || s === window.confirm || s === window.prompt);
    }
    n(o, "isFunction3");
  }
}), Vl = J({
  "node_modules/is-symbol/index.js"(r, e) {
    "use strict";
    var t = Object.prototype.toString, o = ss()();
    o ? (s = Symbol.prototype.toString, a = /^Symbol\(.*\)$/, l = /* @__PURE__ */ n(function(i) {
      return typeof i.valueOf() != "symbol" ? !1 : a.test(s.call(i));
    }, "isRealSymbolObject"), e.exports = /* @__PURE__ */ n(function(i) {
      if (typeof i == "symbol")
        return !0;
      if (t.call(i) !== "[object Symbol]")
        return !1;
      try {
        return l(i);
      } catch {
        return !1;
      }
    }, "isSymbol3")) : e.exports = /* @__PURE__ */ n(function(i) {
      return !1;
    }, "isSymbol3");
    var s, a, l;
  }
}), Hl = Jr(Bl()), zl = Jr(Gl()), Wl = Jr(Vl());
function $l(r) {
  return r != null && typeof r == "object" && Array.isArray(r) === !1;
}
n($l, "isObject");
var Yl = typeof global == "object" && global && global.Object === Object && global, Kl = Yl, Xl = typeof self == "object" && self && self.Object ===
Object && self, Jl = Kl || Xl || Function("return this")(), lo = Jl, Ql = lo.Symbol, Ve = Ql, is = Object.prototype, Zl = is.hasOwnProperty,
ec = is.toString, dr = Ve ? Ve.toStringTag : void 0;
function rc(r) {
  var e = Zl.call(r, dr), t = r[dr];
  try {
    r[dr] = void 0;
    var o = !0;
  } catch {
  }
  var s = ec.call(r);
  return o && (e ? r[dr] = t : delete r[dr]), s;
}
n(rc, "getRawTag");
var tc = rc, oc = Object.prototype, nc = oc.toString;
function sc(r) {
  return nc.call(r);
}
n(sc, "objectToString");
var ac = sc, ic = "[object Null]", lc = "[object Undefined]", Zn = Ve ? Ve.toStringTag : void 0;
function cc(r) {
  return r == null ? r === void 0 ? lc : ic : Zn && Zn in Object(r) ? tc(r) : ac(r);
}
n(cc, "baseGetTag");
var ls = cc;
function pc(r) {
  return r != null && typeof r == "object";
}
n(pc, "isObjectLike");
var dc = pc, uc = "[object Symbol]";
function fc(r) {
  return typeof r == "symbol" || dc(r) && ls(r) == uc;
}
n(fc, "isSymbol");
var co = fc;
function yc(r, e) {
  for (var t = -1, o = r == null ? 0 : r.length, s = Array(o); ++t < o; )
    s[t] = e(r[t], t, r);
  return s;
}
n(yc, "arrayMap");
var mc = yc, hc = Array.isArray, po = hc, gc = 1 / 0, es = Ve ? Ve.prototype : void 0, rs = es ? es.toString : void 0;
function cs(r) {
  if (typeof r == "string")
    return r;
  if (po(r))
    return mc(r, cs) + "";
  if (co(r))
    return rs ? rs.call(r) : "";
  var e = r + "";
  return e == "0" && 1 / r == -gc ? "-0" : e;
}
n(cs, "baseToString");
var Sc = cs;
function bc(r) {
  var e = typeof r;
  return r != null && (e == "object" || e == "function");
}
n(bc, "isObject2");
var ps = bc, Tc = "[object AsyncFunction]", Ec = "[object Function]", Rc = "[object GeneratorFunction]", xc = "[object Proxy]";
function Ac(r) {
  if (!ps(r))
    return !1;
  var e = ls(r);
  return e == Ec || e == Rc || e == Tc || e == xc;
}
n(Ac, "isFunction");
var _c = Ac, wc = lo["__core-js_shared__"], ao = wc, ts = function() {
  var r = /[^.]+$/.exec(ao && ao.keys && ao.keys.IE_PROTO || "");
  return r ? "Symbol(src)_1." + r : "";
}();
function vc(r) {
  return !!ts && ts in r;
}
n(vc, "isMasked");
var Pc = vc, Cc = Function.prototype, Oc = Cc.toString;
function Ic(r) {
  if (r != null) {
    try {
      return Oc.call(r);
    } catch {
    }
    try {
      return r + "";
    } catch {
    }
  }
  return "";
}
n(Ic, "toSource");
var Fc = Ic, Dc = /[\\^$.*+?()[\]{}|]/g, Nc = /^\[object .+?Constructor\]$/, kc = Function.prototype, Lc = Object.prototype, jc = kc.toString,
Mc = Lc.hasOwnProperty, qc = RegExp(
  "^" + jc.call(Mc).replace(Dc, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function Uc(r) {
  if (!ps(r) || Pc(r))
    return !1;
  var e = _c(r) ? qc : Nc;
  return e.test(Fc(r));
}
n(Uc, "baseIsNative");
var Bc = Uc;
function Gc(r, e) {
  return r?.[e];
}
n(Gc, "getValue");
var Vc = Gc;
function Hc(r, e) {
  var t = Vc(r, e);
  return Bc(t) ? t : void 0;
}
n(Hc, "getNative");
var ds = Hc;
function zc(r, e) {
  return r === e || r !== r && e !== e;
}
n(zc, "eq");
var Wc = zc, $c = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, Yc = /^\w*$/;
function Kc(r, e) {
  if (po(r))
    return !1;
  var t = typeof r;
  return t == "number" || t == "symbol" || t == "boolean" || r == null || co(r) ? !0 : Yc.test(r) || !$c.test(r) || e != null && r in Object(
  e);
}
n(Kc, "isKey");
var Xc = Kc, Jc = ds(Object, "create"), ur = Jc;
function Qc() {
  this.__data__ = ur ? ur(null) : {}, this.size = 0;
}
n(Qc, "hashClear");
var Zc = Qc;
function ep(r) {
  var e = this.has(r) && delete this.__data__[r];
  return this.size -= e ? 1 : 0, e;
}
n(ep, "hashDelete");
var rp = ep, tp = "__lodash_hash_undefined__", op = Object.prototype, np = op.hasOwnProperty;
function sp(r) {
  var e = this.__data__;
  if (ur) {
    var t = e[r];
    return t === tp ? void 0 : t;
  }
  return np.call(e, r) ? e[r] : void 0;
}
n(sp, "hashGet");
var ap = sp, ip = Object.prototype, lp = ip.hasOwnProperty;
function cp(r) {
  var e = this.__data__;
  return ur ? e[r] !== void 0 : lp.call(e, r);
}
n(cp, "hashHas");
var pp = cp, dp = "__lodash_hash_undefined__";
function up(r, e) {
  var t = this.__data__;
  return this.size += this.has(r) ? 0 : 1, t[r] = ur && e === void 0 ? dp : e, this;
}
n(up, "hashSet");
var fp = up;
function He(r) {
  var e = -1, t = r == null ? 0 : r.length;
  for (this.clear(); ++e < t; ) {
    var o = r[e];
    this.set(o[0], o[1]);
  }
}
n(He, "Hash");
He.prototype.clear = Zc;
He.prototype.delete = rp;
He.prototype.get = ap;
He.prototype.has = pp;
He.prototype.set = fp;
var os = He;
function yp() {
  this.__data__ = [], this.size = 0;
}
n(yp, "listCacheClear");
var mp = yp;
function hp(r, e) {
  for (var t = r.length; t--; )
    if (Wc(r[t][0], e))
      return t;
  return -1;
}
n(hp, "assocIndexOf");
var et = hp, gp = Array.prototype, Sp = gp.splice;
function bp(r) {
  var e = this.__data__, t = et(e, r);
  if (t < 0)
    return !1;
  var o = e.length - 1;
  return t == o ? e.pop() : Sp.call(e, t, 1), --this.size, !0;
}
n(bp, "listCacheDelete");
var Tp = bp;
function Ep(r) {
  var e = this.__data__, t = et(e, r);
  return t < 0 ? void 0 : e[t][1];
}
n(Ep, "listCacheGet");
var Rp = Ep;
function xp(r) {
  return et(this.__data__, r) > -1;
}
n(xp, "listCacheHas");
var Ap = xp;
function _p(r, e) {
  var t = this.__data__, o = et(t, r);
  return o < 0 ? (++this.size, t.push([r, e])) : t[o][1] = e, this;
}
n(_p, "listCacheSet");
var wp = _p;
function ze(r) {
  var e = -1, t = r == null ? 0 : r.length;
  for (this.clear(); ++e < t; ) {
    var o = r[e];
    this.set(o[0], o[1]);
  }
}
n(ze, "ListCache");
ze.prototype.clear = mp;
ze.prototype.delete = Tp;
ze.prototype.get = Rp;
ze.prototype.has = Ap;
ze.prototype.set = wp;
var vp = ze, Pp = ds(lo, "Map"), Cp = Pp;
function Op() {
  this.size = 0, this.__data__ = {
    hash: new os(),
    map: new (Cp || vp)(),
    string: new os()
  };
}
n(Op, "mapCacheClear");
var Ip = Op;
function Fp(r) {
  var e = typeof r;
  return e == "string" || e == "number" || e == "symbol" || e == "boolean" ? r !== "__proto__" : r === null;
}
n(Fp, "isKeyable");
var Dp = Fp;
function Np(r, e) {
  var t = r.__data__;
  return Dp(e) ? t[typeof e == "string" ? "string" : "hash"] : t.map;
}
n(Np, "getMapData");
var rt = Np;
function kp(r) {
  var e = rt(this, r).delete(r);
  return this.size -= e ? 1 : 0, e;
}
n(kp, "mapCacheDelete");
var Lp = kp;
function jp(r) {
  return rt(this, r).get(r);
}
n(jp, "mapCacheGet");
var Mp = jp;
function qp(r) {
  return rt(this, r).has(r);
}
n(qp, "mapCacheHas");
var Up = qp;
function Bp(r, e) {
  var t = rt(this, r), o = t.size;
  return t.set(r, e), this.size += t.size == o ? 0 : 1, this;
}
n(Bp, "mapCacheSet");
var Gp = Bp;
function We(r) {
  var e = -1, t = r == null ? 0 : r.length;
  for (this.clear(); ++e < t; ) {
    var o = r[e];
    this.set(o[0], o[1]);
  }
}
n(We, "MapCache");
We.prototype.clear = Ip;
We.prototype.delete = Lp;
We.prototype.get = Mp;
We.prototype.has = Up;
We.prototype.set = Gp;
var us = We, Vp = "Expected a function";
function uo(r, e) {
  if (typeof r != "function" || e != null && typeof e != "function")
    throw new TypeError(Vp);
  var t = /* @__PURE__ */ n(function() {
    var o = arguments, s = e ? e.apply(this, o) : o[0], a = t.cache;
    if (a.has(s))
      return a.get(s);
    var l = r.apply(this, o);
    return t.cache = a.set(s, l) || a, l;
  }, "memoized");
  return t.cache = new (uo.Cache || us)(), t;
}
n(uo, "memoize");
uo.Cache = us;
var Hp = uo, zp = 500;
function Wp(r) {
  var e = Hp(r, function(o) {
    return t.size === zp && t.clear(), o;
  }), t = e.cache;
  return e;
}
n(Wp, "memoizeCapped");
var $p = Wp, Yp = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, Kp = /\\(\\)?/g, Xp = $p(
function(r) {
  var e = [];
  return r.charCodeAt(0) === 46 && e.push(""), r.replace(Yp, function(t, o, s, a) {
    e.push(s ? a.replace(Kp, "$1") : o || t);
  }), e;
}), Jp = Xp;
function Qp(r) {
  return r == null ? "" : Sc(r);
}
n(Qp, "toString");
var Zp = Qp;
function ed(r, e) {
  return po(r) ? r : Xc(r, e) ? [r] : Jp(Zp(r));
}
n(ed, "castPath");
var rd = ed, td = 1 / 0;
function od(r) {
  if (typeof r == "string" || co(r))
    return r;
  var e = r + "";
  return e == "0" && 1 / r == -td ? "-0" : e;
}
n(od, "toKey");
var nd = od;
function sd(r, e) {
  e = rd(e, r);
  for (var t = 0, o = e.length; r != null && t < o; )
    r = r[nd(e[t++])];
  return t && t == o ? r : void 0;
}
n(sd, "baseGet");
var ad = sd;
function id(r, e, t) {
  var o = r == null ? void 0 : ad(r, e);
  return o === void 0 ? t : o;
}
n(id, "get");
var ld = id, Zr = $l, cd = /* @__PURE__ */ n((r) => {
  let e = null, t = !1, o = !1, s = !1, a = "";
  if (r.indexOf("//") >= 0 || r.indexOf("/*") >= 0)
    for (let l = 0; l < r.length; l += 1)
      !e && !t && !o && !s ? r[l] === '"' || r[l] === "'" || r[l] === "`" ? e = r[l] : r[l] === "/" && r[l + 1] === "*" ? t = !0 : r[l] === "\
/" && r[l + 1] === "/" ? o = !0 : r[l] === "/" && r[l + 1] !== "/" && (s = !0) : (e && (r[l] === e && r[l - 1] !== "\\" || r[l] === `
` && e !== "`") && (e = null), s && (r[l] === "/" && r[l - 1] !== "\\" || r[l] === `
`) && (s = !1), t && r[l - 1] === "/" && r[l - 2] === "*" && (t = !1), o && r[l] === `
` && (o = !1)), !t && !o && (a += r[l]);
  else
    a = r;
  return a;
}, "removeCodeComments"), pd = (0, fs.default)(1e4)(
  (r) => cd(r).replace(/\n\s*/g, "").trim()
), dd = /* @__PURE__ */ n(function(e, t) {
  let o = t.slice(0, t.indexOf("{")), s = t.slice(t.indexOf("{"));
  if (o.includes("=>") || o.includes("function"))
    return t;
  let a = o;
  return a = a.replace(e, "function"), a + s;
}, "convertShorthandMethods2"), ud = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, fr = /* @__PURE__ */ n((r) => r.match(/^[\[\{\"\}].*[\]\}\"]$/),
"isJSON");
function ys(r) {
  if (!Zr(r))
    return r;
  let e = r, t = !1;
  return typeof Event < "u" && r instanceof Event && (e = Jn(e), t = !0), e = Object.keys(e).reduce((o, s) => {
    try {
      e[s] && e[s].toJSON, o[s] = e[s];
    } catch {
      t = !0;
    }
    return o;
  }, {}), t ? e : r;
}
n(ys, "convertUnconventionalData");
var fd = /* @__PURE__ */ n(function(e) {
  let t, o, s, a;
  return /* @__PURE__ */ n(function(c, i) {
    try {
      if (c === "")
        return a = [], t = /* @__PURE__ */ new Map([[i, "[]"]]), o = /* @__PURE__ */ new Map(), s = [], i;
      let p = o.get(this) || this;
      for (; s.length && p !== s[0]; )
        s.shift(), a.pop();
      if (typeof i == "boolean")
        return i;
      if (i === void 0)
        return e.allowUndefined ? "_undefined_" : void 0;
      if (i === null)
        return null;
      if (typeof i == "number")
        return i === -1 / 0 ? "_-Infinity_" : i === 1 / 0 ? "_Infinity_" : Number.isNaN(i) ? "_NaN_" : i;
      if (typeof i == "bigint")
        return `_bigint_${i.toString()}`;
      if (typeof i == "string")
        return ud.test(i) ? e.allowDate ? `_date_${i}` : void 0 : i;
      if ((0, Hl.default)(i))
        return e.allowRegExp ? `_regexp_${i.flags}|${i.source}` : void 0;
      if ((0, zl.default)(i)) {
        if (!e.allowFunction)
          return;
        let { name: d } = i, h = i.toString();
        return h.match(
          /(\[native code\]|WEBPACK_IMPORTED_MODULE|__webpack_exports__|__webpack_require__)/
        ) ? `_function_${d}|${(() => {
        }).toString()}` : `_function_${d}|${pd(dd(c, h))}`;
      }
      if ((0, Wl.default)(i)) {
        if (!e.allowSymbol)
          return;
        let d = Symbol.keyFor(i);
        return d !== void 0 ? `_gsymbol_${d}` : `_symbol_${i.toString().slice(7, -1)}`;
      }
      if (s.length >= e.maxDepth)
        return Array.isArray(i) ? `[Array(${i.length})]` : "[Object]";
      if (i === this)
        return `_duplicate_${JSON.stringify(a)}`;
      if (i instanceof Error && e.allowError)
        return {
          __isConvertedError__: !0,
          errorProperties: {
            ...i.cause ? { cause: i.cause } : {},
            ...i,
            name: i.name,
            message: i.message,
            stack: i.stack,
            "_constructor-name_": i.constructor.name
          }
        };
      if (i.constructor && i.constructor.name && i.constructor.name !== "Object" && !Array.isArray(i) && !e.allowClass)
        return;
      let u = t.get(i);
      if (!u) {
        let d = Array.isArray(i) ? i : ys(i);
        if (i.constructor && i.constructor.name && i.constructor.name !== "Object" && !Array.isArray(i) && e.allowClass)
          try {
            Object.assign(d, { "_constructor-name_": i.constructor.name });
          } catch {
          }
        return a.push(c), s.unshift(d), t.set(i, JSON.stringify(a)), i !== d && o.set(i, d), d;
      }
      return `_duplicate_${u}`;
    } catch {
      return;
    }
  }, "replace");
}, "replacer2"), yd = /* @__PURE__ */ n(function reviver(options) {
  let refs = [], root;
  return /* @__PURE__ */ n(function revive(key, value) {
    if (key === "" && (root = value, refs.forEach(({ target: r, container: e, replacement: t }) => {
      let o = fr(t) ? JSON.parse(t) : t.split(".");
      o.length === 0 ? e[r] = root : e[r] = ld(root, o);
    })), key === "_constructor-name_")
      return value;
    if (Zr(value) && value.__isConvertedError__) {
      let { message: r, ...e } = value.errorProperties, t = new Error(r);
      return Object.assign(t, e), t;
    }
    if (Zr(value) && value["_constructor-name_"] && options.allowFunction) {
      let r = value["_constructor-name_"];
      if (r !== "Object") {
        let e = new Function(`return function ${r.replace(/[^a-zA-Z0-9$_]+/g, "")}(){}`)();
        Object.setPrototypeOf(value, new e());
      }
      return delete value["_constructor-name_"], value;
    }
    if (typeof value == "string" && value.startsWith("_function_") && options.allowFunction) {
      let [, name, source] = value.match(/_function_([^|]*)\|(.*)/) || [], sourceSanitized = source.replace(/[(\(\))|\\| |\]|`]*$/, "");
      if (!options.lazyEval)
        return eval(`(${sourceSanitized})`);
      let result = /* @__PURE__ */ n((...args) => {
        let f = eval(`(${sourceSanitized})`);
        return f(...args);
      }, "result");
      return Object.defineProperty(result, "toString", {
        value: /* @__PURE__ */ n(() => sourceSanitized, "value")
      }), Object.defineProperty(result, "name", {
        value: name
      }), result;
    }
    if (typeof value == "string" && value.startsWith("_regexp_") && options.allowRegExp) {
      let [, r, e] = value.match(/_regexp_([^|]*)\|(.*)/) || [];
      return new RegExp(e, r);
    }
    return typeof value == "string" && value.startsWith("_date_") && options.allowDate ? new Date(value.replace("_date_", "")) : typeof value ==
    "string" && value.startsWith("_duplicate_") ? (refs.push({ target: key, container: this, replacement: value.replace(/^_duplicate_/, "") }),
    null) : typeof value == "string" && value.startsWith("_symbol_") && options.allowSymbol ? Symbol(value.replace("_symbol_", "")) : typeof value ==
    "string" && value.startsWith("_gsymbol_") && options.allowSymbol ? Symbol.for(value.replace("_gsymbol_", "")) : typeof value == "string" &&
    value === "_-Infinity_" ? -1 / 0 : typeof value == "string" && value === "_Infinity_" ? 1 / 0 : typeof value == "string" && value === "_\
NaN_" ? NaN : typeof value == "string" && value.startsWith("_bigint_") && typeof BigInt == "function" ? BigInt(value.replace("_bigint_", "")) :
    value;
  }, "revive");
}, "reviver"), ms = {
  maxDepth: 10,
  space: void 0,
  allowFunction: !0,
  allowRegExp: !0,
  allowDate: !0,
  allowClass: !0,
  allowError: !0,
  allowUndefined: !0,
  allowSymbol: !0,
  lazyEval: !0
}, tt = /* @__PURE__ */ n((r, e = {}) => {
  let t = { ...ms, ...e };
  return JSON.stringify(ys(r), fd(t), e.space);
}, "stringify"), md = /* @__PURE__ */ n(() => {
  let r = /* @__PURE__ */ new Map();
  return /* @__PURE__ */ n(function e(t) {
    Zr(t) && Object.entries(t).forEach(([o, s]) => {
      s === "_undefined_" ? t[o] = void 0 : r.get(s) || (r.set(s, !0), e(s));
    }), Array.isArray(t) && t.forEach((o, s) => {
      o === "_undefined_" ? (r.set(o, !0), t[s] = void 0) : r.get(o) || (r.set(o, !0), e(o));
    });
  }, "mutateUndefined");
}, "mutator"), ot = /* @__PURE__ */ n((r, e = {}) => {
  let t = { ...ms, ...e }, o = JSON.parse(r, yd(t));
  return md()(o), o;
}, "parse");

// ../node_modules/tiny-invariant/dist/esm/tiny-invariant.js
var hd = !0, fo = "Invariant failed";
function le(r, e) {
  if (!r) {
    if (hd)
      throw new Error(fo);
    var t = typeof e == "function" ? e() : e, o = t ? "".concat(fo, ": ").concat(t) : fo;
    throw new Error(o);
  }
}
n(le, "invariant");

// src/channels/postmessage/getEventSourceUrl.ts
var hs = /* @__PURE__ */ n((r) => {
  let e = Array.from(
    document.querySelectorAll("iframe[data-is-storybook]")
  ), [t, ...o] = e.filter((a) => {
    try {
      return a.contentWindow?.location.origin === r.source.location.origin && a.contentWindow?.location.pathname === r.source.location.pathname;
    } catch {
    }
    try {
      return a.contentWindow === r.source;
    } catch {
    }
    let l = a.getAttribute("src"), c;
    try {
      if (!l)
        return !1;
      ({ origin: c } = new URL(l, document.location.toString()));
    } catch {
      return !1;
    }
    return c === r.origin;
  }), s = t?.getAttribute("src");
  if (s && o.length === 0) {
    let { protocol: a, host: l, pathname: c } = new URL(s, document.location.toString());
    return `${a}//${l}${c}`;
  }
  return o.length > 0 && O.error("found multiple candidates for event source"), null;
}, "getEventSourceUrl");

// src/channels/postmessage/index.ts
var { document: yo, location: mo } = R, gs = "storybook-channel", gd = { allowFunction: !1, maxDepth: 25 }, ho = class ho {
  constructor(e) {
    this.config = e;
    this.connected = !1;
    if (this.buffer = [], typeof R?.addEventListener == "function" && R.addEventListener("message", this.handleEvent.bind(this), !1), e.page !==
    "manager" && e.page !== "preview")
      throw new Error(`postmsg-channel: "config.page" cannot be "${e.page}"`);
  }
  setHandler(e) {
    this.handler = (...t) => {
      e.apply(this, t), !this.connected && this.getLocalFrame().length && (this.flush(), this.connected = !0);
    };
  }
  /**
   * Sends `event` to the associated window. If the window does not yet exist the event will be
   * stored in a buffer and sent when the window exists.
   *
   * @param event
   */
  send(e, t) {
    let {
      target: o,
      // telejson options
      allowRegExp: s,
      allowFunction: a,
      allowSymbol: l,
      allowDate: c,
      allowError: i,
      allowUndefined: p,
      allowClass: u,
      maxDepth: d,
      space: h,
      lazyEval: S
    } = t || {}, m = Object.fromEntries(
      Object.entries({
        allowRegExp: s,
        allowFunction: a,
        allowSymbol: l,
        allowDate: c,
        allowError: i,
        allowUndefined: p,
        allowClass: u,
        maxDepth: d,
        space: h,
        lazyEval: S
      }).filter(([g, b]) => typeof b < "u")
    ), T = {
      ...gd,
      ...R.CHANNEL_OPTIONS || {},
      ...m
    }, y = this.getFrames(o), x = new URLSearchParams(mo?.search || ""), A = tt(
      {
        key: gs,
        event: e,
        refId: x.get("refId")
      },
      T
    );
    return y.length ? (this.buffer.length && this.flush(), y.forEach((g) => {
      try {
        g.postMessage(A, "*");
      } catch {
        O.error("sending over postmessage fail");
      }
    }), Promise.resolve(null)) : new Promise((g, b) => {
      this.buffer.push({ event: e, resolve: g, reject: b });
    });
  }
  flush() {
    let { buffer: e } = this;
    this.buffer = [], e.forEach((t) => {
      this.send(t.event).then(t.resolve).catch(t.reject);
    });
  }
  getFrames(e) {
    if (this.config.page === "manager") {
      let o = Array.from(
        yo.querySelectorAll("iframe[data-is-storybook][data-is-loaded]")
      ).flatMap((s) => {
        try {
          return s.contentWindow && s.dataset.isStorybook !== void 0 && s.id === e ? [s.contentWindow] : [];
        } catch {
          return [];
        }
      });
      return o?.length ? o : this.getCurrentFrames();
    }
    return R && R.parent && R.parent !== R.self ? [R.parent] : [];
  }
  getCurrentFrames() {
    return this.config.page === "manager" ? Array.from(
      yo.querySelectorAll('[data-is-storybook="true"]')
    ).flatMap((t) => t.contentWindow ? [t.contentWindow] : []) : R && R.parent ? [R.parent] : [];
  }
  getLocalFrame() {
    return this.config.page === "manager" ? Array.from(
      yo.querySelectorAll("#storybook-preview-iframe")
    ).flatMap((t) => t.contentWindow ? [t.contentWindow] : []) : R && R.parent ? [R.parent] : [];
  }
  handleEvent(e) {
    try {
      let { data: t } = e, { key: o, event: s, refId: a } = typeof t == "string" && fr(t) ? ot(t, R.CHANNEL_OPTIONS || {}) : t;
      if (o === gs) {
        let l = this.config.page === "manager" ? '<span style="color: #37D5D3; background: black"> manager </span>' : '<span style="color: #\
1EA7FD; background: black"> preview </span>', c = Object.values(fe).includes(s.type) ? `<span style="color: #FF4785">${s.type}</span>` : `<s\
pan style="color: #FFAE00">${s.type}</span>`;
        if (a && (s.refId = a), s.source = this.config.page === "preview" ? e.origin : hs(e), !s.source) {
          K.error(
            `${l} received ${c} but was unable to determine the source of the event`
          );
          return;
        }
        let i = `${l} received ${c} (${t.length})`;
        K.debug(
          mo.origin !== s.source ? i : `${i} <span style="color: gray">(on ${mo.origin} from ${s.source})</span>`,
          ...s.args
        ), le(this.handler, "ChannelHandler should be set"), this.handler(s);
      }
    } catch (t) {
      O.error(t);
    }
  }
};
n(ho, "PostMessageTransport");
var $e = ho;

// src/channels/websocket/index.ts
var { WebSocket: Sd } = R, go = class go {
  constructor({ url: e, onError: t, page: o }) {
    this.buffer = [];
    this.isReady = !1;
    this.socket = new Sd(e), this.socket.onopen = () => {
      this.isReady = !0, this.flush();
    }, this.socket.onmessage = ({ data: s }) => {
      let a = typeof s == "string" && fr(s) ? ot(s) : s;
      le(this.handler, "WebsocketTransport handler should be set"), this.handler(a);
    }, this.socket.onerror = (s) => {
      t && t(s);
    }, this.socket.onclose = () => {
      le(this.handler, "WebsocketTransport handler should be set"), this.handler({ type: kt, args: [], from: o || "preview" });
    };
  }
  setHandler(e) {
    this.handler = e;
  }
  send(e) {
    this.isReady ? this.sendNow(e) : this.sendLater(e);
  }
  sendLater(e) {
    this.buffer.push(e);
  }
  sendNow(e) {
    let t = tt(e, {
      maxDepth: 15,
      allowFunction: !1,
      ...R.CHANNEL_OPTIONS
    });
    this.socket.send(t);
  }
  flush() {
    let { buffer: e } = this;
    this.buffer = [], e.forEach((t) => this.send(t));
  }
};
n(go, "WebsocketTransport");
var Ye = go;

// src/channels/index.ts
var { CONFIG_TYPE: bd } = R, Td = ye;
function Ed({ page: r, extraTransports: e = [] }) {
  let t = [new $e({ page: r }), ...e];
  if (bd === "DEVELOPMENT") {
    let o = window.location.protocol === "http:" ? "ws" : "wss", { hostname: s, port: a } = window.location, l = `${o}://${s}:${a}/storybook\
-server-channel`;
    t.push(new Ye({ url: l, onError: /* @__PURE__ */ n(() => {
    }, "onError"), page: r }));
  }
  return new ye({ transports: t });
}
n(Ed, "createBrowserChannel");

// src/types/index.ts
var mr = {};
Ae(mr, {
  Addon_TypesEnum: () => Ss
});

// src/types/modules/addons.ts
var Ss = /* @__PURE__ */ ((p) => (p.TAB = "tab", p.PANEL = "panel", p.TOOL = "tool", p.TOOLEXTRA = "toolextra", p.PREVIEW = "preview", p.experimental_PAGE =
"page", p.experimental_SIDEBAR_BOTTOM = "sidebar-bottom", p.experimental_SIDEBAR_TOP = "sidebar-top", p.experimental_TEST_PROVIDER = "test-p\
rovider", p))(Ss || {});

// src/preview-api/index.ts
var Ur = {};
Ae(Ur, {
  DocsContext: () => pe,
  HooksContext: () => he,
  Preview: () => De,
  PreviewWeb: () => Mr,
  PreviewWithSelection: () => Ne,
  ReporterAPI: () => Se,
  StoryStore: () => Ie,
  UrlStore: () => je,
  WebView: () => qe,
  addons: () => Z,
  applyHooks: () => st,
  combineArgs: () => Je,
  combineParameters: () => $,
  composeConfigs: () => Oe,
  composeStepRunners: () => St,
  composeStories: () => wa,
  composeStory: () => yn,
  createPlaywrightTest: () => va,
  decorateStory: () => cn,
  defaultDecorateStory: () => mt,
  filterArgTypes: () => Cr,
  inferControls: () => rr,
  makeDecorator: () => Is,
  mockChannel: () => nt,
  normalizeStory: () => Ze,
  prepareMeta: () => ht,
  prepareStory: () => er,
  sanitizeStoryContextUpdate: () => pn,
  setDefaultProjectAnnotations: () => Aa,
  setProjectAnnotations: () => _a,
  simulateDOMContentLoaded: () => qr,
  simulatePageLoad: () => Hn,
  sortStoriesV7: () => Na,
  useArgs: () => Cs,
  useCallback: () => Ke,
  useChannel: () => vs,
  useEffect: () => Ao,
  useGlobals: () => Os,
  useMemo: () => Es,
  useParameter: () => Ps,
  useReducer: () => ws,
  useRef: () => xs,
  useState: () => _s,
  useStoryContext: () => hr,
  userOrAutoTitle: () => Ia,
  userOrAutoTitleFromSpecifier: () => gn
});

// src/preview-api/modules/addons/storybook-channel-mock.ts
function nt() {
  let r = {
    setHandler: /* @__PURE__ */ n(() => {
    }, "setHandler"),
    send: /* @__PURE__ */ n(() => {
    }, "send")
  };
  return new ye({ transport: r });
}
n(nt, "mockChannel");

// src/preview-api/modules/addons/main.ts
var To = class To {
  constructor() {
    this.getChannel = /* @__PURE__ */ n(() => {
      if (!this.channel) {
        let e = nt();
        return this.setChannel(e), e;
      }
      return this.channel;
    }, "getChannel");
    this.ready = /* @__PURE__ */ n(() => this.promise, "ready");
    this.hasChannel = /* @__PURE__ */ n(() => !!this.channel, "hasChannel");
    this.setChannel = /* @__PURE__ */ n((e) => {
      this.channel = e, this.resolve();
    }, "setChannel");
    this.promise = new Promise((e) => {
      this.resolve = () => e(this.getChannel());
    });
  }
};
n(To, "AddonStore");
var bo = To, So = "__STORYBOOK_ADDONS_PREVIEW";
function Rd() {
  return R[So] || (R[So] = new bo()), R[So];
}
n(Rd, "getAddonsStore");
var Z = Rd();

// src/preview-api/modules/addons/hooks.ts
var _o = class _o {
  constructor() {
    this.hookListsMap = void 0;
    this.mountedDecorators = void 0;
    this.prevMountedDecorators = void 0;
    this.currentHooks = void 0;
    this.nextHookIndex = void 0;
    this.currentPhase = void 0;
    this.currentEffects = void 0;
    this.prevEffects = void 0;
    this.currentDecoratorName = void 0;
    this.hasUpdates = void 0;
    this.currentContext = void 0;
    this.renderListener = /* @__PURE__ */ n((e) => {
      e === this.currentContext?.id && (this.triggerEffects(), this.currentContext = null, this.removeRenderListeners());
    }, "renderListener");
    this.init();
  }
  init() {
    this.hookListsMap = /* @__PURE__ */ new WeakMap(), this.mountedDecorators = /* @__PURE__ */ new Set(), this.prevMountedDecorators = /* @__PURE__ */ new Set(),
    this.currentHooks = [], this.nextHookIndex = 0, this.currentPhase = "NONE", this.currentEffects = [], this.prevEffects = [], this.currentDecoratorName =
    null, this.hasUpdates = !1, this.currentContext = null;
  }
  clean() {
    this.prevEffects.forEach((e) => {
      e.destroy && e.destroy();
    }), this.init(), this.removeRenderListeners();
  }
  getNextHook() {
    let e = this.currentHooks[this.nextHookIndex];
    return this.nextHookIndex += 1, e;
  }
  triggerEffects() {
    this.prevEffects.forEach((e) => {
      !this.currentEffects.includes(e) && e.destroy && e.destroy();
    }), this.currentEffects.forEach((e) => {
      this.prevEffects.includes(e) || (e.destroy = e.create());
    }), this.prevEffects = this.currentEffects, this.currentEffects = [];
  }
  addRenderListeners() {
    this.removeRenderListeners(), Z.getChannel().on(Be, this.renderListener);
  }
  removeRenderListeners() {
    Z.getChannel().removeListener(Be, this.renderListener);
  }
};
n(_o, "HooksContext");
var he = _o;
function bs(r) {
  let e = /* @__PURE__ */ n((...t) => {
    let { hooks: o } = typeof t[0] == "function" ? t[1] : t[0], s = o.currentPhase, a = o.currentHooks, l = o.nextHookIndex, c = o.currentDecoratorName;
    o.currentDecoratorName = r.name, o.prevMountedDecorators.has(r) ? (o.currentPhase = "UPDATE", o.currentHooks = o.hookListsMap.get(r) || []) :
    (o.currentPhase = "MOUNT", o.currentHooks = [], o.hookListsMap.set(r, o.currentHooks), o.prevMountedDecorators.add(r)), o.nextHookIndex =
    0;
    let i = R.STORYBOOK_HOOKS_CONTEXT;
    R.STORYBOOK_HOOKS_CONTEXT = o;
    let p = r(...t);
    if (R.STORYBOOK_HOOKS_CONTEXT = i, o.currentPhase === "UPDATE" && o.getNextHook() != null)
      throw new Error(
        "Rendered fewer hooks than expected. This may be caused by an accidental early return statement."
      );
    return o.currentPhase = s, o.currentHooks = a, o.nextHookIndex = l, o.currentDecoratorName = c, p;
  }, "hookified");
  return e.originalFn = r, e;
}
n(bs, "hookify");
var Eo = 0, xd = 25, st = /* @__PURE__ */ n((r) => (e, t) => {
  let o = r(
    bs(e),
    t.map((s) => bs(s))
  );
  return (s) => {
    let { hooks: a } = s;
    a.prevMountedDecorators ??= /* @__PURE__ */ new Set(), a.mountedDecorators = /* @__PURE__ */ new Set([e, ...t]), a.currentContext = s, a.
    hasUpdates = !1;
    let l = o(s);
    for (Eo = 1; a.hasUpdates; )
      if (a.hasUpdates = !1, a.currentEffects = [], l = o(s), Eo += 1, Eo > xd)
        throw new Error(
          "Too many re-renders. Storybook limits the number of renders to prevent an infinite loop."
        );
    return a.addRenderListeners(), l;
  };
}, "applyHooks"), Ad = /* @__PURE__ */ n((r, e) => r.length === e.length && r.every((t, o) => t === e[o]), "areDepsEqual"), Ro = /* @__PURE__ */ n(
() => new Error("Storybook preview hooks can only be called inside decorators and story functions."), "invalidHooksError");
function Ts() {
  return R.STORYBOOK_HOOKS_CONTEXT || null;
}
n(Ts, "getHooksContextOrNull");
function xo() {
  let r = Ts();
  if (r == null)
    throw Ro();
  return r;
}
n(xo, "getHooksContextOrThrow");
function _d(r, e, t) {
  let o = xo();
  if (o.currentPhase === "MOUNT") {
    t != null && !Array.isArray(t) && O.warn(
      `${r} received a final argument that is not an array (instead, received ${t}). When specified, the final argument must be an array.`
    );
    let s = { name: r, deps: t };
    return o.currentHooks.push(s), e(s), s;
  }
  if (o.currentPhase === "UPDATE") {
    let s = o.getNextHook();
    if (s == null)
      throw new Error("Rendered more hooks than during the previous render.");
    return s.name !== r && O.warn(
      `Storybook has detected a change in the order of Hooks${o.currentDecoratorName ? ` called by ${o.currentDecoratorName}` : ""}. This wi\
ll lead to bugs and errors if not fixed.`
    ), t != null && s.deps == null && O.warn(
      `${r} received a final argument during this render, but not during the previous render. Even though the final argument is optional, it\
s type cannot change between renders.`
    ), t != null && s.deps != null && t.length !== s.deps.length && O.warn(`The final argument passed to ${r} changed size between renders. \
The order and size of this array must remain constant.
Previous: ${s.deps}
Incoming: ${t}`), (t == null || s.deps == null || !Ad(t, s.deps)) && (e(s), s.deps = t), s;
  }
  throw Ro();
}
n(_d, "useHook");
function at(r, e, t) {
  let { memoizedState: o } = _d(
    r,
    (s) => {
      s.memoizedState = e();
    },
    t
  );
  return o;
}
n(at, "useMemoLike");
function Es(r, e) {
  return at("useMemo", r, e);
}
n(Es, "useMemo");
function Ke(r, e) {
  return at("useCallback", () => r, e);
}
n(Ke, "useCallback");
function Rs(r, e) {
  return at(r, () => ({ current: e }), []);
}
n(Rs, "useRefLike");
function xs(r) {
  return Rs("useRef", r);
}
n(xs, "useRef");
function wd() {
  let r = Ts();
  if (r != null && r.currentPhase !== "NONE")
    r.hasUpdates = !0;
  else
    try {
      Z.getChannel().emit(ar);
    } catch {
      O.warn("State updates of Storybook preview hooks work only in browser");
    }
}
n(wd, "triggerUpdate");
function As(r, e) {
  let t = Rs(
    r,
    // @ts-expect-error S type should never be function, but there's no way to tell that to TypeScript
    typeof e == "function" ? e() : e
  ), o = /* @__PURE__ */ n((s) => {
    t.current = typeof s == "function" ? s(t.current) : s, wd();
  }, "setState");
  return [t.current, o];
}
n(As, "useStateLike");
function _s(r) {
  return As("useState", r);
}
n(_s, "useState");
function ws(r, e, t) {
  let o = t != null ? () => t(e) : e, [s, a] = As("useReducer", o);
  return [s, /* @__PURE__ */ n((c) => a((i) => r(i, c)), "dispatch")];
}
n(ws, "useReducer");
function Ao(r, e) {
  let t = xo(), o = at("useEffect", () => ({ create: r }), e);
  t.currentEffects.includes(o) || t.currentEffects.push(o);
}
n(Ao, "useEffect");
function vs(r, e = []) {
  let t = Z.getChannel();
  return Ao(() => (Object.entries(r).forEach(([o, s]) => t.on(o, s)), () => {
    Object.entries(r).forEach(
      ([o, s]) => t.removeListener(o, s)
    );
  }), [...Object.keys(r), ...e]), Ke(t.emit.bind(t), [t]);
}
n(vs, "useChannel");
function hr() {
  let { currentContext: r } = xo();
  if (r == null)
    throw Ro();
  return r;
}
n(hr, "useStoryContext");
function Ps(r, e) {
  let { parameters: t } = hr();
  if (r)
    return t[r] ?? e;
}
n(Ps, "useParameter");
function Cs() {
  let r = Z.getChannel(), { id: e, args: t } = hr(), o = Ke(
    (a) => r.emit(cr, { storyId: e, updatedArgs: a }),
    [r, e]
  ), s = Ke(
    (a) => r.emit(ir, { storyId: e, argNames: a }),
    [r, e]
  );
  return [t, o, s];
}
n(Cs, "useArgs");
function Os() {
  let r = Z.getChannel(), { globals: e } = hr(), t = Ke(
    (o) => r.emit(lr, { globals: o }),
    [r]
  );
  return [e, t];
}
n(Os, "useGlobals");

// src/preview-api/modules/addons/make-decorator.ts
var Is = /* @__PURE__ */ n(({
  name: r,
  parameterName: e,
  wrapper: t,
  skipIfNoParametersOrOptions: o = !1
}) => {
  let s = /* @__PURE__ */ n((a) => (l, c) => {
    let i = c.parameters && c.parameters[e];
    return i && i.disable || o && !a && !i ? l(c) : t(l, c, {
      options: a,
      parameters: i
    });
  }, "decorator");
  return (...a) => typeof a[0] == "function" ? s()(...a) : (...l) => {
    if (l.length > 1)
      return a.length > 1 ? s(a)(...l) : s(...a)(...l);
    throw new Error(
      `Passing stories directly into ${r}() is not allowed,
        instead use addDecorator(${r}) and pass options with the '${e}' parameter`
    );
  };
}, "makeDecorator");

// src/preview-errors.ts
var Pr = {};
Ae(Pr, {
  CalledExtractOnStoreError: () => Sr,
  CalledPreviewMethodBeforeInitializationError: () => G,
  Category: () => Ds,
  EmptyIndexError: () => Rr,
  ImplicitActionsDuringRendering: () => wo,
  MdxFileWithNoCsfReferencesError: () => Er,
  MissingRenderToCanvasError: () => br,
  MissingStoryAfterHmrError: () => gr,
  MissingStoryFromCsfFileError: () => Ar,
  MountMustBeDestructuredError: () => ve,
  NextJsSharpError: () => vo,
  NextjsRouterMocksNotAvailable: () => Po,
  NoRenderFunctionError: () => wr,
  NoStoryMatchError: () => xr,
  NoStoryMountedError: () => vr,
  StoryIndexFetchError: () => Tr,
  StoryStoreAccessedBeforeInitializationError: () => _r,
  UnknownArgTypesError: () => Co,
  UnsupportedViewportDimensionError: () => Oo
});

// ../node_modules/ts-dedent/esm/index.js
function P(r) {
  for (var e = [], t = 1; t < arguments.length; t++)
    e[t - 1] = arguments[t];
  var o = Array.from(typeof r == "string" ? [r] : r);
  o[o.length - 1] = o[o.length - 1].replace(/\r?\n([\t ]*)$/, "");
  var s = o.reduce(function(c, i) {
    var p = i.match(/\n([\t ]+|(?!\s).)/g);
    return p ? c.concat(p.map(function(u) {
      var d, h;
      return (h = (d = u.match(/[\t ]/g)) === null || d === void 0 ? void 0 : d.length) !== null && h !== void 0 ? h : 0;
    })) : c;
  }, []);
  if (s.length) {
    var a = new RegExp(`
[	 ]{` + Math.min.apply(Math, s) + "}", "g");
    o = o.map(function(c) {
      return c.replace(a, `
`);
    });
  }
  o[0] = o[0].replace(/^\r?\n/, "");
  var l = o[0];
  return e.forEach(function(c, i) {
    var p = l.match(/(?:^|\n)( *)$/), u = p ? p[1] : "", d = c;
    typeof c == "string" && c.includes(`
`) && (d = String(c).split(`
`).map(function(h, S) {
      return S === 0 ? h : "" + u + h;
    }).join(`
`)), l += d + o[i + 1];
  }), l;
}
n(P, "dedent");

// src/storybook-error.ts
function Fs({
  code: r,
  category: e
}) {
  let t = String(r).padStart(4, "0");
  return `SB_${e}_${t}`;
}
n(Fs, "parseErrorCode");
var it = class it extends Error {
  constructor(t) {
    super(it.getFullMessage(t));
    /**
     * Data associated with the error. Used to provide additional information in the error message or
     * to be passed to telemetry.
     */
    this.data = {};
    /** Flag used to easily determine if the error originates from Storybook. */
    this.fromStorybook = !0;
    this.category = t.category, this.documentation = t.documentation ?? !1, this.code = t.code;
  }
  get fullErrorCode() {
    return Fs({ code: this.code, category: this.category });
  }
  /** Overrides the default `Error.name` property in the format: SB_<CATEGORY>_<CODE>. */
  get name() {
    let t = this.constructor.name;
    return `${this.fullErrorCode} (${t})`;
  }
  /** Generates the error message along with additional documentation link (if applicable). */
  static getFullMessage({
    documentation: t,
    code: o,
    category: s,
    message: a
  }) {
    let l;
    return t === !0 ? l = `https://storybook.js.org/error/${Fs({ code: o, category: s })}` : typeof t == "string" ? l = t : Array.isArray(t) &&
    (l = `
${t.map((c) => `	- ${c}`).join(`
`)}`), `${a}${l != null ? `

More info: ${l}
` : ""}`;
  }
};
n(it, "StorybookError");
var q = it;

// src/preview-errors.ts
var Ds = /* @__PURE__ */ ((b) => (b.BLOCKS = "BLOCKS", b.DOCS_TOOLS = "DOCS-TOOLS", b.PREVIEW_CLIENT_LOGGER = "PREVIEW_CLIENT-LOGGER", b.PREVIEW_CHANNELS =
"PREVIEW_CHANNELS", b.PREVIEW_CORE_EVENTS = "PREVIEW_CORE-EVENTS", b.PREVIEW_INSTRUMENTER = "PREVIEW_INSTRUMENTER", b.PREVIEW_API = "PREVIEW\
_API", b.PREVIEW_REACT_DOM_SHIM = "PREVIEW_REACT-DOM-SHIM", b.PREVIEW_ROUTER = "PREVIEW_ROUTER", b.PREVIEW_THEMING = "PREVIEW_THEMING", b.RENDERER_HTML =
"RENDERER_HTML", b.RENDERER_PREACT = "RENDERER_PREACT", b.RENDERER_REACT = "RENDERER_REACT", b.RENDERER_SERVER = "RENDERER_SERVER", b.RENDERER_SVELTE =
"RENDERER_SVELTE", b.RENDERER_VUE = "RENDERER_VUE", b.RENDERER_VUE3 = "RENDERER_VUE3", b.RENDERER_WEB_COMPONENTS = "RENDERER_WEB-COMPONENTS",
b.FRAMEWORK_NEXTJS = "FRAMEWORK_NEXTJS", b.ADDON_VITEST = "ADDON_VITEST", b))(Ds || {}), Io = class Io extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 1,
      message: P`
        Couldn't find story matching id '${t.storyId}' after HMR.
        - Did you just rename a story?
        - Did you remove it from your CSF file?
        - Are you sure a story with the id '${t.storyId}' exists?
        - Please check the values in the stories field of your main.js config and see if they would match your CSF File.
        - Also check the browser console and terminal for potential error messages.`
    });
    this.data = t;
  }
};
n(Io, "MissingStoryAfterHmrError");
var gr = Io, Fo = class Fo extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 2,
      documentation: "https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#using-implicit-actions-during-rendering-is-deprecated-\
for-example-in-the-play-function",
      message: P`
        We detected that you use an implicit action arg while ${t.phase} of your story.  
        ${t.deprecated ? `
This is deprecated and won't work in Storybook 8 anymore.
` : ""}
        Please provide an explicit spy to your args like this:
          import { fn } from '@storybook/test';
          ... 
          args: {
           ${t.name}: fn()
          }`
    });
    this.data = t;
  }
};
n(Fo, "ImplicitActionsDuringRendering");
var wo = Fo, Do = class Do extends q {
  constructor() {
    super({
      category: "PREVIEW_API",
      code: 3,
      message: P`
        Cannot call \`storyStore.extract()\` without calling \`storyStore.cacheAllCsfFiles()\` first.

        You probably meant to call \`await preview.extract()\` which does the above for you.`
    });
  }
};
n(Do, "CalledExtractOnStoreError");
var Sr = Do, No = class No extends q {
  constructor() {
    super({
      category: "PREVIEW_API",
      code: 4,
      message: P`
        Expected your framework's preset to export a \`renderToCanvas\` field.

        Perhaps it needs to be upgraded for Storybook 7.0?`,
      documentation: "https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#mainjs-framework-field"
    });
  }
};
n(No, "MissingRenderToCanvasError");
var br = No, ko = class ko extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 5,
      message: P`
        Called \`Preview.${t.methodName}()\` before initialization.
        
        The preview needs to load the story index before most methods can be called. If you want
        to call \`${t.methodName}\`, try \`await preview.initializationPromise;\` first.
        
        If you didn't call the above code, then likely it was called by an addon that needs to
        do the above.`
    });
    this.data = t;
  }
};
n(ko, "CalledPreviewMethodBeforeInitializationError");
var G = ko, Lo = class Lo extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 6,
      message: P`
        Error fetching \`/index.json\`:
        
        ${t.text}

        If you are in development, this likely indicates a problem with your Storybook process,
        check the terminal for errors.

        If you are in a deployed Storybook, there may have been an issue deploying the full Storybook
        build.`
    });
    this.data = t;
  }
};
n(Lo, "StoryIndexFetchError");
var Tr = Lo, jo = class jo extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 7,
      message: P`
        Tried to render docs entry ${t.storyId} but it is a MDX file that has no CSF
        references, or autodocs for a CSF file that some doesn't refer to itself.
        
        This likely is an internal error in Storybook's indexing, or you've attached the
        \`attached-mdx\` tag to an MDX file that is not attached.`
    });
    this.data = t;
  }
};
n(jo, "MdxFileWithNoCsfReferencesError");
var Er = jo, Mo = class Mo extends q {
  constructor() {
    super({
      category: "PREVIEW_API",
      code: 8,
      message: P`
        Couldn't find any stories in your Storybook.

        - Please check your stories field of your main.js config: does it match correctly?
        - Also check the browser console and terminal for error messages.`
    });
  }
};
n(Mo, "EmptyIndexError");
var Rr = Mo, qo = class qo extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 9,
      message: P`
        Couldn't find story matching '${t.storySpecifier}'.

        - Are you sure a story with that id exists?
        - Please check your stories field of your main.js config.
        - Also check the browser console and terminal for error messages.`
    });
    this.data = t;
  }
};
n(qo, "NoStoryMatchError");
var xr = qo, Uo = class Uo extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 10,
      message: P`
        Couldn't find story matching id '${t.storyId}' after importing a CSF file.

        The file was indexed as if the story was there, but then after importing the file in the browser
        we didn't find the story. Possible reasons:
        - You are using a custom story indexer that is misbehaving.
        - You have a custom file loader that is removing or renaming exports.

        Please check your browser console and terminal for errors that may explain the issue.`
    });
    this.data = t;
  }
};
n(Uo, "MissingStoryFromCsfFileError");
var Ar = Uo, Bo = class Bo extends q {
  constructor() {
    super({
      category: "PREVIEW_API",
      code: 11,
      message: P`
        Cannot access the Story Store until the index is ready.

        It is not recommended to use methods directly on the Story Store anyway, in Storybook 9 we will
        remove access to the store entirely`
    });
  }
};
n(Bo, "StoryStoreAccessedBeforeInitializationError");
var _r = Bo, Go = class Go extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 12,
      message: P`
      Incorrect use of mount in the play function.
      
      To use mount in the play function, you must satisfy the following two requirements: 
      
      1. You *must* destructure the mount property from the \`context\` (the argument passed to your play function). 
         This makes sure that Storybook does not start rendering the story before the play function begins.
      
      2. Your Storybook framework or builder must be configured to transpile to ES2017 or newer. 
         This is because destructuring statements and async/await usages are otherwise transpiled away, 
         which prevents Storybook from recognizing your usage of \`mount\`.
      
      Note that Angular is not supported. As async/await is transpiled to support the zone.js polyfill. 
      
      More info: https://storybook.js.org/docs/writing-tests/interaction-testing#run-code-before-the-component-gets-rendered
      
      Received the following play function:
      ${t.playFunction}`
    });
    this.data = t;
  }
};
n(Go, "MountMustBeDestructuredError");
var ve = Go, Vo = class Vo extends q {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 14,
      message: P`
        No render function available for storyId '${t.id}'
      `
    });
    this.data = t;
  }
};
n(Vo, "NoRenderFunctionError");
var wr = Vo, Ho = class Ho extends q {
  constructor() {
    super({
      category: "PREVIEW_API",
      code: 15,
      message: P`
        No component is mounted in your story.
        
        This usually occurs when you destructure mount in the play function, but forget to call it.
        
        For example:

        async play({ mount, canvasElement }) {
          // 👈 mount should be called: await mount(); 
          const canvas = within(canvasElement);
          const button = await canvas.findByRole('button');
          await userEvent.click(button);
        };

        Make sure to either remove it or call mount in your play function.
      `
    });
  }
};
n(Ho, "NoStoryMountedError");
var vr = Ho, zo = class zo extends q {
  constructor() {
    super({
      category: "FRAMEWORK_NEXTJS",
      code: 1,
      documentation: "https://storybook.js.org/docs/get-started/nextjs#faq",
      message: P`
      You are importing avif images, but you don't have sharp installed.

      You have to install sharp in order to use image optimization features in Next.js.
      `
    });
  }
};
n(zo, "NextJsSharpError");
var vo = zo, Wo = class Wo extends q {
  constructor(t) {
    super({
      category: "FRAMEWORK_NEXTJS",
      code: 2,
      message: P`
        Tried to access router mocks from "${t.importType}" but they were not created yet. You might be running code in an unsupported environment.
      `
    });
    this.data = t;
  }
};
n(Wo, "NextjsRouterMocksNotAvailable");
var Po = Wo, $o = class $o extends q {
  constructor(t) {
    super({
      category: "DOCS-TOOLS",
      code: 1,
      documentation: "https://github.com/storybookjs/storybook/issues/26606",
      message: P`
        There was a failure when generating detailed ArgTypes in ${t.language} for:
        ${JSON.stringify(t.type, null, 2)} 
        
        Storybook will fall back to use a generic type description instead.

        This type is either not supported or it is a bug in the docgen generation in Storybook.
        If you think this is a bug, please detail it as much as possible in the Github issue.
      `
    });
    this.data = t;
  }
};
n($o, "UnknownArgTypesError");
var Co = $o, Yo = class Yo extends q {
  constructor(t) {
    super({
      category: "ADDON_VITEST",
      code: 1,
      // TODO: Add documentation about viewports support
      // documentation: '',
      message: P`
        Encountered an unsupported value "${t.value}" when setting the viewport ${t.dimension} dimension.
        
        The Storybook plugin only supports values in the following units:
        - px, vh, vw, em, rem and %.
        
        You can either change the viewport for this story to use one of the supported units or skip the test by adding '!test' to the story's tags per https://storybook.js.org/docs/writing-stories/tags
      `
    });
    this.data = t;
  }
};
n(Yo, "UnsupportedViewportDimensionError");
var Oo = Yo;

// ../node_modules/es-toolkit/dist/object/omitBy.mjs
function Ko(r, e) {
  let t = {}, o = Object.entries(r);
  for (let s = 0; s < o.length; s++) {
    let [a, l] = o[s];
    e(l, a) || (t[a] = l);
  }
  return t;
}
n(Ko, "omitBy");

// ../node_modules/es-toolkit/dist/object/pick.mjs
function Xo(r, e) {
  let t = {};
  for (let o = 0; o < e.length; o++) {
    let s = e[o];
    Object.prototype.hasOwnProperty.call(r, s) && (t[s] = r[s]);
  }
  return t;
}
n(Xo, "pick");

// ../node_modules/es-toolkit/dist/object/pickBy.mjs
function Jo(r, e) {
  let t = {}, o = Object.entries(r);
  for (let s = 0; s < o.length; s++) {
    let [a, l] = o[s];
    e(l, a) && (t[a] = l);
  }
  return t;
}
n(Jo, "pickBy");

// ../node_modules/es-toolkit/dist/predicate/isPlainObject.mjs
function W(r) {
  if (typeof r != "object" || r == null)
    return !1;
  if (Object.getPrototypeOf(r) === null)
    return !0;
  if (r.toString() !== "[object Object]")
    return !1;
  let e = r;
  for (; Object.getPrototypeOf(e) !== null; )
    e = Object.getPrototypeOf(e);
  return Object.getPrototypeOf(r) === e;
}
n(W, "isPlainObject");

// ../node_modules/es-toolkit/dist/object/mapValues.mjs
function ee(r, e) {
  let t = {}, o = Object.keys(r);
  for (let s = 0; s < o.length; s++) {
    let a = o[s], l = r[a];
    t[a] = e(l, a, r);
  }
  return t;
}
n(ee, "mapValues");

// ../node_modules/es-toolkit/dist/compat/_internal/tags.mjs
var Ns = "[object RegExp]", ks = "[object String]", Ls = "[object Number]", js = "[object Boolean]", Qo = "[object Arguments]", Ms = "[objec\
t Symbol]", qs = "[object Date]", Us = "[object Map]", Bs = "[object Set]", Gs = "[object Array]", Vs = "[object Function]", Hs = "[object A\
rrayBuffer]", lt = "[object Object]", zs = "[object Error]", Ws = "[object DataView]", $s = "[object Uint8Array]", Ys = "[object Uint8Clampe\
dArray]", Ks = "[object Uint16Array]", Xs = "[object Uint32Array]", Js = "[object BigUint64Array]", Qs = "[object Int8Array]", Zs = "[object\
 Int16Array]", ea = "[object Int32Array]", ra = "[object BigInt64Array]", ta = "[object Float32Array]", oa = "[object Float64Array]";

// ../node_modules/es-toolkit/dist/compat/_internal/getSymbols.mjs
function Zo(r) {
  return Object.getOwnPropertySymbols(r).filter((e) => Object.prototype.propertyIsEnumerable.call(r, e));
}
n(Zo, "getSymbols");

// ../node_modules/es-toolkit/dist/compat/_internal/getTag.mjs
function en(r) {
  return r == null ? r === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(r);
}
n(en, "getTag");

// ../node_modules/es-toolkit/dist/predicate/isEqual.mjs
function rn(r, e) {
  if (typeof r == typeof e)
    switch (typeof r) {
      case "bigint":
      case "string":
      case "boolean":
      case "symbol":
      case "undefined":
        return r === e;
      case "number":
        return r === e || Object.is(r, e);
      case "function":
        return r === e;
      case "object":
        return ce(r, e);
    }
  return ce(r, e);
}
n(rn, "isEqual");
function ce(r, e, t) {
  if (Object.is(r, e))
    return !0;
  let o = en(r), s = en(e);
  if (o === Qo && (o = lt), s === Qo && (s = lt), o !== s)
    return !1;
  switch (o) {
    case ks:
      return r.toString() === e.toString();
    case Ls: {
      let c = r.valueOf(), i = e.valueOf();
      return c === i || Number.isNaN(c) && Number.isNaN(i);
    }
    case js:
    case qs:
    case Ms:
      return Object.is(r.valueOf(), e.valueOf());
    case Ns:
      return r.source === e.source && r.flags === e.flags;
    case Vs:
      return r === e;
  }
  t = t ?? /* @__PURE__ */ new Map();
  let a = t.get(r), l = t.get(e);
  if (a != null && l != null)
    return a === e;
  t.set(r, e), t.set(e, r);
  try {
    switch (o) {
      case Us: {
        if (r.size !== e.size)
          return !1;
        for (let [c, i] of r.entries())
          if (!e.has(c) || !ce(i, e.get(c), t))
            return !1;
        return !0;
      }
      case Bs: {
        if (r.size !== e.size)
          return !1;
        let c = Array.from(r.values()), i = Array.from(e.values());
        for (let p = 0; p < c.length; p++) {
          let u = c[p], d = i.findIndex((h) => ce(u, h, t));
          if (d === -1)
            return !1;
          i.splice(d, 1);
        }
        return !0;
      }
      case Gs:
      case $s:
      case Ys:
      case Ks:
      case Xs:
      case Js:
      case Qs:
      case Zs:
      case ea:
      case ra:
      case ta:
      case oa: {
        if (typeof Buffer < "u" && Buffer.isBuffer(r) !== Buffer.isBuffer(e) || r.length !== e.length)
          return !1;
        for (let c = 0; c < r.length; c++)
          if (!ce(r[c], e[c], t))
            return !1;
        return !0;
      }
      case Hs:
        return r.byteLength !== e.byteLength ? !1 : ce(new Uint8Array(r), new Uint8Array(e), t);
      case Ws:
        return r.byteLength !== e.byteLength || r.byteOffset !== e.byteOffset ? !1 : ce(r.buffer, e.buffer, t);
      case zs:
        return r.name === e.name && r.message === e.message;
      case lt: {
        if (!(ce(r.constructor, e.constructor, t) || W(r) && W(e)))
          return !1;
        let i = [...Object.keys(r), ...Zo(r)], p = [...Object.keys(e), ...Zo(e)];
        if (i.length !== p.length)
          return !1;
        for (let u = 0; u < i.length; u++) {
          let d = i[u], h = r[d];
          if (!Object.prototype.hasOwnProperty.call(e, d))
            return !1;
          let S = e[d];
          if (!ce(h, S, t))
            return !1;
        }
        return !0;
      }
      default:
        return !1;
    }
  } finally {
    t.delete(r), t.delete(e);
  }
}
n(ce, "areObjectsEqual");

// src/preview-api/modules/store/StoryStore.ts
var bt = ue(Qr(), 1);

// src/preview-api/modules/store/args.ts
var Xe = Symbol("incompatible"), tn = /* @__PURE__ */ n((r, e) => {
  let t = e.type;
  if (r == null || !t || e.mapping)
    return r;
  switch (t.name) {
    case "string":
      return String(r);
    case "enum":
      return r;
    case "number":
      return Number(r);
    case "boolean":
      return String(r) === "true";
    case "array":
      return !t.value || !Array.isArray(r) ? Xe : r.reduce((o, s, a) => {
        let l = tn(s, { type: t.value });
        return l !== Xe && (o[a] = l), o;
      }, new Array(r.length));
    case "object":
      return typeof r == "string" || typeof r == "number" ? r : !t.value || typeof r != "object" ? Xe : Object.entries(r).reduce((o, [s, a]) => {
        let l = tn(a, { type: t.value[s] });
        return l === Xe ? o : Object.assign(o, { [s]: l });
      }, {});
    default:
      return Xe;
  }
}, "map"), na = /* @__PURE__ */ n((r, e) => Object.entries(r).reduce((t, [o, s]) => {
  if (!e[o])
    return t;
  let a = tn(s, e[o]);
  return a === Xe ? t : Object.assign(t, { [o]: a });
}, {}), "mapArgsToTypes"), Je = /* @__PURE__ */ n((r, e) => Array.isArray(r) && Array.isArray(e) ? e.reduce(
  (t, o, s) => (t[s] = Je(r[s], e[s]), t),
  [...r]
).filter((t) => t !== void 0) : !W(r) || !W(e) ? e : Object.keys({ ...r, ...e }).reduce((t, o) => {
  if (o in e) {
    let s = Je(r[o], e[o]);
    s !== void 0 && (t[o] = s);
  } else
    t[o] = r[o];
  return t;
}, {}), "combineArgs"), sa = /* @__PURE__ */ n((r, e) => Object.entries(e).reduce((t, [o, { options: s }]) => {
  function a() {
    return o in r && (t[o] = r[o]), t;
  }
  if (n(a, "allowArg"), !s)
    return a();
  if (!Array.isArray(s))
    return L.error(P`
        Invalid argType: '${o}.options' should be an array.

        More info: https://storybook.js.org/docs/api/arg-types
      `), a();
  if (s.some((d) => d && ["object", "function"].includes(typeof d)))
    return L.error(P`
        Invalid argType: '${o}.options' should only contain primitives. Use a 'mapping' for complex values.

        More info: https://storybook.js.org/docs/writing-stories/args#mapping-to-complex-arg-values
      `), a();
  let l = Array.isArray(r[o]), c = l && r[o].findIndex((d) => !s.includes(d)), i = l && c === -1;
  if (r[o] === void 0 || s.includes(r[o]) || i)
    return a();
  let p = l ? `${o}[${c}]` : o, u = s.map((d) => typeof d == "string" ? `'${d}'` : String(d)).join(", ");
  return L.warn(`Received illegal value for '${p}'. Supported options: ${u}`), t;
}, {}), "validateOptions"), Pe = Symbol("Deeply equal"), Qe = /* @__PURE__ */ n((r, e) => {
  if (typeof r != typeof e)
    return e;
  if (rn(r, e))
    return Pe;
  if (Array.isArray(r) && Array.isArray(e)) {
    let t = e.reduce((o, s, a) => {
      let l = Qe(r[a], s);
      return l !== Pe && (o[a] = l), o;
    }, new Array(e.length));
    return e.length >= r.length ? t : t.concat(new Array(r.length - e.length).fill(void 0));
  }
  return W(r) && W(e) ? Object.keys({ ...r, ...e }).reduce((t, o) => {
    let s = Qe(r?.[o], e?.[o]);
    return s === Pe ? t : Object.assign(t, { [o]: s });
  }, {}) : e;
}, "deepDiff"), on = "UNTARGETED";
function aa({
  args: r,
  argTypes: e
}) {
  let t = {};
  return Object.entries(r).forEach(([o, s]) => {
    let { target: a = on } = e[o] || {};
    t[a] = t[a] || {}, t[a][o] = s;
  }), t;
}
n(aa, "groupArgsByTarget");

// src/preview-api/modules/store/ArgsStore.ts
function vd(r) {
  return Object.keys(r).forEach((e) => r[e] === void 0 && delete r[e]), r;
}
n(vd, "deleteUndefined");
var nn = class nn {
  constructor() {
    this.initialArgsByStoryId = {};
    this.argsByStoryId = {};
  }
  get(e) {
    if (!(e in this.argsByStoryId))
      throw new Error(`No args known for ${e} -- has it been rendered yet?`);
    return this.argsByStoryId[e];
  }
  setInitial(e) {
    if (!this.initialArgsByStoryId[e.id])
      this.initialArgsByStoryId[e.id] = e.initialArgs, this.argsByStoryId[e.id] = e.initialArgs;
    else if (this.initialArgsByStoryId[e.id] !== e.initialArgs) {
      let t = Qe(this.initialArgsByStoryId[e.id], this.argsByStoryId[e.id]);
      this.initialArgsByStoryId[e.id] = e.initialArgs, this.argsByStoryId[e.id] = e.initialArgs, t !== Pe && this.updateFromDelta(e, t);
    }
  }
  updateFromDelta(e, t) {
    let o = sa(t, e.argTypes);
    this.argsByStoryId[e.id] = Je(this.argsByStoryId[e.id], o);
  }
  updateFromPersisted(e, t) {
    let o = na(t, e.argTypes);
    return this.updateFromDelta(e, o);
  }
  update(e, t) {
    if (!(e in this.argsByStoryId))
      throw new Error(`No args known for ${e} -- has it been rendered yet?`);
    this.argsByStoryId[e] = vd({
      ...this.argsByStoryId[e],
      ...t
    });
  }
};
n(nn, "ArgsStore");
var ct = nn;

// src/preview-api/modules/store/csf/getValuesFromArgTypes.ts
var pt = /* @__PURE__ */ n((r = {}) => Object.entries(r).reduce((e, [t, { defaultValue: o }]) => (typeof o < "u" && (e[t] = o), e), {}), "ge\
tValuesFromArgTypes");

// src/preview-api/modules/store/GlobalsStore.ts
var sn = class sn {
  constructor({
    globals: e = {},
    globalTypes: t = {}
  }) {
    this.set({ globals: e, globalTypes: t });
  }
  set({ globals: e = {}, globalTypes: t = {} }) {
    let o = this.initialGlobals && Qe(this.initialGlobals, this.globals);
    this.allowedGlobalNames = /* @__PURE__ */ new Set([...Object.keys(e), ...Object.keys(t)]);
    let s = pt(t);
    this.initialGlobals = { ...s, ...e }, this.globals = this.initialGlobals, o && o !== Pe && this.updateFromPersisted(o);
  }
  filterAllowedGlobals(e) {
    return Object.entries(e).reduce((t, [o, s]) => (this.allowedGlobalNames.has(o) ? t[o] = s : O.warn(
      `Attempted to set a global (${o}) that is not defined in initial globals or globalTypes`
    ), t), {});
  }
  updateFromPersisted(e) {
    let t = this.filterAllowedGlobals(e);
    this.globals = { ...this.globals, ...t };
  }
  get() {
    return this.globals;
  }
  update(e) {
    this.globals = { ...this.globals, ...this.filterAllowedGlobals(e) };
  }
};
n(sn, "GlobalsStore");
var dt = sn;

// src/preview-api/modules/store/StoryIndexStore.ts
var ia = ue(Qr(), 1);
var Pd = (0, ia.default)(1)(
  (r) => Object.values(r).reduce(
    (e, t) => (e[t.importPath] = e[t.importPath] || t, e),
    {}
  )
), an = class an {
  constructor({ entries: e } = { v: 5, entries: {} }) {
    this.entries = e;
  }
  entryFromSpecifier(e) {
    let t = Object.values(this.entries);
    if (e === "*")
      return t[0];
    if (typeof e == "string")
      return this.entries[e] ? this.entries[e] : t.find((a) => a.id.startsWith(e));
    let { name: o, title: s } = e;
    return t.find((a) => a.name === o && a.title === s);
  }
  storyIdToEntry(e) {
    let t = this.entries[e];
    if (!t)
      throw new gr({ storyId: e });
    return t;
  }
  importPathToEntry(e) {
    return Pd(this.entries)[e];
  }
};
n(an, "StoryIndexStore");
var ut = an;

// src/preview-api/modules/store/csf/normalizeInputTypes.ts
var Cd = /* @__PURE__ */ n((r) => typeof r == "string" ? { name: r } : r, "normalizeType"), Od = /* @__PURE__ */ n((r) => typeof r == "strin\
g" ? { type: r } : r, "normalizeControl"), Id = /* @__PURE__ */ n((r, e) => {
  let { type: t, control: o, ...s } = r, a = {
    name: e,
    ...s
  };
  return t && (a.type = Cd(t)), o ? a.control = Od(o) : o === !1 && (a.control = { disable: !0 }), a;
}, "normalizeInputType"), Ce = /* @__PURE__ */ n((r) => ee(r, Id), "normalizeInputTypes");

// ../node_modules/@storybook/csf/dist/index.mjs
var Fd = Object.create, da = Object.defineProperty, Dd = Object.getOwnPropertyDescriptor, Nd = Object.getOwnPropertyNames, kd = Object.getPrototypeOf,
Ld = Object.prototype.hasOwnProperty, jd = /* @__PURE__ */ n((r, e) => () => (e || r((e = { exports: {} }).exports, e), e.exports), "E"), Md = /* @__PURE__ */ n(
(r, e, t, o) => {
  if (e && typeof e == "object" || typeof e == "function") for (let s of Nd(e)) !Ld.call(r, s) && s !== t && da(r, s, { get: /* @__PURE__ */ n(
  () => e[s], "get"), enumerable: !(o = Dd(e, s)) || o.enumerable });
  return r;
}, "v"), qd = /* @__PURE__ */ n((r, e, t) => (t = r != null ? Fd(kd(r)) : {}, Md(e || !r || !r.__esModule ? da(t, "default", { value: r, enumerable: !0 }) :
t, r)), "I"), Ud = jd((r) => {
  Object.defineProperty(r, "__esModule", { value: !0 }), r.isEqual = /* @__PURE__ */ function() {
    var e = Object.prototype.toString, t = Object.getPrototypeOf, o = Object.getOwnPropertySymbols ? function(s) {
      return Object.keys(s).concat(Object.getOwnPropertySymbols(s));
    } : Object.keys;
    return function(s, a) {
      return (/* @__PURE__ */ n(function l(c, i, p) {
        var u, d, h, S = e.call(c), m = e.call(i);
        if (c === i) return !0;
        if (c == null || i == null) return !1;
        if (p.indexOf(c) > -1 && p.indexOf(i) > -1) return !0;
        if (p.push(c, i), S != m || (u = o(c), d = o(i), u.length != d.length || u.some(function(T) {
          return !l(c[T], i[T], p);
        }))) return !1;
        switch (S.slice(8, -1)) {
          case "Symbol":
            return c.valueOf() == i.valueOf();
          case "Date":
          case "Number":
            return +c == +i || +c != +c && +i != +i;
          case "RegExp":
          case "Function":
          case "String":
          case "Boolean":
            return "" + c == "" + i;
          case "Set":
          case "Map":
            u = c.entries(), d = i.entries();
            do
              if (!l((h = u.next()).value, d.next().value, p)) return !1;
            while (!h.done);
            return !0;
          case "ArrayBuffer":
            c = new Uint8Array(c), i = new Uint8Array(i);
          case "DataView":
            c = new Uint8Array(c.buffer), i = new Uint8Array(i.buffer);
          case "Float32Array":
          case "Float64Array":
          case "Int8Array":
          case "Int16Array":
          case "Int32Array":
          case "Uint8Array":
          case "Uint16Array":
          case "Uint32Array":
          case "Uint8ClampedArray":
          case "Arguments":
          case "Array":
            if (c.length != i.length) return !1;
            for (h = 0; h < c.length; h++) if ((h in c || h in i) && (h in c != h in i || !l(c[h], i[h], p))) return !1;
            return !0;
          case "Object":
            return l(t(c), t(i), p);
          default:
            return !1;
        }
      }, "i"))(s, a, []);
    };
  }();
});
function Bd(r) {
  return r.replace(/_/g, " ").replace(/-/g, " ").replace(/\./g, " ").replace(/([^\n])([A-Z])([a-z])/g, (e, t, o, s) => `${t} ${o}${s}`).replace(
  /([a-z])([A-Z])/g, (e, t, o) => `${t} ${o}`).replace(/([a-z])([0-9])/gi, (e, t, o) => `${t} ${o}`).replace(/([0-9])([a-z])/gi, (e, t, o) => `${t}\
 ${o}`).replace(/(\s|^)(\w)/g, (e, t, o) => `${t}${o.toUpperCase()}`).replace(/ +/g, " ").trim();
}
n(Bd, "R");
var la = qd(Ud()), ua = /* @__PURE__ */ n((r) => r.map((e) => typeof e < "u").filter(Boolean).length, "S"), Gd = /* @__PURE__ */ n((r, e) => {
  let { exists: t, eq: o, neq: s, truthy: a } = r;
  if (ua([t, o, s, a]) > 1) throw new Error(`Invalid conditional test ${JSON.stringify({ exists: t, eq: o, neq: s })}`);
  if (typeof o < "u") return (0, la.isEqual)(e, o);
  if (typeof s < "u") return !(0, la.isEqual)(e, s);
  if (typeof t < "u") {
    let l = typeof e < "u";
    return t ? l : !l;
  }
  return typeof a > "u" || a ? !!e : !e;
}, "k"), fa = /* @__PURE__ */ n((r, e, t) => {
  if (!r.if) return !0;
  let { arg: o, global: s } = r.if;
  if (ua([o, s]) !== 1) throw new Error(`Invalid conditional value ${JSON.stringify({ arg: o, global: s })}`);
  let a = o ? e[o] : t[s];
  return Gd(r.if, a);
}, "P"), ln = /* @__PURE__ */ n((r) => r.toLowerCase().replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, "-").replace(
/-+/g, "-").replace(/^-+/, "").replace(/-+$/, ""), "O"), ca = /* @__PURE__ */ n((r, e) => {
  let t = ln(r);
  if (t === "") throw new Error(`Invalid ${e} '${r}', must include alphanumeric characters`);
  return t;
}, "f"), ya = /* @__PURE__ */ n((r, e) => `${ca(r, "kind")}${e ? `--${ca(e, "name")}` : ""}`, "G"), ma = /* @__PURE__ */ n((r) => Bd(r), "N");
function pa(r, e) {
  return Array.isArray(e) ? e.includes(r) : r.match(e);
}
n(pa, "m");
function ft(r, { includeStories: e, excludeStories: t }) {
  return r !== "__esModule" && (!e || pa(r, e)) && (!t || !pa(r, t));
}
n(ft, "M");
var ha = /* @__PURE__ */ n((...r) => {
  let e = r.reduce((t, o) => (o.startsWith("!") ? t.delete(o.slice(1)) : t.add(o), t), /* @__PURE__ */ new Set());
  return Array.from(e);
}, "z");

// src/preview-api/modules/store/csf/normalizeArrays.ts
var N = /* @__PURE__ */ n((r) => Array.isArray(r) ? r : r ? [r] : [], "normalizeArrays");

// src/preview-api/modules/store/csf/normalizeStory.ts
var Vd = P`
CSF .story annotations deprecated; annotate story functions directly:
- StoryFn.story.name => StoryFn.storyName
- StoryFn.story.(parameters|decorators) => StoryFn.(parameters|decorators)
See https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#hoisted-csf-annotations for details and codemod.
`;
function Ze(r, e, t) {
  let o = e, s = typeof e == "function" ? e : null, { story: a } = o;
  a && (O.debug("deprecated story", a), oe(Vd));
  let l = ma(r), c = typeof o != "function" && o.name || o.storyName || a?.name || l, i = [
    ...N(o.decorators),
    ...N(a?.decorators)
  ], p = { ...a?.parameters, ...o.parameters }, u = { ...a?.args, ...o.args }, d = { ...a?.argTypes, ...o.argTypes }, h = [...N(o.loaders), ...N(
  a?.loaders)], S = [
    ...N(o.beforeEach),
    ...N(a?.beforeEach)
  ], m = [
    ...N(o.experimental_afterEach),
    ...N(a?.experimental_afterEach)
  ], { render: T, play: y, tags: x = [], globals: A = {} } = o, g = p.__id || ya(t.id, l);
  return {
    moduleExport: e,
    id: g,
    name: c,
    tags: x,
    decorators: i,
    parameters: p,
    args: u,
    argTypes: Ce(d),
    loaders: h,
    beforeEach: S,
    experimental_afterEach: m,
    globals: A,
    ...T && { render: T },
    ...s && { userStoryFn: s },
    ...y && { play: y }
  };
}
n(Ze, "normalizeStory");

// src/preview-api/modules/store/csf/normalizeComponentAnnotations.ts
function yt(r, e = r.title, t) {
  let { id: o, argTypes: s } = r;
  return {
    id: ln(o || e),
    ...r,
    title: e,
    ...s && { argTypes: Ce(s) },
    parameters: {
      fileName: t,
      ...r.parameters
    }
  };
}
n(yt, "normalizeComponentAnnotations");

// src/preview-api/modules/store/csf/processCSFFile.ts
var Hd = /* @__PURE__ */ n((r) => {
  let { globals: e, globalTypes: t } = r;
  (e || t) && O.error(
    "Global args/argTypes can only be set globally",
    JSON.stringify({
      globals: e,
      globalTypes: t
    })
  );
}, "checkGlobals"), zd = /* @__PURE__ */ n((r) => {
  let { options: e } = r;
  e?.storySort && O.error("The storySort option parameter can only be set globally");
}, "checkStorySort"), ga = /* @__PURE__ */ n((r) => {
  r && (Hd(r), zd(r));
}, "checkDisallowedParameters");
function Sa(r, e, t) {
  let { default: o, __namedExportsOrder: s, ...a } = r, l = yt(
    o,
    t,
    e
  );
  ga(l.parameters);
  let c = { meta: l, stories: {}, moduleExports: r };
  return Object.keys(a).forEach((i) => {
    if (ft(i, l)) {
      let p = Ze(i, a[i], l);
      ga(p.parameters), c.stories[p.id] = p;
    }
  }), c;
}
n(Sa, "processCSFFile");

// src/preview-api/modules/preview-web/render/mount-utils.ts
function Ta(r) {
  return r != null && Wd(r).includes("mount");
}
n(Ta, "mountDestructured");
function Wd(r) {
  let e = r.toString().match(/[^(]*\(([^)]*)/);
  if (!e)
    return [];
  let t = ba(e[1]);
  if (!t.length)
    return [];
  let o = t[0];
  return o.startsWith("{") && o.endsWith("}") ? ba(o.slice(1, -1).replace(/\s/g, "")).map((a) => a.replace(/:.*|=.*/g, "")) : [];
}
n(Wd, "getUsedProps");
function ba(r) {
  let e = [], t = [], o = 0;
  for (let a = 0; a < r.length; a++)
    if (r[a] === "{" || r[a] === "[")
      t.push(r[a] === "{" ? "}" : "]");
    else if (r[a] === t[t.length - 1])
      t.pop();
    else if (!t.length && r[a] === ",") {
      let l = r.substring(o, a).trim();
      l && e.push(l), o = a + 1;
    }
  let s = r.substring(o).trim();
  return s && e.push(s), e;
}
n(ba, "splitByComma");

// src/preview-api/modules/store/decorators.ts
function cn(r, e, t) {
  let o = t(r);
  return (s) => e(o, s);
}
n(cn, "decorateStory");
function pn({
  componentId: r,
  title: e,
  kind: t,
  id: o,
  name: s,
  story: a,
  parameters: l,
  initialArgs: c,
  argTypes: i,
  ...p
} = {}) {
  return p;
}
n(pn, "sanitizeStoryContextUpdate");
function mt(r, e) {
  let t = {}, o = /* @__PURE__ */ n((a) => (l) => {
    if (!t.value)
      throw new Error("Decorated function called without init");
    return t.value = {
      ...t.value,
      ...pn(l)
    }, a(t.value);
  }, "bindWithContext"), s = e.reduce(
    (a, l) => cn(a, l, o),
    r
  );
  return (a) => (t.value = a, s(a));
}
n(mt, "defaultDecorateStory");

// src/preview-api/modules/store/parameters.ts
var $ = /* @__PURE__ */ n((...r) => {
  let e = {}, t = r.filter(Boolean), o = t.reduce((s, a) => (Object.entries(a).forEach(([l, c]) => {
    let i = s[l];
    Array.isArray(c) || typeof i > "u" ? s[l] = c : W(c) && W(i) ? e[l] = !0 : typeof c < "u" && (s[l] = c);
  }), s), {});
  return Object.keys(e).forEach((s) => {
    let a = t.filter(Boolean).map((l) => l[s]).filter((l) => typeof l < "u");
    a.every((l) => W(l)) ? o[s] = $(...a) : o[s] = a[a.length - 1];
  }), o;
}, "combineParameters");

// src/preview-api/modules/store/csf/prepareStory.ts
function er(r, e, t) {
  let { moduleExport: o, id: s, name: a } = r || {}, l = Ea(
    r,
    e,
    t
  ), c = /* @__PURE__ */ n(async (w) => {
    let I = {};
    for (let M of [
      ..."__STORYBOOK_TEST_LOADERS__" in R && Array.isArray(R.__STORYBOOK_TEST_LOADERS__) ? [R.__STORYBOOK_TEST_LOADERS__] : [],
      N(t.loaders),
      N(e.loaders),
      N(r.loaders)
    ]) {
      if (w.abortSignal.aborted)
        return I;
      let U = await Promise.all(M.map((z) => z(w)));
      Object.assign(I, ...U);
    }
    return I;
  }, "applyLoaders"), i = /* @__PURE__ */ n(async (w) => {
    let I = new Array();
    for (let M of [
      ...N(t.beforeEach),
      ...N(e.beforeEach),
      ...N(r.beforeEach)
    ]) {
      if (w.abortSignal.aborted)
        return I;
      let U = await M(w);
      U && I.push(U);
    }
    return I;
  }, "applyBeforeEach"), p = /* @__PURE__ */ n(async (w) => {
    let I = [
      ...N(t.experimental_afterEach),
      ...N(e.experimental_afterEach),
      ...N(r.experimental_afterEach)
    ].reverse();
    for (let M of I) {
      if (w.abortSignal.aborted)
        return;
      await M(w);
    }
  }, "applyAfterEach"), u = /* @__PURE__ */ n((w) => w.originalStoryFn(w.args, w), "undecoratedStoryFn"), { applyDecorators: d = mt, runStep: h } = t,
  S = [
    ...N(r?.decorators),
    ...N(e?.decorators),
    ...N(t?.decorators)
  ], m = r?.userStoryFn || r?.render || e.render || t.render, T = st(d)(u, S), y = /* @__PURE__ */ n((w) => T(w), "unboundStoryFn"), x = r?.
  play ?? e?.play, A = Ta(x);
  if (!m && !A)
    throw new wr({ id: s });
  let g = /* @__PURE__ */ n((w) => async () => (await w.renderToCanvas(), w.canvas), "defaultMount"), b = r.mount ?? e.mount ?? t.mount ?? g,
  _ = t.testingLibraryRender;
  return {
    storyGlobals: {},
    ...l,
    moduleExport: o,
    id: s,
    name: a,
    story: a,
    originalStoryFn: m,
    undecoratedStoryFn: u,
    unboundStoryFn: y,
    applyLoaders: c,
    applyBeforeEach: i,
    applyAfterEach: p,
    playFunction: x,
    runStep: h,
    mount: b,
    testingLibraryRender: _,
    renderToCanvas: t.renderToCanvas,
    usesMount: A
  };
}
n(er, "prepareStory");
function ht(r, e, t) {
  return {
    ...Ea(void 0, r, e),
    moduleExport: t
  };
}
n(ht, "prepareMeta");
function Ea(r, e, t) {
  let o = ["dev", "test"], s = R.DOCS_OPTIONS?.autodocs === !0 ? ["autodocs"] : [], a = ha(
    ...o,
    ...s,
    ...t.tags ?? [],
    ...e.tags ?? [],
    ...r?.tags ?? []
  ), l = $(
    t.parameters,
    e.parameters,
    r?.parameters
  ), { argTypesEnhancers: c = [], argsEnhancers: i = [] } = t, p = $(
    t.argTypes,
    e.argTypes,
    r?.argTypes
  );
  if (r) {
    let x = r?.userStoryFn || r?.render || e.render || t.render;
    l.__isArgsStory = x && x.length > 0;
  }
  let u = {
    ...t.args,
    ...e.args,
    ...r?.args
  }, d = {
    ...e.globals,
    ...r?.globals
  }, h = {
    componentId: e.id,
    title: e.title,
    kind: e.title,
    // Back compat
    id: r?.id || e.id,
    // if there's no story name, we create a fake one since enhancers expect a name
    name: r?.name || "__meta",
    story: r?.name || "__meta",
    // Back compat
    component: e.component,
    subcomponents: e.subcomponents,
    tags: a,
    parameters: l,
    initialArgs: u,
    argTypes: p,
    storyGlobals: d
  };
  h.argTypes = c.reduce(
    (x, A) => A({ ...h, argTypes: x }),
    h.argTypes
  );
  let S = { ...u };
  h.initialArgs = i.reduce(
    (x, A) => ({
      ...x,
      ...A({
        ...h,
        initialArgs: x
      })
    }),
    S
  );
  let { name: m, story: T, ...y } = h;
  return y;
}
n(Ea, "preparePartialAnnotations");
function gt(r) {
  let { args: e } = r, t = {
    ...r,
    allArgs: void 0,
    argsByTarget: void 0
  };
  if (R.FEATURES?.argTypeTargetsV7) {
    let a = aa(r);
    t = {
      ...r,
      allArgs: r.args,
      argsByTarget: a,
      args: a[on] || {}
    };
  }
  let o = Object.entries(t.args).reduce((a, [l, c]) => {
    if (!t.argTypes[l]?.mapping)
      return a[l] = c, a;
    let i = /* @__PURE__ */ n((p) => {
      let u = t.argTypes[l].mapping;
      return u && p in u ? u[p] : p;
    }, "mappingFn");
    return a[l] = Array.isArray(c) ? c.map(i) : i(c), a;
  }, {}), s = Object.entries(o).reduce((a, [l, c]) => {
    let i = t.argTypes[l] || {};
    return fa(i, o, t.globals) && (a[l] = c), a;
  }, {});
  return { ...t, unmappedArgs: e, args: s };
}
n(gt, "prepareContext");

// src/preview-api/modules/store/inferArgTypes.ts
var dn = /* @__PURE__ */ n((r, e, t) => {
  let o = typeof r;
  switch (o) {
    case "boolean":
    case "string":
    case "number":
    case "function":
    case "symbol":
      return { name: o };
    default:
      break;
  }
  return r ? t.has(r) ? (O.warn(P`
        We've detected a cycle in arg '${e}'. Args should be JSON-serializable.

        Consider using the mapping feature or fully custom args:
        - Mapping: https://storybook.js.org/docs/writing-stories/args#mapping-to-complex-arg-values
        - Custom args: https://storybook.js.org/docs/essentials/controls#fully-custom-args
      `), { name: "other", value: "cyclic object" }) : (t.add(r), Array.isArray(r) ? { name: "array", value: r.length > 0 ? dn(r[0], e, new Set(
  t)) : { name: "other", value: "unknown" } } : { name: "object", value: ee(r, (a) => dn(a, e, new Set(t))) }) : { name: "object", value: {} };
}, "inferType"), un = /* @__PURE__ */ n((r) => {
  let { id: e, argTypes: t = {}, initialArgs: o = {} } = r, s = ee(o, (l, c) => ({
    name: c,
    type: dn(l, `${e}.${c}`, /* @__PURE__ */ new Set())
  })), a = ee(t, (l, c) => ({
    name: c
  }));
  return $(s, a, t);
}, "inferArgTypes");
un.secondPass = !0;

// src/preview-api/modules/store/filterArgTypes.ts
var Ra = /* @__PURE__ */ n((r, e) => Array.isArray(e) ? e.includes(r) : r.match(e), "matches"), Cr = /* @__PURE__ */ n((r, e, t) => !e && !t ?
r : r && Jo(r, (o, s) => {
  let a = o.name || s.toString();
  return !!(!e || Ra(a, e)) && (!t || !Ra(a, t));
}), "filterArgTypes");

// src/preview-api/modules/store/inferControls.ts
var $d = /* @__PURE__ */ n((r, e, t) => {
  let { type: o, options: s } = r;
  if (o) {
    if (t.color && t.color.test(e)) {
      let a = o.name;
      if (a === "string")
        return { control: { type: "color" } };
      a !== "enum" && O.warn(
        `Addon controls: Control of type color only supports string, received "${a}" instead`
      );
    }
    if (t.date && t.date.test(e))
      return { control: { type: "date" } };
    switch (o.name) {
      case "array":
        return { control: { type: "object" } };
      case "boolean":
        return { control: { type: "boolean" } };
      case "string":
        return { control: { type: "text" } };
      case "number":
        return { control: { type: "number" } };
      case "enum": {
        let { value: a } = o;
        return { control: { type: a?.length <= 5 ? "radio" : "select" }, options: a };
      }
      case "function":
      case "symbol":
        return null;
      default:
        return { control: { type: s ? "select" : "object" } };
    }
  }
}, "inferControl"), rr = /* @__PURE__ */ n((r) => {
  let {
    argTypes: e,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    parameters: { __isArgsStory: t, controls: { include: o = null, exclude: s = null, matchers: a = {} } = {} }
  } = r;
  if (!t)
    return e;
  let l = Cr(e, o, s), c = ee(l, (i, p) => i?.type && $d(i, p.toString(), a));
  return $(c, l);
}, "inferControls");
rr.secondPass = !0;

// src/preview-api/modules/store/csf/normalizeProjectAnnotations.ts
function Or({
  argTypes: r,
  globalTypes: e,
  argTypesEnhancers: t,
  decorators: o,
  loaders: s,
  beforeEach: a,
  experimental_afterEach: l,
  globals: c,
  initialGlobals: i,
  ...p
}) {
  return c && Object.keys(c).length > 0 && oe(P`
      The preview.js 'globals' field is deprecated and will be removed in Storybook 9.0.
      Please use 'initialGlobals' instead. Learn more:

      https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#previewjs-globals-renamed-to-initialglobals
    `), {
    ...r && { argTypes: Ce(r) },
    ...e && { globalTypes: Ce(e) },
    decorators: N(o),
    loaders: N(s),
    beforeEach: N(a),
    experimental_afterEach: N(l),
    argTypesEnhancers: [
      ...t || [],
      un,
      // inferControls technically should only run if the user is using the controls addon,
      // and so should be added by a preset there. However, as it seems some code relies on controls
      // annotations (in particular the angular implementation's `cleanArgsDecorator`), for backwards
      // compatibility reasons, we will leave this in the store until 7.0
      rr
    ],
    initialGlobals: $(i, c),
    ...p
  };
}
n(Or, "normalizeProjectAnnotations");

// src/preview-api/modules/store/csf/beforeAll.ts
var xa = /* @__PURE__ */ n((r) => async () => {
  let e = [];
  for (let t of r) {
    let o = await t();
    o && e.unshift(o);
  }
  return async () => {
    for (let t of e)
      await t();
  };
}, "composeBeforeAllHooks");

// src/preview-api/modules/store/csf/stepRunners.ts
function St(r) {
  return async (e, t, o) => {
    await r.reduceRight(
      (a, l) => async () => l(e, a, o),
      async () => t(o)
    )();
  };
}
n(St, "composeStepRunners");

// src/preview-api/modules/store/csf/composeConfigs.ts
function Fr(r, e) {
  return r.map((t) => t.default?.[e] ?? t[e]).filter(Boolean);
}
n(Fr, "getField");
function ge(r, e, t = {}) {
  return Fr(r, e).reduce((o, s) => {
    let a = N(s);
    return t.reverseFileOrder ? [...a, ...o] : [...o, ...a];
  }, []);
}
n(ge, "getArrayField");
function Ir(r, e) {
  return Object.assign({}, ...Fr(r, e));
}
n(Ir, "getObjectField");
function tr(r, e) {
  return Fr(r, e).pop();
}
n(tr, "getSingletonField");
function Oe(r) {
  let e = ge(r, "argTypesEnhancers"), t = Fr(r, "runStep"), o = ge(r, "beforeAll");
  return {
    parameters: $(...Fr(r, "parameters")),
    decorators: ge(r, "decorators", {
      reverseFileOrder: !(R.FEATURES?.legacyDecoratorFileOrder ?? !1)
    }),
    args: Ir(r, "args"),
    argsEnhancers: ge(r, "argsEnhancers"),
    argTypes: Ir(r, "argTypes"),
    argTypesEnhancers: [
      ...e.filter((s) => !s.secondPass),
      ...e.filter((s) => s.secondPass)
    ],
    globals: Ir(r, "globals"),
    initialGlobals: Ir(r, "initialGlobals"),
    globalTypes: Ir(r, "globalTypes"),
    loaders: ge(r, "loaders"),
    beforeAll: xa(o),
    beforeEach: ge(r, "beforeEach"),
    experimental_afterEach: ge(r, "experimental_afterEach"),
    render: tr(r, "render"),
    renderToCanvas: tr(r, "renderToCanvas"),
    renderToDOM: tr(r, "renderToDOM"),
    // deprecated
    applyDecorators: tr(r, "applyDecorators"),
    runStep: St(t),
    tags: ge(r, "tags"),
    mount: tr(r, "mount"),
    testingLibraryRender: tr(r, "testingLibraryRender")
  };
}
n(Oe, "composeConfigs");

// src/preview-api/modules/store/reporter-api.ts
var fn = class fn {
  constructor() {
    this.reports = [];
  }
  async addReport(e) {
    this.reports.push(e);
  }
};
n(fn, "ReporterAPI");
var Se = fn;

// src/preview-api/modules/store/csf/portable-stories.ts
function Aa(r) {
  globalThis.defaultProjectAnnotations = r;
}
n(Aa, "setDefaultProjectAnnotations");
var Yd = "ComposedStory", Kd = "Unnamed Story";
function Xd(r) {
  return r ? Oe([r]) : {};
}
n(Xd, "extractAnnotation");
function _a(r) {
  let e = Array.isArray(r) ? r : [r];
  return globalThis.globalProjectAnnotations = Oe(e.map(Xd)), Oe([
    globalThis.defaultProjectAnnotations ?? {},
    globalThis.globalProjectAnnotations ?? {}
  ]);
}
n(_a, "setProjectAnnotations");
var be = [];
function yn(r, e, t, o, s) {
  if (r === void 0)
    throw new Error("Expected a story but received undefined.");
  e.title = e.title ?? Yd;
  let a = yt(e), l = s || r.storyName || r.story?.name || r.name || Kd, c = Ze(
    l,
    r,
    a
  ), i = Or(
    Oe([
      o && Object.keys(o).length > 0 ? o : globalThis.defaultProjectAnnotations ?? {},
      globalThis.globalProjectAnnotations ?? {},
      t ?? {}
    ])
  ), p = er(
    c,
    a,
    i
  ), d = {
    // TODO: remove loading from globalTypes in 9.0
    ...pt(i.globalTypes),
    ...i.initialGlobals,
    ...p.storyGlobals
  }, h = new Se(), S = /* @__PURE__ */ n(() => {
    let g = gt({
      hooks: new he(),
      globals: d,
      args: { ...p.initialArgs },
      viewMode: "story",
      reporting: h,
      loaded: {},
      abortSignal: new AbortController().signal,
      step: /* @__PURE__ */ n((b, _) => p.runStep(b, _, g), "step"),
      canvasElement: null,
      canvas: {},
      globalTypes: i.globalTypes,
      ...p,
      context: null,
      mount: null
    });
    return g.context = g, p.renderToCanvas && (g.renderToCanvas = async () => {
      let b = await p.renderToCanvas?.(
        {
          componentId: p.componentId,
          title: p.title,
          id: p.id,
          name: p.name,
          tags: p.tags,
          showMain: /* @__PURE__ */ n(() => {
          }, "showMain"),
          showError: /* @__PURE__ */ n((_) => {
            throw new Error(`${_.title}
${_.description}`);
          }, "showError"),
          showException: /* @__PURE__ */ n((_) => {
            throw _;
          }, "showException"),
          forceRemount: !0,
          storyContext: g,
          storyFn: /* @__PURE__ */ n(() => p.unboundStoryFn(g), "storyFn"),
          unboundStoryFn: p.unboundStoryFn
        },
        g.canvasElement
      );
      b && be.push(b);
    }), g.mount = p.mount(g), g;
  }, "initializeContext"), m, T = /* @__PURE__ */ n(async (g) => {
    let b = S();
    return b.canvasElement ??= globalThis?.document?.body, m && (b.loaded = m.loaded), Object.assign(b, g), p.playFunction(b);
  }, "play"), y = /* @__PURE__ */ n((g) => {
    let b = S();
    return Object.assign(b, g), Qd(p, b);
  }, "run"), x = p.playFunction ? T : void 0;
  return Object.assign(
    /* @__PURE__ */ n(function(b) {
      let _ = S();
      return m && (_.loaded = m.loaded), _.args = {
        ..._.initialArgs,
        ...b
      }, p.unboundStoryFn(_);
    }, "storyFn"),
    {
      id: p.id,
      storyName: l,
      load: /* @__PURE__ */ n(async () => {
        for (let b of [...be].reverse())
          await b();
        be.length = 0;
        let g = S();
        g.loaded = await p.applyLoaders(g), be.push(...(await p.applyBeforeEach(g)).filter(Boolean)), m = g;
      }, "load"),
      globals: d,
      args: p.initialArgs,
      parameters: p.parameters,
      argTypes: p.argTypes,
      play: x,
      run: y,
      reporting: h,
      tags: p.tags
    }
  );
}
n(yn, "composeStory");
var Jd = /* @__PURE__ */ n((r, e, t, o) => yn(r, e, t, {}, o), "defaultComposeStory");
function wa(r, e, t = Jd) {
  let { default: o, __esModule: s, __namedExportsOrder: a, ...l } = r;
  return Object.entries(l).reduce((i, [p, u]) => ft(p, o) ? Object.assign(i, {
    [p]: t(
      u,
      o,
      e,
      p
    )
  }) : i, {});
}
n(wa, "composeStories");
function va(r) {
  return r.extend({
    mount: /* @__PURE__ */ n(async ({ mount: e, page: t }, o) => {
      await o(async (s, ...a) => {
        if (!("__pw_type" in s) || "__pw_type" in s && s.__pw_type !== "jsx")
          throw new Error(P`
              Portable stories in Playwright CT only work when referencing JSX elements.
              Please use JSX format for your components such as:

              instead of:
              await mount(MyComponent, { props: { foo: 'bar' } })

              do:
              await mount(<MyComponent foo="bar"/>)

              More info: https://storybook.js.org/docs/api/portable-stories-playwright
            `);
        await t.evaluate(async (c) => {
          let i = await globalThis.__pwUnwrapObject?.(c);
          return ("__pw_type" in i ? i.type : i)?.load?.();
        }, s);
        let l = await e(s, ...a);
        return await t.evaluate(async (c) => {
          let i = await globalThis.__pwUnwrapObject?.(c), p = "__pw_type" in i ? i.type : i, u = document.querySelector("#root");
          return p?.play?.({ canvasElement: u });
        }, s), l;
      });
    }, "mount")
  });
}
n(va, "createPlaywrightTest");
async function Qd(r, e) {
  for (let s of [...be].reverse())
    await s();
  if (be.length = 0, !e.canvasElement) {
    let s = document.createElement("div");
    globalThis?.document?.body?.appendChild(s), e.canvasElement = s, be.push(() => {
      globalThis?.document?.body?.contains(s) && globalThis?.document?.body?.removeChild(s);
    });
  }
  if (e.loaded = await r.applyLoaders(e), e.abortSignal.aborted)
    return;
  be.push(...(await r.applyBeforeEach(e)).filter(Boolean));
  let t = r.playFunction, o = r.usesMount;
  o || await e.mount(), !e.abortSignal.aborted && (t && (o || (e.mount = async () => {
    throw new ve({ playFunction: t.toString() });
  }), await t(e)), await r.applyAfterEach(e));
}
n(Qd, "runStory");

// src/preview-api/modules/store/StoryStore.ts
function Pa(r, e) {
  return Ko(Xo(r, e), (t) => t === void 0);
}
n(Pa, "picky");
var Ca = 1e3, Zd = 1e4, mn = class mn {
  constructor(e, t, o) {
    this.importFn = t;
    // TODO: Remove in 9.0
    // NOTE: this is legacy `stories.json` data for the `extract` script.
    // It is used to allow v7 Storybooks to be composed in v6 Storybooks, which expect a
    // `stories.json` file with legacy fields (`kind` etc).
    this.getStoriesJsonData = /* @__PURE__ */ n(() => {
      let e = this.getSetStoriesPayload(), t = ["fileName", "docsOnly", "framework", "__id", "__isArgsStory"];
      return {
        v: 3,
        stories: ee(e.stories, (s) => {
          let { importPath: a } = this.storyIndex.entries[s.id];
          return {
            ...Pa(s, ["id", "name", "title"]),
            importPath: a,
            // These 3 fields were going to be dropped in v7, but instead we will keep them for the
            // 7.x cycle so that v7 Storybooks can be composed successfully in v6 Storybook.
            // In v8 we will (likely) completely drop support for `extract` and `getStoriesJsonData`
            kind: s.title,
            story: s.name,
            parameters: {
              ...Pa(s.parameters, t),
              fileName: a
            }
          };
        })
      };
    }, "getStoriesJsonData");
    this.storyIndex = new ut(e), this.projectAnnotations = Or(o);
    let { initialGlobals: s, globalTypes: a } = this.projectAnnotations;
    this.args = new ct(), this.userGlobals = new dt({ globals: s, globalTypes: a }), this.hooks = {}, this.cleanupCallbacks = {}, this.processCSFFileWithCache =
    (0, bt.default)(Ca)(Sa), this.prepareMetaWithCache = (0, bt.default)(Ca)(ht), this.prepareStoryWithCache = (0, bt.default)(Zd)(er);
  }
  setProjectAnnotations(e) {
    this.projectAnnotations = Or(e);
    let { initialGlobals: t, globalTypes: o } = e;
    this.userGlobals.set({ globals: t, globalTypes: o });
  }
  // This means that one of the CSF files has changed.
  // If the `importFn` has changed, we will invalidate both caches.
  // If the `storyIndex` data has changed, we may or may not invalidate the caches, depending
  // on whether we've loaded the relevant files yet.
  async onStoriesChanged({
    importFn: e,
    storyIndex: t
  }) {
    e && (this.importFn = e), t && (this.storyIndex.entries = t.entries), this.cachedCSFFiles && await this.cacheAllCSFFiles();
  }
  // Get an entry from the index, waiting on initialization if necessary
  async storyIdToEntry(e) {
    return this.storyIndex.storyIdToEntry(e);
  }
  // To load a single CSF file to service a story we need to look up the importPath in the index
  async loadCSFFileByStoryId(e) {
    let { importPath: t, title: o } = this.storyIndex.storyIdToEntry(e), s = await this.importFn(t);
    return this.processCSFFileWithCache(s, t, o);
  }
  async loadAllCSFFiles() {
    let e = {};
    return Object.entries(this.storyIndex.entries).forEach(([o, { importPath: s }]) => {
      e[s] = o;
    }), (await Promise.all(
      Object.entries(e).map(async ([o, s]) => ({
        importPath: o,
        csfFile: await this.loadCSFFileByStoryId(s)
      }))
    )).reduce(
      (o, { importPath: s, csfFile: a }) => (o[s] = a, o),
      {}
    );
  }
  async cacheAllCSFFiles() {
    this.cachedCSFFiles = await this.loadAllCSFFiles();
  }
  preparedMetaFromCSFFile({ csfFile: e }) {
    let t = e.meta;
    return this.prepareMetaWithCache(
      t,
      this.projectAnnotations,
      e.moduleExports.default
    );
  }
  // Load the CSF file for a story and prepare the story from it and the project annotations.
  async loadStory({ storyId: e }) {
    let t = await this.loadCSFFileByStoryId(e);
    return this.storyFromCSFFile({ storyId: e, csfFile: t });
  }
  // This function is synchronous for convenience -- often times if you have a CSF file already
  // it is easier not to have to await `loadStory`.
  storyFromCSFFile({
    storyId: e,
    csfFile: t
  }) {
    let o = t.stories[e];
    if (!o)
      throw new Ar({ storyId: e });
    let s = t.meta, a = this.prepareStoryWithCache(
      o,
      s,
      this.projectAnnotations
    );
    return this.args.setInitial(a), this.hooks[a.id] = this.hooks[a.id] || new he(), a;
  }
  // If we have a CSF file we can get all the stories from it synchronously
  componentStoriesFromCSFFile({
    csfFile: e
  }) {
    return Object.keys(this.storyIndex.entries).filter((t) => !!e.stories[t]).map((t) => this.storyFromCSFFile({ storyId: t, csfFile: e }));
  }
  async loadEntry(e) {
    let t = await this.storyIdToEntry(e), o = t.type === "docs" ? t.storiesImports : [], [s, ...a] = await Promise.all([
      this.importFn(t.importPath),
      ...o.map((l) => {
        let c = this.storyIndex.importPathToEntry(l);
        return this.loadCSFFileByStoryId(c.id);
      })
    ]);
    return { entryExports: s, csfFiles: a };
  }
  // A prepared story does not include args, globals or hooks. These are stored in the story store
  // and updated separtely to the (immutable) story.
  getStoryContext(e, { forceInitialArgs: t = !1 } = {}) {
    let o = this.userGlobals.get(), { initialGlobals: s } = this.userGlobals, a = new Se();
    return gt({
      ...e,
      args: t ? e.initialArgs : this.args.get(e.id),
      initialGlobals: s,
      globalTypes: this.projectAnnotations.globalTypes,
      userGlobals: o,
      reporting: a,
      globals: {
        ...o,
        ...e.storyGlobals
      },
      hooks: this.hooks[e.id]
    });
  }
  addCleanupCallbacks(e, t) {
    this.cleanupCallbacks[e.id] = t;
  }
  async cleanupStory(e) {
    this.hooks[e.id].clean();
    let t = this.cleanupCallbacks[e.id];
    if (t)
      for (let o of [...t].reverse())
        await o();
    delete this.cleanupCallbacks[e.id];
  }
  extract(e = { includeDocsOnly: !1 }) {
    let { cachedCSFFiles: t } = this;
    if (!t)
      throw new Sr();
    return Object.entries(this.storyIndex.entries).reduce(
      (o, [s, { type: a, importPath: l }]) => {
        if (a === "docs")
          return o;
        let c = t[l], i = this.storyFromCSFFile({ storyId: s, csfFile: c });
        return !e.includeDocsOnly && i.parameters.docsOnly || (o[s] = Object.entries(i).reduce(
          (p, [u, d]) => u === "moduleExport" || typeof d == "function" ? p : Array.isArray(d) ? Object.assign(p, { [u]: d.slice().sort() }) :
          Object.assign(p, { [u]: d }),
          {
            //
            args: i.initialArgs,
            globals: {
              ...this.userGlobals.initialGlobals,
              ...this.userGlobals.globals,
              ...i.storyGlobals
            }
          }
        )), o;
      },
      {}
    );
  }
  // TODO: Remove in 9.0
  getSetStoriesPayload() {
    let e = this.extract({ includeDocsOnly: !0 }), t = Object.values(e).reduce(
      (o, { title: s }) => (o[s] = {}, o),
      {}
    );
    return {
      v: 2,
      globals: this.userGlobals.get(),
      globalParameters: {},
      kindParameters: t,
      stories: e
    };
  }
  raw() {
    return oe(
      "StoryStore.raw() is deprecated and will be removed in 9.0, please use extract() instead"
    ), Object.values(this.extract()).map(({ id: e }) => this.fromId(e)).filter(Boolean);
  }
  fromId(e) {
    if (oe(
      "StoryStore.fromId() is deprecated and will be removed in 9.0, please use loadStory() instead"
    ), !this.cachedCSFFiles)
      throw new Error("Cannot call fromId/raw() unless you call cacheAllCSFFiles() first.");
    let t;
    try {
      ({ importPath: t } = this.storyIndex.storyIdToEntry(e));
    } catch {
      return null;
    }
    let o = this.cachedCSFFiles[t], s = this.storyFromCSFFile({ storyId: e, csfFile: o });
    return {
      ...s,
      storyFn: /* @__PURE__ */ n((a) => {
        let l = {
          ...this.getStoryContext(s),
          abortSignal: new AbortController().signal,
          canvasElement: null,
          loaded: {},
          step: /* @__PURE__ */ n((c, i) => s.runStep(c, i, l), "step"),
          context: null,
          mount: null,
          canvas: {},
          viewMode: "story"
        };
        return s.unboundStoryFn({ ...l, ...a });
      }, "storyFn")
    };
  }
};
n(mn, "StoryStore");
var Ie = mn;

// ../node_modules/slash/index.js
function hn(r) {
  return r.startsWith("\\\\?\\") ? r : r.replace(/\\/g, "/");
}
n(hn, "slash");

// src/preview-api/modules/store/autoTitle.ts
var eu = /* @__PURE__ */ n((r) => {
  if (r.length === 0)
    return r;
  let e = r[r.length - 1], t = e?.replace(/(?:[.](?:story|stories))?([.][^.]+)$/i, "");
  if (r.length === 1)
    return [t];
  let o = r[r.length - 2];
  return t && o && t.toLowerCase() === o.toLowerCase() ? [...r.slice(0, -2), t] : t && (/^(story|stories)([.][^.]+)$/i.test(e) || /^index$/i.
  test(t)) ? r.slice(0, -1) : [...r.slice(0, -1), t];
}, "sanitize");
function Oa(r) {
  return r.flatMap((e) => e.split("/")).filter(Boolean).join("/");
}
n(Oa, "pathJoin");
var gn = /* @__PURE__ */ n((r, e, t) => {
  let { directory: o, importPathMatcher: s, titlePrefix: a = "" } = e || {};
  typeof r == "number" && L.warn(P`
      CSF Auto-title received a numeric fileName. This typically happens when
      webpack is mis-configured in production mode. To force webpack to produce
      filenames, set optimization.moduleIds = "named" in your webpack config.
    `);
  let l = hn(String(r));
  if (s.exec(l)) {
    if (!t) {
      let c = l.replace(o, ""), i = Oa([a, c]).split("/");
      return i = eu(i), i.join("/");
    }
    return a ? Oa([a, t]) : t;
  }
}, "userOrAutoTitleFromSpecifier"), Ia = /* @__PURE__ */ n((r, e, t) => {
  for (let o = 0; o < e.length; o += 1) {
    let s = gn(r, e[o], t);
    if (s)
      return s;
  }
  return t || void 0;
}, "userOrAutoTitle");

// src/preview-api/modules/store/storySort.ts
var Fa = /\s*\/\s*/, Da = /* @__PURE__ */ n((r = {}) => (e, t) => {
  if (e.title === t.title && !r.includeNames)
    return 0;
  let o = r.method || "configure", s = r.order || [], a = e.title.trim().split(Fa), l = t.title.trim().split(Fa);
  r.includeNames && (a.push(e.name), l.push(t.name));
  let c = 0;
  for (; a[c] || l[c]; ) {
    if (!a[c])
      return -1;
    if (!l[c])
      return 1;
    let i = a[c], p = l[c];
    if (i !== p) {
      let d = s.indexOf(i), h = s.indexOf(p), S = s.indexOf("*");
      return d !== -1 || h !== -1 ? (d === -1 && (S !== -1 ? d = S : d = s.length), h === -1 && (S !== -1 ? h = S : h = s.length), d - h) : o ===
      "configure" ? 0 : i.localeCompare(p, r.locales ? r.locales : void 0, {
        numeric: !0,
        sensitivity: "accent"
      });
    }
    let u = s.indexOf(i);
    u === -1 && (u = s.indexOf("*")), s = u !== -1 && Array.isArray(s[u + 1]) ? s[u + 1] : [], c += 1;
  }
  return 0;
}, "storySort");

// src/preview-api/modules/store/sortStories.ts
var ru = /* @__PURE__ */ n((r, e, t) => {
  if (e) {
    let o;
    typeof e == "function" ? o = e : o = Da(e), r.sort(o);
  } else
    r.sort(
      (o, s) => t.indexOf(o.importPath) - t.indexOf(s.importPath)
    );
  return r;
}, "sortStoriesCommon"), Na = /* @__PURE__ */ n((r, e, t) => {
  try {
    return ru(r, e, t);
  } catch (o) {
    throw new Error(P`
    Error sorting stories with sort parameter ${e}:

    > ${o.message}
    
    Are you using a V6-style sort function in V7 mode?

    More info: https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#v7-style-story-sort
  `);
  }
}, "sortStoriesV7");

// src/preview-api/modules/preview-web/render/Render.ts
var Te = new Error("prepareAborted");

// src/preview-api/modules/preview-web/render/StoryRender.ts
var { AbortController: ka } = globalThis;
function La(r) {
  try {
    let { name: e = "Error", message: t = String(r), stack: o } = r;
    return { name: e, message: t, stack: o };
  } catch {
    return { name: "Error", message: String(r) };
  }
}
n(La, "serializeError");
var Sn = class Sn {
  constructor(e, t, o, s, a, l, c = { autoplay: !0, forceInitialArgs: !1 }, i) {
    this.channel = e;
    this.store = t;
    this.renderToScreen = o;
    this.callbacks = s;
    this.id = a;
    this.viewMode = l;
    this.renderOptions = c;
    this.type = "story";
    this.notYetRendered = !0;
    this.rerenderEnqueued = !1;
    this.disableKeyListeners = !1;
    this.teardownRender = /* @__PURE__ */ n(() => {
    }, "teardownRender");
    this.torndown = !1;
    this.abortController = new ka(), i && (this.story = i, this.phase = "preparing");
  }
  async runPhase(e, t, o) {
    this.phase = t, this.channel.emit(we, { newPhase: this.phase, storyId: this.id }), o && (await o(), this.checkIfAborted(e));
  }
  checkIfAborted(e) {
    return e.aborted ? (this.phase = "aborted", this.channel.emit(we, { newPhase: this.phase, storyId: this.id }), !0) : !1;
  }
  async prepare() {
    if (await this.runPhase(this.abortController.signal, "preparing", async () => {
      this.story = await this.store.loadStory({ storyId: this.id });
    }), this.abortController.signal.aborted)
      throw await this.store.cleanupStory(this.story), Te;
  }
  // The two story "renders" are equal and have both loaded the same story
  isEqual(e) {
    return !!(this.id === e.id && this.story && this.story === e.story);
  }
  isPreparing() {
    return ["preparing"].includes(this.phase);
  }
  isPending() {
    return ["loading", "beforeEach", "rendering", "playing", "afterEach"].includes(
      this.phase
    );
  }
  async renderToElement(e) {
    return this.canvasElement = e, this.render({ initial: !0, forceRemount: !0 });
  }
  storyContext() {
    if (!this.story)
      throw new Error("Cannot call storyContext before preparing");
    let { forceInitialArgs: e } = this.renderOptions;
    return this.store.getStoryContext(this.story, { forceInitialArgs: e });
  }
  async render({
    initial: e = !1,
    forceRemount: t = !1
  } = {}) {
    let { canvasElement: o } = this;
    if (!this.story)
      throw new Error("cannot render when not prepared");
    let s = this.story;
    if (!o)
      throw new Error("cannot render when canvasElement is unset");
    let {
      id: a,
      componentId: l,
      title: c,
      name: i,
      tags: p,
      applyLoaders: u,
      applyBeforeEach: d,
      applyAfterEach: h,
      unboundStoryFn: S,
      playFunction: m,
      runStep: T
    } = s;
    t && !e && (this.cancelRender(), this.abortController = new ka());
    let y = this.abortController.signal, x = !1, A = s.usesMount;
    try {
      let g = {
        ...this.storyContext(),
        viewMode: this.viewMode,
        abortSignal: y,
        canvasElement: o,
        loaded: {},
        step: /* @__PURE__ */ n((v, F) => T(v, F, g), "step"),
        context: null,
        canvas: {},
        renderToCanvas: /* @__PURE__ */ n(async () => {
          let v = await this.renderToScreen(b, o);
          this.teardownRender = v || (() => {
          }), x = !0;
        }, "renderToCanvas"),
        // The story provides (set in a renderer) a mount function that is a higher order function
        // (context) => (...args) => Canvas
        //
        // Before assigning it to the context, we resolve the context dependency,
        // so that a user can just call it as await mount(...args) in their play function.
        mount: /* @__PURE__ */ n(async (...v) => {
          this.callbacks.showStoryDuringRender?.();
          let F = null;
          return await this.runPhase(y, "rendering", async () => {
            F = await s.mount(g)(...v);
          }), A && await this.runPhase(y, "playing"), F;
        }, "mount")
      };
      g.context = g;
      let b = {
        componentId: l,
        title: c,
        kind: c,
        id: a,
        name: i,
        story: i,
        tags: p,
        ...this.callbacks,
        showError: /* @__PURE__ */ n((v) => (this.phase = "errored", this.callbacks.showError(v)), "showError"),
        showException: /* @__PURE__ */ n((v) => (this.phase = "errored", this.callbacks.showException(v)), "showException"),
        forceRemount: t || this.notYetRendered,
        storyContext: g,
        storyFn: /* @__PURE__ */ n(() => S(g), "storyFn"),
        unboundStoryFn: S
      };
      if (await this.runPhase(y, "loading", async () => {
        g.loaded = await u(g);
      }), y.aborted)
        return;
      let _ = await d(g);
      if (this.store.addCleanupCallbacks(s, _), this.checkIfAborted(y) || (!x && !A && await g.mount(), this.notYetRendered = !1, y.aborted))
        return;
      let w = this.story.parameters?.test?.dangerouslyIgnoreUnhandledErrors === !0, I = /* @__PURE__ */ new Set(), M = /* @__PURE__ */ n((v) => I.
      add("error" in v ? v.error : v.reason), "onError");
      if (this.renderOptions.autoplay && t && m && this.phase !== "errored") {
        window.addEventListener("error", M), window.addEventListener("unhandledrejection", M), this.disableKeyListeners = !0;
        try {
          if (A ? await m(g) : (g.mount = async () => {
            throw new ve({ playFunction: m.toString() });
          }, await this.runPhase(y, "playing", async () => m(g))), !x)
            throw new vr();
          this.checkIfAborted(y), !w && I.size > 0 ? await this.runPhase(y, "errored") : await this.runPhase(y, "played");
        } catch (v) {
          if (this.callbacks.showStoryDuringRender?.(), await this.runPhase(y, "errored", async () => {
            this.channel.emit(qt, La(v));
          }), this.story.parameters.throwPlayFunctionExceptions !== !1)
            throw v;
          console.error(v);
        }
        if (!w && I.size > 0 && this.channel.emit(
          Ut,
          Array.from(I).map(La)
        ), this.disableKeyListeners = !1, window.removeEventListener("unhandledrejection", M), window.removeEventListener("error", M), y.aborted)
          return;
      }
      await this.runPhase(
        y,
        "completed",
        async () => this.channel.emit(Be, a)
      ), this.phase !== "errored" && await this.runPhase(y, "afterEach", async () => {
        await h(g);
      });
      let U = !w && I.size > 0, z = g.reporting.reports.some(
        (v) => v.status === "failed"
      ), te = U || z;
      await this.runPhase(
        y,
        "finished",
        async () => this.channel.emit(Kr, {
          storyId: a,
          status: te ? "error" : "success",
          reporters: g.reporting.reports
        })
      );
    } catch (g) {
      this.phase = "errored", this.callbacks.showException(g), await this.runPhase(
        y,
        "finished",
        async () => this.channel.emit(Kr, {
          storyId: a,
          status: "error",
          reporters: []
        })
      );
    }
    this.rerenderEnqueued && (this.rerenderEnqueued = !1, this.render());
  }
  /**
   * Rerender the story. If the story is currently pending (loading/rendering), the rerender will be
   * enqueued, and will be executed after the current render is completed. Rerendering while playing
   * will not be enqueued, and will be executed immediately, to support rendering args changes while
   * playing.
   */
  async rerender() {
    if (this.isPending() && this.phase !== "playing")
      this.rerenderEnqueued = !0;
    else
      return this.render();
  }
  async remount() {
    return await this.teardown(), this.render({ forceRemount: !0 });
  }
  // If the story is torn down (either a new story is rendered or the docs page removes it)
  // we need to consider the fact that the initial render may not be finished
  // (possibly the loaders or the play function are still running). We use the controller
  // as a method to abort them, ASAP, but this is not foolproof as we cannot control what
  // happens inside the user's code.
  cancelRender() {
    this.abortController?.abort();
  }
  async teardown() {
    this.torndown = !0, this.cancelRender(), this.story && await this.store.cleanupStory(this.story);
    for (let e = 0; e < 3; e += 1) {
      if (!this.isPending()) {
        await this.teardownRender();
        return;
      }
      await new Promise((t) => setTimeout(t, 0));
    }
    window.location.reload(), await new Promise(() => {
    });
  }
};
n(Sn, "StoryRender");
var Fe = Sn;

// src/preview-api/modules/preview-web/Preview.tsx
var { fetch: tu } = R, ou = "./index.json", bn = class bn {
  constructor(e, t, o = Z.getChannel(), s = !0) {
    this.importFn = e;
    this.getProjectAnnotations = t;
    this.channel = o;
    this.storyRenders = [];
    this.storeInitializationPromise = new Promise((a, l) => {
      this.resolveStoreInitializationPromise = a, this.rejectStoreInitializationPromise = l;
    }), s && this.initialize();
  }
  // Create a proxy object for `__STORYBOOK_STORY_STORE__` and `__STORYBOOK_PREVIEW__.storyStore`
  // That proxies through to the store once ready, and errors beforehand. This means we can set
  // `__STORYBOOK_STORY_STORE__ = __STORYBOOK_PREVIEW__.storyStore` without having to wait, and
  // similarly integrators can access the `storyStore` on the preview at any time, although
  // it is considered deprecated and we will no longer allow access in 9.0
  get storyStore() {
    return new Proxy(
      {},
      {
        get: /* @__PURE__ */ n((e, t) => {
          if (this.storyStoreValue)
            return oe("Accessing the Story Store is deprecated and will be removed in 9.0"), this.storyStoreValue[t];
          throw new _r();
        }, "get")
      }
    );
  }
  // INITIALIZATION
  async initialize() {
    this.setupListeners();
    try {
      let e = await this.getProjectAnnotationsOrRenderError();
      await this.runBeforeAllHook(e), await this.initializeWithProjectAnnotations(e);
    } catch (e) {
      this.rejectStoreInitializationPromise(e);
    }
  }
  ready() {
    return this.storeInitializationPromise;
  }
  setupListeners() {
    this.channel.on(Yt, this.onStoryIndexChanged.bind(this)), this.channel.on(lr, this.onUpdateGlobals.bind(this)), this.channel.on(cr, this.
    onUpdateArgs.bind(this)), this.channel.on(ro, this.onRequestArgTypesInfo.bind(this)), this.channel.on(ir, this.onResetArgs.bind(this)), this.
    channel.on(ar, this.onForceReRender.bind(this)), this.channel.on(Mt, this.onForceRemount.bind(this));
  }
  async getProjectAnnotationsOrRenderError() {
    try {
      let e = await this.getProjectAnnotations();
      if (this.renderToCanvas = e.renderToCanvas, !this.renderToCanvas)
        throw new br();
      return e;
    } catch (e) {
      throw this.renderPreviewEntryError("Error reading preview.js:", e), e;
    }
  }
  // If initialization gets as far as project annotations, this function runs.
  async initializeWithProjectAnnotations(e) {
    this.projectAnnotationsBeforeInitialization = e;
    try {
      let t = await this.getStoryIndexFromServer();
      return this.initializeWithStoryIndex(t);
    } catch (t) {
      throw this.renderPreviewEntryError("Error loading story index:", t), t;
    }
  }
  async runBeforeAllHook(e) {
    try {
      await this.beforeAllCleanup?.(), this.beforeAllCleanup = await e.beforeAll?.();
    } catch (t) {
      throw this.renderPreviewEntryError("Error in beforeAll hook:", t), t;
    }
  }
  async getStoryIndexFromServer() {
    let e = await tu(ou);
    if (e.status === 200)
      return e.json();
    throw new Tr({ text: await e.text() });
  }
  // If initialization gets as far as the story index, this function runs.
  initializeWithStoryIndex(e) {
    if (!this.projectAnnotationsBeforeInitialization)
      throw new Error("Cannot call initializeWithStoryIndex until project annotations resolve");
    this.storyStoreValue = new Ie(
      e,
      this.importFn,
      this.projectAnnotationsBeforeInitialization
    ), delete this.projectAnnotationsBeforeInitialization, this.setInitialGlobals(), this.resolveStoreInitializationPromise();
  }
  async setInitialGlobals() {
    this.emitGlobals();
  }
  emitGlobals() {
    if (!this.storyStoreValue)
      throw new G({ methodName: "emitGlobals" });
    let e = {
      globals: this.storyStoreValue.userGlobals.get() || {},
      globalTypes: this.storyStoreValue.projectAnnotations.globalTypes || {}
    };
    this.channel.emit(Ht, e);
  }
  // EVENT HANDLERS
  // This happens when a config file gets reloaded
  async onGetProjectAnnotationsChanged({
    getProjectAnnotations: e
  }) {
    delete this.previewEntryError, this.getProjectAnnotations = e;
    let t = await this.getProjectAnnotationsOrRenderError();
    if (await this.runBeforeAllHook(t), !this.storyStoreValue) {
      await this.initializeWithProjectAnnotations(t);
      return;
    }
    this.storyStoreValue.setProjectAnnotations(t), this.emitGlobals();
  }
  async onStoryIndexChanged() {
    if (delete this.previewEntryError, !(!this.storyStoreValue && !this.projectAnnotationsBeforeInitialization))
      try {
        let e = await this.getStoryIndexFromServer();
        if (this.projectAnnotationsBeforeInitialization) {
          this.initializeWithStoryIndex(e);
          return;
        }
        await this.onStoriesChanged({ storyIndex: e });
      } catch (e) {
        throw this.renderPreviewEntryError("Error loading story index:", e), e;
      }
  }
  // This happens when a glob gets HMR-ed
  async onStoriesChanged({
    importFn: e,
    storyIndex: t
  }) {
    if (!this.storyStoreValue)
      throw new G({ methodName: "onStoriesChanged" });
    await this.storyStoreValue.onStoriesChanged({ importFn: e, storyIndex: t });
  }
  async onUpdateGlobals({
    globals: e,
    currentStory: t
  }) {
    if (this.storyStoreValue || await this.storeInitializationPromise, !this.storyStoreValue)
      throw new G({ methodName: "onUpdateGlobals" });
    if (this.storyStoreValue.userGlobals.update(e), t) {
      let { initialGlobals: o, storyGlobals: s, userGlobals: a, globals: l } = this.storyStoreValue.getStoryContext(t);
      this.channel.emit(_e, {
        initialGlobals: o,
        userGlobals: a,
        storyGlobals: s,
        globals: l
      });
    } else {
      let { initialGlobals: o, globals: s } = this.storyStoreValue.userGlobals;
      this.channel.emit(_e, {
        initialGlobals: o,
        userGlobals: s,
        storyGlobals: {},
        globals: s
      });
    }
    await Promise.all(this.storyRenders.map((o) => o.rerender()));
  }
  async onUpdateArgs({ storyId: e, updatedArgs: t }) {
    if (!this.storyStoreValue)
      throw new G({ methodName: "onUpdateArgs" });
    this.storyStoreValue.args.update(e, t), await Promise.all(
      this.storyRenders.filter((o) => o.id === e && !o.renderOptions.forceInitialArgs).map(
        (o) => (
          // We only run the play function, with in a force remount.
          // But when mount is destructured, the rendering happens inside of the play function.
          o.story && o.story.usesMount ? o.remount() : o.rerender()
        )
      )
    ), this.channel.emit(zt, {
      storyId: e,
      args: this.storyStoreValue.args.get(e)
    });
  }
  async onRequestArgTypesInfo({ id: e, payload: t }) {
    try {
      await this.storeInitializationPromise;
      let o = await this.storyStoreValue?.loadStory(t);
      this.channel.emit(Xr, {
        id: e,
        success: !0,
        payload: { argTypes: o?.argTypes || {} },
        error: null
      });
    } catch (o) {
      this.channel.emit(Xr, {
        id: e,
        success: !1,
        error: o?.message
      });
    }
  }
  async onResetArgs({ storyId: e, argNames: t }) {
    if (!this.storyStoreValue)
      throw new G({ methodName: "onResetArgs" });
    let s = this.storyRenders.find((c) => c.id === e)?.story || await this.storyStoreValue.loadStory({ storyId: e }), l = (t || [
      .../* @__PURE__ */ new Set([
        ...Object.keys(s.initialArgs),
        ...Object.keys(this.storyStoreValue.args.get(e))
      ])
    ]).reduce((c, i) => (c[i] = s.initialArgs[i], c), {});
    await this.onUpdateArgs({ storyId: e, updatedArgs: l });
  }
  // ForceReRender does not include a story id, so we simply must
  // re-render all stories in case they are relevant
  async onForceReRender() {
    await Promise.all(this.storyRenders.map((e) => e.rerender()));
  }
  async onForceRemount({ storyId: e }) {
    await Promise.all(this.storyRenders.filter((t) => t.id === e).map((t) => t.remount()));
  }
  // Used by docs to render a story to a given element
  // Note this short-circuits the `prepare()` phase of the StoryRender,
  // main to be consistent with the previous behaviour. In the future,
  // we will change it to go ahead and load the story, which will end up being
  // "instant", although async.
  renderStoryToElement(e, t, o, s) {
    if (!this.renderToCanvas || !this.storyStoreValue)
      throw new G({
        methodName: "renderStoryToElement"
      });
    let a = new Fe(
      this.channel,
      this.storyStoreValue,
      this.renderToCanvas,
      o,
      e.id,
      "docs",
      s,
      e
    );
    return a.renderToElement(t), this.storyRenders.push(a), async () => {
      await this.teardownRender(a);
    };
  }
  async teardownRender(e, { viewModeChanged: t } = {}) {
    this.storyRenders = this.storyRenders.filter((o) => o !== e), await e?.teardown?.({ viewModeChanged: t });
  }
  // API
  async loadStory({ storyId: e }) {
    if (!this.storyStoreValue)
      throw new G({ methodName: "loadStory" });
    return this.storyStoreValue.loadStory({ storyId: e });
  }
  getStoryContext(e, { forceInitialArgs: t = !1 } = {}) {
    if (!this.storyStoreValue)
      throw new G({ methodName: "getStoryContext" });
    return this.storyStoreValue.getStoryContext(e, { forceInitialArgs: t });
  }
  async extract(e) {
    if (!this.storyStoreValue)
      throw new G({ methodName: "extract" });
    if (this.previewEntryError)
      throw this.previewEntryError;
    return await this.storyStoreValue.cacheAllCSFFiles(), this.storyStoreValue.extract(e);
  }
  // UTILITIES
  renderPreviewEntryError(e, t) {
    this.previewEntryError = t, O.error(e), O.error(t), this.channel.emit(Lt, t);
  }
};
n(bn, "Preview");
var De = bn;

// src/preview-api/modules/preview-web/docs-context/DocsContext.ts
var Tn = class Tn {
  constructor(e, t, o, s) {
    this.channel = e;
    this.store = t;
    this.renderStoryToElement = o;
    this.storyIdByName = /* @__PURE__ */ n((e) => {
      let t = this.nameToStoryId.get(e);
      if (t)
        return t;
      throw new Error(`No story found with that name: ${e}`);
    }, "storyIdByName");
    this.componentStories = /* @__PURE__ */ n(() => this.componentStoriesValue, "componentStories");
    this.componentStoriesFromCSFFile = /* @__PURE__ */ n((e) => this.store.componentStoriesFromCSFFile({ csfFile: e }), "componentStoriesFro\
mCSFFile");
    this.storyById = /* @__PURE__ */ n((e) => {
      if (!e) {
        if (!this.primaryStory)
          throw new Error(
            "No primary story defined for docs entry. Did you forget to use `<Meta>`?"
          );
        return this.primaryStory;
      }
      let t = this.storyIdToCSFFile.get(e);
      if (!t)
        throw new Error(`Called \`storyById\` for story that was never loaded: ${e}`);
      return this.store.storyFromCSFFile({ storyId: e, csfFile: t });
    }, "storyById");
    this.getStoryContext = /* @__PURE__ */ n((e) => ({
      ...this.store.getStoryContext(e),
      loaded: {},
      viewMode: "docs"
    }), "getStoryContext");
    this.loadStory = /* @__PURE__ */ n((e) => this.store.loadStory({ storyId: e }), "loadStory");
    this.componentStoriesValue = [], this.storyIdToCSFFile = /* @__PURE__ */ new Map(), this.exportToStory = /* @__PURE__ */ new Map(), this.
    exportsToCSFFile = /* @__PURE__ */ new Map(), this.nameToStoryId = /* @__PURE__ */ new Map(), this.attachedCSFFiles = /* @__PURE__ */ new Set(),
    s.forEach((a, l) => {
      this.referenceCSFFile(a);
    });
  }
  // This docs entry references this CSF file and can synchronously load the stories, as well
  // as reference them by module export. If the CSF is part of the "component" stories, they
  // can also be referenced by name and are in the componentStories list.
  referenceCSFFile(e) {
    this.exportsToCSFFile.set(e.moduleExports, e), this.exportsToCSFFile.set(e.moduleExports.default, e), this.store.componentStoriesFromCSFFile(
    { csfFile: e }).forEach((o) => {
      let s = e.stories[o.id];
      this.storyIdToCSFFile.set(s.id, e), this.exportToStory.set(s.moduleExport, o);
    });
  }
  attachCSFFile(e) {
    if (!this.exportsToCSFFile.has(e.moduleExports))
      throw new Error("Cannot attach a CSF file that has not been referenced");
    if (this.attachedCSFFiles.has(e))
      return;
    this.attachedCSFFiles.add(e), this.store.componentStoriesFromCSFFile({ csfFile: e }).forEach((o) => {
      this.nameToStoryId.set(o.name, o.id), this.componentStoriesValue.push(o), this.primaryStory || (this.primaryStory = o);
    });
  }
  referenceMeta(e, t) {
    let o = this.resolveModuleExport(e);
    if (o.type !== "meta")
      throw new Error(
        "<Meta of={} /> must reference a CSF file module export or meta export. Did you mistakenly reference your component instead of your \
CSF file?"
      );
    t && this.attachCSFFile(o.csfFile);
  }
  get projectAnnotations() {
    let { projectAnnotations: e } = this.store;
    if (!e)
      throw new Error("Can't get projectAnnotations from DocsContext before they are initialized");
    return e;
  }
  resolveAttachedModuleExportType(e) {
    if (e === "story") {
      if (!this.primaryStory)
        throw new Error(
          "No primary story attached to this docs file, did you forget to use <Meta of={} />?"
        );
      return { type: "story", story: this.primaryStory };
    }
    if (this.attachedCSFFiles.size === 0)
      throw new Error(
        "No CSF file attached to this docs file, did you forget to use <Meta of={} />?"
      );
    let t = Array.from(this.attachedCSFFiles)[0];
    if (e === "meta")
      return { type: "meta", csfFile: t };
    let { component: o } = t.meta;
    if (!o)
      throw new Error(
        "Attached CSF file does not defined a component, did you forget to export one?"
      );
    return { type: "component", component: o };
  }
  resolveModuleExport(e) {
    let t = this.exportsToCSFFile.get(e);
    if (t)
      return { type: "meta", csfFile: t };
    let o = this.exportToStory.get(e);
    return o ? { type: "story", story: o } : { type: "component", component: e };
  }
  resolveOf(e, t = []) {
    let o;
    if (["component", "meta", "story"].includes(e)) {
      let s = e;
      o = this.resolveAttachedModuleExportType(s);
    } else
      o = this.resolveModuleExport(e);
    if (t.length && !t.includes(o.type)) {
      let s = o.type === "component" ? "component or unknown" : o.type;
      throw new Error(P`Invalid value passed to the 'of' prop. The value was resolved to a '${s}' type but the only types for this block are: ${t.
      join(
        ", "
      )}.
        - Did you pass a component to the 'of' prop when the block only supports a story or a meta?
        - ... or vice versa?
        - Did you pass a story, CSF file or meta to the 'of' prop that is not indexed, ie. is not targeted by the 'stories' globs in the main configuration?`);
    }
    switch (o.type) {
      case "component":
        return {
          ...o,
          projectAnnotations: this.projectAnnotations
        };
      case "meta":
        return {
          ...o,
          preparedMeta: this.store.preparedMetaFromCSFFile({ csfFile: o.csfFile })
        };
      case "story":
      default:
        return o;
    }
  }
};
n(Tn, "DocsContext");
var pe = Tn;

// src/preview-api/modules/preview-web/render/CsfDocsRender.ts
var En = class En {
  constructor(e, t, o, s) {
    this.channel = e;
    this.store = t;
    this.entry = o;
    this.callbacks = s;
    this.type = "docs";
    this.subtype = "csf";
    this.torndown = !1;
    this.disableKeyListeners = !1;
    this.preparing = !1;
    this.id = o.id;
  }
  isPreparing() {
    return this.preparing;
  }
  async prepare() {
    this.preparing = !0;
    let { entryExports: e, csfFiles: t = [] } = await this.store.loadEntry(this.id);
    if (this.torndown)
      throw Te;
    let { importPath: o, title: s } = this.entry, a = this.store.processCSFFileWithCache(
      e,
      o,
      s
    ), l = Object.keys(a.stories)[0];
    this.story = this.store.storyFromCSFFile({ storyId: l, csfFile: a }), this.csfFiles = [a, ...t], this.preparing = !1;
  }
  isEqual(e) {
    return !!(this.id === e.id && this.story && this.story === e.story);
  }
  docsContext(e) {
    if (!this.csfFiles)
      throw new Error("Cannot render docs before preparing");
    let t = new pe(
      this.channel,
      this.store,
      e,
      this.csfFiles
    );
    return this.csfFiles.forEach((o) => t.attachCSFFile(o)), t;
  }
  async renderToElement(e, t) {
    if (!this.story || !this.csfFiles)
      throw new Error("Cannot render docs before preparing");
    let o = this.docsContext(t), { docs: s } = this.story.parameters || {};
    if (!s)
      throw new Error(
        "Cannot render a story in viewMode=docs if `@storybook/addon-docs` is not installed"
      );
    let a = await s.renderer(), { render: l } = a, c = /* @__PURE__ */ n(async () => {
      try {
        await l(o, s, e), this.channel.emit(sr, this.id);
      } catch (i) {
        this.callbacks.showException(i);
      }
    }, "renderDocs");
    return this.rerender = async () => c(), this.teardownRender = async ({ viewModeChanged: i }) => {
      !i || !e || a.unmount(e);
    }, c();
  }
  async teardown({ viewModeChanged: e } = {}) {
    this.teardownRender?.({ viewModeChanged: e }), this.torndown = !0;
  }
};
n(En, "CsfDocsRender");
var Dr = En;

// src/preview-api/modules/preview-web/render/MdxDocsRender.ts
var Rn = class Rn {
  constructor(e, t, o, s) {
    this.channel = e;
    this.store = t;
    this.entry = o;
    this.callbacks = s;
    this.type = "docs";
    this.subtype = "mdx";
    this.torndown = !1;
    this.disableKeyListeners = !1;
    this.preparing = !1;
    this.id = o.id;
  }
  isPreparing() {
    return this.preparing;
  }
  async prepare() {
    this.preparing = !0;
    let { entryExports: e, csfFiles: t = [] } = await this.store.loadEntry(this.id);
    if (this.torndown)
      throw Te;
    this.csfFiles = t, this.exports = e, this.preparing = !1;
  }
  isEqual(e) {
    return !!(this.id === e.id && this.exports && this.exports === e.exports);
  }
  docsContext(e) {
    if (!this.csfFiles)
      throw new Error("Cannot render docs before preparing");
    return new pe(
      this.channel,
      this.store,
      e,
      this.csfFiles
    );
  }
  async renderToElement(e, t) {
    if (!this.exports || !this.csfFiles || !this.store.projectAnnotations)
      throw new Error("Cannot render docs before preparing");
    let o = this.docsContext(t), { docs: s } = this.store.projectAnnotations.parameters || {};
    if (!s)
      throw new Error(
        "Cannot render a story in viewMode=docs if `@storybook/addon-docs` is not installed"
      );
    let a = { ...s, page: this.exports.default }, l = await s.renderer(), { render: c } = l, i = /* @__PURE__ */ n(async () => {
      try {
        await c(o, a, e), this.channel.emit(sr, this.id);
      } catch (p) {
        this.callbacks.showException(p);
      }
    }, "renderDocs");
    return this.rerender = async () => i(), this.teardownRender = async ({ viewModeChanged: p } = {}) => {
      !p || !e || (l.unmount(e), this.torndown = !0);
    }, i();
  }
  async teardown({ viewModeChanged: e } = {}) {
    this.teardownRender?.({ viewModeChanged: e }), this.torndown = !0;
  }
};
n(Rn, "MdxDocsRender");
var Nr = Rn;

// src/preview-api/modules/preview-web/PreviewWithSelection.tsx
var nu = globalThis;
function su(r) {
  let e = r.composedPath && r.composedPath()[0] || r.target;
  return /input|textarea/i.test(e.tagName) || e.getAttribute("contenteditable") !== null;
}
n(su, "focusInInput");
var ja = "attached-mdx", au = "unattached-mdx";
function iu({ tags: r }) {
  return r?.includes(au) || r?.includes(ja);
}
n(iu, "isMdxEntry");
function xn(r) {
  return r.type === "story";
}
n(xn, "isStoryRender");
function lu(r) {
  return r.type === "docs";
}
n(lu, "isDocsRender");
function cu(r) {
  return lu(r) && r.subtype === "csf";
}
n(cu, "isCsfDocsRender");
var An = class An extends De {
  constructor(t, o, s, a) {
    super(t, o, void 0, !1);
    this.importFn = t;
    this.getProjectAnnotations = o;
    this.selectionStore = s;
    this.view = a;
    this.initialize();
  }
  setupListeners() {
    super.setupListeners(), nu.onkeydown = this.onKeydown.bind(this), this.channel.on(Vt, this.onSetCurrentStory.bind(this)), this.channel.on(
    Zt, this.onUpdateQueryParams.bind(this)), this.channel.on(Bt, this.onPreloadStories.bind(this));
  }
  async setInitialGlobals() {
    if (!this.storyStoreValue)
      throw new G({ methodName: "setInitialGlobals" });
    let { globals: t } = this.selectionStore.selectionSpecifier || {};
    t && this.storyStoreValue.userGlobals.updateFromPersisted(t), this.emitGlobals();
  }
  // If initialization gets as far as the story index, this function runs.
  async initializeWithStoryIndex(t) {
    return await super.initializeWithStoryIndex(t), this.selectSpecifiedStory();
  }
  // Use the selection specifier to choose a story, then render it
  async selectSpecifiedStory() {
    if (!this.storyStoreValue)
      throw new G({
        methodName: "selectSpecifiedStory"
      });
    if (this.selectionStore.selection) {
      await this.renderSelection();
      return;
    }
    if (!this.selectionStore.selectionSpecifier) {
      this.renderMissingStory();
      return;
    }
    let { storySpecifier: t, args: o } = this.selectionStore.selectionSpecifier, s = this.storyStoreValue.storyIndex.entryFromSpecifier(t);
    if (!s) {
      t === "*" ? this.renderStoryLoadingException(t, new Rr()) : this.renderStoryLoadingException(
        t,
        new xr({ storySpecifier: t.toString() })
      );
      return;
    }
    let { id: a, type: l } = s;
    this.selectionStore.setSelection({ storyId: a, viewMode: l }), this.channel.emit(Xt, this.selectionStore.selection), this.channel.emit($r,
    this.selectionStore.selection), await this.renderSelection({ persistedArgs: o });
  }
  // EVENT HANDLERS
  // This happens when a config file gets reloaded
  async onGetProjectAnnotationsChanged({
    getProjectAnnotations: t
  }) {
    await super.onGetProjectAnnotationsChanged({ getProjectAnnotations: t }), this.selectionStore.selection && this.renderSelection();
  }
  // This happens when a glob gets HMR-ed
  async onStoriesChanged({
    importFn: t,
    storyIndex: o
  }) {
    await super.onStoriesChanged({ importFn: t, storyIndex: o }), this.selectionStore.selection ? await this.renderSelection() : await this.
    selectSpecifiedStory();
  }
  onKeydown(t) {
    if (!this.storyRenders.find((o) => o.disableKeyListeners) && !su(t)) {
      let { altKey: o, ctrlKey: s, metaKey: a, shiftKey: l, key: c, code: i, keyCode: p } = t;
      this.channel.emit(Gt, {
        event: { altKey: o, ctrlKey: s, metaKey: a, shiftKey: l, key: c, code: i, keyCode: p }
      });
    }
  }
  async onSetCurrentStory(t) {
    this.selectionStore.setSelection({ viewMode: "story", ...t }), await this.storeInitializationPromise, this.channel.emit($r, this.selectionStore.
    selection), this.renderSelection();
  }
  onUpdateQueryParams(t) {
    this.selectionStore.setQueryParams(t);
  }
  async onUpdateGlobals({ globals: t }) {
    let o = this.currentRender instanceof Fe && this.currentRender.story || void 0;
    super.onUpdateGlobals({ globals: t, currentStory: o }), (this.currentRender instanceof Nr || this.currentRender instanceof Dr) && await this.
    currentRender.rerender?.();
  }
  async onUpdateArgs({ storyId: t, updatedArgs: o }) {
    super.onUpdateArgs({ storyId: t, updatedArgs: o });
  }
  async onPreloadStories({ ids: t }) {
    await this.storeInitializationPromise, this.storyStoreValue && await Promise.allSettled(t.map((o) => this.storyStoreValue?.loadEntry(o)));
  }
  // RENDERING
  // We can either have:
  // - a story selected in "story" viewMode,
  //     in which case we render it to the root element, OR
  // - a story selected in "docs" viewMode,
  //     in which case we render the docsPage for that story
  async renderSelection({ persistedArgs: t } = {}) {
    let { renderToCanvas: o } = this;
    if (!this.storyStoreValue || !o)
      throw new G({ methodName: "renderSelection" });
    let { selection: s } = this.selectionStore;
    if (!s)
      throw new Error("Cannot call renderSelection as no selection was made");
    let { storyId: a } = s, l;
    try {
      l = await this.storyStoreValue.storyIdToEntry(a);
    } catch (S) {
      this.currentRender && await this.teardownRender(this.currentRender), this.renderStoryLoadingException(a, S);
      return;
    }
    let c = this.currentSelection?.storyId !== a, i = this.currentRender?.type !== l.type;
    l.type === "story" ? this.view.showPreparingStory({ immediate: i }) : this.view.showPreparingDocs({ immediate: i }), this.currentRender?.
    isPreparing() && await this.teardownRender(this.currentRender);
    let p;
    l.type === "story" ? p = new Fe(
      this.channel,
      this.storyStoreValue,
      o,
      this.mainStoryCallbacks(a),
      a,
      "story"
    ) : iu(l) ? p = new Nr(
      this.channel,
      this.storyStoreValue,
      l,
      this.mainStoryCallbacks(a)
    ) : p = new Dr(
      this.channel,
      this.storyStoreValue,
      l,
      this.mainStoryCallbacks(a)
    );
    let u = this.currentSelection;
    this.currentSelection = s;
    let d = this.currentRender;
    this.currentRender = p;
    try {
      await p.prepare();
    } catch (S) {
      d && await this.teardownRender(d), S !== Te && this.renderStoryLoadingException(a, S);
      return;
    }
    let h = !c && d && !p.isEqual(d);
    if (t && xn(p) && (le(!!p.story), this.storyStoreValue.args.updateFromPersisted(p.story, t)), d && !d.torndown && !c && !h && !i) {
      this.currentRender = d, this.channel.emit(Qt, a), this.view.showMain();
      return;
    }
    if (d && await this.teardownRender(d, { viewModeChanged: i }), u && (c || i) && this.channel.emit(Wt, a), xn(p)) {
      le(!!p.story);
      let {
        parameters: S,
        initialArgs: m,
        argTypes: T,
        unmappedArgs: y,
        initialGlobals: x,
        userGlobals: A,
        storyGlobals: g,
        globals: b
      } = this.storyStoreValue.getStoryContext(p.story);
      this.channel.emit(Kt, {
        id: a,
        parameters: S,
        initialArgs: m,
        argTypes: T,
        args: y
      }), this.channel.emit(_e, { userGlobals: A, storyGlobals: g, globals: b, initialGlobals: x });
    } else {
      let { parameters: S } = this.storyStoreValue.projectAnnotations, { initialGlobals: m, globals: T } = this.storyStoreValue.userGlobals;
      if (this.channel.emit(_e, {
        globals: T,
        initialGlobals: m,
        storyGlobals: {},
        userGlobals: T
      }), cu(p) || p.entry.tags?.includes(ja)) {
        if (!p.csfFiles)
          throw new Er({ storyId: a });
        ({ parameters: S } = this.storyStoreValue.preparedMetaFromCSFFile({
          csfFile: p.csfFiles[0]
        }));
      }
      this.channel.emit(jt, {
        id: a,
        parameters: S
      });
    }
    xn(p) ? (le(!!p.story), this.storyRenders.push(p), this.currentRender.renderToElement(
      this.view.prepareForStory(p.story)
    )) : this.currentRender.renderToElement(
      this.view.prepareForDocs(),
      // This argument is used for docs, which is currently only compatible with HTMLElements
      this.renderStoryToElement.bind(this)
    );
  }
  async teardownRender(t, { viewModeChanged: o = !1 } = {}) {
    this.storyRenders = this.storyRenders.filter((s) => s !== t), await t?.teardown?.({ viewModeChanged: o });
  }
  // UTILITIES
  mainStoryCallbacks(t) {
    return {
      showStoryDuringRender: /* @__PURE__ */ n(() => this.view.showStoryDuringRender(), "showStoryDuringRender"),
      showMain: /* @__PURE__ */ n(() => this.view.showMain(), "showMain"),
      showError: /* @__PURE__ */ n((o) => this.renderError(t, o), "showError"),
      showException: /* @__PURE__ */ n((o) => this.renderException(t, o), "showException")
    };
  }
  renderPreviewEntryError(t, o) {
    super.renderPreviewEntryError(t, o), this.view.showErrorDisplay(o);
  }
  renderMissingStory() {
    this.view.showNoPreview(), this.channel.emit(Yr);
  }
  renderStoryLoadingException(t, o) {
    O.error(o), this.view.showErrorDisplay(o), this.channel.emit(Yr, t);
  }
  // renderException is used if we fail to render the story and it is uncaught by the app layer
  renderException(t, o) {
    let { name: s = "Error", message: a = String(o), stack: l } = o;
    this.channel.emit(Jt, { name: s, message: a, stack: l }), this.channel.emit(we, { newPhase: "errored", storyId: t }), this.view.showErrorDisplay(
    o), O.error(`Error rendering story '${t}':`), O.error(o);
  }
  // renderError is used by the various app layers to inform the user they have done something
  // wrong -- for instance returned the wrong thing from a story
  renderError(t, { title: o, description: s }) {
    O.error(`Error rendering story ${o}: ${s}`), this.channel.emit($t, { title: o, description: s }), this.channel.emit(we, { newPhase: "err\
ored", storyId: t }), this.view.showErrorDisplay({
      message: o,
      stack: s
    });
  }
};
n(An, "PreviewWithSelection");
var Ne = An;

// src/preview-api/modules/preview-web/UrlStore.ts
var Lr = ue(At(), 1);

// src/preview-api/modules/preview-web/parseArgsParam.ts
var Xa = ue(At(), 1);
var Ka = /^[a-zA-Z0-9 _-]*$/, Ja = /^-?[0-9]+(\.[0-9]+)?$/, ku = /^#([a-f0-9]{3,4}|[a-f0-9]{6}|[a-f0-9]{8})$/i, Qa = /^(rgba?|hsla?)\(([0-9]{1,3}),\s?([0-9]{1,3})%?,\s?([0-9]{1,3})%?,?\s?([0-9](\.[0-9]{1,2})?)?\)$/i,
In = /* @__PURE__ */ n((r = "", e) => r === null || r === "" || !Ka.test(r) ? !1 : e == null || e instanceof Date || typeof e == "number" ||
typeof e == "boolean" ? !0 : typeof e == "string" ? Ka.test(e) || Ja.test(e) || ku.test(e) || Qa.test(e) : Array.isArray(e) ? e.every((t) => In(
r, t)) : W(e) ? Object.entries(e).every(([t, o]) => In(t, o)) : !1, "validateArgs"), Lu = {
  delimiter: ";",
  // we're parsing a single query param
  nesting: !0,
  arrayRepeat: !0,
  arrayRepeatSyntax: "bracket",
  nestingSyntax: "js",
  // objects are encoded using dot notation
  valueDeserializer(r) {
    if (r.startsWith("!")) {
      if (r === "!undefined")
        return;
      if (r === "!null")
        return null;
      if (r === "!true")
        return !0;
      if (r === "!false")
        return !1;
      if (r.startsWith("!date(") && r.endsWith(")"))
        return new Date(r.replaceAll(" ", "+").slice(6, -1));
      if (r.startsWith("!hex(") && r.endsWith(")"))
        return `#${r.slice(5, -1)}`;
      let e = r.slice(1).match(Qa);
      if (e)
        return r.startsWith("!rgba") || r.startsWith("!RGBA") ? `${e[1]}(${e[2]}, ${e[3]}, ${e[4]}, ${e[5]})` : r.startsWith("!hsla") || r.startsWith(
        "!HSLA") ? `${e[1]}(${e[2]}, ${e[3]}%, ${e[4]}%, ${e[5]})` : r.startsWith("!rgb") || r.startsWith("!RGB") ? `${e[1]}(${e[2]}, ${e[3]}\
, ${e[4]})` : `${e[1]}(${e[2]}, ${e[3]}%, ${e[4]}%)`;
    }
    return Ja.test(r) ? Number(r) : r;
  }
}, Fn = /* @__PURE__ */ n((r) => {
  let e = r.split(";").map((t) => t.replace("=", "~").replace(":", "="));
  return Object.entries((0, Xa.parse)(e.join(";"), Lu)).reduce((t, [o, s]) => In(o, s) ? Object.assign(t, { [o]: s }) : (L.warn(P`
      Omitted potentially unsafe URL args.

      More info: https://storybook.js.org/docs/writing-stories/args#setting-args-through-the-url
    `), t), {});
}, "parseArgsParam");

// src/preview-api/modules/preview-web/UrlStore.ts
var { history: Za, document: Ee } = R;
function ju(r) {
  let e = (r || "").match(/^\/story\/(.+)/);
  if (!e)
    throw new Error(`Invalid path '${r}',  must start with '/story/'`);
  return e[1];
}
n(ju, "pathToId");
var ei = /* @__PURE__ */ n(({
  selection: r,
  extraParams: e
}) => {
  let t = Ee?.location.search.slice(1), { path: o, selectedKind: s, selectedStory: a, ...l } = (0, Lr.parse)(t);
  return `?${(0, Lr.stringify)({
    ...l,
    ...e,
    ...r && { id: r.storyId, viewMode: r.viewMode }
  })}`;
}, "getQueryString"), Mu = /* @__PURE__ */ n((r) => {
  if (!r)
    return;
  let e = ei({ selection: r }), { hash: t = "" } = Ee.location;
  Ee.title = r.storyId, Za.replaceState({}, "", `${Ee.location.pathname}${e}${t}`);
}, "setPath"), qu = /* @__PURE__ */ n((r) => r != null && typeof r == "object" && Array.isArray(r) === !1, "isObject"), kr = /* @__PURE__ */ n(
(r) => {
  if (r !== void 0) {
    if (typeof r == "string")
      return r;
    if (Array.isArray(r))
      return kr(r[0]);
    if (qu(r))
      return kr(
        Object.values(r).filter(Boolean)
      );
  }
}, "getFirstString"), Uu = /* @__PURE__ */ n(() => {
  if (typeof Ee < "u") {
    let r = Ee.location.search.slice(1), e = (0, Lr.parse)(r), t = typeof e.args == "string" ? Fn(e.args) : void 0, o = typeof e.globals == "\
string" ? Fn(e.globals) : void 0, s = kr(e.viewMode);
    (typeof s != "string" || !s.match(/docs|story/)) && (s = "story");
    let a = kr(e.path), l = a ? ju(a) : kr(e.id);
    if (l)
      return { storySpecifier: l, args: t, globals: o, viewMode: s };
  }
  return null;
}, "getSelectionSpecifierFromPath"), Dn = class Dn {
  constructor() {
    this.selectionSpecifier = Uu();
  }
  setSelection(e) {
    this.selection = e, Mu(this.selection);
  }
  setQueryParams(e) {
    let t = ei({ extraParams: e }), { hash: o = "" } = Ee.location;
    Za.replaceState({}, "", `${Ee.location.pathname}${t}${o}`);
  }
};
n(Dn, "UrlStore");
var je = Dn;

// src/preview-api/modules/preview-web/WebView.ts
var Fi = ue(Ci(), 1), Di = ue(At(), 1);
var { document: H } = R, Oi = 100, Ni = /* @__PURE__ */ ((a) => (a.MAIN = "MAIN", a.NOPREVIEW = "NOPREVIEW", a.PREPARING_STORY = "PREPARING_\
STORY", a.PREPARING_DOCS = "PREPARING_DOCS", a.ERROR = "ERROR", a))(Ni || {}), Un = {
  PREPARING_STORY: "sb-show-preparing-story",
  PREPARING_DOCS: "sb-show-preparing-docs",
  MAIN: "sb-show-main",
  NOPREVIEW: "sb-show-nopreview",
  ERROR: "sb-show-errordisplay"
}, Bn = {
  centered: "sb-main-centered",
  fullscreen: "sb-main-fullscreen",
  padded: "sb-main-padded"
}, Ii = new Fi.default({
  escapeXML: !0
}), Gn = class Gn {
  constructor() {
    this.testing = !1;
    if (typeof H < "u") {
      let { __SPECIAL_TEST_PARAMETER__: e } = (0, Di.parse)(H.location.search.slice(1));
      switch (e) {
        case "preparing-story": {
          this.showPreparingStory(), this.testing = !0;
          break;
        }
        case "preparing-docs": {
          this.showPreparingDocs(), this.testing = !0;
          break;
        }
        default:
      }
    }
  }
  // Get ready to render a story, returning the element to render to
  prepareForStory(e) {
    return this.showStory(), this.applyLayout(e.parameters.layout), H.documentElement.scrollTop = 0, H.documentElement.scrollLeft = 0, this.
    storyRoot();
  }
  storyRoot() {
    return H.getElementById("storybook-root");
  }
  prepareForDocs() {
    return this.showMain(), this.showDocs(), this.applyLayout("fullscreen"), H.documentElement.scrollTop = 0, H.documentElement.scrollLeft =
    0, this.docsRoot();
  }
  docsRoot() {
    return H.getElementById("storybook-docs");
  }
  applyLayout(e = "padded") {
    if (e === "none") {
      H.body.classList.remove(this.currentLayoutClass), this.currentLayoutClass = null;
      return;
    }
    this.checkIfLayoutExists(e);
    let t = Bn[e];
    H.body.classList.remove(this.currentLayoutClass), H.body.classList.add(t), this.currentLayoutClass = t;
  }
  checkIfLayoutExists(e) {
    Bn[e] || O.warn(
      P`
          The desired layout: ${e} is not a valid option.
          The possible options are: ${Object.keys(Bn).join(", ")}, none.
        `
    );
  }
  showMode(e) {
    clearTimeout(this.preparingTimeout), Object.keys(Ni).forEach((t) => {
      t === e ? H.body.classList.add(Un[t]) : H.body.classList.remove(Un[t]);
    });
  }
  showErrorDisplay({ message: e = "", stack: t = "" }) {
    let o = e, s = t, a = e.split(`
`);
    a.length > 1 && ([o] = a, s = a.slice(1).join(`
`).replace(/^\n/, "")), H.getElementById("error-message").innerHTML = Ii.toHtml(o), H.getElementById("error-stack").innerHTML = Ii.toHtml(s),
    this.showMode("ERROR");
  }
  showNoPreview() {
    this.testing || (this.showMode("NOPREVIEW"), this.storyRoot()?.setAttribute("hidden", "true"), this.docsRoot()?.setAttribute("hidden", "\
true"));
  }
  showPreparingStory({ immediate: e = !1 } = {}) {
    clearTimeout(this.preparingTimeout), e ? this.showMode("PREPARING_STORY") : this.preparingTimeout = setTimeout(
      () => this.showMode("PREPARING_STORY"),
      Oi
    );
  }
  showPreparingDocs({ immediate: e = !1 } = {}) {
    clearTimeout(this.preparingTimeout), e ? this.showMode("PREPARING_DOCS") : this.preparingTimeout = setTimeout(() => this.showMode("PREPA\
RING_DOCS"), Oi);
  }
  showMain() {
    this.showMode("MAIN");
  }
  showDocs() {
    this.storyRoot().setAttribute("hidden", "true"), this.docsRoot().removeAttribute("hidden");
  }
  showStory() {
    this.docsRoot().setAttribute("hidden", "true"), this.storyRoot().removeAttribute("hidden");
  }
  showStoryDuringRender() {
    H.body.classList.add(Un.MAIN);
  }
};
n(Gn, "WebView");
var qe = Gn;

// src/preview-api/modules/preview-web/PreviewWeb.tsx
var Vn = class Vn extends Ne {
  constructor(t, o) {
    super(t, o, new je(), new qe());
    this.importFn = t;
    this.getProjectAnnotations = o;
    R.__STORYBOOK_PREVIEW__ = this;
  }
};
n(Vn, "PreviewWeb");
var Mr = Vn;

// src/preview-api/modules/preview-web/simulate-pageload.ts
var { document: Ue } = R, Rf = [
  "application/javascript",
  "application/ecmascript",
  "application/x-ecmascript",
  "application/x-javascript",
  "text/ecmascript",
  "text/javascript",
  "text/javascript1.0",
  "text/javascript1.1",
  "text/javascript1.2",
  "text/javascript1.3",
  "text/javascript1.4",
  "text/javascript1.5",
  "text/jscript",
  "text/livescript",
  "text/x-ecmascript",
  "text/x-javascript",
  // Support modern javascript
  "module"
], xf = "script", ki = "scripts-root";
function qr() {
  let r = Ue.createEvent("Event");
  r.initEvent("DOMContentLoaded", !0, !0), Ue.dispatchEvent(r);
}
n(qr, "simulateDOMContentLoaded");
function Af(r, e, t) {
  let o = Ue.createElement("script");
  o.type = r.type === "module" ? "module" : "text/javascript", r.src ? (o.onload = e, o.onerror = e, o.src = r.src) : o.textContent = r.innerText,
  t ? t.appendChild(o) : Ue.head.appendChild(o), r.parentNode.removeChild(r), r.src || e();
}
n(Af, "insertScript");
function Li(r, e, t = 0) {
  r[t](() => {
    t++, t === r.length ? e() : Li(r, e, t);
  });
}
n(Li, "insertScriptsSequentially");
function Hn(r) {
  let e = Ue.getElementById(ki);
  e ? e.innerHTML = "" : (e = Ue.createElement("div"), e.id = ki, Ue.body.appendChild(e));
  let t = Array.from(r.querySelectorAll(xf));
  if (t.length) {
    let o = [];
    t.forEach((s) => {
      let a = s.getAttribute("type");
      (!a || Rf.includes(a)) && o.push((l) => Af(s, l, e));
    }), o.length && Li(o, qr, void 0);
  } else
    qr();
}
n(Hn, "simulatePageLoad");

// src/preview/globals/runtime.ts
var ji = {
  "@storybook/global": Dt,
  "storybook/internal/channels": yr,
  "@storybook/channels": yr,
  "@storybook/core/channels": yr,
  "storybook/internal/client-logger": pr,
  "@storybook/client-logger": pr,
  "@storybook/core/client-logger": pr,
  "storybook/internal/core-events": fe,
  "@storybook/core-events": fe,
  "@storybook/core/core-events": fe,
  "storybook/internal/preview-errors": Pr,
  "@storybook/core-events/preview-errors": Pr,
  "@storybook/core/preview-errors": Pr,
  "storybook/internal/preview-api": Ur,
  "@storybook/preview-api": Ur,
  "@storybook/core/preview-api": Ur,
  "storybook/internal/types": mr,
  "@storybook/types": mr,
  "@storybook/core/types": mr
};

// src/preview/utils.ts
var qi = ue(Mi(), 1);
var $n;
function _f() {
  return $n || ($n = new qi.default(R.navigator?.userAgent).getBrowserInfo()), $n;
}
n(_f, "getBrowserInfo");
function Ui(r) {
  return r.browserInfo = _f(), r;
}
n(Ui, "prepareForTelemetry");

// src/preview/runtime.ts
function wf(r) {
  let e = r.error || r;
  e.fromStorybook && R.sendTelemetryError(e);
}
n(wf, "errorListener");
function vf({ reason: r }) {
  r.fromStorybook && R.sendTelemetryError(r);
}
n(vf, "unhandledRejectionListener");
function Pf() {
  Yn.forEach((r) => {
    R[to[r]] = ji[r];
  }), R.sendTelemetryError = (r) => {
    R.__STORYBOOK_ADDONS_CHANNEL__.emit(eo, Ui(r));
  }, R.addEventListener("error", wf), R.addEventListener("unhandledrejection", vf);
}
n(Pf, "setup");
Pf();
export {
  Pf as setup
};
