var bm = Object.create;
var jt = Object.defineProperty;
var vm = Object.getOwnPropertyDescriptor;
var Tm = Object.getOwnPropertyNames;
var Em = Object.getPrototypeOf, Am = Object.prototype.hasOwnProperty;
var n = (r, e) => jt(r, "name", { value: e, configurable: !0 }), Mr = /* @__PURE__ */ ((r) => typeof require < "u" ? require : typeof Proxy <
"u" ? new Proxy(r, {
  get: (e, t) => (typeof require < "u" ? require : e)[t]
}) : r)(function(r) {
  if (typeof require < "u") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + r + '" is not supported');
});
var y = (r, e) => () => (e || r((e = { exports: {} }).exports, e), e.exports), Ie = (r, e) => {
  for (var t in e)
    jt(r, t, { get: e[t], enumerable: !0 });
}, Rm = (r, e, t, o) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (let a of Tm(e))
      !Am.call(r, a) && a !== t && jt(r, a, { get: () => e[a], enumerable: !(o = vm(e, a)) || o.enumerable });
  return r;
};
var Y = (r, e, t) => (t = r != null ? bm(Em(r)) : {}, Rm(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  e || !r || !r.__esModule ? jt(t, "default", { value: r, enumerable: !0 }) : t,
  r
));

// ../node_modules/memoizerific/memoizerific.js
var Vt = y((ps, xn) => {
  (function(r) {
    if (typeof ps == "object" && typeof xn < "u")
      xn.exports = r();
    else if (typeof define == "function" && define.amd)
      define([], r);
    else {
      var e;
      typeof window < "u" ? e = window : typeof global < "u" ? e = global : typeof self < "u" ? e = self : e = this, e.memoizerific = r();
    }
  })(function() {
    var r, e, t;
    return (/* @__PURE__ */ n(function o(a, i, s) {
      function c(p, h) {
        if (!i[p]) {
          if (!a[p]) {
            var d = typeof Mr == "function" && Mr;
            if (!h && d) return d(p, !0);
            if (l) return l(p, !0);
            var g = new Error("Cannot find module '" + p + "'");
            throw g.code = "MODULE_NOT_FOUND", g;
          }
          var m = i[p] = { exports: {} };
          a[p][0].call(m.exports, function(b) {
            var S = a[p][1][b];
            return c(S || b);
          }, m, m.exports, o, a, i, s);
        }
        return i[p].exports;
      }
      n(c, "s");
      for (var l = typeof Mr == "function" && Mr, u = 0; u < s.length; u++) c(s[u]);
      return c;
    }, "e"))({ 1: [function(o, a, i) {
      a.exports = function(s) {
        if (typeof Map != "function" || s) {
          var c = o("./similar");
          return new c();
        } else
          return /* @__PURE__ */ new Map();
      };
    }, { "./similar": 2 }], 2: [function(o, a, i) {
      function s() {
        return this.list = [], this.lastItem = void 0, this.size = 0, this;
      }
      n(s, "Similar"), s.prototype.get = function(c) {
        var l;
        if (this.lastItem && this.isEqual(this.lastItem.key, c))
          return this.lastItem.val;
        if (l = this.indexOf(c), l >= 0)
          return this.lastItem = this.list[l], this.list[l].val;
      }, s.prototype.set = function(c, l) {
        var u;
        return this.lastItem && this.isEqual(this.lastItem.key, c) ? (this.lastItem.val = l, this) : (u = this.indexOf(c), u >= 0 ? (this.lastItem =
        this.list[u], this.list[u].val = l, this) : (this.lastItem = { key: c, val: l }, this.list.push(this.lastItem), this.size++, this));
      }, s.prototype.delete = function(c) {
        var l;
        if (this.lastItem && this.isEqual(this.lastItem.key, c) && (this.lastItem = void 0), l = this.indexOf(c), l >= 0)
          return this.size--, this.list.splice(l, 1)[0];
      }, s.prototype.has = function(c) {
        var l;
        return this.lastItem && this.isEqual(this.lastItem.key, c) ? !0 : (l = this.indexOf(c), l >= 0 ? (this.lastItem = this.list[l], !0) :
        !1);
      }, s.prototype.forEach = function(c, l) {
        var u;
        for (u = 0; u < this.size; u++)
          c.call(l || this, this.list[u].val, this.list[u].key, this);
      }, s.prototype.indexOf = function(c) {
        var l;
        for (l = 0; l < this.size; l++)
          if (this.isEqual(this.list[l].key, c))
            return l;
        return -1;
      }, s.prototype.isEqual = function(c, l) {
        return c === l || c !== c && l !== l;
      }, a.exports = s;
    }, {}], 3: [function(o, a, i) {
      var s = o("map-or-similar");
      a.exports = function(p) {
        var h = new s(!1), d = [];
        return function(g) {
          var m = /* @__PURE__ */ n(function() {
            var b = h, S, T, v = arguments.length - 1, E = Array(v + 1), R = !0, w;
            if ((m.numArgs || m.numArgs === 0) && m.numArgs !== v + 1)
              throw new Error("Memoizerific functions should always be called with the same number of arguments");
            for (w = 0; w < v; w++) {
              if (E[w] = {
                cacheItem: b,
                arg: arguments[w]
              }, b.has(arguments[w])) {
                b = b.get(arguments[w]);
                continue;
              }
              R = !1, S = new s(!1), b.set(arguments[w], S), b = S;
            }
            return R && (b.has(arguments[v]) ? T = b.get(arguments[v]) : R = !1), R || (T = g.apply(null, arguments), b.set(arguments[v], T)),
            p > 0 && (E[v] = {
              cacheItem: b,
              arg: arguments[v]
            }, R ? c(d, E) : d.push(E), d.length > p && l(d.shift())), m.wasMemoized = R, m.numArgs = v + 1, T;
          }, "memoizerific");
          return m.limit = p, m.wasMemoized = !1, m.cache = h, m.lru = d, m;
        };
      };
      function c(p, h) {
        var d = p.length, g = h.length, m, b, S;
        for (b = 0; b < d; b++) {
          for (m = !0, S = 0; S < g; S++)
            if (!u(p[b][S].arg, h[S].arg)) {
              m = !1;
              break;
            }
          if (m)
            break;
        }
        p.push(p.splice(b, 1)[0]);
      }
      n(c, "moveToMostRecentLru");
      function l(p) {
        var h = p.length, d = p[h - 1], g, m;
        for (d.cacheItem.delete(d.arg), m = h - 2; m >= 0 && (d = p[m], g = d.cacheItem.get(d.arg), !g || !g.size); m--)
          d.cacheItem.delete(d.arg);
      }
      n(l, "removeCachedResult");
      function u(p, h) {
        return p === h || p !== p && h !== h;
      }
      n(u, "isEqual");
    }, { "map-or-similar": 1 }] }, {}, [3])(3);
  });
});

// ../node_modules/lodash/_freeGlobal.js
var ha = y((DD, zs) => {
  var Jb = typeof global == "object" && global && global.Object === Object && global;
  zs.exports = Jb;
});

// ../node_modules/lodash/_root.js
var ie = y((ND, Ys) => {
  var Qb = ha(), Zb = typeof self == "object" && self && self.Object === Object && self, ev = Qb || Zb || Function("return this")();
  Ys.exports = ev;
});

// ../node_modules/lodash/_Symbol.js
var lr = y((qD, Ks) => {
  var rv = ie(), tv = rv.Symbol;
  Ks.exports = tv;
});

// ../node_modules/lodash/_getRawTag.js
var Zs = y((LD, Qs) => {
  var Xs = lr(), Js = Object.prototype, ov = Js.hasOwnProperty, nv = Js.toString, lt = Xs ? Xs.toStringTag : void 0;
  function av(r) {
    var e = ov.call(r, lt), t = r[lt];
    try {
      r[lt] = void 0;
      var o = !0;
    } catch {
    }
    var a = nv.call(r);
    return o && (e ? r[lt] = t : delete r[lt]), a;
  }
  n(av, "getRawTag");
  Qs.exports = av;
});

// ../node_modules/lodash/_objectToString.js
var rl = y((kD, el) => {
  var iv = Object.prototype, sv = iv.toString;
  function lv(r) {
    return sv.call(r);
  }
  n(lv, "objectToString");
  el.exports = lv;
});

// ../node_modules/lodash/_baseGetTag.js
var qe = y((GD, nl) => {
  var tl = lr(), cv = Zs(), uv = rl(), pv = "[object Null]", dv = "[object Undefined]", ol = tl ? tl.toStringTag : void 0;
  function fv(r) {
    return r == null ? r === void 0 ? dv : pv : ol && ol in Object(r) ? cv(r) : uv(r);
  }
  n(fv, "baseGetTag");
  nl.exports = fv;
});

// ../node_modules/lodash/isObject.js
var cr = y((UD, al) => {
  function yv(r) {
    var e = typeof r;
    return r != null && (e == "object" || e == "function");
  }
  n(yv, "isObject");
  al.exports = yv;
});

// ../node_modules/lodash/isFunction.js
var ma = y((VD, il) => {
  var hv = qe(), mv = cr(), gv = "[object AsyncFunction]", Sv = "[object Function]", bv = "[object GeneratorFunction]", vv = "[object Proxy]";
  function Tv(r) {
    if (!mv(r))
      return !1;
    var e = hv(r);
    return e == Sv || e == bv || e == gv || e == vv;
  }
  n(Tv, "isFunction");
  il.exports = Tv;
});

// ../node_modules/lodash/_coreJsData.js
var ll = y((WD, sl) => {
  var Ev = ie(), Av = Ev["__core-js_shared__"];
  sl.exports = Av;
});

// ../node_modules/lodash/_isMasked.js
var pl = y((zD, ul) => {
  var ga = ll(), cl = function() {
    var r = /[^.]+$/.exec(ga && ga.keys && ga.keys.IE_PROTO || "");
    return r ? "Symbol(src)_1." + r : "";
  }();
  function Rv(r) {
    return !!cl && cl in r;
  }
  n(Rv, "isMasked");
  ul.exports = Rv;
});

// ../node_modules/lodash/_toSource.js
var Sa = y((KD, dl) => {
  var wv = Function.prototype, xv = wv.toString;
  function _v(r) {
    if (r != null) {
      try {
        return xv.call(r);
      } catch {
      }
      try {
        return r + "";
      } catch {
      }
    }
    return "";
  }
  n(_v, "toSource");
  dl.exports = _v;
});

// ../node_modules/lodash/_baseIsNative.js
var yl = y((JD, fl) => {
  var Pv = ma(), Ov = pl(), Cv = cr(), Iv = Sa(), Fv = /[\\^$.*+?()[\]{}|]/g, Dv = /^\[object .+?Constructor\]$/, Nv = Function.prototype, qv = Object.
  prototype, Lv = Nv.toString, Mv = qv.hasOwnProperty, kv = RegExp(
    "^" + Lv.call(Mv).replace(Fv, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
  );
  function jv(r) {
    if (!Cv(r) || Ov(r))
      return !1;
    var e = Pv(r) ? kv : Dv;
    return e.test(Iv(r));
  }
  n(jv, "baseIsNative");
  fl.exports = jv;
});

// ../node_modules/lodash/_getValue.js
var ml = y((ZD, hl) => {
  function Gv(r, e) {
    return r?.[e];
  }
  n(Gv, "getValue");
  hl.exports = Gv;
});

// ../node_modules/lodash/_getNative.js
var Ae = y((rN, gl) => {
  var Bv = yl(), Uv = ml();
  function Hv(r, e) {
    var t = Uv(r, e);
    return Bv(t) ? t : void 0;
  }
  n(Hv, "getNative");
  gl.exports = Hv;
});

// ../node_modules/lodash/_defineProperty.js
var ba = y((oN, Sl) => {
  var Vv = Ae(), $v = function() {
    try {
      var r = Vv(Object, "defineProperty");
      return r({}, "", {}), r;
    } catch {
    }
  }();
  Sl.exports = $v;
});

// ../node_modules/lodash/_baseAssignValue.js
var va = y((nN, vl) => {
  var bl = ba();
  function Wv(r, e, t) {
    e == "__proto__" && bl ? bl(r, e, {
      configurable: !0,
      enumerable: !0,
      value: t,
      writable: !0
    }) : r[e] = t;
  }
  n(Wv, "baseAssignValue");
  vl.exports = Wv;
});

// ../node_modules/lodash/_createBaseFor.js
var El = y((iN, Tl) => {
  function zv(r) {
    return function(e, t, o) {
      for (var a = -1, i = Object(e), s = o(e), c = s.length; c--; ) {
        var l = s[r ? c : ++a];
        if (t(i[l], l, i) === !1)
          break;
      }
      return e;
    };
  }
  n(zv, "createBaseFor");
  Tl.exports = zv;
});

// ../node_modules/lodash/_baseFor.js
var Rl = y((lN, Al) => {
  var Yv = El(), Kv = Yv();
  Al.exports = Kv;
});

// ../node_modules/lodash/_baseTimes.js
var xl = y((cN, wl) => {
  function Xv(r, e) {
    for (var t = -1, o = Array(r); ++t < r; )
      o[t] = e(t);
    return o;
  }
  n(Xv, "baseTimes");
  wl.exports = Xv;
});

// ../node_modules/lodash/isObjectLike.js
var Le = y((pN, _l) => {
  function Jv(r) {
    return r != null && typeof r == "object";
  }
  n(Jv, "isObjectLike");
  _l.exports = Jv;
});

// ../node_modules/lodash/_baseIsArguments.js
var Ol = y((fN, Pl) => {
  var Qv = qe(), Zv = Le(), eT = "[object Arguments]";
  function rT(r) {
    return Zv(r) && Qv(r) == eT;
  }
  n(rT, "baseIsArguments");
  Pl.exports = rT;
});

// ../node_modules/lodash/isArguments.js
var eo = y((hN, Fl) => {
  var Cl = Ol(), tT = Le(), Il = Object.prototype, oT = Il.hasOwnProperty, nT = Il.propertyIsEnumerable, aT = Cl(/* @__PURE__ */ function() {
    return arguments;
  }()) ? Cl : function(r) {
    return tT(r) && oT.call(r, "callee") && !nT.call(r, "callee");
  };
  Fl.exports = aT;
});

// ../node_modules/lodash/isArray.js
var se = y((mN, Dl) => {
  var iT = Array.isArray;
  Dl.exports = iT;
});

// ../node_modules/lodash/stubFalse.js
var ql = y((gN, Nl) => {
  function sT() {
    return !1;
  }
  n(sT, "stubFalse");
  Nl.exports = sT;
});

// ../node_modules/lodash/isBuffer.js
var Ta = y((ct, ur) => {
  var lT = ie(), cT = ql(), kl = typeof ct == "object" && ct && !ct.nodeType && ct, Ll = kl && typeof ur == "object" && ur && !ur.nodeType &&
  ur, uT = Ll && Ll.exports === kl, Ml = uT ? lT.Buffer : void 0, pT = Ml ? Ml.isBuffer : void 0, dT = pT || cT;
  ur.exports = dT;
});

// ../node_modules/lodash/_isIndex.js
var ro = y((bN, jl) => {
  var fT = 9007199254740991, yT = /^(?:0|[1-9]\d*)$/;
  function hT(r, e) {
    var t = typeof r;
    return e = e ?? fT, !!e && (t == "number" || t != "symbol" && yT.test(r)) && r > -1 && r % 1 == 0 && r < e;
  }
  n(hT, "isIndex");
  jl.exports = hT;
});

// ../node_modules/lodash/isLength.js
var to = y((TN, Gl) => {
  var mT = 9007199254740991;
  function gT(r) {
    return typeof r == "number" && r > -1 && r % 1 == 0 && r <= mT;
  }
  n(gT, "isLength");
  Gl.exports = gT;
});

// ../node_modules/lodash/_baseIsTypedArray.js
var Ul = y((AN, Bl) => {
  var ST = qe(), bT = to(), vT = Le(), TT = "[object Arguments]", ET = "[object Array]", AT = "[object Boolean]", RT = "[object Date]", wT = "\
[object Error]", xT = "[object Function]", _T = "[object Map]", PT = "[object Number]", OT = "[object Object]", CT = "[object RegExp]", IT = "\
[object Set]", FT = "[object String]", DT = "[object WeakMap]", NT = "[object ArrayBuffer]", qT = "[object DataView]", LT = "[object Float32\
Array]", MT = "[object Float64Array]", kT = "[object Int8Array]", jT = "[object Int16Array]", GT = "[object Int32Array]", BT = "[object Uint\
8Array]", UT = "[object Uint8ClampedArray]", HT = "[object Uint16Array]", VT = "[object Uint32Array]", L = {};
  L[LT] = L[MT] = L[kT] = L[jT] = L[GT] = L[BT] = L[UT] = L[HT] = L[VT] = !0;
  L[TT] = L[ET] = L[NT] = L[AT] = L[qT] = L[RT] = L[wT] = L[xT] = L[_T] = L[PT] = L[OT] = L[CT] = L[IT] = L[FT] = L[DT] = !1;
  function $T(r) {
    return vT(r) && bT(r.length) && !!L[ST(r)];
  }
  n($T, "baseIsTypedArray");
  Bl.exports = $T;
});

// ../node_modules/lodash/_baseUnary.js
var Vl = y((wN, Hl) => {
  function WT(r) {
    return function(e) {
      return r(e);
    };
  }
  n(WT, "baseUnary");
  Hl.exports = WT;
});

// ../node_modules/lodash/_nodeUtil.js
var Wl = y((ut, pr) => {
  var zT = ha(), $l = typeof ut == "object" && ut && !ut.nodeType && ut, pt = $l && typeof pr == "object" && pr && !pr.nodeType && pr, YT = pt &&
  pt.exports === $l, Ea = YT && zT.process, KT = function() {
    try {
      var r = pt && pt.require && pt.require("util").types;
      return r || Ea && Ea.binding && Ea.binding("util");
    } catch {
    }
  }();
  pr.exports = KT;
});

// ../node_modules/lodash/isTypedArray.js
var Aa = y((_N, Kl) => {
  var XT = Ul(), JT = Vl(), zl = Wl(), Yl = zl && zl.isTypedArray, QT = Yl ? JT(Yl) : XT;
  Kl.exports = QT;
});

// ../node_modules/lodash/_arrayLikeKeys.js
var Ra = y((PN, Xl) => {
  var ZT = xl(), eE = eo(), rE = se(), tE = Ta(), oE = ro(), nE = Aa(), aE = Object.prototype, iE = aE.hasOwnProperty;
  function sE(r, e) {
    var t = rE(r), o = !t && eE(r), a = !t && !o && tE(r), i = !t && !o && !a && nE(r), s = t || o || a || i, c = s ? ZT(r.length, String) :
    [], l = c.length;
    for (var u in r)
      (e || iE.call(r, u)) && !(s && // Safari 9 has enumerable `arguments.length` in strict mode.
      (u == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
      a && (u == "offset" || u == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
      i && (u == "buffer" || u == "byteLength" || u == "byteOffset") || // Skip index properties.
      oE(u, l))) && c.push(u);
    return c;
  }
  n(sE, "arrayLikeKeys");
  Xl.exports = sE;
});

// ../node_modules/lodash/_isPrototype.js
var wa = y((CN, Jl) => {
  var lE = Object.prototype;
  function cE(r) {
    var e = r && r.constructor, t = typeof e == "function" && e.prototype || lE;
    return r === t;
  }
  n(cE, "isPrototype");
  Jl.exports = cE;
});

// ../node_modules/lodash/_overArg.js
var xa = y((FN, Ql) => {
  function uE(r, e) {
    return function(t) {
      return r(e(t));
    };
  }
  n(uE, "overArg");
  Ql.exports = uE;
});

// ../node_modules/lodash/_nativeKeys.js
var ec = y((NN, Zl) => {
  var pE = xa(), dE = pE(Object.keys, Object);
  Zl.exports = dE;
});

// ../node_modules/lodash/_baseKeys.js
var tc = y((qN, rc) => {
  var fE = wa(), yE = ec(), hE = Object.prototype, mE = hE.hasOwnProperty;
  function gE(r) {
    if (!fE(r))
      return yE(r);
    var e = [];
    for (var t in Object(r))
      mE.call(r, t) && t != "constructor" && e.push(t);
    return e;
  }
  n(gE, "baseKeys");
  rc.exports = gE;
});

// ../node_modules/lodash/isArrayLike.js
var _a = y((MN, oc) => {
  var SE = ma(), bE = to();
  function vE(r) {
    return r != null && bE(r.length) && !SE(r);
  }
  n(vE, "isArrayLike");
  oc.exports = vE;
});

// ../node_modules/lodash/keys.js
var oo = y((jN, nc) => {
  var TE = Ra(), EE = tc(), AE = _a();
  function RE(r) {
    return AE(r) ? TE(r) : EE(r);
  }
  n(RE, "keys");
  nc.exports = RE;
});

// ../node_modules/lodash/_baseForOwn.js
var ic = y((BN, ac) => {
  var wE = Rl(), xE = oo();
  function _E(r, e) {
    return r && wE(r, e, xE);
  }
  n(_E, "baseForOwn");
  ac.exports = _E;
});

// ../node_modules/lodash/_listCacheClear.js
var lc = y((HN, sc) => {
  function PE() {
    this.__data__ = [], this.size = 0;
  }
  n(PE, "listCacheClear");
  sc.exports = PE;
});

// ../node_modules/lodash/eq.js
var no = y(($N, cc) => {
  function OE(r, e) {
    return r === e || r !== r && e !== e;
  }
  n(OE, "eq");
  cc.exports = OE;
});

// ../node_modules/lodash/_assocIndexOf.js
var dt = y((zN, uc) => {
  var CE = no();
  function IE(r, e) {
    for (var t = r.length; t--; )
      if (CE(r[t][0], e))
        return t;
    return -1;
  }
  n(IE, "assocIndexOf");
  uc.exports = IE;
});

// ../node_modules/lodash/_listCacheDelete.js
var dc = y((KN, pc) => {
  var FE = dt(), DE = Array.prototype, NE = DE.splice;
  function qE(r) {
    var e = this.__data__, t = FE(e, r);
    if (t < 0)
      return !1;
    var o = e.length - 1;
    return t == o ? e.pop() : NE.call(e, t, 1), --this.size, !0;
  }
  n(qE, "listCacheDelete");
  pc.exports = qE;
});

// ../node_modules/lodash/_listCacheGet.js
var yc = y((JN, fc) => {
  var LE = dt();
  function ME(r) {
    var e = this.__data__, t = LE(e, r);
    return t < 0 ? void 0 : e[t][1];
  }
  n(ME, "listCacheGet");
  fc.exports = ME;
});

// ../node_modules/lodash/_listCacheHas.js
var mc = y((ZN, hc) => {
  var kE = dt();
  function jE(r) {
    return kE(this.__data__, r) > -1;
  }
  n(jE, "listCacheHas");
  hc.exports = jE;
});

// ../node_modules/lodash/_listCacheSet.js
var Sc = y((rq, gc) => {
  var GE = dt();
  function BE(r, e) {
    var t = this.__data__, o = GE(t, r);
    return o < 0 ? (++this.size, t.push([r, e])) : t[o][1] = e, this;
  }
  n(BE, "listCacheSet");
  gc.exports = BE;
});

// ../node_modules/lodash/_ListCache.js
var ft = y((oq, bc) => {
  var UE = lc(), HE = dc(), VE = yc(), $E = mc(), WE = Sc();
  function dr(r) {
    var e = -1, t = r == null ? 0 : r.length;
    for (this.clear(); ++e < t; ) {
      var o = r[e];
      this.set(o[0], o[1]);
    }
  }
  n(dr, "ListCache");
  dr.prototype.clear = UE;
  dr.prototype.delete = HE;
  dr.prototype.get = VE;
  dr.prototype.has = $E;
  dr.prototype.set = WE;
  bc.exports = dr;
});

// ../node_modules/lodash/_stackClear.js
var Tc = y((aq, vc) => {
  var zE = ft();
  function YE() {
    this.__data__ = new zE(), this.size = 0;
  }
  n(YE, "stackClear");
  vc.exports = YE;
});

// ../node_modules/lodash/_stackDelete.js
var Ac = y((sq, Ec) => {
  function KE(r) {
    var e = this.__data__, t = e.delete(r);
    return this.size = e.size, t;
  }
  n(KE, "stackDelete");
  Ec.exports = KE;
});

// ../node_modules/lodash/_stackGet.js
var wc = y((cq, Rc) => {
  function XE(r) {
    return this.__data__.get(r);
  }
  n(XE, "stackGet");
  Rc.exports = XE;
});

// ../node_modules/lodash/_stackHas.js
var _c = y((pq, xc) => {
  function JE(r) {
    return this.__data__.has(r);
  }
  n(JE, "stackHas");
  xc.exports = JE;
});

// ../node_modules/lodash/_Map.js
var ao = y((fq, Pc) => {
  var QE = Ae(), ZE = ie(), eA = QE(ZE, "Map");
  Pc.exports = eA;
});

// ../node_modules/lodash/_nativeCreate.js
var yt = y((yq, Oc) => {
  var rA = Ae(), tA = rA(Object, "create");
  Oc.exports = tA;
});

// ../node_modules/lodash/_hashClear.js
var Fc = y((hq, Ic) => {
  var Cc = yt();
  function oA() {
    this.__data__ = Cc ? Cc(null) : {}, this.size = 0;
  }
  n(oA, "hashClear");
  Ic.exports = oA;
});

// ../node_modules/lodash/_hashDelete.js
var Nc = y((gq, Dc) => {
  function nA(r) {
    var e = this.has(r) && delete this.__data__[r];
    return this.size -= e ? 1 : 0, e;
  }
  n(nA, "hashDelete");
  Dc.exports = nA;
});

// ../node_modules/lodash/_hashGet.js
var Lc = y((bq, qc) => {
  var aA = yt(), iA = "__lodash_hash_undefined__", sA = Object.prototype, lA = sA.hasOwnProperty;
  function cA(r) {
    var e = this.__data__;
    if (aA) {
      var t = e[r];
      return t === iA ? void 0 : t;
    }
    return lA.call(e, r) ? e[r] : void 0;
  }
  n(cA, "hashGet");
  qc.exports = cA;
});

// ../node_modules/lodash/_hashHas.js
var kc = y((Tq, Mc) => {
  var uA = yt(), pA = Object.prototype, dA = pA.hasOwnProperty;
  function fA(r) {
    var e = this.__data__;
    return uA ? e[r] !== void 0 : dA.call(e, r);
  }
  n(fA, "hashHas");
  Mc.exports = fA;
});

// ../node_modules/lodash/_hashSet.js
var Gc = y((Aq, jc) => {
  var yA = yt(), hA = "__lodash_hash_undefined__";
  function mA(r, e) {
    var t = this.__data__;
    return this.size += this.has(r) ? 0 : 1, t[r] = yA && e === void 0 ? hA : e, this;
  }
  n(mA, "hashSet");
  jc.exports = mA;
});

// ../node_modules/lodash/_Hash.js
var Uc = y((wq, Bc) => {
  var gA = Fc(), SA = Nc(), bA = Lc(), vA = kc(), TA = Gc();
  function fr(r) {
    var e = -1, t = r == null ? 0 : r.length;
    for (this.clear(); ++e < t; ) {
      var o = r[e];
      this.set(o[0], o[1]);
    }
  }
  n(fr, "Hash");
  fr.prototype.clear = gA;
  fr.prototype.delete = SA;
  fr.prototype.get = bA;
  fr.prototype.has = vA;
  fr.prototype.set = TA;
  Bc.exports = fr;
});

// ../node_modules/lodash/_mapCacheClear.js
var $c = y((_q, Vc) => {
  var Hc = Uc(), EA = ft(), AA = ao();
  function RA() {
    this.size = 0, this.__data__ = {
      hash: new Hc(),
      map: new (AA || EA)(),
      string: new Hc()
    };
  }
  n(RA, "mapCacheClear");
  Vc.exports = RA;
});

// ../node_modules/lodash/_isKeyable.js
var zc = y((Oq, Wc) => {
  function wA(r) {
    var e = typeof r;
    return e == "string" || e == "number" || e == "symbol" || e == "boolean" ? r !== "__proto__" : r === null;
  }
  n(wA, "isKeyable");
  Wc.exports = wA;
});

// ../node_modules/lodash/_getMapData.js
var ht = y((Iq, Yc) => {
  var xA = zc();
  function _A(r, e) {
    var t = r.__data__;
    return xA(e) ? t[typeof e == "string" ? "string" : "hash"] : t.map;
  }
  n(_A, "getMapData");
  Yc.exports = _A;
});

// ../node_modules/lodash/_mapCacheDelete.js
var Xc = y((Dq, Kc) => {
  var PA = ht();
  function OA(r) {
    var e = PA(this, r).delete(r);
    return this.size -= e ? 1 : 0, e;
  }
  n(OA, "mapCacheDelete");
  Kc.exports = OA;
});

// ../node_modules/lodash/_mapCacheGet.js
var Qc = y((qq, Jc) => {
  var CA = ht();
  function IA(r) {
    return CA(this, r).get(r);
  }
  n(IA, "mapCacheGet");
  Jc.exports = IA;
});

// ../node_modules/lodash/_mapCacheHas.js
var eu = y((Mq, Zc) => {
  var FA = ht();
  function DA(r) {
    return FA(this, r).has(r);
  }
  n(DA, "mapCacheHas");
  Zc.exports = DA;
});

// ../node_modules/lodash/_mapCacheSet.js
var tu = y((jq, ru) => {
  var NA = ht();
  function qA(r, e) {
    var t = NA(this, r), o = t.size;
    return t.set(r, e), this.size += t.size == o ? 0 : 1, this;
  }
  n(qA, "mapCacheSet");
  ru.exports = qA;
});

// ../node_modules/lodash/_MapCache.js
var io = y((Bq, ou) => {
  var LA = $c(), MA = Xc(), kA = Qc(), jA = eu(), GA = tu();
  function yr(r) {
    var e = -1, t = r == null ? 0 : r.length;
    for (this.clear(); ++e < t; ) {
      var o = r[e];
      this.set(o[0], o[1]);
    }
  }
  n(yr, "MapCache");
  yr.prototype.clear = LA;
  yr.prototype.delete = MA;
  yr.prototype.get = kA;
  yr.prototype.has = jA;
  yr.prototype.set = GA;
  ou.exports = yr;
});

// ../node_modules/lodash/_stackSet.js
var au = y((Hq, nu) => {
  var BA = ft(), UA = ao(), HA = io(), VA = 200;
  function $A(r, e) {
    var t = this.__data__;
    if (t instanceof BA) {
      var o = t.__data__;
      if (!UA || o.length < VA - 1)
        return o.push([r, e]), this.size = ++t.size, this;
      t = this.__data__ = new HA(o);
    }
    return t.set(r, e), this.size = t.size, this;
  }
  n($A, "stackSet");
  nu.exports = $A;
});

// ../node_modules/lodash/_Stack.js
var Pa = y(($q, iu) => {
  var WA = ft(), zA = Tc(), YA = Ac(), KA = wc(), XA = _c(), JA = au();
  function hr(r) {
    var e = this.__data__ = new WA(r);
    this.size = e.size;
  }
  n(hr, "Stack");
  hr.prototype.clear = zA;
  hr.prototype.delete = YA;
  hr.prototype.get = KA;
  hr.prototype.has = XA;
  hr.prototype.set = JA;
  iu.exports = hr;
});

// ../node_modules/lodash/_setCacheAdd.js
var lu = y((zq, su) => {
  var QA = "__lodash_hash_undefined__";
  function ZA(r) {
    return this.__data__.set(r, QA), this;
  }
  n(ZA, "setCacheAdd");
  su.exports = ZA;
});

// ../node_modules/lodash/_setCacheHas.js
var uu = y((Kq, cu) => {
  function eR(r) {
    return this.__data__.has(r);
  }
  n(eR, "setCacheHas");
  cu.exports = eR;
});

// ../node_modules/lodash/_SetCache.js
var du = y((Jq, pu) => {
  var rR = io(), tR = lu(), oR = uu();
  function so(r) {
    var e = -1, t = r == null ? 0 : r.length;
    for (this.__data__ = new rR(); ++e < t; )
      this.add(r[e]);
  }
  n(so, "SetCache");
  so.prototype.add = so.prototype.push = tR;
  so.prototype.has = oR;
  pu.exports = so;
});

// ../node_modules/lodash/_arraySome.js
var yu = y((Zq, fu) => {
  function nR(r, e) {
    for (var t = -1, o = r == null ? 0 : r.length; ++t < o; )
      if (e(r[t], t, r))
        return !0;
    return !1;
  }
  n(nR, "arraySome");
  fu.exports = nR;
});

// ../node_modules/lodash/_cacheHas.js
var mu = y((r0, hu) => {
  function aR(r, e) {
    return r.has(e);
  }
  n(aR, "cacheHas");
  hu.exports = aR;
});

// ../node_modules/lodash/_equalArrays.js
var Oa = y((o0, gu) => {
  var iR = du(), sR = yu(), lR = mu(), cR = 1, uR = 2;
  function pR(r, e, t, o, a, i) {
    var s = t & cR, c = r.length, l = e.length;
    if (c != l && !(s && l > c))
      return !1;
    var u = i.get(r), p = i.get(e);
    if (u && p)
      return u == e && p == r;
    var h = -1, d = !0, g = t & uR ? new iR() : void 0;
    for (i.set(r, e), i.set(e, r); ++h < c; ) {
      var m = r[h], b = e[h];
      if (o)
        var S = s ? o(b, m, h, e, r, i) : o(m, b, h, r, e, i);
      if (S !== void 0) {
        if (S)
          continue;
        d = !1;
        break;
      }
      if (g) {
        if (!sR(e, function(T, v) {
          if (!lR(g, v) && (m === T || a(m, T, t, o, i)))
            return g.push(v);
        })) {
          d = !1;
          break;
        }
      } else if (!(m === b || a(m, b, t, o, i))) {
        d = !1;
        break;
      }
    }
    return i.delete(r), i.delete(e), d;
  }
  n(pR, "equalArrays");
  gu.exports = pR;
});

// ../node_modules/lodash/_Uint8Array.js
var bu = y((a0, Su) => {
  var dR = ie(), fR = dR.Uint8Array;
  Su.exports = fR;
});

// ../node_modules/lodash/_mapToArray.js
var Tu = y((i0, vu) => {
  function yR(r) {
    var e = -1, t = Array(r.size);
    return r.forEach(function(o, a) {
      t[++e] = [a, o];
    }), t;
  }
  n(yR, "mapToArray");
  vu.exports = yR;
});

// ../node_modules/lodash/_setToArray.js
var Au = y((l0, Eu) => {
  function hR(r) {
    var e = -1, t = Array(r.size);
    return r.forEach(function(o) {
      t[++e] = o;
    }), t;
  }
  n(hR, "setToArray");
  Eu.exports = hR;
});

// ../node_modules/lodash/_equalByTag.js
var Pu = y((u0, _u) => {
  var Ru = lr(), wu = bu(), mR = no(), gR = Oa(), SR = Tu(), bR = Au(), vR = 1, TR = 2, ER = "[object Boolean]", AR = "[object Date]", RR = "\
[object Error]", wR = "[object Map]", xR = "[object Number]", _R = "[object RegExp]", PR = "[object Set]", OR = "[object String]", CR = "[ob\
ject Symbol]", IR = "[object ArrayBuffer]", FR = "[object DataView]", xu = Ru ? Ru.prototype : void 0, Ca = xu ? xu.valueOf : void 0;
  function DR(r, e, t, o, a, i, s) {
    switch (t) {
      case FR:
        if (r.byteLength != e.byteLength || r.byteOffset != e.byteOffset)
          return !1;
        r = r.buffer, e = e.buffer;
      case IR:
        return !(r.byteLength != e.byteLength || !i(new wu(r), new wu(e)));
      case ER:
      case AR:
      case xR:
        return mR(+r, +e);
      case RR:
        return r.name == e.name && r.message == e.message;
      case _R:
      case OR:
        return r == e + "";
      case wR:
        var c = SR;
      case PR:
        var l = o & vR;
        if (c || (c = bR), r.size != e.size && !l)
          return !1;
        var u = s.get(r);
        if (u)
          return u == e;
        o |= TR, s.set(r, e);
        var p = gR(c(r), c(e), o, a, i, s);
        return s.delete(r), p;
      case CR:
        if (Ca)
          return Ca.call(r) == Ca.call(e);
    }
    return !1;
  }
  n(DR, "equalByTag");
  _u.exports = DR;
});

// ../node_modules/lodash/_arrayPush.js
var lo = y((d0, Ou) => {
  function NR(r, e) {
    for (var t = -1, o = e.length, a = r.length; ++t < o; )
      r[a + t] = e[t];
    return r;
  }
  n(NR, "arrayPush");
  Ou.exports = NR;
});

// ../node_modules/lodash/_baseGetAllKeys.js
var Ia = y((y0, Cu) => {
  var qR = lo(), LR = se();
  function MR(r, e, t) {
    var o = e(r);
    return LR(r) ? o : qR(o, t(r));
  }
  n(MR, "baseGetAllKeys");
  Cu.exports = MR;
});

// ../node_modules/lodash/_arrayFilter.js
var Fu = y((m0, Iu) => {
  function kR(r, e) {
    for (var t = -1, o = r == null ? 0 : r.length, a = 0, i = []; ++t < o; ) {
      var s = r[t];
      e(s, t, r) && (i[a++] = s);
    }
    return i;
  }
  n(kR, "arrayFilter");
  Iu.exports = kR;
});

// ../node_modules/lodash/stubArray.js
var Fa = y((S0, Du) => {
  function jR() {
    return [];
  }
  n(jR, "stubArray");
  Du.exports = jR;
});

// ../node_modules/lodash/_getSymbols.js
var Da = y((v0, qu) => {
  var GR = Fu(), BR = Fa(), UR = Object.prototype, HR = UR.propertyIsEnumerable, Nu = Object.getOwnPropertySymbols, VR = Nu ? function(r) {
    return r == null ? [] : (r = Object(r), GR(Nu(r), function(e) {
      return HR.call(r, e);
    }));
  } : BR;
  qu.exports = VR;
});

// ../node_modules/lodash/_getAllKeys.js
var Mu = y((T0, Lu) => {
  var $R = Ia(), WR = Da(), zR = oo();
  function YR(r) {
    return $R(r, zR, WR);
  }
  n(YR, "getAllKeys");
  Lu.exports = YR;
});

// ../node_modules/lodash/_equalObjects.js
var Gu = y((A0, ju) => {
  var ku = Mu(), KR = 1, XR = Object.prototype, JR = XR.hasOwnProperty;
  function QR(r, e, t, o, a, i) {
    var s = t & KR, c = ku(r), l = c.length, u = ku(e), p = u.length;
    if (l != p && !s)
      return !1;
    for (var h = l; h--; ) {
      var d = c[h];
      if (!(s ? d in e : JR.call(e, d)))
        return !1;
    }
    var g = i.get(r), m = i.get(e);
    if (g && m)
      return g == e && m == r;
    var b = !0;
    i.set(r, e), i.set(e, r);
    for (var S = s; ++h < l; ) {
      d = c[h];
      var T = r[d], v = e[d];
      if (o)
        var E = s ? o(v, T, d, e, r, i) : o(T, v, d, r, e, i);
      if (!(E === void 0 ? T === v || a(T, v, t, o, i) : E)) {
        b = !1;
        break;
      }
      S || (S = d == "constructor");
    }
    if (b && !S) {
      var R = r.constructor, w = e.constructor;
      R != w && "constructor" in r && "constructor" in e && !(typeof R == "function" && R instanceof R && typeof w == "function" && w instanceof
      w) && (b = !1);
    }
    return i.delete(r), i.delete(e), b;
  }
  n(QR, "equalObjects");
  ju.exports = QR;
});

// ../node_modules/lodash/_DataView.js
var Uu = y((w0, Bu) => {
  var ZR = Ae(), ew = ie(), rw = ZR(ew, "DataView");
  Bu.exports = rw;
});

// ../node_modules/lodash/_Promise.js
var Vu = y((x0, Hu) => {
  var tw = Ae(), ow = ie(), nw = tw(ow, "Promise");
  Hu.exports = nw;
});

// ../node_modules/lodash/_Set.js
var Wu = y((_0, $u) => {
  var aw = Ae(), iw = ie(), sw = aw(iw, "Set");
  $u.exports = sw;
});

// ../node_modules/lodash/_WeakMap.js
var Yu = y((P0, zu) => {
  var lw = Ae(), cw = ie(), uw = lw(cw, "WeakMap");
  zu.exports = uw;
});

// ../node_modules/lodash/_getTag.js
var tp = y((O0, rp) => {
  var Na = Uu(), qa = ao(), La = Vu(), Ma = Wu(), ka = Yu(), ep = qe(), mr = Sa(), Ku = "[object Map]", pw = "[object Object]", Xu = "[objec\
t Promise]", Ju = "[object Set]", Qu = "[object WeakMap]", Zu = "[object DataView]", dw = mr(Na), fw = mr(qa), yw = mr(La), hw = mr(Ma), mw = mr(
  ka), Me = ep;
  (Na && Me(new Na(new ArrayBuffer(1))) != Zu || qa && Me(new qa()) != Ku || La && Me(La.resolve()) != Xu || Ma && Me(new Ma()) != Ju || ka &&
  Me(new ka()) != Qu) && (Me = /* @__PURE__ */ n(function(r) {
    var e = ep(r), t = e == pw ? r.constructor : void 0, o = t ? mr(t) : "";
    if (o)
      switch (o) {
        case dw:
          return Zu;
        case fw:
          return Ku;
        case yw:
          return Xu;
        case hw:
          return Ju;
        case mw:
          return Qu;
      }
    return e;
  }, "getTag"));
  rp.exports = Me;
});

// ../node_modules/lodash/_baseIsEqualDeep.js
var up = y((I0, cp) => {
  var ja = Pa(), gw = Oa(), Sw = Pu(), bw = Gu(), op = tp(), np = se(), ap = Ta(), vw = Aa(), Tw = 1, ip = "[object Arguments]", sp = "[obje\
ct Array]", co = "[object Object]", Ew = Object.prototype, lp = Ew.hasOwnProperty;
  function Aw(r, e, t, o, a, i) {
    var s = np(r), c = np(e), l = s ? sp : op(r), u = c ? sp : op(e);
    l = l == ip ? co : l, u = u == ip ? co : u;
    var p = l == co, h = u == co, d = l == u;
    if (d && ap(r)) {
      if (!ap(e))
        return !1;
      s = !0, p = !1;
    }
    if (d && !p)
      return i || (i = new ja()), s || vw(r) ? gw(r, e, t, o, a, i) : Sw(r, e, l, t, o, a, i);
    if (!(t & Tw)) {
      var g = p && lp.call(r, "__wrapped__"), m = h && lp.call(e, "__wrapped__");
      if (g || m) {
        var b = g ? r.value() : r, S = m ? e.value() : e;
        return i || (i = new ja()), a(b, S, t, o, i);
      }
    }
    return d ? (i || (i = new ja()), bw(r, e, t, o, a, i)) : !1;
  }
  n(Aw, "baseIsEqualDeep");
  cp.exports = Aw;
});

// ../node_modules/lodash/_baseIsEqual.js
var Ga = y((D0, fp) => {
  var Rw = up(), pp = Le();
  function dp(r, e, t, o, a) {
    return r === e ? !0 : r == null || e == null || !pp(r) && !pp(e) ? r !== r && e !== e : Rw(r, e, t, o, dp, a);
  }
  n(dp, "baseIsEqual");
  fp.exports = dp;
});

// ../node_modules/lodash/_baseIsMatch.js
var hp = y((q0, yp) => {
  var ww = Pa(), xw = Ga(), _w = 1, Pw = 2;
  function Ow(r, e, t, o) {
    var a = t.length, i = a, s = !o;
    if (r == null)
      return !i;
    for (r = Object(r); a--; ) {
      var c = t[a];
      if (s && c[2] ? c[1] !== r[c[0]] : !(c[0] in r))
        return !1;
    }
    for (; ++a < i; ) {
      c = t[a];
      var l = c[0], u = r[l], p = c[1];
      if (s && c[2]) {
        if (u === void 0 && !(l in r))
          return !1;
      } else {
        var h = new ww();
        if (o)
          var d = o(u, p, l, r, e, h);
        if (!(d === void 0 ? xw(p, u, _w | Pw, o, h) : d))
          return !1;
      }
    }
    return !0;
  }
  n(Ow, "baseIsMatch");
  yp.exports = Ow;
});

// ../node_modules/lodash/_isStrictComparable.js
var Ba = y((M0, mp) => {
  var Cw = cr();
  function Iw(r) {
    return r === r && !Cw(r);
  }
  n(Iw, "isStrictComparable");
  mp.exports = Iw;
});

// ../node_modules/lodash/_getMatchData.js
var Sp = y((j0, gp) => {
  var Fw = Ba(), Dw = oo();
  function Nw(r) {
    for (var e = Dw(r), t = e.length; t--; ) {
      var o = e[t], a = r[o];
      e[t] = [o, a, Fw(a)];
    }
    return e;
  }
  n(Nw, "getMatchData");
  gp.exports = Nw;
});

// ../node_modules/lodash/_matchesStrictComparable.js
var Ua = y((B0, bp) => {
  function qw(r, e) {
    return function(t) {
      return t == null ? !1 : t[r] === e && (e !== void 0 || r in Object(t));
    };
  }
  n(qw, "matchesStrictComparable");
  bp.exports = qw;
});

// ../node_modules/lodash/_baseMatches.js
var Tp = y((H0, vp) => {
  var Lw = hp(), Mw = Sp(), kw = Ua();
  function jw(r) {
    var e = Mw(r);
    return e.length == 1 && e[0][2] ? kw(e[0][0], e[0][1]) : function(t) {
      return t === r || Lw(t, r, e);
    };
  }
  n(jw, "baseMatches");
  vp.exports = jw;
});

// ../node_modules/lodash/isSymbol.js
var uo = y(($0, Ep) => {
  var Gw = qe(), Bw = Le(), Uw = "[object Symbol]";
  function Hw(r) {
    return typeof r == "symbol" || Bw(r) && Gw(r) == Uw;
  }
  n(Hw, "isSymbol");
  Ep.exports = Hw;
});

// ../node_modules/lodash/_isKey.js
var po = y((z0, Ap) => {
  var Vw = se(), $w = uo(), Ww = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, zw = /^\w*$/;
  function Yw(r, e) {
    if (Vw(r))
      return !1;
    var t = typeof r;
    return t == "number" || t == "symbol" || t == "boolean" || r == null || $w(r) ? !0 : zw.test(r) || !Ww.test(r) || e != null && r in Object(
    e);
  }
  n(Yw, "isKey");
  Ap.exports = Yw;
});

// ../node_modules/lodash/memoize.js
var xp = y((K0, wp) => {
  var Rp = io(), Kw = "Expected a function";
  function Ha(r, e) {
    if (typeof r != "function" || e != null && typeof e != "function")
      throw new TypeError(Kw);
    var t = /* @__PURE__ */ n(function() {
      var o = arguments, a = e ? e.apply(this, o) : o[0], i = t.cache;
      if (i.has(a))
        return i.get(a);
      var s = r.apply(this, o);
      return t.cache = i.set(a, s) || i, s;
    }, "memoized");
    return t.cache = new (Ha.Cache || Rp)(), t;
  }
  n(Ha, "memoize");
  Ha.Cache = Rp;
  wp.exports = Ha;
});

// ../node_modules/lodash/_memoizeCapped.js
var Pp = y((J0, _p) => {
  var Xw = xp(), Jw = 500;
  function Qw(r) {
    var e = Xw(r, function(o) {
      return t.size === Jw && t.clear(), o;
    }), t = e.cache;
    return e;
  }
  n(Qw, "memoizeCapped");
  _p.exports = Qw;
});

// ../node_modules/lodash/_stringToPath.js
var Cp = y((Z0, Op) => {
  var Zw = Pp(), ex = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, rx = /\\(\\)?/g, tx = Zw(
  function(r) {
    var e = [];
    return r.charCodeAt(0) === 46 && e.push(""), r.replace(ex, function(t, o, a, i) {
      e.push(a ? i.replace(rx, "$1") : o || t);
    }), e;
  });
  Op.exports = tx;
});

// ../node_modules/lodash/_arrayMap.js
var Va = y((eL, Ip) => {
  function ox(r, e) {
    for (var t = -1, o = r == null ? 0 : r.length, a = Array(o); ++t < o; )
      a[t] = e(r[t], t, r);
    return a;
  }
  n(ox, "arrayMap");
  Ip.exports = ox;
});

// ../node_modules/lodash/_baseToString.js
var Mp = y((tL, Lp) => {
  var Fp = lr(), nx = Va(), ax = se(), ix = uo(), sx = 1 / 0, Dp = Fp ? Fp.prototype : void 0, Np = Dp ? Dp.toString : void 0;
  function qp(r) {
    if (typeof r == "string")
      return r;
    if (ax(r))
      return nx(r, qp) + "";
    if (ix(r))
      return Np ? Np.call(r) : "";
    var e = r + "";
    return e == "0" && 1 / r == -sx ? "-0" : e;
  }
  n(qp, "baseToString");
  Lp.exports = qp;
});

// ../node_modules/lodash/toString.js
var jp = y((nL, kp) => {
  var lx = Mp();
  function cx(r) {
    return r == null ? "" : lx(r);
  }
  n(cx, "toString");
  kp.exports = cx;
});

// ../node_modules/lodash/_castPath.js
var mt = y((iL, Gp) => {
  var ux = se(), px = po(), dx = Cp(), fx = jp();
  function yx(r, e) {
    return ux(r) ? r : px(r, e) ? [r] : dx(fx(r));
  }
  n(yx, "castPath");
  Gp.exports = yx;
});

// ../node_modules/lodash/_toKey.js
var gr = y((lL, Bp) => {
  var hx = uo(), mx = 1 / 0;
  function gx(r) {
    if (typeof r == "string" || hx(r))
      return r;
    var e = r + "";
    return e == "0" && 1 / r == -mx ? "-0" : e;
  }
  n(gx, "toKey");
  Bp.exports = gx;
});

// ../node_modules/lodash/_baseGet.js
var fo = y((uL, Up) => {
  var Sx = mt(), bx = gr();
  function vx(r, e) {
    e = Sx(e, r);
    for (var t = 0, o = e.length; r != null && t < o; )
      r = r[bx(e[t++])];
    return t && t == o ? r : void 0;
  }
  n(vx, "baseGet");
  Up.exports = vx;
});

// ../node_modules/lodash/get.js
var Vp = y((dL, Hp) => {
  var Tx = fo();
  function Ex(r, e, t) {
    var o = r == null ? void 0 : Tx(r, e);
    return o === void 0 ? t : o;
  }
  n(Ex, "get");
  Hp.exports = Ex;
});

// ../node_modules/lodash/_baseHasIn.js
var Wp = y((yL, $p) => {
  function Ax(r, e) {
    return r != null && e in Object(r);
  }
  n(Ax, "baseHasIn");
  $p.exports = Ax;
});

// ../node_modules/lodash/_hasPath.js
var Yp = y((mL, zp) => {
  var Rx = mt(), wx = eo(), xx = se(), _x = ro(), Px = to(), Ox = gr();
  function Cx(r, e, t) {
    e = Rx(e, r);
    for (var o = -1, a = e.length, i = !1; ++o < a; ) {
      var s = Ox(e[o]);
      if (!(i = r != null && t(r, s)))
        break;
      r = r[s];
    }
    return i || ++o != a ? i : (a = r == null ? 0 : r.length, !!a && Px(a) && _x(s, a) && (xx(r) || wx(r)));
  }
  n(Cx, "hasPath");
  zp.exports = Cx;
});

// ../node_modules/lodash/hasIn.js
var $a = y((SL, Kp) => {
  var Ix = Wp(), Fx = Yp();
  function Dx(r, e) {
    return r != null && Fx(r, e, Ix);
  }
  n(Dx, "hasIn");
  Kp.exports = Dx;
});

// ../node_modules/lodash/_baseMatchesProperty.js
var Jp = y((vL, Xp) => {
  var Nx = Ga(), qx = Vp(), Lx = $a(), Mx = po(), kx = Ba(), jx = Ua(), Gx = gr(), Bx = 1, Ux = 2;
  function Hx(r, e) {
    return Mx(r) && kx(e) ? jx(Gx(r), e) : function(t) {
      var o = qx(t, r);
      return o === void 0 && o === e ? Lx(t, r) : Nx(e, o, Bx | Ux);
    };
  }
  n(Hx, "baseMatchesProperty");
  Xp.exports = Hx;
});

// ../node_modules/lodash/identity.js
var Wa = y((EL, Qp) => {
  function Vx(r) {
    return r;
  }
  n(Vx, "identity");
  Qp.exports = Vx;
});

// ../node_modules/lodash/_baseProperty.js
var ed = y((RL, Zp) => {
  function $x(r) {
    return function(e) {
      return e?.[r];
    };
  }
  n($x, "baseProperty");
  Zp.exports = $x;
});

// ../node_modules/lodash/_basePropertyDeep.js
var td = y((xL, rd) => {
  var Wx = fo();
  function zx(r) {
    return function(e) {
      return Wx(e, r);
    };
  }
  n(zx, "basePropertyDeep");
  rd.exports = zx;
});

// ../node_modules/lodash/property.js
var nd = y((PL, od) => {
  var Yx = ed(), Kx = td(), Xx = po(), Jx = gr();
  function Qx(r) {
    return Xx(r) ? Yx(Jx(r)) : Kx(r);
  }
  n(Qx, "property");
  od.exports = Qx;
});

// ../node_modules/lodash/_baseIteratee.js
var za = y((CL, ad) => {
  var Zx = Tp(), e_ = Jp(), r_ = Wa(), t_ = se(), o_ = nd();
  function n_(r) {
    return typeof r == "function" ? r : r == null ? r_ : typeof r == "object" ? t_(r) ? e_(r[0], r[1]) : Zx(r) : o_(r);
  }
  n(n_, "baseIteratee");
  ad.exports = n_;
});

// ../node_modules/lodash/mapValues.js
var gt = y((FL, id) => {
  var a_ = va(), i_ = ic(), s_ = za();
  function l_(r, e) {
    var t = {};
    return e = s_(e, 3), i_(r, function(o, a, i) {
      a_(t, a, e(o, a, i));
    }), t;
  }
  n(l_, "mapValues");
  id.exports = l_;
});

// ../node_modules/lodash/_assignValue.js
var ld = y((NL, sd) => {
  var c_ = va(), u_ = no(), p_ = Object.prototype, d_ = p_.hasOwnProperty;
  function f_(r, e, t) {
    var o = r[e];
    (!(d_.call(r, e) && u_(o, t)) || t === void 0 && !(e in r)) && c_(r, e, t);
  }
  n(f_, "assignValue");
  sd.exports = f_;
});

// ../node_modules/lodash/_baseSet.js
var pd = y((LL, ud) => {
  var y_ = ld(), h_ = mt(), m_ = ro(), cd = cr(), g_ = gr();
  function S_(r, e, t, o) {
    if (!cd(r))
      return r;
    e = h_(e, r);
    for (var a = -1, i = e.length, s = i - 1, c = r; c != null && ++a < i; ) {
      var l = g_(e[a]), u = t;
      if (l === "__proto__" || l === "constructor" || l === "prototype")
        return r;
      if (a != s) {
        var p = c[l];
        u = o ? o(p, l, c) : void 0, u === void 0 && (u = cd(p) ? p : m_(e[a + 1]) ? [] : {});
      }
      y_(c, l, u), c = c[l];
    }
    return r;
  }
  n(S_, "baseSet");
  ud.exports = S_;
});

// ../node_modules/lodash/_basePickBy.js
var Ya = y((kL, dd) => {
  var b_ = fo(), v_ = pd(), T_ = mt();
  function E_(r, e, t) {
    for (var o = -1, a = e.length, i = {}; ++o < a; ) {
      var s = e[o], c = b_(r, s);
      t(c, s) && v_(i, T_(s, r), c);
    }
    return i;
  }
  n(E_, "basePickBy");
  dd.exports = E_;
});

// ../node_modules/lodash/_basePick.js
var yd = y((GL, fd) => {
  var A_ = Ya(), R_ = $a();
  function w_(r, e) {
    return A_(r, e, function(t, o) {
      return R_(r, o);
    });
  }
  n(w_, "basePick");
  fd.exports = w_;
});

// ../node_modules/lodash/_isFlattenable.js
var Sd = y((UL, gd) => {
  var hd = lr(), x_ = eo(), __ = se(), md = hd ? hd.isConcatSpreadable : void 0;
  function P_(r) {
    return __(r) || x_(r) || !!(md && r && r[md]);
  }
  n(P_, "isFlattenable");
  gd.exports = P_;
});

// ../node_modules/lodash/_baseFlatten.js
var Td = y((VL, vd) => {
  var O_ = lo(), C_ = Sd();
  function bd(r, e, t, o, a) {
    var i = -1, s = r.length;
    for (t || (t = C_), a || (a = []); ++i < s; ) {
      var c = r[i];
      e > 0 && t(c) ? e > 1 ? bd(c, e - 1, t, o, a) : O_(a, c) : o || (a[a.length] = c);
    }
    return a;
  }
  n(bd, "baseFlatten");
  vd.exports = bd;
});

// ../node_modules/lodash/flatten.js
var Ad = y((WL, Ed) => {
  var I_ = Td();
  function F_(r) {
    var e = r == null ? 0 : r.length;
    return e ? I_(r, 1) : [];
  }
  n(F_, "flatten");
  Ed.exports = F_;
});

// ../node_modules/lodash/_apply.js
var wd = y((YL, Rd) => {
  function D_(r, e, t) {
    switch (t.length) {
      case 0:
        return r.call(e);
      case 1:
        return r.call(e, t[0]);
      case 2:
        return r.call(e, t[0], t[1]);
      case 3:
        return r.call(e, t[0], t[1], t[2]);
    }
    return r.apply(e, t);
  }
  n(D_, "apply");
  Rd.exports = D_;
});

// ../node_modules/lodash/_overRest.js
var Pd = y((XL, _d) => {
  var N_ = wd(), xd = Math.max;
  function q_(r, e, t) {
    return e = xd(e === void 0 ? r.length - 1 : e, 0), function() {
      for (var o = arguments, a = -1, i = xd(o.length - e, 0), s = Array(i); ++a < i; )
        s[a] = o[e + a];
      a = -1;
      for (var c = Array(e + 1); ++a < e; )
        c[a] = o[a];
      return c[e] = t(s), N_(r, this, c);
    };
  }
  n(q_, "overRest");
  _d.exports = q_;
});

// ../node_modules/lodash/constant.js
var Cd = y((QL, Od) => {
  function L_(r) {
    return function() {
      return r;
    };
  }
  n(L_, "constant");
  Od.exports = L_;
});

// ../node_modules/lodash/_baseSetToString.js
var Dd = y((eM, Fd) => {
  var M_ = Cd(), Id = ba(), k_ = Wa(), j_ = Id ? function(r, e) {
    return Id(r, "toString", {
      configurable: !0,
      enumerable: !1,
      value: M_(e),
      writable: !0
    });
  } : k_;
  Fd.exports = j_;
});

// ../node_modules/lodash/_shortOut.js
var qd = y((rM, Nd) => {
  var G_ = 800, B_ = 16, U_ = Date.now;
  function H_(r) {
    var e = 0, t = 0;
    return function() {
      var o = U_(), a = B_ - (o - t);
      if (t = o, a > 0) {
        if (++e >= G_)
          return arguments[0];
      } else
        e = 0;
      return r.apply(void 0, arguments);
    };
  }
  n(H_, "shortOut");
  Nd.exports = H_;
});

// ../node_modules/lodash/_setToString.js
var Md = y((oM, Ld) => {
  var V_ = Dd(), $_ = qd(), W_ = $_(V_);
  Ld.exports = W_;
});

// ../node_modules/lodash/_flatRest.js
var jd = y((nM, kd) => {
  var z_ = Ad(), Y_ = Pd(), K_ = Md();
  function X_(r) {
    return K_(Y_(r, void 0, z_), r + "");
  }
  n(X_, "flatRest");
  kd.exports = X_;
});

// ../node_modules/lodash/pick.js
var Bd = y((iM, Gd) => {
  var J_ = yd(), Q_ = jd(), Z_ = Q_(function(r, e) {
    return r == null ? {} : J_(r, e);
  });
  Gd.exports = Z_;
});

// ../node_modules/lodash/_getPrototype.js
var Ka = y((cM, Vd) => {
  var eP = xa(), rP = eP(Object.getPrototypeOf, Object);
  Vd.exports = rP;
});

// ../node_modules/lodash/isPlainObject.js
var yo = y((uM, Wd) => {
  var tP = qe(), oP = Ka(), nP = Le(), aP = "[object Object]", iP = Function.prototype, sP = Object.prototype, $d = iP.toString, lP = sP.hasOwnProperty,
  cP = $d.call(Object);
  function uP(r) {
    if (!nP(r) || tP(r) != aP)
      return !1;
    var e = oP(r);
    if (e === null)
      return !0;
    var t = lP.call(e, "constructor") && e.constructor;
    return typeof t == "function" && t instanceof t && $d.call(t) == cP;
  }
  n(uP, "isPlainObject");
  Wd.exports = uP;
});

// ../node_modules/lodash/_getSymbolsIn.js
var yf = y((Ek, ff) => {
  var IP = lo(), FP = Ka(), DP = Da(), NP = Fa(), qP = Object.getOwnPropertySymbols, LP = qP ? function(r) {
    for (var e = []; r; )
      IP(e, DP(r)), r = FP(r);
    return e;
  } : NP;
  ff.exports = LP;
});

// ../node_modules/lodash/_nativeKeysIn.js
var mf = y((Ak, hf) => {
  function MP(r) {
    var e = [];
    if (r != null)
      for (var t in Object(r))
        e.push(t);
    return e;
  }
  n(MP, "nativeKeysIn");
  hf.exports = MP;
});

// ../node_modules/lodash/_baseKeysIn.js
var Sf = y((wk, gf) => {
  var kP = cr(), jP = wa(), GP = mf(), BP = Object.prototype, UP = BP.hasOwnProperty;
  function HP(r) {
    if (!kP(r))
      return GP(r);
    var e = jP(r), t = [];
    for (var o in r)
      o == "constructor" && (e || !UP.call(r, o)) || t.push(o);
    return t;
  }
  n(HP, "baseKeysIn");
  gf.exports = HP;
});

// ../node_modules/lodash/keysIn.js
var vf = y((_k, bf) => {
  var VP = Ra(), $P = Sf(), WP = _a();
  function zP(r) {
    return WP(r) ? VP(r, !0) : $P(r);
  }
  n(zP, "keysIn");
  bf.exports = zP;
});

// ../node_modules/lodash/_getAllKeysIn.js
var Ef = y((Ok, Tf) => {
  var YP = Ia(), KP = yf(), XP = vf();
  function JP(r) {
    return YP(r, XP, KP);
  }
  n(JP, "getAllKeysIn");
  Tf.exports = JP;
});

// ../node_modules/lodash/pickBy.js
var Rf = y((Ik, Af) => {
  var QP = Va(), ZP = za(), eO = Ya(), rO = Ef();
  function tO(r, e) {
    if (r == null)
      return {};
    var t = QP(rO(r), function(o) {
      return [o];
    });
    return e = ZP(e), eO(r, t, function(o, a) {
      return e(o, a[0]);
    });
  }
  n(tO, "pickBy");
  Af.exports = tO;
});

// ../node_modules/es-errors/index.js
var Vf = y((Lj, Hf) => {
  "use strict";
  Hf.exports = Error;
});

// ../node_modules/es-errors/eval.js
var Wf = y((Mj, $f) => {
  "use strict";
  $f.exports = EvalError;
});

// ../node_modules/es-errors/range.js
var Yf = y((kj, zf) => {
  "use strict";
  zf.exports = RangeError;
});

// ../node_modules/es-errors/ref.js
var Xf = y((jj, Kf) => {
  "use strict";
  Kf.exports = ReferenceError;
});

// ../node_modules/es-errors/syntax.js
var Si = y((Gj, Jf) => {
  "use strict";
  Jf.exports = SyntaxError;
});

// ../node_modules/es-errors/type.js
var _r = y((Bj, Qf) => {
  "use strict";
  Qf.exports = TypeError;
});

// ../node_modules/es-errors/uri.js
var ey = y((Uj, Zf) => {
  "use strict";
  Zf.exports = URIError;
});

// ../node_modules/has-symbols/shams.js
var ty = y((Hj, ry) => {
  "use strict";
  ry.exports = /* @__PURE__ */ n(function() {
    if (typeof Symbol != "function" || typeof Object.getOwnPropertySymbols != "function")
      return !1;
    if (typeof Symbol.iterator == "symbol")
      return !0;
    var e = {}, t = Symbol("test"), o = Object(t);
    if (typeof t == "string" || Object.prototype.toString.call(t) !== "[object Symbol]" || Object.prototype.toString.call(o) !== "[object Sy\
mbol]")
      return !1;
    var a = 42;
    e[t] = a;
    for (t in e)
      return !1;
    if (typeof Object.keys == "function" && Object.keys(e).length !== 0 || typeof Object.getOwnPropertyNames == "function" && Object.getOwnPropertyNames(
    e).length !== 0)
      return !1;
    var i = Object.getOwnPropertySymbols(e);
    if (i.length !== 1 || i[0] !== t || !Object.prototype.propertyIsEnumerable.call(e, t))
      return !1;
    if (typeof Object.getOwnPropertyDescriptor == "function") {
      var s = Object.getOwnPropertyDescriptor(e, t);
      if (s.value !== a || s.enumerable !== !0)
        return !1;
    }
    return !0;
  }, "hasSymbols");
});

// ../node_modules/has-symbols/index.js
var ay = y(($j, ny) => {
  "use strict";
  var oy = typeof Symbol < "u" && Symbol, vO = ty();
  ny.exports = /* @__PURE__ */ n(function() {
    return typeof oy != "function" || typeof Symbol != "function" || typeof oy("foo") != "symbol" || typeof Symbol("bar") != "symbol" ? !1 :
    vO();
  }, "hasNativeSymbols");
});

// ../node_modules/has-proto/index.js
var sy = y((zj, iy) => {
  "use strict";
  var bi = {
    __proto__: null,
    foo: {}
  }, TO = Object;
  iy.exports = /* @__PURE__ */ n(function() {
    return { __proto__: bi }.foo === bi.foo && !(bi instanceof TO);
  }, "hasProto");
});

// ../node_modules/function-bind/implementation.js
var uy = y((Kj, cy) => {
  "use strict";
  var EO = "Function.prototype.bind called on incompatible ", AO = Object.prototype.toString, RO = Math.max, wO = "[object Function]", ly = /* @__PURE__ */ n(
  function(e, t) {
    for (var o = [], a = 0; a < e.length; a += 1)
      o[a] = e[a];
    for (var i = 0; i < t.length; i += 1)
      o[i + e.length] = t[i];
    return o;
  }, "concatty"), xO = /* @__PURE__ */ n(function(e, t) {
    for (var o = [], a = t || 0, i = 0; a < e.length; a += 1, i += 1)
      o[i] = e[a];
    return o;
  }, "slicy"), _O = /* @__PURE__ */ n(function(r, e) {
    for (var t = "", o = 0; o < r.length; o += 1)
      t += r[o], o + 1 < r.length && (t += e);
    return t;
  }, "joiny");
  cy.exports = /* @__PURE__ */ n(function(e) {
    var t = this;
    if (typeof t != "function" || AO.apply(t) !== wO)
      throw new TypeError(EO + t);
    for (var o = xO(arguments, 1), a, i = /* @__PURE__ */ n(function() {
      if (this instanceof a) {
        var p = t.apply(
          this,
          ly(o, arguments)
        );
        return Object(p) === p ? p : this;
      }
      return t.apply(
        e,
        ly(o, arguments)
      );
    }, "binder"), s = RO(0, t.length - o.length), c = [], l = 0; l < s; l++)
      c[l] = "$" + l;
    if (a = Function("binder", "return function (" + _O(c, ",") + "){ return binder.apply(this,arguments); }")(i), t.prototype) {
      var u = /* @__PURE__ */ n(function() {
      }, "Empty");
      u.prototype = t.prototype, a.prototype = new u(), u.prototype = null;
    }
    return a;
  }, "bind");
});

// ../node_modules/function-bind/index.js
var Po = y((Jj, py) => {
  "use strict";
  var PO = uy();
  py.exports = Function.prototype.bind || PO;
});

// ../node_modules/hasown/index.js
var fy = y((Qj, dy) => {
  "use strict";
  var OO = Function.prototype.call, CO = Object.prototype.hasOwnProperty, IO = Po();
  dy.exports = IO.call(OO, CO);
});

// ../node_modules/get-intrinsic/index.js
var ze = y((Zj, Sy) => {
  "use strict";
  var I, FO = Vf(), DO = Wf(), NO = Yf(), qO = Xf(), Ir = Si(), Cr = _r(), LO = ey(), gy = Function, vi = /* @__PURE__ */ n(function(r) {
    try {
      return gy('"use strict"; return (' + r + ").constructor;")();
    } catch {
    }
  }, "getEvalledConstructor"), $e = Object.getOwnPropertyDescriptor;
  if ($e)
    try {
      $e({}, "");
    } catch {
      $e = null;
    }
  var Ti = /* @__PURE__ */ n(function() {
    throw new Cr();
  }, "throwTypeError"), MO = $e ? function() {
    try {
      return arguments.callee, Ti;
    } catch {
      try {
        return $e(arguments, "callee").get;
      } catch {
        return Ti;
      }
    }
  }() : Ti, Pr = ay()(), kO = sy()(), W = Object.getPrototypeOf || (kO ? function(r) {
    return r.__proto__;
  } : null), Or = {}, jO = typeof Uint8Array > "u" || !W ? I : W(Uint8Array), We = {
    __proto__: null,
    "%AggregateError%": typeof AggregateError > "u" ? I : AggregateError,
    "%Array%": Array,
    "%ArrayBuffer%": typeof ArrayBuffer > "u" ? I : ArrayBuffer,
    "%ArrayIteratorPrototype%": Pr && W ? W([][Symbol.iterator]()) : I,
    "%AsyncFromSyncIteratorPrototype%": I,
    "%AsyncFunction%": Or,
    "%AsyncGenerator%": Or,
    "%AsyncGeneratorFunction%": Or,
    "%AsyncIteratorPrototype%": Or,
    "%Atomics%": typeof Atomics > "u" ? I : Atomics,
    "%BigInt%": typeof BigInt > "u" ? I : BigInt,
    "%BigInt64Array%": typeof BigInt64Array > "u" ? I : BigInt64Array,
    "%BigUint64Array%": typeof BigUint64Array > "u" ? I : BigUint64Array,
    "%Boolean%": Boolean,
    "%DataView%": typeof DataView > "u" ? I : DataView,
    "%Date%": Date,
    "%decodeURI%": decodeURI,
    "%decodeURIComponent%": decodeURIComponent,
    "%encodeURI%": encodeURI,
    "%encodeURIComponent%": encodeURIComponent,
    "%Error%": FO,
    "%eval%": eval,
    // eslint-disable-line no-eval
    "%EvalError%": DO,
    "%Float32Array%": typeof Float32Array > "u" ? I : Float32Array,
    "%Float64Array%": typeof Float64Array > "u" ? I : Float64Array,
    "%FinalizationRegistry%": typeof FinalizationRegistry > "u" ? I : FinalizationRegistry,
    "%Function%": gy,
    "%GeneratorFunction%": Or,
    "%Int8Array%": typeof Int8Array > "u" ? I : Int8Array,
    "%Int16Array%": typeof Int16Array > "u" ? I : Int16Array,
    "%Int32Array%": typeof Int32Array > "u" ? I : Int32Array,
    "%isFinite%": isFinite,
    "%isNaN%": isNaN,
    "%IteratorPrototype%": Pr && W ? W(W([][Symbol.iterator]())) : I,
    "%JSON%": typeof JSON == "object" ? JSON : I,
    "%Map%": typeof Map > "u" ? I : Map,
    "%MapIteratorPrototype%": typeof Map > "u" || !Pr || !W ? I : W((/* @__PURE__ */ new Map())[Symbol.iterator]()),
    "%Math%": Math,
    "%Number%": Number,
    "%Object%": Object,
    "%parseFloat%": parseFloat,
    "%parseInt%": parseInt,
    "%Promise%": typeof Promise > "u" ? I : Promise,
    "%Proxy%": typeof Proxy > "u" ? I : Proxy,
    "%RangeError%": NO,
    "%ReferenceError%": qO,
    "%Reflect%": typeof Reflect > "u" ? I : Reflect,
    "%RegExp%": RegExp,
    "%Set%": typeof Set > "u" ? I : Set,
    "%SetIteratorPrototype%": typeof Set > "u" || !Pr || !W ? I : W((/* @__PURE__ */ new Set())[Symbol.iterator]()),
    "%SharedArrayBuffer%": typeof SharedArrayBuffer > "u" ? I : SharedArrayBuffer,
    "%String%": String,
    "%StringIteratorPrototype%": Pr && W ? W(""[Symbol.iterator]()) : I,
    "%Symbol%": Pr ? Symbol : I,
    "%SyntaxError%": Ir,
    "%ThrowTypeError%": MO,
    "%TypedArray%": jO,
    "%TypeError%": Cr,
    "%Uint8Array%": typeof Uint8Array > "u" ? I : Uint8Array,
    "%Uint8ClampedArray%": typeof Uint8ClampedArray > "u" ? I : Uint8ClampedArray,
    "%Uint16Array%": typeof Uint16Array > "u" ? I : Uint16Array,
    "%Uint32Array%": typeof Uint32Array > "u" ? I : Uint32Array,
    "%URIError%": LO,
    "%WeakMap%": typeof WeakMap > "u" ? I : WeakMap,
    "%WeakRef%": typeof WeakRef > "u" ? I : WeakRef,
    "%WeakSet%": typeof WeakSet > "u" ? I : WeakSet
  };
  if (W)
    try {
      null.error;
    } catch (r) {
      yy = W(W(r)), We["%Error.prototype%"] = yy;
    }
  var yy, GO = /* @__PURE__ */ n(function r(e) {
    var t;
    if (e === "%AsyncFunction%")
      t = vi("async function () {}");
    else if (e === "%GeneratorFunction%")
      t = vi("function* () {}");
    else if (e === "%AsyncGeneratorFunction%")
      t = vi("async function* () {}");
    else if (e === "%AsyncGenerator%") {
      var o = r("%AsyncGeneratorFunction%");
      o && (t = o.prototype);
    } else if (e === "%AsyncIteratorPrototype%") {
      var a = r("%AsyncGenerator%");
      a && W && (t = W(a.prototype));
    }
    return We[e] = t, t;
  }, "doEval"), hy = {
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
  }, wt = Po(), Oo = fy(), BO = wt.call(Function.call, Array.prototype.concat), UO = wt.call(Function.apply, Array.prototype.splice), my = wt.
  call(Function.call, String.prototype.replace), Co = wt.call(Function.call, String.prototype.slice), HO = wt.call(Function.call, RegExp.prototype.
  exec), VO = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g, $O = /\\(\\)?/g, WO = /* @__PURE__ */ n(
  function(e) {
    var t = Co(e, 0, 1), o = Co(e, -1);
    if (t === "%" && o !== "%")
      throw new Ir("invalid intrinsic syntax, expected closing `%`");
    if (o === "%" && t !== "%")
      throw new Ir("invalid intrinsic syntax, expected opening `%`");
    var a = [];
    return my(e, VO, function(i, s, c, l) {
      a[a.length] = c ? my(l, $O, "$1") : s || i;
    }), a;
  }, "stringToPath"), zO = /* @__PURE__ */ n(function(e, t) {
    var o = e, a;
    if (Oo(hy, o) && (a = hy[o], o = "%" + a[0] + "%"), Oo(We, o)) {
      var i = We[o];
      if (i === Or && (i = GO(o)), typeof i > "u" && !t)
        throw new Cr("intrinsic " + e + " exists, but is not available. Please file an issue!");
      return {
        alias: a,
        name: o,
        value: i
      };
    }
    throw new Ir("intrinsic " + e + " does not exist!");
  }, "getBaseIntrinsic");
  Sy.exports = /* @__PURE__ */ n(function(e, t) {
    if (typeof e != "string" || e.length === 0)
      throw new Cr("intrinsic name must be a non-empty string");
    if (arguments.length > 1 && typeof t != "boolean")
      throw new Cr('"allowMissing" argument must be a boolean');
    if (HO(/^%?[^%]*%?$/, e) === null)
      throw new Ir("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
    var o = WO(e), a = o.length > 0 ? o[0] : "", i = zO("%" + a + "%", t), s = i.name, c = i.value, l = !1, u = i.alias;
    u && (a = u[0], UO(o, BO([0, 1], u)));
    for (var p = 1, h = !0; p < o.length; p += 1) {
      var d = o[p], g = Co(d, 0, 1), m = Co(d, -1);
      if ((g === '"' || g === "'" || g === "`" || m === '"' || m === "'" || m === "`") && g !== m)
        throw new Ir("property names with quotes must have matching quotes");
      if ((d === "constructor" || !h) && (l = !0), a += "." + d, s = "%" + a + "%", Oo(We, s))
        c = We[s];
      else if (c != null) {
        if (!(d in c)) {
          if (!t)
            throw new Cr("base intrinsic for " + e + " exists, but the property is not available.");
          return;
        }
        if ($e && p + 1 >= o.length) {
          var b = $e(c, d);
          h = !!b, h && "get" in b && !("originalValue" in b.get) ? c = b.get : c = c[d];
        } else
          h = Oo(c, d), c = c[d];
        h && !l && (We[s] = c);
      }
    }
    return c;
  }, "GetIntrinsic");
});

// ../node_modules/es-define-property/index.js
var Fo = y((rG, by) => {
  "use strict";
  var YO = ze(), Io = YO("%Object.defineProperty%", !0) || !1;
  if (Io)
    try {
      Io({}, "a", { value: 1 });
    } catch {
      Io = !1;
    }
  by.exports = Io;
});

// ../node_modules/gopd/index.js
var Ei = y((tG, vy) => {
  "use strict";
  var KO = ze(), Do = KO("%Object.getOwnPropertyDescriptor%", !0);
  if (Do)
    try {
      Do([], "length");
    } catch {
      Do = null;
    }
  vy.exports = Do;
});

// ../node_modules/define-data-property/index.js
var Ry = y((oG, Ay) => {
  "use strict";
  var Ty = Fo(), XO = Si(), Fr = _r(), Ey = Ei();
  Ay.exports = /* @__PURE__ */ n(function(e, t, o) {
    if (!e || typeof e != "object" && typeof e != "function")
      throw new Fr("`obj` must be an object or a function`");
    if (typeof t != "string" && typeof t != "symbol")
      throw new Fr("`property` must be a string or a symbol`");
    if (arguments.length > 3 && typeof arguments[3] != "boolean" && arguments[3] !== null)
      throw new Fr("`nonEnumerable`, if provided, must be a boolean or null");
    if (arguments.length > 4 && typeof arguments[4] != "boolean" && arguments[4] !== null)
      throw new Fr("`nonWritable`, if provided, must be a boolean or null");
    if (arguments.length > 5 && typeof arguments[5] != "boolean" && arguments[5] !== null)
      throw new Fr("`nonConfigurable`, if provided, must be a boolean or null");
    if (arguments.length > 6 && typeof arguments[6] != "boolean")
      throw new Fr("`loose`, if provided, must be a boolean");
    var a = arguments.length > 3 ? arguments[3] : null, i = arguments.length > 4 ? arguments[4] : null, s = arguments.length > 5 ? arguments[5] :
    null, c = arguments.length > 6 ? arguments[6] : !1, l = !!Ey && Ey(e, t);
    if (Ty)
      Ty(e, t, {
        configurable: s === null && l ? l.configurable : !s,
        enumerable: a === null && l ? l.enumerable : !a,
        value: o,
        writable: i === null && l ? l.writable : !i
      });
    else if (c || !a && !i && !s)
      e[t] = o;
    else
      throw new XO("This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.");
  }, "defineDataProperty");
});

// ../node_modules/has-property-descriptors/index.js
var _y = y((aG, xy) => {
  "use strict";
  var Ai = Fo(), wy = /* @__PURE__ */ n(function() {
    return !!Ai;
  }, "hasPropertyDescriptors");
  wy.hasArrayLengthDefineBug = /* @__PURE__ */ n(function() {
    if (!Ai)
      return null;
    try {
      return Ai([], "length", { value: 1 }).length !== 1;
    } catch {
      return !0;
    }
  }, "hasArrayLengthDefineBug");
  xy.exports = wy;
});

// ../node_modules/set-function-length/index.js
var Fy = y((sG, Iy) => {
  "use strict";
  var JO = ze(), Py = Ry(), QO = _y()(), Oy = Ei(), Cy = _r(), ZO = JO("%Math.floor%");
  Iy.exports = /* @__PURE__ */ n(function(e, t) {
    if (typeof e != "function")
      throw new Cy("`fn` is not a function");
    if (typeof t != "number" || t < 0 || t > 4294967295 || ZO(t) !== t)
      throw new Cy("`length` must be a positive 32-bit integer");
    var o = arguments.length > 2 && !!arguments[2], a = !0, i = !0;
    if ("length" in e && Oy) {
      var s = Oy(e, "length");
      s && !s.configurable && (a = !1), s && !s.writable && (i = !1);
    }
    return (a || i || !o) && (QO ? Py(
      /** @type {Parameters<define>[0]} */
      e,
      "length",
      t,
      !0,
      !0
    ) : Py(
      /** @type {Parameters<define>[0]} */
      e,
      "length",
      t
    )), e;
  }, "setFunctionLength");
});

// ../node_modules/call-bind/index.js
var ky = y((cG, No) => {
  "use strict";
  var Ri = Po(), qo = ze(), eC = Fy(), rC = _r(), qy = qo("%Function.prototype.apply%"), Ly = qo("%Function.prototype.call%"), My = qo("%Ref\
lect.apply%", !0) || Ri.call(Ly, qy), Dy = Fo(), tC = qo("%Math.max%");
  No.exports = /* @__PURE__ */ n(function(e) {
    if (typeof e != "function")
      throw new rC("a function is required");
    var t = My(Ri, Ly, arguments);
    return eC(
      t,
      1 + tC(0, e.length - (arguments.length - 1)),
      !0
    );
  }, "callBind");
  var Ny = /* @__PURE__ */ n(function() {
    return My(Ri, qy, arguments);
  }, "applyBind");
  Dy ? Dy(No.exports, "apply", { value: Ny }) : No.exports.apply = Ny;
});

// ../node_modules/call-bind/callBound.js
var Uy = y((pG, By) => {
  "use strict";
  var jy = ze(), Gy = ky(), oC = Gy(jy("String.prototype.indexOf"));
  By.exports = /* @__PURE__ */ n(function(e, t) {
    var o = jy(e, !!t);
    return typeof o == "function" && oC(e, ".prototype.") > -1 ? Gy(o) : o;
  }, "callBoundIntrinsic");
});

// (disabled):../node_modules/object-inspect/util.inspect
var Hy = y(() => {
});

// ../node_modules/object-inspect/index.js
var ch = y((hG, lh) => {
  var Ni = typeof Map == "function" && Map.prototype, wi = Object.getOwnPropertyDescriptor && Ni ? Object.getOwnPropertyDescriptor(Map.prototype,
  "size") : null, Mo = Ni && wi && typeof wi.get == "function" ? wi.get : null, Vy = Ni && Map.prototype.forEach, qi = typeof Set == "functi\
on" && Set.prototype, xi = Object.getOwnPropertyDescriptor && qi ? Object.getOwnPropertyDescriptor(Set.prototype, "size") : null, ko = qi &&
  xi && typeof xi.get == "function" ? xi.get : null, $y = qi && Set.prototype.forEach, nC = typeof WeakMap == "function" && WeakMap.prototype,
  _t = nC ? WeakMap.prototype.has : null, aC = typeof WeakSet == "function" && WeakSet.prototype, Pt = aC ? WeakSet.prototype.has : null, iC = typeof WeakRef ==
  "function" && WeakRef.prototype, Wy = iC ? WeakRef.prototype.deref : null, sC = Boolean.prototype.valueOf, lC = Object.prototype.toString,
  cC = Function.prototype.toString, uC = String.prototype.match, Li = String.prototype.slice, _e = String.prototype.replace, pC = String.prototype.
  toUpperCase, zy = String.prototype.toLowerCase, th = RegExp.prototype.test, Yy = Array.prototype.concat, le = Array.prototype.join, dC = Array.
  prototype.slice, Ky = Math.floor, Oi = typeof BigInt == "function" ? BigInt.prototype.valueOf : null, _i = Object.getOwnPropertySymbols, Ci = typeof Symbol ==
  "function" && typeof Symbol.iterator == "symbol" ? Symbol.prototype.toString : null, Dr = typeof Symbol == "function" && typeof Symbol.iterator ==
  "object", X = typeof Symbol == "function" && Symbol.toStringTag && (typeof Symbol.toStringTag === Dr || !0) ? Symbol.toStringTag : null, oh = Object.
  prototype.propertyIsEnumerable, Xy = (typeof Reflect == "function" ? Reflect.getPrototypeOf : Object.getPrototypeOf) || ([].__proto__ === Array.
  prototype ? function(r) {
    return r.__proto__;
  } : null);
  function Jy(r, e) {
    if (r === 1 / 0 || r === -1 / 0 || r !== r || r && r > -1e3 && r < 1e3 || th.call(/e/, e))
      return e;
    var t = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
    if (typeof r == "number") {
      var o = r < 0 ? -Ky(-r) : Ky(r);
      if (o !== r) {
        var a = String(o), i = Li.call(e, a.length + 1);
        return _e.call(a, t, "$&_") + "." + _e.call(_e.call(i, /([0-9]{3})/g, "$&_"), /_$/, "");
      }
    }
    return _e.call(e, t, "$&_");
  }
  n(Jy, "addNumericSeparator");
  var Ii = Hy(), Qy = Ii.custom, Zy = ah(Qy) ? Qy : null;
  lh.exports = /* @__PURE__ */ n(function r(e, t, o, a) {
    var i = t || {};
    if (xe(i, "quoteStyle") && i.quoteStyle !== "single" && i.quoteStyle !== "double")
      throw new TypeError('option "quoteStyle" must be "single" or "double"');
    if (xe(i, "maxStringLength") && (typeof i.maxStringLength == "number" ? i.maxStringLength < 0 && i.maxStringLength !== 1 / 0 : i.maxStringLength !==
    null))
      throw new TypeError('option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`');
    var s = xe(i, "customInspect") ? i.customInspect : !0;
    if (typeof s != "boolean" && s !== "symbol")
      throw new TypeError("option \"customInspect\", if provided, must be `true`, `false`, or `'symbol'`");
    if (xe(i, "indent") && i.indent !== null && i.indent !== "	" && !(parseInt(i.indent, 10) === i.indent && i.indent > 0))
      throw new TypeError('option "indent" must be "\\t", an integer > 0, or `null`');
    if (xe(i, "numericSeparator") && typeof i.numericSeparator != "boolean")
      throw new TypeError('option "numericSeparator", if provided, must be `true` or `false`');
    var c = i.numericSeparator;
    if (typeof e > "u")
      return "undefined";
    if (e === null)
      return "null";
    if (typeof e == "boolean")
      return e ? "true" : "false";
    if (typeof e == "string")
      return sh(e, i);
    if (typeof e == "number") {
      if (e === 0)
        return 1 / 0 / e > 0 ? "0" : "-0";
      var l = String(e);
      return c ? Jy(e, l) : l;
    }
    if (typeof e == "bigint") {
      var u = String(e) + "n";
      return c ? Jy(e, u) : u;
    }
    var p = typeof i.depth > "u" ? 5 : i.depth;
    if (typeof o > "u" && (o = 0), o >= p && p > 0 && typeof e == "object")
      return Fi(e) ? "[Array]" : "[Object]";
    var h = CC(i, o);
    if (typeof a > "u")
      a = [];
    else if (ih(a, e) >= 0)
      return "[Circular]";
    function d(D, q, N) {
      if (q && (a = dC.call(a), a.push(q)), N) {
        var G = {
          depth: i.depth
        };
        return xe(i, "quoteStyle") && (G.quoteStyle = i.quoteStyle), r(D, G, o + 1, a);
      }
      return r(D, i, o + 1, a);
    }
    if (n(d, "inspect"), typeof e == "function" && !eh(e)) {
      var g = TC(e), m = Lo(e, d);
      return "[Function" + (g ? ": " + g : " (anonymous)") + "]" + (m.length > 0 ? " { " + le.call(m, ", ") + " }" : "");
    }
    if (ah(e)) {
      var b = Dr ? _e.call(String(e), /^(Symbol\(.*\))_[^)]*$/, "$1") : Ci.call(e);
      return typeof e == "object" && !Dr ? xt(b) : b;
    }
    if (_C(e)) {
      for (var S = "<" + zy.call(String(e.nodeName)), T = e.attributes || [], v = 0; v < T.length; v++)
        S += " " + T[v].name + "=" + nh(fC(T[v].value), "double", i);
      return S += ">", e.childNodes && e.childNodes.length && (S += "..."), S += "</" + zy.call(String(e.nodeName)) + ">", S;
    }
    if (Fi(e)) {
      if (e.length === 0)
        return "[]";
      var E = Lo(e, d);
      return h && !OC(E) ? "[" + Di(E, h) + "]" : "[ " + le.call(E, ", ") + " ]";
    }
    if (hC(e)) {
      var R = Lo(e, d);
      return !("cause" in Error.prototype) && "cause" in e && !oh.call(e, "cause") ? "{ [" + String(e) + "] " + le.call(Yy.call("[cause]: " +
      d(e.cause), R), ", ") + " }" : R.length === 0 ? "[" + String(e) + "]" : "{ [" + String(e) + "] " + le.call(R, ", ") + " }";
    }
    if (typeof e == "object" && s) {
      if (Zy && typeof e[Zy] == "function" && Ii)
        return Ii(e, { depth: p - o });
      if (s !== "symbol" && typeof e.inspect == "function")
        return e.inspect();
    }
    if (EC(e)) {
      var w = [];
      return Vy && Vy.call(e, function(D, q) {
        w.push(d(q, e, !0) + " => " + d(D, e));
      }), rh("Map", Mo.call(e), w, h);
    }
    if (wC(e)) {
      var P = [];
      return $y && $y.call(e, function(D) {
        P.push(d(D, e));
      }), rh("Set", ko.call(e), P, h);
    }
    if (AC(e))
      return Pi("WeakMap");
    if (xC(e))
      return Pi("WeakSet");
    if (RC(e))
      return Pi("WeakRef");
    if (gC(e))
      return xt(d(Number(e)));
    if (bC(e))
      return xt(d(Oi.call(e)));
    if (SC(e))
      return xt(sC.call(e));
    if (mC(e))
      return xt(d(String(e)));
    if (typeof window < "u" && e === window)
      return "{ [object Window] }";
    if (e === global)
      return "{ [object globalThis] }";
    if (!yC(e) && !eh(e)) {
      var M = Lo(e, d), F = Xy ? Xy(e) === Object.prototype : e instanceof Object || e.constructor === Object, H = e instanceof Object ? "" :
      "null prototype", Z = !F && X && Object(e) === e && X in e ? Li.call(Pe(e), 8, -1) : H ? "Object" : "", me = F || typeof e.constructor !=
      "function" ? "" : e.constructor.name ? e.constructor.name + " " : "", V = me + (Z || H ? "[" + le.call(Yy.call([], Z || [], H || []), "\
: ") + "] " : "");
      return M.length === 0 ? V + "{}" : h ? V + "{" + Di(M, h) + "}" : V + "{ " + le.call(M, ", ") + " }";
    }
    return String(e);
  }, "inspect_");
  function nh(r, e, t) {
    var o = (t.quoteStyle || e) === "double" ? '"' : "'";
    return o + r + o;
  }
  n(nh, "wrapQuotes");
  function fC(r) {
    return _e.call(String(r), /"/g, "&quot;");
  }
  n(fC, "quote");
  function Fi(r) {
    return Pe(r) === "[object Array]" && (!X || !(typeof r == "object" && X in r));
  }
  n(Fi, "isArray");
  function yC(r) {
    return Pe(r) === "[object Date]" && (!X || !(typeof r == "object" && X in r));
  }
  n(yC, "isDate");
  function eh(r) {
    return Pe(r) === "[object RegExp]" && (!X || !(typeof r == "object" && X in r));
  }
  n(eh, "isRegExp");
  function hC(r) {
    return Pe(r) === "[object Error]" && (!X || !(typeof r == "object" && X in r));
  }
  n(hC, "isError");
  function mC(r) {
    return Pe(r) === "[object String]" && (!X || !(typeof r == "object" && X in r));
  }
  n(mC, "isString");
  function gC(r) {
    return Pe(r) === "[object Number]" && (!X || !(typeof r == "object" && X in r));
  }
  n(gC, "isNumber");
  function SC(r) {
    return Pe(r) === "[object Boolean]" && (!X || !(typeof r == "object" && X in r));
  }
  n(SC, "isBoolean");
  function ah(r) {
    if (Dr)
      return r && typeof r == "object" && r instanceof Symbol;
    if (typeof r == "symbol")
      return !0;
    if (!r || typeof r != "object" || !Ci)
      return !1;
    try {
      return Ci.call(r), !0;
    } catch {
    }
    return !1;
  }
  n(ah, "isSymbol");
  function bC(r) {
    if (!r || typeof r != "object" || !Oi)
      return !1;
    try {
      return Oi.call(r), !0;
    } catch {
    }
    return !1;
  }
  n(bC, "isBigInt");
  var vC = Object.prototype.hasOwnProperty || function(r) {
    return r in this;
  };
  function xe(r, e) {
    return vC.call(r, e);
  }
  n(xe, "has");
  function Pe(r) {
    return lC.call(r);
  }
  n(Pe, "toStr");
  function TC(r) {
    if (r.name)
      return r.name;
    var e = uC.call(cC.call(r), /^function\s*([\w$]+)/);
    return e ? e[1] : null;
  }
  n(TC, "nameOf");
  function ih(r, e) {
    if (r.indexOf)
      return r.indexOf(e);
    for (var t = 0, o = r.length; t < o; t++)
      if (r[t] === e)
        return t;
    return -1;
  }
  n(ih, "indexOf");
  function EC(r) {
    if (!Mo || !r || typeof r != "object")
      return !1;
    try {
      Mo.call(r);
      try {
        ko.call(r);
      } catch {
        return !0;
      }
      return r instanceof Map;
    } catch {
    }
    return !1;
  }
  n(EC, "isMap");
  function AC(r) {
    if (!_t || !r || typeof r != "object")
      return !1;
    try {
      _t.call(r, _t);
      try {
        Pt.call(r, Pt);
      } catch {
        return !0;
      }
      return r instanceof WeakMap;
    } catch {
    }
    return !1;
  }
  n(AC, "isWeakMap");
  function RC(r) {
    if (!Wy || !r || typeof r != "object")
      return !1;
    try {
      return Wy.call(r), !0;
    } catch {
    }
    return !1;
  }
  n(RC, "isWeakRef");
  function wC(r) {
    if (!ko || !r || typeof r != "object")
      return !1;
    try {
      ko.call(r);
      try {
        Mo.call(r);
      } catch {
        return !0;
      }
      return r instanceof Set;
    } catch {
    }
    return !1;
  }
  n(wC, "isSet");
  function xC(r) {
    if (!Pt || !r || typeof r != "object")
      return !1;
    try {
      Pt.call(r, Pt);
      try {
        _t.call(r, _t);
      } catch {
        return !0;
      }
      return r instanceof WeakSet;
    } catch {
    }
    return !1;
  }
  n(xC, "isWeakSet");
  function _C(r) {
    return !r || typeof r != "object" ? !1 : typeof HTMLElement < "u" && r instanceof HTMLElement ? !0 : typeof r.nodeName == "string" && typeof r.
    getAttribute == "function";
  }
  n(_C, "isElement");
  function sh(r, e) {
    if (r.length > e.maxStringLength) {
      var t = r.length - e.maxStringLength, o = "... " + t + " more character" + (t > 1 ? "s" : "");
      return sh(Li.call(r, 0, e.maxStringLength), e) + o;
    }
    var a = _e.call(_e.call(r, /(['\\])/g, "\\$1"), /[\x00-\x1f]/g, PC);
    return nh(a, "single", e);
  }
  n(sh, "inspectString");
  function PC(r) {
    var e = r.charCodeAt(0), t = {
      8: "b",
      9: "t",
      10: "n",
      12: "f",
      13: "r"
    }[e];
    return t ? "\\" + t : "\\x" + (e < 16 ? "0" : "") + pC.call(e.toString(16));
  }
  n(PC, "lowbyte");
  function xt(r) {
    return "Object(" + r + ")";
  }
  n(xt, "markBoxed");
  function Pi(r) {
    return r + " { ? }";
  }
  n(Pi, "weakCollectionOf");
  function rh(r, e, t, o) {
    var a = o ? Di(t, o) : le.call(t, ", ");
    return r + " (" + e + ") {" + a + "}";
  }
  n(rh, "collectionOf");
  function OC(r) {
    for (var e = 0; e < r.length; e++)
      if (ih(r[e], `
`) >= 0)
        return !1;
    return !0;
  }
  n(OC, "singleLineValues");
  function CC(r, e) {
    var t;
    if (r.indent === "	")
      t = "	";
    else if (typeof r.indent == "number" && r.indent > 0)
      t = le.call(Array(r.indent + 1), " ");
    else
      return null;
    return {
      base: t,
      prev: le.call(Array(e + 1), t)
    };
  }
  n(CC, "getIndent");
  function Di(r, e) {
    if (r.length === 0)
      return "";
    var t = `
` + e.prev + e.base;
    return t + le.call(r, "," + t) + `
` + e.prev;
  }
  n(Di, "indentedJoin");
  function Lo(r, e) {
    var t = Fi(r), o = [];
    if (t) {
      o.length = r.length;
      for (var a = 0; a < r.length; a++)
        o[a] = xe(r, a) ? e(r[a], r) : "";
    }
    var i = typeof _i == "function" ? _i(r) : [], s;
    if (Dr) {
      s = {};
      for (var c = 0; c < i.length; c++)
        s["$" + i[c]] = i[c];
    }
    for (var l in r)
      xe(r, l) && (t && String(Number(l)) === l && l < r.length || Dr && s["$" + l] instanceof Symbol || (th.call(/[^\w$]/, l) ? o.push(e(l,
      r) + ": " + e(r[l], r)) : o.push(l + ": " + e(r[l], r))));
    if (typeof _i == "function")
      for (var u = 0; u < i.length; u++)
        oh.call(r, i[u]) && o.push("[" + e(i[u]) + "]: " + e(r[i[u]], r));
    return o;
  }
  n(Lo, "arrObjKeys");
});

// ../node_modules/side-channel/index.js
var dh = y((gG, ph) => {
  "use strict";
  var uh = ze(), Nr = Uy(), IC = ch(), FC = _r(), jo = uh("%WeakMap%", !0), Go = uh("%Map%", !0), DC = Nr("WeakMap.prototype.get", !0), NC = Nr(
  "WeakMap.prototype.set", !0), qC = Nr("WeakMap.prototype.has", !0), LC = Nr("Map.prototype.get", !0), MC = Nr("Map.prototype.set", !0), kC = Nr(
  "Map.prototype.has", !0), Mi = /* @__PURE__ */ n(function(r, e) {
    for (var t = r, o; (o = t.next) !== null; t = o)
      if (o.key === e)
        return t.next = o.next, o.next = /** @type {NonNullable<typeof list.next>} */
        r.next, r.next = o, o;
  }, "listGetNode"), jC = /* @__PURE__ */ n(function(r, e) {
    var t = Mi(r, e);
    return t && t.value;
  }, "listGet"), GC = /* @__PURE__ */ n(function(r, e, t) {
    var o = Mi(r, e);
    o ? o.value = t : r.next = /** @type {import('.').ListNode<typeof value>} */
    {
      // eslint-disable-line no-param-reassign, no-extra-parens
      key: e,
      next: r.next,
      value: t
    };
  }, "listSet"), BC = /* @__PURE__ */ n(function(r, e) {
    return !!Mi(r, e);
  }, "listHas");
  ph.exports = /* @__PURE__ */ n(function() {
    var e, t, o, a = {
      assert: /* @__PURE__ */ n(function(i) {
        if (!a.has(i))
          throw new FC("Side channel does not contain " + IC(i));
      }, "assert"),
      get: /* @__PURE__ */ n(function(i) {
        if (jo && i && (typeof i == "object" || typeof i == "function")) {
          if (e)
            return DC(e, i);
        } else if (Go) {
          if (t)
            return LC(t, i);
        } else if (o)
          return jC(o, i);
      }, "get"),
      has: /* @__PURE__ */ n(function(i) {
        if (jo && i && (typeof i == "object" || typeof i == "function")) {
          if (e)
            return qC(e, i);
        } else if (Go) {
          if (t)
            return kC(t, i);
        } else if (o)
          return BC(o, i);
        return !1;
      }, "has"),
      set: /* @__PURE__ */ n(function(i, s) {
        jo && i && (typeof i == "object" || typeof i == "function") ? (e || (e = new jo()), NC(e, i, s)) : Go ? (t || (t = new Go()), MC(t, i,
        s)) : (o || (o = { key: {}, next: null }), GC(o, i, s));
      }, "set")
    };
    return a;
  }, "getSideChannel");
});

// ../node_modules/qs/lib/formats.js
var Bo = y((bG, fh) => {
  "use strict";
  var UC = String.prototype.replace, HC = /%20/g, ki = {
    RFC1738: "RFC1738",
    RFC3986: "RFC3986"
  };
  fh.exports = {
    default: ki.RFC3986,
    formatters: {
      RFC1738: /* @__PURE__ */ n(function(r) {
        return UC.call(r, HC, "+");
      }, "RFC1738"),
      RFC3986: /* @__PURE__ */ n(function(r) {
        return String(r);
      }, "RFC3986")
    },
    RFC1738: ki.RFC1738,
    RFC3986: ki.RFC3986
  };
});

// ../node_modules/qs/lib/utils.js
var Bi = y((TG, hh) => {
  "use strict";
  var VC = Bo(), ji = Object.prototype.hasOwnProperty, Ye = Array.isArray, ce = function() {
    for (var r = [], e = 0; e < 256; ++e)
      r.push("%" + ((e < 16 ? "0" : "") + e.toString(16)).toUpperCase());
    return r;
  }(), $C = /* @__PURE__ */ n(function(e) {
    for (; e.length > 1; ) {
      var t = e.pop(), o = t.obj[t.prop];
      if (Ye(o)) {
        for (var a = [], i = 0; i < o.length; ++i)
          typeof o[i] < "u" && a.push(o[i]);
        t.obj[t.prop] = a;
      }
    }
  }, "compactQueue"), yh = /* @__PURE__ */ n(function(e, t) {
    for (var o = t && t.plainObjects ? /* @__PURE__ */ Object.create(null) : {}, a = 0; a < e.length; ++a)
      typeof e[a] < "u" && (o[a] = e[a]);
    return o;
  }, "arrayToObject"), WC = /* @__PURE__ */ n(function r(e, t, o) {
    if (!t)
      return e;
    if (typeof t != "object") {
      if (Ye(e))
        e.push(t);
      else if (e && typeof e == "object")
        (o && (o.plainObjects || o.allowPrototypes) || !ji.call(Object.prototype, t)) && (e[t] = !0);
      else
        return [e, t];
      return e;
    }
    if (!e || typeof e != "object")
      return [e].concat(t);
    var a = e;
    return Ye(e) && !Ye(t) && (a = yh(e, o)), Ye(e) && Ye(t) ? (t.forEach(function(i, s) {
      if (ji.call(e, s)) {
        var c = e[s];
        c && typeof c == "object" && i && typeof i == "object" ? e[s] = r(c, i, o) : e.push(i);
      } else
        e[s] = i;
    }), e) : Object.keys(t).reduce(function(i, s) {
      var c = t[s];
      return ji.call(i, s) ? i[s] = r(i[s], c, o) : i[s] = c, i;
    }, a);
  }, "merge"), zC = /* @__PURE__ */ n(function(e, t) {
    return Object.keys(t).reduce(function(o, a) {
      return o[a] = t[a], o;
    }, e);
  }, "assignSingleSource"), YC = /* @__PURE__ */ n(function(r, e, t) {
    var o = r.replace(/\+/g, " ");
    if (t === "iso-8859-1")
      return o.replace(/%[0-9a-f]{2}/gi, unescape);
    try {
      return decodeURIComponent(o);
    } catch {
      return o;
    }
  }, "decode"), Gi = 1024, KC = /* @__PURE__ */ n(function(e, t, o, a, i) {
    if (e.length === 0)
      return e;
    var s = e;
    if (typeof e == "symbol" ? s = Symbol.prototype.toString.call(e) : typeof e != "string" && (s = String(e)), o === "iso-8859-1")
      return escape(s).replace(/%u[0-9a-f]{4}/gi, function(g) {
        return "%26%23" + parseInt(g.slice(2), 16) + "%3B";
      });
    for (var c = "", l = 0; l < s.length; l += Gi) {
      for (var u = s.length >= Gi ? s.slice(l, l + Gi) : s, p = [], h = 0; h < u.length; ++h) {
        var d = u.charCodeAt(h);
        if (d === 45 || d === 46 || d === 95 || d === 126 || d >= 48 && d <= 57 || d >= 65 && d <= 90 || d >= 97 && d <= 122 || i === VC.RFC1738 &&
        (d === 40 || d === 41)) {
          p[p.length] = u.charAt(h);
          continue;
        }
        if (d < 128) {
          p[p.length] = ce[d];
          continue;
        }
        if (d < 2048) {
          p[p.length] = ce[192 | d >> 6] + ce[128 | d & 63];
          continue;
        }
        if (d < 55296 || d >= 57344) {
          p[p.length] = ce[224 | d >> 12] + ce[128 | d >> 6 & 63] + ce[128 | d & 63];
          continue;
        }
        h += 1, d = 65536 + ((d & 1023) << 10 | u.charCodeAt(h) & 1023), p[p.length] = ce[240 | d >> 18] + ce[128 | d >> 12 & 63] + ce[128 |
        d >> 6 & 63] + ce[128 | d & 63];
      }
      c += p.join("");
    }
    return c;
  }, "encode"), XC = /* @__PURE__ */ n(function(e) {
    for (var t = [{ obj: { o: e }, prop: "o" }], o = [], a = 0; a < t.length; ++a)
      for (var i = t[a], s = i.obj[i.prop], c = Object.keys(s), l = 0; l < c.length; ++l) {
        var u = c[l], p = s[u];
        typeof p == "object" && p !== null && o.indexOf(p) === -1 && (t.push({ obj: s, prop: u }), o.push(p));
      }
    return $C(t), e;
  }, "compact"), JC = /* @__PURE__ */ n(function(e) {
    return Object.prototype.toString.call(e) === "[object RegExp]";
  }, "isRegExp"), QC = /* @__PURE__ */ n(function(e) {
    return !e || typeof e != "object" ? !1 : !!(e.constructor && e.constructor.isBuffer && e.constructor.isBuffer(e));
  }, "isBuffer"), ZC = /* @__PURE__ */ n(function(e, t) {
    return [].concat(e, t);
  }, "combine"), eI = /* @__PURE__ */ n(function(e, t) {
    if (Ye(e)) {
      for (var o = [], a = 0; a < e.length; a += 1)
        o.push(t(e[a]));
      return o;
    }
    return t(e);
  }, "maybeMap");
  hh.exports = {
    arrayToObject: yh,
    assign: zC,
    combine: ZC,
    compact: XC,
    decode: YC,
    encode: KC,
    isBuffer: QC,
    isRegExp: JC,
    maybeMap: eI,
    merge: WC
  };
});

// ../node_modules/qs/lib/stringify.js
var Th = y((AG, vh) => {
  "use strict";
  var gh = dh(), Uo = Bi(), Ot = Bo(), rI = Object.prototype.hasOwnProperty, Sh = {
    brackets: /* @__PURE__ */ n(function(e) {
      return e + "[]";
    }, "brackets"),
    comma: "comma",
    indices: /* @__PURE__ */ n(function(e, t) {
      return e + "[" + t + "]";
    }, "indices"),
    repeat: /* @__PURE__ */ n(function(e) {
      return e;
    }, "repeat")
  }, ue = Array.isArray, tI = Array.prototype.push, bh = /* @__PURE__ */ n(function(r, e) {
    tI.apply(r, ue(e) ? e : [e]);
  }, "pushToArray"), oI = Date.prototype.toISOString, mh = Ot.default, $ = {
    addQueryPrefix: !1,
    allowDots: !1,
    allowEmptyArrays: !1,
    arrayFormat: "indices",
    charset: "utf-8",
    charsetSentinel: !1,
    delimiter: "&",
    encode: !0,
    encodeDotInKeys: !1,
    encoder: Uo.encode,
    encodeValuesOnly: !1,
    format: mh,
    formatter: Ot.formatters[mh],
    // deprecated
    indices: !1,
    serializeDate: /* @__PURE__ */ n(function(e) {
      return oI.call(e);
    }, "serializeDate"),
    skipNulls: !1,
    strictNullHandling: !1
  }, nI = /* @__PURE__ */ n(function(e) {
    return typeof e == "string" || typeof e == "number" || typeof e == "boolean" || typeof e == "symbol" || typeof e == "bigint";
  }, "isNonNullishPrimitive"), Ui = {}, aI = /* @__PURE__ */ n(function r(e, t, o, a, i, s, c, l, u, p, h, d, g, m, b, S, T, v) {
    for (var E = e, R = v, w = 0, P = !1; (R = R.get(Ui)) !== void 0 && !P; ) {
      var M = R.get(e);
      if (w += 1, typeof M < "u") {
        if (M === w)
          throw new RangeError("Cyclic object value");
        P = !0;
      }
      typeof R.get(Ui) > "u" && (w = 0);
    }
    if (typeof p == "function" ? E = p(t, E) : E instanceof Date ? E = g(E) : o === "comma" && ue(E) && (E = Uo.maybeMap(E, function(Se) {
      return Se instanceof Date ? g(Se) : Se;
    })), E === null) {
      if (s)
        return u && !S ? u(t, $.encoder, T, "key", m) : t;
      E = "";
    }
    if (nI(E) || Uo.isBuffer(E)) {
      if (u) {
        var F = S ? t : u(t, $.encoder, T, "key", m);
        return [b(F) + "=" + b(u(E, $.encoder, T, "value", m))];
      }
      return [b(t) + "=" + b(String(E))];
    }
    var H = [];
    if (typeof E > "u")
      return H;
    var Z;
    if (o === "comma" && ue(E))
      S && u && (E = Uo.maybeMap(E, u)), Z = [{ value: E.length > 0 ? E.join(",") || null : void 0 }];
    else if (ue(p))
      Z = p;
    else {
      var me = Object.keys(E);
      Z = h ? me.sort(h) : me;
    }
    var V = l ? t.replace(/\./g, "%2E") : t, D = a && ue(E) && E.length === 1 ? V + "[]" : V;
    if (i && ue(E) && E.length === 0)
      return D + "[]";
    for (var q = 0; q < Z.length; ++q) {
      var N = Z[q], G = typeof N == "object" && typeof N.value < "u" ? N.value : E[N];
      if (!(c && G === null)) {
        var ee = d && l ? N.replace(/\./g, "%2E") : N, ge = ue(E) ? typeof o == "function" ? o(D, ee) : D : D + (d ? "." + ee : "[" + ee + "\
]");
        v.set(e, w);
        var z = gh();
        z.set(Ui, v), bh(H, r(
          G,
          ge,
          o,
          a,
          i,
          s,
          c,
          l,
          o === "comma" && S && ue(E) ? null : u,
          p,
          h,
          d,
          g,
          m,
          b,
          S,
          T,
          z
        ));
      }
    }
    return H;
  }, "stringify"), iI = /* @__PURE__ */ n(function(e) {
    if (!e)
      return $;
    if (typeof e.allowEmptyArrays < "u" && typeof e.allowEmptyArrays != "boolean")
      throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
    if (typeof e.encodeDotInKeys < "u" && typeof e.encodeDotInKeys != "boolean")
      throw new TypeError("`encodeDotInKeys` option can only be `true` or `false`, when provided");
    if (e.encoder !== null && typeof e.encoder < "u" && typeof e.encoder != "function")
      throw new TypeError("Encoder has to be a function.");
    var t = e.charset || $.charset;
    if (typeof e.charset < "u" && e.charset !== "utf-8" && e.charset !== "iso-8859-1")
      throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
    var o = Ot.default;
    if (typeof e.format < "u") {
      if (!rI.call(Ot.formatters, e.format))
        throw new TypeError("Unknown format option provided.");
      o = e.format;
    }
    var a = Ot.formatters[o], i = $.filter;
    (typeof e.filter == "function" || ue(e.filter)) && (i = e.filter);
    var s;
    if (e.arrayFormat in Sh ? s = e.arrayFormat : "indices" in e ? s = e.indices ? "indices" : "repeat" : s = $.arrayFormat, "commaRoundTrip" in
    e && typeof e.commaRoundTrip != "boolean")
      throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
    var c = typeof e.allowDots > "u" ? e.encodeDotInKeys === !0 ? !0 : $.allowDots : !!e.allowDots;
    return {
      addQueryPrefix: typeof e.addQueryPrefix == "boolean" ? e.addQueryPrefix : $.addQueryPrefix,
      allowDots: c,
      allowEmptyArrays: typeof e.allowEmptyArrays == "boolean" ? !!e.allowEmptyArrays : $.allowEmptyArrays,
      arrayFormat: s,
      charset: t,
      charsetSentinel: typeof e.charsetSentinel == "boolean" ? e.charsetSentinel : $.charsetSentinel,
      commaRoundTrip: e.commaRoundTrip,
      delimiter: typeof e.delimiter > "u" ? $.delimiter : e.delimiter,
      encode: typeof e.encode == "boolean" ? e.encode : $.encode,
      encodeDotInKeys: typeof e.encodeDotInKeys == "boolean" ? e.encodeDotInKeys : $.encodeDotInKeys,
      encoder: typeof e.encoder == "function" ? e.encoder : $.encoder,
      encodeValuesOnly: typeof e.encodeValuesOnly == "boolean" ? e.encodeValuesOnly : $.encodeValuesOnly,
      filter: i,
      format: o,
      formatter: a,
      serializeDate: typeof e.serializeDate == "function" ? e.serializeDate : $.serializeDate,
      skipNulls: typeof e.skipNulls == "boolean" ? e.skipNulls : $.skipNulls,
      sort: typeof e.sort == "function" ? e.sort : null,
      strictNullHandling: typeof e.strictNullHandling == "boolean" ? e.strictNullHandling : $.strictNullHandling
    };
  }, "normalizeStringifyOptions");
  vh.exports = function(r, e) {
    var t = r, o = iI(e), a, i;
    typeof o.filter == "function" ? (i = o.filter, t = i("", t)) : ue(o.filter) && (i = o.filter, a = i);
    var s = [];
    if (typeof t != "object" || t === null)
      return "";
    var c = Sh[o.arrayFormat], l = c === "comma" && o.commaRoundTrip;
    a || (a = Object.keys(t)), o.sort && a.sort(o.sort);
    for (var u = gh(), p = 0; p < a.length; ++p) {
      var h = a[p];
      o.skipNulls && t[h] === null || bh(s, aI(
        t[h],
        h,
        c,
        l,
        o.allowEmptyArrays,
        o.strictNullHandling,
        o.skipNulls,
        o.encodeDotInKeys,
        o.encode ? o.encoder : null,
        o.filter,
        o.sort,
        o.allowDots,
        o.serializeDate,
        o.format,
        o.formatter,
        o.encodeValuesOnly,
        o.charset,
        u
      ));
    }
    var d = s.join(o.delimiter), g = o.addQueryPrefix === !0 ? "?" : "";
    return o.charsetSentinel && (o.charset === "iso-8859-1" ? g += "utf8=%26%2310003%3B&" : g += "utf8=%E2%9C%93&"), d.length > 0 ? g + d : "";
  };
});

// ../node_modules/qs/lib/parse.js
var Rh = y((wG, Ah) => {
  "use strict";
  var qr = Bi(), Hi = Object.prototype.hasOwnProperty, sI = Array.isArray, U = {
    allowDots: !1,
    allowEmptyArrays: !1,
    allowPrototypes: !1,
    allowSparse: !1,
    arrayLimit: 20,
    charset: "utf-8",
    charsetSentinel: !1,
    comma: !1,
    decodeDotInKeys: !1,
    decoder: qr.decode,
    delimiter: "&",
    depth: 5,
    duplicates: "combine",
    ignoreQueryPrefix: !1,
    interpretNumericEntities: !1,
    parameterLimit: 1e3,
    parseArrays: !0,
    plainObjects: !1,
    strictNullHandling: !1
  }, lI = /* @__PURE__ */ n(function(r) {
    return r.replace(/&#(\d+);/g, function(e, t) {
      return String.fromCharCode(parseInt(t, 10));
    });
  }, "interpretNumericEntities"), Eh = /* @__PURE__ */ n(function(r, e) {
    return r && typeof r == "string" && e.comma && r.indexOf(",") > -1 ? r.split(",") : r;
  }, "parseArrayValue"), cI = "utf8=%26%2310003%3B", uI = "utf8=%E2%9C%93", pI = /* @__PURE__ */ n(function(e, t) {
    var o = { __proto__: null }, a = t.ignoreQueryPrefix ? e.replace(/^\?/, "") : e;
    a = a.replace(/%5B/gi, "[").replace(/%5D/gi, "]");
    var i = t.parameterLimit === 1 / 0 ? void 0 : t.parameterLimit, s = a.split(t.delimiter, i), c = -1, l, u = t.charset;
    if (t.charsetSentinel)
      for (l = 0; l < s.length; ++l)
        s[l].indexOf("utf8=") === 0 && (s[l] === uI ? u = "utf-8" : s[l] === cI && (u = "iso-8859-1"), c = l, l = s.length);
    for (l = 0; l < s.length; ++l)
      if (l !== c) {
        var p = s[l], h = p.indexOf("]="), d = h === -1 ? p.indexOf("=") : h + 1, g, m;
        d === -1 ? (g = t.decoder(p, U.decoder, u, "key"), m = t.strictNullHandling ? null : "") : (g = t.decoder(p.slice(0, d), U.decoder, u,
        "key"), m = qr.maybeMap(
          Eh(p.slice(d + 1), t),
          function(S) {
            return t.decoder(S, U.decoder, u, "value");
          }
        )), m && t.interpretNumericEntities && u === "iso-8859-1" && (m = lI(m)), p.indexOf("[]=") > -1 && (m = sI(m) ? [m] : m);
        var b = Hi.call(o, g);
        b && t.duplicates === "combine" ? o[g] = qr.combine(o[g], m) : (!b || t.duplicates === "last") && (o[g] = m);
      }
    return o;
  }, "parseQueryStringValues"), dI = /* @__PURE__ */ n(function(r, e, t, o) {
    for (var a = o ? e : Eh(e, t), i = r.length - 1; i >= 0; --i) {
      var s, c = r[i];
      if (c === "[]" && t.parseArrays)
        s = t.allowEmptyArrays && (a === "" || t.strictNullHandling && a === null) ? [] : [].concat(a);
      else {
        s = t.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
        var l = c.charAt(0) === "[" && c.charAt(c.length - 1) === "]" ? c.slice(1, -1) : c, u = t.decodeDotInKeys ? l.replace(/%2E/g, ".") :
        l, p = parseInt(u, 10);
        !t.parseArrays && u === "" ? s = { 0: a } : !isNaN(p) && c !== u && String(p) === u && p >= 0 && t.parseArrays && p <= t.arrayLimit ?
        (s = [], s[p] = a) : u !== "__proto__" && (s[u] = a);
      }
      a = s;
    }
    return a;
  }, "parseObject"), fI = /* @__PURE__ */ n(function(e, t, o, a) {
    if (e) {
      var i = o.allowDots ? e.replace(/\.([^.[]+)/g, "[$1]") : e, s = /(\[[^[\]]*])/, c = /(\[[^[\]]*])/g, l = o.depth > 0 && s.exec(i), u = l ?
      i.slice(0, l.index) : i, p = [];
      if (u) {
        if (!o.plainObjects && Hi.call(Object.prototype, u) && !o.allowPrototypes)
          return;
        p.push(u);
      }
      for (var h = 0; o.depth > 0 && (l = c.exec(i)) !== null && h < o.depth; ) {
        if (h += 1, !o.plainObjects && Hi.call(Object.prototype, l[1].slice(1, -1)) && !o.allowPrototypes)
          return;
        p.push(l[1]);
      }
      return l && p.push("[" + i.slice(l.index) + "]"), dI(p, t, o, a);
    }
  }, "parseQueryStringKeys"), yI = /* @__PURE__ */ n(function(e) {
    if (!e)
      return U;
    if (typeof e.allowEmptyArrays < "u" && typeof e.allowEmptyArrays != "boolean")
      throw new TypeError("`allowEmptyArrays` option can only be `true` or `false`, when provided");
    if (typeof e.decodeDotInKeys < "u" && typeof e.decodeDotInKeys != "boolean")
      throw new TypeError("`decodeDotInKeys` option can only be `true` or `false`, when provided");
    if (e.decoder !== null && typeof e.decoder < "u" && typeof e.decoder != "function")
      throw new TypeError("Decoder has to be a function.");
    if (typeof e.charset < "u" && e.charset !== "utf-8" && e.charset !== "iso-8859-1")
      throw new TypeError("The charset option must be either utf-8, iso-8859-1, or undefined");
    var t = typeof e.charset > "u" ? U.charset : e.charset, o = typeof e.duplicates > "u" ? U.duplicates : e.duplicates;
    if (o !== "combine" && o !== "first" && o !== "last")
      throw new TypeError("The duplicates option must be either combine, first, or last");
    var a = typeof e.allowDots > "u" ? e.decodeDotInKeys === !0 ? !0 : U.allowDots : !!e.allowDots;
    return {
      allowDots: a,
      allowEmptyArrays: typeof e.allowEmptyArrays == "boolean" ? !!e.allowEmptyArrays : U.allowEmptyArrays,
      allowPrototypes: typeof e.allowPrototypes == "boolean" ? e.allowPrototypes : U.allowPrototypes,
      allowSparse: typeof e.allowSparse == "boolean" ? e.allowSparse : U.allowSparse,
      arrayLimit: typeof e.arrayLimit == "number" ? e.arrayLimit : U.arrayLimit,
      charset: t,
      charsetSentinel: typeof e.charsetSentinel == "boolean" ? e.charsetSentinel : U.charsetSentinel,
      comma: typeof e.comma == "boolean" ? e.comma : U.comma,
      decodeDotInKeys: typeof e.decodeDotInKeys == "boolean" ? e.decodeDotInKeys : U.decodeDotInKeys,
      decoder: typeof e.decoder == "function" ? e.decoder : U.decoder,
      delimiter: typeof e.delimiter == "string" || qr.isRegExp(e.delimiter) ? e.delimiter : U.delimiter,
      // eslint-disable-next-line no-implicit-coercion, no-extra-parens
      depth: typeof e.depth == "number" || e.depth === !1 ? +e.depth : U.depth,
      duplicates: o,
      ignoreQueryPrefix: e.ignoreQueryPrefix === !0,
      interpretNumericEntities: typeof e.interpretNumericEntities == "boolean" ? e.interpretNumericEntities : U.interpretNumericEntities,
      parameterLimit: typeof e.parameterLimit == "number" ? e.parameterLimit : U.parameterLimit,
      parseArrays: e.parseArrays !== !1,
      plainObjects: typeof e.plainObjects == "boolean" ? e.plainObjects : U.plainObjects,
      strictNullHandling: typeof e.strictNullHandling == "boolean" ? e.strictNullHandling : U.strictNullHandling
    };
  }, "normalizeParseOptions");
  Ah.exports = function(r, e) {
    var t = yI(e);
    if (r === "" || r === null || typeof r > "u")
      return t.plainObjects ? /* @__PURE__ */ Object.create(null) : {};
    for (var o = typeof r == "string" ? pI(r, t) : r, a = t.plainObjects ? /* @__PURE__ */ Object.create(null) : {}, i = Object.keys(o), s = 0; s <
    i.length; ++s) {
      var c = i[s], l = fI(c, o[c], t, typeof r == "string");
      a = qr.merge(a, l, t);
    }
    return t.allowSparse === !0 ? a : qr.compact(a);
  };
});

// ../node_modules/qs/lib/index.js
var Ho = y((_G, wh) => {
  "use strict";
  var hI = Th(), mI = Rh(), gI = Bo();
  wh.exports = {
    formats: gI,
    parse: mI,
    stringify: hI
  };
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/maps/entities.json
var zi = y((LG, RI) => {
  RI.exports = { Aacute: "\xC1", aacute: "\xE1", Abreve: "\u0102", abreve: "\u0103", ac: "\u223E", acd: "\u223F", acE: "\u223E\u0333", Acirc: "\
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
var Dh = y((MG, wI) => {
  wI.exports = { Aacute: "\xC1", aacute: "\xE1", Acirc: "\xC2", acirc: "\xE2", acute: "\xB4", AElig: "\xC6", aelig: "\xE6", Agrave: "\xC0", agrave: "\
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
var Yi = y((kG, xI) => {
  xI.exports = { amp: "&", apos: "'", gt: ">", lt: "<", quot: '"' };
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/maps/decode.json
var Nh = y((jG, _I) => {
  _I.exports = { "0": 65533, "128": 8364, "130": 8218, "131": 402, "132": 8222, "133": 8230, "134": 8224, "135": 8225, "136": 710, "137": 8240,
  "138": 352, "139": 8249, "140": 338, "142": 381, "145": 8216, "146": 8217, "147": 8220, "148": 8221, "149": 8226, "150": 8211, "151": 8212,
  "152": 732, "153": 8482, "154": 353, "155": 8250, "156": 339, "158": 382, "159": 376 };
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/decode_codepoint.js
var Lh = y((It) => {
  "use strict";
  var PI = It && It.__importDefault || function(r) {
    return r && r.__esModule ? r : { default: r };
  };
  Object.defineProperty(It, "__esModule", { value: !0 });
  var qh = PI(Nh()), OI = (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    String.fromCodePoint || function(r) {
      var e = "";
      return r > 65535 && (r -= 65536, e += String.fromCharCode(r >>> 10 & 1023 | 55296), r = 56320 | r & 1023), e += String.fromCharCode(r),
      e;
    }
  );
  function CI(r) {
    return r >= 55296 && r <= 57343 || r > 1114111 ? "\uFFFD" : (r in qh.default && (r = qh.default[r]), OI(r));
  }
  n(CI, "decodeCodePoint");
  It.default = CI;
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/decode.js
var Xi = y((pe) => {
  "use strict";
  var $o = pe && pe.__importDefault || function(r) {
    return r && r.__esModule ? r : { default: r };
  };
  Object.defineProperty(pe, "__esModule", { value: !0 });
  pe.decodeHTML = pe.decodeHTMLStrict = pe.decodeXML = void 0;
  var Ki = $o(zi()), II = $o(Dh()), FI = $o(Yi()), Mh = $o(Lh()), DI = /&(?:[a-zA-Z0-9]+|#[xX][\da-fA-F]+|#\d+);/g;
  pe.decodeXML = jh(FI.default);
  pe.decodeHTMLStrict = jh(Ki.default);
  function jh(r) {
    var e = Gh(r);
    return function(t) {
      return String(t).replace(DI, e);
    };
  }
  n(jh, "getStrictDecoder");
  var kh = /* @__PURE__ */ n(function(r, e) {
    return r < e ? 1 : -1;
  }, "sorter");
  pe.decodeHTML = function() {
    for (var r = Object.keys(II.default).sort(kh), e = Object.keys(Ki.default).sort(kh), t = 0, o = 0; t < e.length; t++)
      r[o] === e[t] ? (e[t] += ";?", o++) : e[t] += ";";
    var a = new RegExp("&(?:" + e.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g"), i = Gh(Ki.default);
    function s(c) {
      return c.substr(-1) !== ";" && (c += ";"), i(c);
    }
    return n(s, "replacer"), function(c) {
      return String(c).replace(a, s);
    };
  }();
  function Gh(r) {
    return /* @__PURE__ */ n(function(t) {
      if (t.charAt(1) === "#") {
        var o = t.charAt(2);
        return o === "X" || o === "x" ? Mh.default(parseInt(t.substr(3), 16)) : Mh.default(parseInt(t.substr(2), 10));
      }
      return r[t.slice(1, -1)] || t;
    }, "replace");
  }
  n(Gh, "getReplacer");
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/encode.js
var Qi = y((te) => {
  "use strict";
  var Bh = te && te.__importDefault || function(r) {
    return r && r.__esModule ? r : { default: r };
  };
  Object.defineProperty(te, "__esModule", { value: !0 });
  te.escapeUTF8 = te.escape = te.encodeNonAsciiHTML = te.encodeHTML = te.encodeXML = void 0;
  var NI = Bh(Yi()), Uh = Vh(NI.default), Hh = $h(Uh);
  te.encodeXML = Yh(Uh);
  var qI = Bh(zi()), Ji = Vh(qI.default), LI = $h(Ji);
  te.encodeHTML = kI(Ji, LI);
  te.encodeNonAsciiHTML = Yh(Ji);
  function Vh(r) {
    return Object.keys(r).sort().reduce(function(e, t) {
      return e[r[t]] = "&" + t + ";", e;
    }, {});
  }
  n(Vh, "getInverseObj");
  function $h(r) {
    for (var e = [], t = [], o = 0, a = Object.keys(r); o < a.length; o++) {
      var i = a[o];
      i.length === 1 ? e.push("\\" + i) : t.push(i);
    }
    e.sort();
    for (var s = 0; s < e.length - 1; s++) {
      for (var c = s; c < e.length - 1 && e[c].charCodeAt(1) + 1 === e[c + 1].charCodeAt(1); )
        c += 1;
      var l = 1 + c - s;
      l < 3 || e.splice(s, l, e[s] + "-" + e[c]);
    }
    return t.unshift("[" + e.join("") + "]"), new RegExp(t.join("|"), "g");
  }
  n($h, "getInverseReplacer");
  var Wh = /(?:[\x80-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g,
  MI = (
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
  function Wo(r) {
    return "&#x" + (r.length > 1 ? MI(r) : r.charCodeAt(0)).toString(16).toUpperCase() + ";";
  }
  n(Wo, "singleCharReplacer");
  function kI(r, e) {
    return function(t) {
      return t.replace(e, function(o) {
        return r[o];
      }).replace(Wh, Wo);
    };
  }
  n(kI, "getInverse");
  var zh = new RegExp(Hh.source + "|" + Wh.source, "g");
  function jI(r) {
    return r.replace(zh, Wo);
  }
  n(jI, "escape");
  te.escape = jI;
  function GI(r) {
    return r.replace(Hh, Wo);
  }
  n(GI, "escapeUTF8");
  te.escapeUTF8 = GI;
  function Yh(r) {
    return function(e) {
      return e.replace(zh, function(t) {
        return r[t] || Wo(t);
      });
    };
  }
  n(Yh, "getASCIIEncoder");
});

// ../node_modules/ansi-to-html/node_modules/entities/lib/index.js
var Xh = y((O) => {
  "use strict";
  Object.defineProperty(O, "__esModule", { value: !0 });
  O.decodeXMLStrict = O.decodeHTML5Strict = O.decodeHTML4Strict = O.decodeHTML5 = O.decodeHTML4 = O.decodeHTMLStrict = O.decodeHTML = O.decodeXML =
  O.encodeHTML5 = O.encodeHTML4 = O.escapeUTF8 = O.escape = O.encodeNonAsciiHTML = O.encodeHTML = O.encodeXML = O.encode = O.decodeStrict = O.
  decode = void 0;
  var zo = Xi(), Kh = Qi();
  function BI(r, e) {
    return (!e || e <= 0 ? zo.decodeXML : zo.decodeHTML)(r);
  }
  n(BI, "decode");
  O.decode = BI;
  function UI(r, e) {
    return (!e || e <= 0 ? zo.decodeXML : zo.decodeHTMLStrict)(r);
  }
  n(UI, "decodeStrict");
  O.decodeStrict = UI;
  function HI(r, e) {
    return (!e || e <= 0 ? Kh.encodeXML : Kh.encodeHTML)(r);
  }
  n(HI, "encode");
  O.encode = HI;
  var Xe = Qi();
  Object.defineProperty(O, "encodeXML", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Xe.encodeXML;
  }, "get") });
  Object.defineProperty(O, "encodeHTML", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Xe.encodeHTML;
  }, "get") });
  Object.defineProperty(O, "encodeNonAsciiHTML", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Xe.encodeNonAsciiHTML;
  }, "get") });
  Object.defineProperty(O, "escape", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Xe.escape;
  }, "get") });
  Object.defineProperty(O, "escapeUTF8", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Xe.escapeUTF8;
  }, "get") });
  Object.defineProperty(O, "encodeHTML4", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Xe.encodeHTML;
  }, "get") });
  Object.defineProperty(O, "encodeHTML5", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Xe.encodeHTML;
  }, "get") });
  var Oe = Xi();
  Object.defineProperty(O, "decodeXML", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Oe.decodeXML;
  }, "get") });
  Object.defineProperty(O, "decodeHTML", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Oe.decodeHTML;
  }, "get") });
  Object.defineProperty(O, "decodeHTMLStrict", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Oe.decodeHTMLStrict;
  }, "get") });
  Object.defineProperty(O, "decodeHTML4", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Oe.decodeHTML;
  }, "get") });
  Object.defineProperty(O, "decodeHTML5", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Oe.decodeHTML;
  }, "get") });
  Object.defineProperty(O, "decodeHTML4Strict", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Oe.decodeHTMLStrict;
  }, "get") });
  Object.defineProperty(O, "decodeHTML5Strict", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Oe.decodeHTMLStrict;
  }, "get") });
  Object.defineProperty(O, "decodeXMLStrict", { enumerable: !0, get: /* @__PURE__ */ n(function() {
    return Oe.decodeXML;
  }, "get") });
});

// ../node_modules/ansi-to-html/lib/ansi_to_html.js
var sm = y((YG, im) => {
  "use strict";
  function VI(r, e) {
    if (!(r instanceof e))
      throw new TypeError("Cannot call a class as a function");
  }
  n(VI, "_classCallCheck");
  function Jh(r, e) {
    for (var t = 0; t < e.length; t++) {
      var o = e[t];
      o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(r, o.key, o);
    }
  }
  n(Jh, "_defineProperties");
  function $I(r, e, t) {
    return e && Jh(r.prototype, e), t && Jh(r, t), r;
  }
  n($I, "_createClass");
  function om(r, e) {
    var t = typeof Symbol < "u" && r[Symbol.iterator] || r["@@iterator"];
    if (!t) {
      if (Array.isArray(r) || (t = WI(r)) || e && r && typeof r.length == "number") {
        t && (r = t);
        var o = 0, a = /* @__PURE__ */ n(function() {
        }, "F");
        return { s: a, n: /* @__PURE__ */ n(function() {
          return o >= r.length ? { done: !0 } : { done: !1, value: r[o++] };
        }, "n"), e: /* @__PURE__ */ n(function(u) {
          throw u;
        }, "e"), f: a };
      }
      throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
    }
    var i = !0, s = !1, c;
    return { s: /* @__PURE__ */ n(function() {
      t = t.call(r);
    }, "s"), n: /* @__PURE__ */ n(function() {
      var u = t.next();
      return i = u.done, u;
    }, "n"), e: /* @__PURE__ */ n(function(u) {
      s = !0, c = u;
    }, "e"), f: /* @__PURE__ */ n(function() {
      try {
        !i && t.return != null && t.return();
      } finally {
        if (s) throw c;
      }
    }, "f") };
  }
  n(om, "_createForOfIteratorHelper");
  function WI(r, e) {
    if (r) {
      if (typeof r == "string") return Qh(r, e);
      var t = Object.prototype.toString.call(r).slice(8, -1);
      if (t === "Object" && r.constructor && (t = r.constructor.name), t === "Map" || t === "Set") return Array.from(r);
      if (t === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)) return Qh(r, e);
    }
  }
  n(WI, "_unsupportedIterableToArray");
  function Qh(r, e) {
    (e == null || e > r.length) && (e = r.length);
    for (var t = 0, o = new Array(e); t < e; t++)
      o[t] = r[t];
    return o;
  }
  n(Qh, "_arrayLikeToArray");
  var zI = Xh(), Zh = {
    fg: "#FFF",
    bg: "#000",
    newline: !1,
    escapeXML: !1,
    stream: !1,
    colors: YI()
  };
  function YI() {
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
    return Yo(0, 5).forEach(function(e) {
      Yo(0, 5).forEach(function(t) {
        Yo(0, 5).forEach(function(o) {
          return KI(e, t, o, r);
        });
      });
    }), Yo(0, 23).forEach(function(e) {
      var t = e + 232, o = nm(e * 10 + 8);
      r[t] = "#" + o + o + o;
    }), r;
  }
  n(YI, "getDefaultColors");
  function KI(r, e, t, o) {
    var a = 16 + r * 36 + e * 6 + t, i = r > 0 ? r * 40 + 55 : 0, s = e > 0 ? e * 40 + 55 : 0, c = t > 0 ? t * 40 + 55 : 0;
    o[a] = XI([i, s, c]);
  }
  n(KI, "setStyleColor");
  function nm(r) {
    for (var e = r.toString(16); e.length < 2; )
      e = "0" + e;
    return e;
  }
  n(nm, "toHexString");
  function XI(r) {
    var e = [], t = om(r), o;
    try {
      for (t.s(); !(o = t.n()).done; ) {
        var a = o.value;
        e.push(nm(a));
      }
    } catch (i) {
      t.e(i);
    } finally {
      t.f();
    }
    return "#" + e.join("");
  }
  n(XI, "toColorHexString");
  function em(r, e, t, o) {
    var a;
    return e === "text" ? a = eF(t, o) : e === "display" ? a = QI(r, t, o) : e === "xterm256Foreground" ? a = Xo(r, o.colors[t]) : e === "xt\
erm256Background" ? a = Jo(r, o.colors[t]) : e === "rgb" && (a = JI(r, t)), a;
  }
  n(em, "generateOutput");
  function JI(r, e) {
    e = e.substring(2).slice(0, -1);
    var t = +e.substr(0, 2), o = e.substring(5).split(";"), a = o.map(function(i) {
      return ("0" + Number(i).toString(16)).substr(-2);
    }).join("");
    return Ko(r, (t === 38 ? "color:#" : "background-color:#") + a);
  }
  n(JI, "handleRgb");
  function QI(r, e, t) {
    e = parseInt(e, 10);
    var o = {
      "-1": /* @__PURE__ */ n(function() {
        return "<br/>";
      }, "_"),
      0: /* @__PURE__ */ n(function() {
        return r.length && am(r);
      }, "_"),
      1: /* @__PURE__ */ n(function() {
        return Ce(r, "b");
      }, "_"),
      3: /* @__PURE__ */ n(function() {
        return Ce(r, "i");
      }, "_"),
      4: /* @__PURE__ */ n(function() {
        return Ce(r, "u");
      }, "_"),
      8: /* @__PURE__ */ n(function() {
        return Ko(r, "display:none");
      }, "_"),
      9: /* @__PURE__ */ n(function() {
        return Ce(r, "strike");
      }, "_"),
      22: /* @__PURE__ */ n(function() {
        return Ko(r, "font-weight:normal;text-decoration:none;font-style:normal");
      }, "_"),
      23: /* @__PURE__ */ n(function() {
        return tm(r, "i");
      }, "_"),
      24: /* @__PURE__ */ n(function() {
        return tm(r, "u");
      }, "_"),
      39: /* @__PURE__ */ n(function() {
        return Xo(r, t.fg);
      }, "_"),
      49: /* @__PURE__ */ n(function() {
        return Jo(r, t.bg);
      }, "_"),
      53: /* @__PURE__ */ n(function() {
        return Ko(r, "text-decoration:overline");
      }, "_")
    }, a;
    return o[e] ? a = o[e]() : 4 < e && e < 7 ? a = Ce(r, "blink") : 29 < e && e < 38 ? a = Xo(r, t.colors[e - 30]) : 39 < e && e < 48 ? a =
    Jo(r, t.colors[e - 40]) : 89 < e && e < 98 ? a = Xo(r, t.colors[8 + (e - 90)]) : 99 < e && e < 108 && (a = Jo(r, t.colors[8 + (e - 100)])),
    a;
  }
  n(QI, "handleDisplay");
  function am(r) {
    var e = r.slice(0);
    return r.length = 0, e.reverse().map(function(t) {
      return "</" + t + ">";
    }).join("");
  }
  n(am, "resetStyles");
  function Yo(r, e) {
    for (var t = [], o = r; o <= e; o++)
      t.push(o);
    return t;
  }
  n(Yo, "range");
  function ZI(r) {
    return function(e) {
      return (r === null || e.category !== r) && r !== "all";
    };
  }
  n(ZI, "notCategory");
  function rm(r) {
    r = parseInt(r, 10);
    var e = null;
    return r === 0 ? e = "all" : r === 1 ? e = "bold" : 2 < r && r < 5 ? e = "underline" : 4 < r && r < 7 ? e = "blink" : r === 8 ? e = "hid\
e" : r === 9 ? e = "strike" : 29 < r && r < 38 || r === 39 || 89 < r && r < 98 ? e = "foreground-color" : (39 < r && r < 48 || r === 49 || 99 <
    r && r < 108) && (e = "background-color"), e;
  }
  n(rm, "categoryForCode");
  function eF(r, e) {
    return e.escapeXML ? zI.encodeXML(r) : r;
  }
  n(eF, "pushText");
  function Ce(r, e, t) {
    return t || (t = ""), r.push(e), "<".concat(e).concat(t ? ' style="'.concat(t, '"') : "", ">");
  }
  n(Ce, "pushTag");
  function Ko(r, e) {
    return Ce(r, "span", e);
  }
  n(Ko, "pushStyle");
  function Xo(r, e) {
    return Ce(r, "span", "color:" + e);
  }
  n(Xo, "pushForegroundColor");
  function Jo(r, e) {
    return Ce(r, "span", "background-color:" + e);
  }
  n(Jo, "pushBackgroundColor");
  function tm(r, e) {
    var t;
    if (r.slice(-1)[0] === e && (t = r.pop()), t)
      return "</" + e + ">";
  }
  n(tm, "closeTag");
  function rF(r, e, t) {
    var o = !1, a = 3;
    function i() {
      return "";
    }
    n(i, "remove");
    function s(w, P) {
      return t("xterm256Foreground", P), "";
    }
    n(s, "removeXterm256Foreground");
    function c(w, P) {
      return t("xterm256Background", P), "";
    }
    n(c, "removeXterm256Background");
    function l(w) {
      return e.newline ? t("display", -1) : t("text", w), "";
    }
    n(l, "newline");
    function u(w, P) {
      o = !0, P.trim().length === 0 && (P = "0"), P = P.trimRight(";").split(";");
      var M = om(P), F;
      try {
        for (M.s(); !(F = M.n()).done; ) {
          var H = F.value;
          t("display", H);
        }
      } catch (Z) {
        M.e(Z);
      } finally {
        M.f();
      }
      return "";
    }
    n(u, "ansiMess");
    function p(w) {
      return t("text", w), "";
    }
    n(p, "realText");
    function h(w) {
      return t("rgb", w), "";
    }
    n(h, "rgb");
    var d = [{
      pattern: /^\x08+/,
      sub: i
    }, {
      pattern: /^\x1b\[[012]?K/,
      sub: i
    }, {
      pattern: /^\x1b\[\(B/,
      sub: i
    }, {
      pattern: /^\x1b\[[34]8;2;\d+;\d+;\d+m/,
      sub: h
    }, {
      pattern: /^\x1b\[38;5;(\d+)m/,
      sub: s
    }, {
      pattern: /^\x1b\[48;5;(\d+)m/,
      sub: c
    }, {
      pattern: /^\n/,
      sub: l
    }, {
      pattern: /^\r+\n/,
      sub: l
    }, {
      pattern: /^\r/,
      sub: l
    }, {
      pattern: /^\x1b\[((?:\d{1,3};?)+|)m/,
      sub: u
    }, {
      // CSI n J
      // ED - Erase in Display Clears part of the screen.
      // If n is 0 (or missing), clear from cursor to end of screen.
      // If n is 1, clear from cursor to beginning of the screen.
      // If n is 2, clear entire screen (and moves cursor to upper left on DOS ANSI.SYS).
      // If n is 3, clear entire screen and delete all lines saved in the scrollback buffer
      //   (this feature was added for xterm and is supported by other terminal applications).
      pattern: /^\x1b\[\d?J/,
      sub: i
    }, {
      // CSI n ; m f
      // HVP - Horizontal Vertical Position Same as CUP
      pattern: /^\x1b\[\d{0,3};\d{0,3}f/,
      sub: i
    }, {
      // catch-all for CSI sequences?
      pattern: /^\x1b\[?[\d;]{0,3}/,
      sub: i
    }, {
      /**
       * extracts real text - not containing:
       * - `\x1b' - ESC - escape (Ascii 27)
       * - '\x08' - BS - backspace (Ascii 8)
       * - `\n` - Newline - linefeed (LF) (ascii 10)
       * - `\r` - Windows Carriage Return (CR)
       */
      pattern: /^(([^\x1b\x08\r\n])+)/,
      sub: p
    }];
    function g(w, P) {
      P > a && o || (o = !1, r = r.replace(w.pattern, w.sub));
    }
    n(g, "process");
    var m = [], b = r, S = b.length;
    e: for (; S > 0; ) {
      for (var T = 0, v = 0, E = d.length; v < E; T = ++v) {
        var R = d[T];
        if (g(R, T), r.length !== S) {
          S = r.length;
          continue e;
        }
      }
      if (r.length === S)
        break;
      m.push(0), S = r.length;
    }
    return m;
  }
  n(rF, "tokenize");
  function tF(r, e, t) {
    return e !== "text" && (r = r.filter(ZI(rm(t))), r.push({
      token: e,
      data: t,
      category: rm(t)
    })), r;
  }
  n(tF, "updateStickyStack");
  var oF = /* @__PURE__ */ function() {
    function r(e) {
      VI(this, r), e = e || {}, e.colors && (e.colors = Object.assign({}, Zh.colors, e.colors)), this.options = Object.assign({}, Zh, e), this.
      stack = [], this.stickyStack = [];
    }
    return n(r, "Filter"), $I(r, [{
      key: "toHtml",
      value: /* @__PURE__ */ n(function(t) {
        var o = this;
        t = typeof t == "string" ? [t] : t;
        var a = this.stack, i = this.options, s = [];
        return this.stickyStack.forEach(function(c) {
          var l = em(a, c.token, c.data, i);
          l && s.push(l);
        }), rF(t.join(""), i, function(c, l) {
          var u = em(a, c, l, i);
          u && s.push(u), i.stream && (o.stickyStack = tF(o.stickyStack, c, l));
        }), a.length && s.push(am(a)), s.join("");
      }, "toHtml")
    }]), r;
  }();
  im.exports = oF;
});

// ../node_modules/browser-dtector/browser-dtector.umd.min.js
var mm = y((ns, as) => {
  (function(r, e) {
    typeof ns == "object" && typeof as < "u" ? as.exports = e() : typeof define == "function" && define.amd ? define(e) : (r = typeof globalThis <
    "u" ? globalThis : r || self).BrowserDetector = e();
  })(ns, function() {
    "use strict";
    function r(s, c) {
      for (var l = 0; l < c.length; l++) {
        var u = c[l];
        u.enumerable = u.enumerable || !1, u.configurable = !0, "value" in u && (u.writable = !0), Object.defineProperty(s, (p = u.key, h = void 0,
        typeof (h = function(d, g) {
          if (typeof d != "object" || d === null) return d;
          var m = d[Symbol.toPrimitive];
          if (m !== void 0) {
            var b = m.call(d, g || "default");
            if (typeof b != "object") return b;
            throw new TypeError("@@toPrimitive must return a primitive value.");
          }
          return (g === "string" ? String : Number)(d);
        }(p, "string")) == "symbol" ? h : String(h)), u);
      }
      var p, h;
    }
    n(r, "e");
    var e = { chrome: "Google Chrome", brave: "Brave", crios: "Google Chrome", edge: "Microsoft Edge", edg: "Microsoft Edge", edgios: "Micro\
soft Edge", fennec: "Mozilla Firefox", jsdom: "JsDOM", mozilla: "Mozilla Firefox", fxios: "Mozilla Firefox", msie: "Microsoft Internet Explo\
rer", opera: "Opera", opios: "Opera", opr: "Opera", opt: "Opera", rv: "Microsoft Internet Explorer", safari: "Safari", samsungbrowser: "Sams\
ung Browser", electron: "Electron" }, t = { android: "Android", androidTablet: "Android Tablet", cros: "Chrome OS", fennec: "Android Tablet",
    ipad: "IPad", iphone: "IPhone", jsdom: "JsDOM", linux: "Linux", mac: "Macintosh", tablet: "Android Tablet", win: "Windows", "windows pho\
ne": "Windows Phone", xbox: "Microsoft Xbox" }, o = /* @__PURE__ */ n(function(s) {
      var c = new RegExp("^-?\\d+(?:.\\d{0,".concat(arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : -1, "})?")), l = Number(
      s).toString().match(c);
      return l ? l[0] : null;
    }, "n"), a = /* @__PURE__ */ n(function() {
      return typeof window < "u" ? window.navigator : null;
    }, "i"), i = function() {
      function s(p) {
        var h;
        (function(d, g) {
          if (!(d instanceof g)) throw new TypeError("Cannot call a class as a function");
        })(this, s), this.userAgent = p || ((h = a()) === null || h === void 0 ? void 0 : h.userAgent) || null;
      }
      n(s, "t");
      var c, l, u;
      return c = s, l = [{ key: "parseUserAgent", value: /* @__PURE__ */ n(function(p) {
        var h, d, g, m = {}, b = p || this.userAgent || "", S = b.toLowerCase().replace(/\s\s+/g, " "), T = /(edge)\/([\w.]+)/.exec(S) || /(edg)[/]([\w.]+)/.
        exec(S) || /(opr)[/]([\w.]+)/.exec(S) || /(opt)[/]([\w.]+)/.exec(S) || /(fxios)[/]([\w.]+)/.exec(S) || /(edgios)[/]([\w.]+)/.exec(S) ||
        /(jsdom)[/]([\w.]+)/.exec(S) || /(samsungbrowser)[/]([\w.]+)/.exec(S) || /(electron)[/]([\w.]+)/.exec(S) || /(chrome)[/]([\w.]+)/.exec(
        S) || /(crios)[/]([\w.]+)/.exec(S) || /(opios)[/]([\w.]+)/.exec(S) || /(version)(applewebkit)[/]([\w.]+).*(safari)[/]([\w.]+)/.exec(
        S) || /(webkit)[/]([\w.]+).*(version)[/]([\w.]+).*(safari)[/]([\w.]+)/.exec(S) || /(applewebkit)[/]([\w.]+).*(safari)[/]([\w.]+)/.exec(
        S) || /(webkit)[/]([\w.]+)/.exec(S) || /(opera)(?:.*version|)[/]([\w.]+)/.exec(S) || /(msie) ([\w.]+)/.exec(S) || /(fennec)[/]([\w.]+)/.
        exec(S) || S.indexOf("trident") >= 0 && /(rv)(?::| )([\w.]+)/.exec(S) || S.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.
        exec(S) || [], v = /(ipad)/.exec(S) || /(ipod)/.exec(S) || /(iphone)/.exec(S) || /(jsdom)/.exec(S) || /(windows phone)/.exec(S) || /(xbox)/.
        exec(S) || /(win)/.exec(S) || /(tablet)/.exec(S) || /(android)/.test(S) && /(mobile)/.test(S) === !1 && ["androidTablet"] || /(android)/.
        exec(S) || /(mac)/.exec(S) || /(linux)/.exec(S) || /(cros)/.exec(S) || [], E = T[5] || T[3] || T[1] || null, R = v[0] || null, w = T[4] ||
        T[2] || null, P = a();
        E === "chrome" && typeof (P == null || (h = P.brave) === null || h === void 0 ? void 0 : h.isBrave) == "function" && (E = "brave"), E &&
        (m[E] = !0), R && (m[R] = !0);
        var M = !!(m.tablet || m.android || m.androidTablet), F = !!(m.ipad || m.tablet || m.androidTablet), H = !!(m.android || m.androidTablet ||
        m.tablet || m.ipad || m.ipod || m.iphone || m["windows phone"]), Z = !!(m.cros || m.mac || m.linux || m.win), me = !!(m.brave || m.chrome ||
        m.crios || m.opr || m.safari || m.edg || m.electron), V = !!(m.msie || m.rv);
        return { name: (d = e[E]) !== null && d !== void 0 ? d : null, platform: (g = t[R]) !== null && g !== void 0 ? g : null, userAgent: b,
        version: w, shortVersion: w ? o(parseFloat(w), 2) : null, isAndroid: M, isTablet: F, isMobile: H, isDesktop: Z, isWebkit: me, isIE: V };
      }, "value") }, { key: "getBrowserInfo", value: /* @__PURE__ */ n(function() {
        var p = this.parseUserAgent();
        return { name: p.name, platform: p.platform, userAgent: p.userAgent, version: p.version, shortVersion: p.shortVersion };
      }, "value") }], u = [{ key: "VERSION", get: /* @__PURE__ */ n(function() {
        return "3.4.0";
      }, "get") }], l && r(c.prototype, l), u && r(c, u), Object.defineProperty(c, "prototype", { writable: !1 }), s;
    }();
    return i;
  });
});

// ../node_modules/@storybook/global/dist/index.mjs
var Zo = {};
Ie(Zo, {
  global: () => A
});
var A = (() => {
  let r;
  return typeof window < "u" ? r = window : typeof globalThis < "u" ? r = globalThis : typeof global < "u" ? r = global : typeof self < "u" ?
  r = self : r = {}, r;
})();

// src/core-events/index.ts
var be = {};
Ie(be, {
  ARGTYPES_INFO_REQUEST: () => En,
  ARGTYPES_INFO_RESPONSE: () => Ut,
  CHANNEL_CREATED: () => xm,
  CHANNEL_WS_DISCONNECT: () => rn,
  CONFIG_ERROR: () => tn,
  CREATE_NEW_STORYFILE_REQUEST: () => _m,
  CREATE_NEW_STORYFILE_RESPONSE: () => Pm,
  CURRENT_STORY_WAS_SET: () => Gt,
  DOCS_PREPARED: () => on,
  DOCS_RENDERED: () => kr,
  FILE_COMPONENT_SEARCH_REQUEST: () => Om,
  FILE_COMPONENT_SEARCH_RESPONSE: () => Cm,
  FORCE_REMOUNT: () => nn,
  FORCE_RE_RENDER: () => jr,
  GLOBALS_UPDATED: () => Fe,
  NAVIGATE_URL: () => Im,
  PLAY_FUNCTION_THREW_EXCEPTION: () => an,
  PRELOAD_ENTRIES: () => ln,
  PREVIEW_BUILDER_PROGRESS: () => Fm,
  PREVIEW_KEYDOWN: () => cn,
  REGISTER_SUBSCRIPTION: () => Dm,
  REQUEST_WHATS_NEW_DATA: () => Hm,
  RESET_STORY_ARGS: () => Gr,
  RESULT_WHATS_NEW_DATA: () => Vm,
  SAVE_STORY_REQUEST: () => zm,
  SAVE_STORY_RESPONSE: () => Ym,
  SELECT_STORY: () => Nm,
  SET_CONFIG: () => qm,
  SET_CURRENT_STORY: () => un,
  SET_FILTER: () => Lm,
  SET_GLOBALS: () => pn,
  SET_INDEX: () => Mm,
  SET_STORIES: () => km,
  SET_WHATS_NEW_CACHE: () => $m,
  SHARED_STATE_CHANGED: () => jm,
  SHARED_STATE_SET: () => Gm,
  STORIES_COLLAPSE_ALL: () => Bm,
  STORIES_EXPAND_ALL: () => Um,
  STORY_ARGS_UPDATED: () => dn,
  STORY_CHANGED: () => fn,
  STORY_ERRORED: () => yn,
  STORY_INDEX_INVALIDATED: () => hn,
  STORY_MISSING: () => Bt,
  STORY_PREPARED: () => mn,
  STORY_RENDERED: () => Ze,
  STORY_RENDER_PHASE_CHANGED: () => De,
  STORY_SPECIFIED: () => gn,
  STORY_THREW_EXCEPTION: () => Sn,
  STORY_UNCHANGED: () => bn,
  TELEMETRY_ERROR: () => Tn,
  TOGGLE_WHATS_NEW_NOTIFICATIONS: () => Wm,
  UNHANDLED_ERRORS_WHILE_PLAYING: () => sn,
  UPDATE_GLOBALS: () => Br,
  UPDATE_QUERY_PARAMS: () => vn,
  UPDATE_STORY_ARGS: () => Ur,
  default: () => wm
});
var en = /* @__PURE__ */ ((x) => (x.CHANNEL_WS_DISCONNECT = "channelWSDisconnect", x.CHANNEL_CREATED = "channelCreated", x.CONFIG_ERROR = "c\
onfigError", x.STORY_INDEX_INVALIDATED = "storyIndexInvalidated", x.STORY_SPECIFIED = "storySpecified", x.SET_CONFIG = "setConfig", x.SET_STORIES =
"setStories", x.SET_INDEX = "setIndex", x.SET_CURRENT_STORY = "setCurrentStory", x.CURRENT_STORY_WAS_SET = "currentStoryWasSet", x.FORCE_RE_RENDER =
"forceReRender", x.FORCE_REMOUNT = "forceRemount", x.PRELOAD_ENTRIES = "preloadStories", x.STORY_PREPARED = "storyPrepared", x.DOCS_PREPARED =
"docsPrepared", x.STORY_CHANGED = "storyChanged", x.STORY_UNCHANGED = "storyUnchanged", x.STORY_RENDERED = "storyRendered", x.STORY_MISSING =
"storyMissing", x.STORY_ERRORED = "storyErrored", x.STORY_THREW_EXCEPTION = "storyThrewException", x.STORY_RENDER_PHASE_CHANGED = "storyRend\
erPhaseChanged", x.PLAY_FUNCTION_THREW_EXCEPTION = "playFunctionThrewException", x.UNHANDLED_ERRORS_WHILE_PLAYING = "unhandledErrorsWhilePla\
ying", x.UPDATE_STORY_ARGS = "updateStoryArgs", x.STORY_ARGS_UPDATED = "storyArgsUpdated", x.RESET_STORY_ARGS = "resetStoryArgs", x.SET_FILTER =
"setFilter", x.SET_GLOBALS = "setGlobals", x.UPDATE_GLOBALS = "updateGlobals", x.GLOBALS_UPDATED = "globalsUpdated", x.REGISTER_SUBSCRIPTION =
"registerSubscription", x.PREVIEW_KEYDOWN = "previewKeydown", x.PREVIEW_BUILDER_PROGRESS = "preview_builder_progress", x.SELECT_STORY = "sel\
ectStory", x.STORIES_COLLAPSE_ALL = "storiesCollapseAll", x.STORIES_EXPAND_ALL = "storiesExpandAll", x.DOCS_RENDERED = "docsRendered", x.SHARED_STATE_CHANGED =
"sharedStateChanged", x.SHARED_STATE_SET = "sharedStateSet", x.NAVIGATE_URL = "navigateUrl", x.UPDATE_QUERY_PARAMS = "updateQueryParams", x.
REQUEST_WHATS_NEW_DATA = "requestWhatsNewData", x.RESULT_WHATS_NEW_DATA = "resultWhatsNewData", x.SET_WHATS_NEW_CACHE = "setWhatsNewCache", x.
TOGGLE_WHATS_NEW_NOTIFICATIONS = "toggleWhatsNewNotifications", x.TELEMETRY_ERROR = "telemetryError", x.FILE_COMPONENT_SEARCH_REQUEST = "fil\
eComponentSearchRequest", x.FILE_COMPONENT_SEARCH_RESPONSE = "fileComponentSearchResponse", x.SAVE_STORY_REQUEST = "saveStoryRequest", x.SAVE_STORY_RESPONSE =
"saveStoryResponse", x.ARGTYPES_INFO_REQUEST = "argtypesInfoRequest", x.ARGTYPES_INFO_RESPONSE = "argtypesInfoResponse", x.CREATE_NEW_STORYFILE_REQUEST =
"createNewStoryfileRequest", x.CREATE_NEW_STORYFILE_RESPONSE = "createNewStoryfileResponse", x))(en || {}), wm = en, {
  CHANNEL_WS_DISCONNECT: rn,
  CHANNEL_CREATED: xm,
  CONFIG_ERROR: tn,
  CREATE_NEW_STORYFILE_REQUEST: _m,
  CREATE_NEW_STORYFILE_RESPONSE: Pm,
  CURRENT_STORY_WAS_SET: Gt,
  DOCS_PREPARED: on,
  DOCS_RENDERED: kr,
  FILE_COMPONENT_SEARCH_REQUEST: Om,
  FILE_COMPONENT_SEARCH_RESPONSE: Cm,
  FORCE_RE_RENDER: jr,
  FORCE_REMOUNT: nn,
  GLOBALS_UPDATED: Fe,
  NAVIGATE_URL: Im,
  PLAY_FUNCTION_THREW_EXCEPTION: an,
  UNHANDLED_ERRORS_WHILE_PLAYING: sn,
  PRELOAD_ENTRIES: ln,
  PREVIEW_BUILDER_PROGRESS: Fm,
  PREVIEW_KEYDOWN: cn,
  REGISTER_SUBSCRIPTION: Dm,
  RESET_STORY_ARGS: Gr,
  SELECT_STORY: Nm,
  SET_CONFIG: qm,
  SET_CURRENT_STORY: un,
  SET_FILTER: Lm,
  SET_GLOBALS: pn,
  SET_INDEX: Mm,
  SET_STORIES: km,
  SHARED_STATE_CHANGED: jm,
  SHARED_STATE_SET: Gm,
  STORIES_COLLAPSE_ALL: Bm,
  STORIES_EXPAND_ALL: Um,
  STORY_ARGS_UPDATED: dn,
  STORY_CHANGED: fn,
  STORY_ERRORED: yn,
  STORY_INDEX_INVALIDATED: hn,
  STORY_MISSING: Bt,
  STORY_PREPARED: mn,
  STORY_RENDER_PHASE_CHANGED: De,
  STORY_RENDERED: Ze,
  STORY_SPECIFIED: gn,
  STORY_THREW_EXCEPTION: Sn,
  STORY_UNCHANGED: bn,
  UPDATE_GLOBALS: Br,
  UPDATE_QUERY_PARAMS: vn,
  UPDATE_STORY_ARGS: Ur,
  REQUEST_WHATS_NEW_DATA: Hm,
  RESULT_WHATS_NEW_DATA: Vm,
  SET_WHATS_NEW_CACHE: $m,
  TOGGLE_WHATS_NEW_NOTIFICATIONS: Wm,
  TELEMETRY_ERROR: Tn,
  SAVE_STORY_REQUEST: zm,
  SAVE_STORY_RESPONSE: Ym,
  ARGTYPES_INFO_REQUEST: En,
  ARGTYPES_INFO_RESPONSE: Ut
} = en;

// src/preview/globals/globals.ts
var An = {
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
}, ss = Object.keys(An);

// src/channels/index.ts
var zr = {};
Ie(zr, {
  Channel: () => ve,
  PostMessageTransport: () => ar,
  WebsocketTransport: () => ir,
  createBrowserChannel: () => $b,
  default: () => Vb
});

// src/channels/main.ts
var Km = /* @__PURE__ */ n((r) => r.transports !== void 0, "isMulti"), Xm = /* @__PURE__ */ n(() => Math.random().toString(16).slice(2), "ge\
nerateRandomId"), Rn = class Rn {
  constructor(e = {}) {
    this.sender = Xm();
    this.events = {};
    this.data = {};
    this.transports = [];
    this.isAsync = e.async || !1, Km(e) ? (this.transports = e.transports || [], this.transports.forEach((t) => {
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
    let o = { type: e, args: t, from: this.sender }, a = {};
    t.length >= 1 && t[0] && t[0].options && (a = t[0].options);
    let i = /* @__PURE__ */ n(() => {
      this.transports.forEach((s) => {
        s.send(o, a);
      }), this.handleEvent(o);
    }, "handler");
    this.isAsync ? setImmediate(i) : i();
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
    o && (this.events[e] = o.filter((a) => a !== t));
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
    let o = /* @__PURE__ */ n((...a) => (this.removeListener(e, o), t(...a)), "onceListener");
    return o;
  }
};
n(Rn, "Channel");
var ve = Rn;

// src/client-logger/index.ts
var Hr = {};
Ie(Hr, {
  deprecate: () => ae,
  logger: () => C,
  once: () => k,
  pretty: () => re
});
var { LOGLEVEL: Jm } = A, Te = {
  trace: 1,
  debug: 2,
  info: 3,
  warn: 4,
  error: 5,
  silent: 10
}, Qm = Jm, er = Te[Qm] || Te.info, C = {
  trace: /* @__PURE__ */ n((r, ...e) => {
    er <= Te.trace && console.trace(r, ...e);
  }, "trace"),
  debug: /* @__PURE__ */ n((r, ...e) => {
    er <= Te.debug && console.debug(r, ...e);
  }, "debug"),
  info: /* @__PURE__ */ n((r, ...e) => {
    er <= Te.info && console.info(r, ...e);
  }, "info"),
  warn: /* @__PURE__ */ n((r, ...e) => {
    er <= Te.warn && console.warn(r, ...e);
  }, "warn"),
  error: /* @__PURE__ */ n((r, ...e) => {
    er <= Te.error && console.error(r, ...e);
  }, "error"),
  log: /* @__PURE__ */ n((r, ...e) => {
    er < Te.silent && console.log(r, ...e);
  }, "log")
}, wn = /* @__PURE__ */ new Set(), k = /* @__PURE__ */ n((r) => (e, ...t) => {
  if (!wn.has(e))
    return wn.add(e), C[r](e, ...t);
}, "once");
k.clear = () => wn.clear();
k.trace = k("trace");
k.debug = k("debug");
k.info = k("info");
k.warn = k("warn");
k.error = k("error");
k.log = k("log");
var ae = k("warn"), re = /* @__PURE__ */ n((r) => (...e) => {
  let t = [];
  if (e.length) {
    let o = /<span\s+style=(['"])([^'"]*)\1\s*>/gi, a = /<\/span>/gi, i;
    for (t.push(e[0].replace(o, "%c").replace(a, "%c")); i = o.exec(e[0]); )
      t.push(i[2]), t.push("");
    for (let s = 1; s < e.length; s++)
      t.push(e[s]);
  }
  C[r].apply(C, t);
}, "pretty");
re.trace = re("trace");
re.debug = re("debug");
re.info = re("info");
re.warn = re("warn");
re.error = re("error");

// ../node_modules/telejson/dist/chunk-465TF3XA.mjs
var Zm = Object.create, ls = Object.defineProperty, eg = Object.getOwnPropertyDescriptor, cs = Object.getOwnPropertyNames, rg = Object.getPrototypeOf,
tg = Object.prototype.hasOwnProperty, oe = /* @__PURE__ */ n((r, e) => /* @__PURE__ */ n(function() {
  return e || (0, r[cs(r)[0]])((e = { exports: {} }).exports, e), e.exports;
}, "__require"), "__commonJS"), og = /* @__PURE__ */ n((r, e, t, o) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (let a of cs(e))
      !tg.call(r, a) && a !== t && ls(r, a, { get: /* @__PURE__ */ n(() => e[a], "get"), enumerable: !(o = eg(e, a)) || o.enumerable });
  return r;
}, "__copyProps"), Ht = /* @__PURE__ */ n((r, e, t) => (t = r != null ? Zm(rg(r)) : {}, og(
  e || !r || !r.__esModule ? ls(t, "default", { value: r, enumerable: !0 }) : t,
  r
)), "__toESM"), ng = [
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
], ag = ["detail"];
function us(r) {
  let e = ng.filter((t) => r[t] !== void 0).reduce((t, o) => ({ ...t, [o]: r[o] }), {});
  return r instanceof CustomEvent && ag.filter((t) => r[t] !== void 0).forEach((t) => {
    e[t] = r[t];
  }), e;
}
n(us, "extractEventHiddenProperties");

// ../node_modules/telejson/dist/index.mjs
var xs = Y(Vt(), 1);
var gs = oe({
  "node_modules/has-symbols/shams.js"(r, e) {
    "use strict";
    e.exports = /* @__PURE__ */ n(function() {
      if (typeof Symbol != "function" || typeof Object.getOwnPropertySymbols != "function")
        return !1;
      if (typeof Symbol.iterator == "symbol")
        return !0;
      var o = {}, a = Symbol("test"), i = Object(a);
      if (typeof a == "string" || Object.prototype.toString.call(a) !== "[object Symbol]" || Object.prototype.toString.call(i) !== "[object \
Symbol]")
        return !1;
      var s = 42;
      o[a] = s;
      for (a in o)
        return !1;
      if (typeof Object.keys == "function" && Object.keys(o).length !== 0 || typeof Object.getOwnPropertyNames == "function" && Object.getOwnPropertyNames(
      o).length !== 0)
        return !1;
      var c = Object.getOwnPropertySymbols(o);
      if (c.length !== 1 || c[0] !== a || !Object.prototype.propertyIsEnumerable.call(o, a))
        return !1;
      if (typeof Object.getOwnPropertyDescriptor == "function") {
        var l = Object.getOwnPropertyDescriptor(o, a);
        if (l.value !== s || l.enumerable !== !0)
          return !1;
      }
      return !0;
    }, "hasSymbols");
  }
}), Ss = oe({
  "node_modules/has-symbols/index.js"(r, e) {
    "use strict";
    var t = typeof Symbol < "u" && Symbol, o = gs();
    e.exports = /* @__PURE__ */ n(function() {
      return typeof t != "function" || typeof Symbol != "function" || typeof t("foo") != "symbol" || typeof Symbol("bar") != "symbol" ? !1 :
      o();
    }, "hasNativeSymbols");
  }
}), ig = oe({
  "node_modules/function-bind/implementation.js"(r, e) {
    "use strict";
    var t = "Function.prototype.bind called on incompatible ", o = Array.prototype.slice, a = Object.prototype.toString, i = "[object Functi\
on]";
    e.exports = /* @__PURE__ */ n(function(c) {
      var l = this;
      if (typeof l != "function" || a.call(l) !== i)
        throw new TypeError(t + l);
      for (var u = o.call(arguments, 1), p, h = /* @__PURE__ */ n(function() {
        if (this instanceof p) {
          var S = l.apply(
            this,
            u.concat(o.call(arguments))
          );
          return Object(S) === S ? S : this;
        } else
          return l.apply(
            c,
            u.concat(o.call(arguments))
          );
      }, "binder"), d = Math.max(0, l.length - u.length), g = [], m = 0; m < d; m++)
        g.push("$" + m);
      if (p = Function("binder", "return function (" + g.join(",") + "){ return binder.apply(this,arguments); }")(h), l.prototype) {
        var b = /* @__PURE__ */ n(function() {
        }, "Empty2");
        b.prototype = l.prototype, p.prototype = new b(), b.prototype = null;
      }
      return p;
    }, "bind");
  }
}), Pn = oe({
  "node_modules/function-bind/index.js"(r, e) {
    "use strict";
    var t = ig();
    e.exports = Function.prototype.bind || t;
  }
}), sg = oe({
  "node_modules/has/src/index.js"(r, e) {
    "use strict";
    var t = Pn();
    e.exports = t.call(Function.call, Object.prototype.hasOwnProperty);
  }
}), bs = oe({
  "node_modules/get-intrinsic/index.js"(r, e) {
    "use strict";
    var t, o = SyntaxError, a = Function, i = TypeError, s = /* @__PURE__ */ n(function(V) {
      try {
        return a('"use strict"; return (' + V + ").constructor;")();
      } catch {
      }
    }, "getEvalledConstructor"), c = Object.getOwnPropertyDescriptor;
    if (c)
      try {
        c({}, "");
      } catch {
        c = null;
      }
    var l = /* @__PURE__ */ n(function() {
      throw new i();
    }, "throwTypeError"), u = c ? function() {
      try {
        return arguments.callee, l;
      } catch {
        try {
          return c(arguments, "callee").get;
        } catch {
          return l;
        }
      }
    }() : l, p = Ss()(), h = Object.getPrototypeOf || function(V) {
      return V.__proto__;
    }, d = {}, g = typeof Uint8Array > "u" ? t : h(Uint8Array), m = {
      "%AggregateError%": typeof AggregateError > "u" ? t : AggregateError,
      "%Array%": Array,
      "%ArrayBuffer%": typeof ArrayBuffer > "u" ? t : ArrayBuffer,
      "%ArrayIteratorPrototype%": p ? h([][Symbol.iterator]()) : t,
      "%AsyncFromSyncIteratorPrototype%": t,
      "%AsyncFunction%": d,
      "%AsyncGenerator%": d,
      "%AsyncGeneratorFunction%": d,
      "%AsyncIteratorPrototype%": d,
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
      "%Function%": a,
      "%GeneratorFunction%": d,
      "%Int8Array%": typeof Int8Array > "u" ? t : Int8Array,
      "%Int16Array%": typeof Int16Array > "u" ? t : Int16Array,
      "%Int32Array%": typeof Int32Array > "u" ? t : Int32Array,
      "%isFinite%": isFinite,
      "%isNaN%": isNaN,
      "%IteratorPrototype%": p ? h(h([][Symbol.iterator]())) : t,
      "%JSON%": typeof JSON == "object" ? JSON : t,
      "%Map%": typeof Map > "u" ? t : Map,
      "%MapIteratorPrototype%": typeof Map > "u" || !p ? t : h((/* @__PURE__ */ new Map())[Symbol.iterator]()),
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
      "%SetIteratorPrototype%": typeof Set > "u" || !p ? t : h((/* @__PURE__ */ new Set())[Symbol.iterator]()),
      "%SharedArrayBuffer%": typeof SharedArrayBuffer > "u" ? t : SharedArrayBuffer,
      "%String%": String,
      "%StringIteratorPrototype%": p ? h(""[Symbol.iterator]()) : t,
      "%Symbol%": p ? Symbol : t,
      "%SyntaxError%": o,
      "%ThrowTypeError%": u,
      "%TypedArray%": g,
      "%TypeError%": i,
      "%Uint8Array%": typeof Uint8Array > "u" ? t : Uint8Array,
      "%Uint8ClampedArray%": typeof Uint8ClampedArray > "u" ? t : Uint8ClampedArray,
      "%Uint16Array%": typeof Uint16Array > "u" ? t : Uint16Array,
      "%Uint32Array%": typeof Uint32Array > "u" ? t : Uint32Array,
      "%URIError%": URIError,
      "%WeakMap%": typeof WeakMap > "u" ? t : WeakMap,
      "%WeakRef%": typeof WeakRef > "u" ? t : WeakRef,
      "%WeakSet%": typeof WeakSet > "u" ? t : WeakSet
    }, b = /* @__PURE__ */ n(function V(D) {
      var q;
      if (D === "%AsyncFunction%")
        q = s("async function () {}");
      else if (D === "%GeneratorFunction%")
        q = s("function* () {}");
      else if (D === "%AsyncGeneratorFunction%")
        q = s("async function* () {}");
      else if (D === "%AsyncGenerator%") {
        var N = V("%AsyncGeneratorFunction%");
        N && (q = N.prototype);
      } else if (D === "%AsyncIteratorPrototype%") {
        var G = V("%AsyncGenerator%");
        G && (q = h(G.prototype));
      }
      return m[D] = q, q;
    }, "doEval2"), S = {
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
    }, T = Pn(), v = sg(), E = T.call(Function.call, Array.prototype.concat), R = T.call(Function.apply, Array.prototype.splice), w = T.call(
    Function.call, String.prototype.replace), P = T.call(Function.call, String.prototype.slice), M = T.call(Function.call, RegExp.prototype.
    exec), F = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g, H = /\\(\\)?/g, Z = /* @__PURE__ */ n(
    function(D) {
      var q = P(D, 0, 1), N = P(D, -1);
      if (q === "%" && N !== "%")
        throw new o("invalid intrinsic syntax, expected closing `%`");
      if (N === "%" && q !== "%")
        throw new o("invalid intrinsic syntax, expected opening `%`");
      var G = [];
      return w(D, F, function(ee, ge, z, Se) {
        G[G.length] = z ? w(Se, H, "$1") : ge || ee;
      }), G;
    }, "stringToPath3"), me = /* @__PURE__ */ n(function(D, q) {
      var N = D, G;
      if (v(S, N) && (G = S[N], N = "%" + G[0] + "%"), v(m, N)) {
        var ee = m[N];
        if (ee === d && (ee = b(N)), typeof ee > "u" && !q)
          throw new i("intrinsic " + D + " exists, but is not available. Please file an issue!");
        return {
          alias: G,
          name: N,
          value: ee
        };
      }
      throw new o("intrinsic " + D + " does not exist!");
    }, "getBaseIntrinsic2");
    e.exports = /* @__PURE__ */ n(function(D, q) {
      if (typeof D != "string" || D.length === 0)
        throw new i("intrinsic name must be a non-empty string");
      if (arguments.length > 1 && typeof q != "boolean")
        throw new i('"allowMissing" argument must be a boolean');
      if (M(/^%?[^%]*%?$/, D) === null)
        throw new o("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
      var N = Z(D), G = N.length > 0 ? N[0] : "", ee = me("%" + G + "%", q), ge = ee.name, z = ee.value, Se = !1, Qo = ee.alias;
      Qo && (G = Qo[0], R(N, E([0, 1], Qo)));
      for (var qt = 1, Lr = !0; qt < N.length; qt += 1) {
        var de = N[qt], Lt = P(de, 0, 1), Mt = P(de, -1);
        if ((Lt === '"' || Lt === "'" || Lt === "`" || Mt === '"' || Mt === "'" || Mt === "`") && Lt !== Mt)
          throw new o("property names with quotes must have matching quotes");
        if ((de === "constructor" || !Lr) && (Se = !0), G += "." + de, ge = "%" + G + "%", v(m, ge))
          z = m[ge];
        else if (z != null) {
          if (!(de in z)) {
            if (!q)
              throw new i("base intrinsic for " + D + " exists, but the property is not available.");
            return;
          }
          if (c && qt + 1 >= N.length) {
            var kt = c(z, de);
            Lr = !!kt, Lr && "get" in kt && !("originalValue" in kt.get) ? z = kt.get : z = z[de];
          } else
            Lr = v(z, de), z = z[de];
          Lr && !Se && (m[ge] = z);
        }
      }
      return z;
    }, "GetIntrinsic");
  }
}), lg = oe({
  "node_modules/call-bind/index.js"(r, e) {
    "use strict";
    var t = Pn(), o = bs(), a = o("%Function.prototype.apply%"), i = o("%Function.prototype.call%"), s = o("%Reflect.apply%", !0) || t.call(
    i, a), c = o("%Object.getOwnPropertyDescriptor%", !0), l = o("%Object.defineProperty%", !0), u = o("%Math.max%");
    if (l)
      try {
        l({}, "a", { value: 1 });
      } catch {
        l = null;
      }
    e.exports = /* @__PURE__ */ n(function(d) {
      var g = s(t, i, arguments);
      if (c && l) {
        var m = c(g, "length");
        m.configurable && l(
          g,
          "length",
          { value: 1 + u(0, d.length - (arguments.length - 1)) }
        );
      }
      return g;
    }, "callBind");
    var p = /* @__PURE__ */ n(function() {
      return s(t, a, arguments);
    }, "applyBind2");
    l ? l(e.exports, "apply", { value: p }) : e.exports.apply = p;
  }
}), cg = oe({
  "node_modules/call-bind/callBound.js"(r, e) {
    "use strict";
    var t = bs(), o = lg(), a = o(t("String.prototype.indexOf"));
    e.exports = /* @__PURE__ */ n(function(s, c) {
      var l = t(s, !!c);
      return typeof l == "function" && a(s, ".prototype.") > -1 ? o(l) : l;
    }, "callBoundIntrinsic");
  }
}), ug = oe({
  "node_modules/has-tostringtag/shams.js"(r, e) {
    "use strict";
    var t = gs();
    e.exports = /* @__PURE__ */ n(function() {
      return t() && !!Symbol.toStringTag;
    }, "hasToStringTagShams");
  }
}), pg = oe({
  "node_modules/is-regex/index.js"(r, e) {
    "use strict";
    var t = cg(), o = ug()(), a, i, s, c;
    o && (a = t("Object.prototype.hasOwnProperty"), i = t("RegExp.prototype.exec"), s = {}, l = /* @__PURE__ */ n(function() {
      throw s;
    }, "throwRegexMarker"), c = {
      toString: l,
      valueOf: l
    }, typeof Symbol.toPrimitive == "symbol" && (c[Symbol.toPrimitive] = l));
    var l, u = t("Object.prototype.toString"), p = Object.getOwnPropertyDescriptor, h = "[object RegExp]";
    e.exports = /* @__PURE__ */ n(o ? function(g) {
      if (!g || typeof g != "object")
        return !1;
      var m = p(g, "lastIndex"), b = m && a(m, "value");
      if (!b)
        return !1;
      try {
        i(g, c);
      } catch (S) {
        return S === s;
      }
    } : function(g) {
      return !g || typeof g != "object" && typeof g != "function" ? !1 : u(g) === h;
    }, "isRegex");
  }
}), dg = oe({
  "node_modules/is-function/index.js"(r, e) {
    e.exports = o;
    var t = Object.prototype.toString;
    function o(a) {
      if (!a)
        return !1;
      var i = t.call(a);
      return i === "[object Function]" || typeof a == "function" && i !== "[object RegExp]" || typeof window < "u" && (a === window.setTimeout ||
      a === window.alert || a === window.confirm || a === window.prompt);
    }
    n(o, "isFunction3");
  }
}), fg = oe({
  "node_modules/is-symbol/index.js"(r, e) {
    "use strict";
    var t = Object.prototype.toString, o = Ss()();
    o ? (a = Symbol.prototype.toString, i = /^Symbol\(.*\)$/, s = /* @__PURE__ */ n(function(l) {
      return typeof l.valueOf() != "symbol" ? !1 : i.test(a.call(l));
    }, "isRealSymbolObject"), e.exports = /* @__PURE__ */ n(function(l) {
      if (typeof l == "symbol")
        return !0;
      if (t.call(l) !== "[object Symbol]")
        return !1;
      try {
        return s(l);
      } catch {
        return !1;
      }
    }, "isSymbol3")) : e.exports = /* @__PURE__ */ n(function(l) {
      return !1;
    }, "isSymbol3");
    var a, i, s;
  }
}), yg = Ht(pg()), hg = Ht(dg()), mg = Ht(fg());
function gg(r) {
  return r != null && typeof r == "object" && Array.isArray(r) === !1;
}
n(gg, "isObject");
var Sg = typeof global == "object" && global && global.Object === Object && global, bg = Sg, vg = typeof self == "object" && self && self.Object ===
Object && self, Tg = bg || vg || Function("return this")(), On = Tg, Eg = On.Symbol, rr = Eg, vs = Object.prototype, Ag = vs.hasOwnProperty,
Rg = vs.toString, Vr = rr ? rr.toStringTag : void 0;
function wg(r) {
  var e = Ag.call(r, Vr), t = r[Vr];
  try {
    r[Vr] = void 0;
    var o = !0;
  } catch {
  }
  var a = Rg.call(r);
  return o && (e ? r[Vr] = t : delete r[Vr]), a;
}
n(wg, "getRawTag");
var xg = wg, _g = Object.prototype, Pg = _g.toString;
function Og(r) {
  return Pg.call(r);
}
n(Og, "objectToString");
var Cg = Og, Ig = "[object Null]", Fg = "[object Undefined]", ds = rr ? rr.toStringTag : void 0;
function Dg(r) {
  return r == null ? r === void 0 ? Fg : Ig : ds && ds in Object(r) ? xg(r) : Cg(r);
}
n(Dg, "baseGetTag");
var Ts = Dg;
function Ng(r) {
  return r != null && typeof r == "object";
}
n(Ng, "isObjectLike");
var qg = Ng, Lg = "[object Symbol]";
function Mg(r) {
  return typeof r == "symbol" || qg(r) && Ts(r) == Lg;
}
n(Mg, "isSymbol");
var Cn = Mg;
function kg(r, e) {
  for (var t = -1, o = r == null ? 0 : r.length, a = Array(o); ++t < o; )
    a[t] = e(r[t], t, r);
  return a;
}
n(kg, "arrayMap");
var jg = kg, Gg = Array.isArray, In = Gg, Bg = 1 / 0, fs = rr ? rr.prototype : void 0, ys = fs ? fs.toString : void 0;
function Es(r) {
  if (typeof r == "string")
    return r;
  if (In(r))
    return jg(r, Es) + "";
  if (Cn(r))
    return ys ? ys.call(r) : "";
  var e = r + "";
  return e == "0" && 1 / r == -Bg ? "-0" : e;
}
n(Es, "baseToString");
var Ug = Es;
function Hg(r) {
  var e = typeof r;
  return r != null && (e == "object" || e == "function");
}
n(Hg, "isObject2");
var As = Hg, Vg = "[object AsyncFunction]", $g = "[object Function]", Wg = "[object GeneratorFunction]", zg = "[object Proxy]";
function Yg(r) {
  if (!As(r))
    return !1;
  var e = Ts(r);
  return e == $g || e == Wg || e == Vg || e == zg;
}
n(Yg, "isFunction");
var Kg = Yg, Xg = On["__core-js_shared__"], _n = Xg, hs = function() {
  var r = /[^.]+$/.exec(_n && _n.keys && _n.keys.IE_PROTO || "");
  return r ? "Symbol(src)_1." + r : "";
}();
function Jg(r) {
  return !!hs && hs in r;
}
n(Jg, "isMasked");
var Qg = Jg, Zg = Function.prototype, eS = Zg.toString;
function rS(r) {
  if (r != null) {
    try {
      return eS.call(r);
    } catch {
    }
    try {
      return r + "";
    } catch {
    }
  }
  return "";
}
n(rS, "toSource");
var tS = rS, oS = /[\\^$.*+?()[\]{}|]/g, nS = /^\[object .+?Constructor\]$/, aS = Function.prototype, iS = Object.prototype, sS = aS.toString,
lS = iS.hasOwnProperty, cS = RegExp(
  "^" + sS.call(lS).replace(oS, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function uS(r) {
  if (!As(r) || Qg(r))
    return !1;
  var e = Kg(r) ? cS : nS;
  return e.test(tS(r));
}
n(uS, "baseIsNative");
var pS = uS;
function dS(r, e) {
  return r?.[e];
}
n(dS, "getValue");
var fS = dS;
function yS(r, e) {
  var t = fS(r, e);
  return pS(t) ? t : void 0;
}
n(yS, "getNative");
var Rs = yS;
function hS(r, e) {
  return r === e || r !== r && e !== e;
}
n(hS, "eq");
var mS = hS, gS = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, SS = /^\w*$/;
function bS(r, e) {
  if (In(r))
    return !1;
  var t = typeof r;
  return t == "number" || t == "symbol" || t == "boolean" || r == null || Cn(r) ? !0 : SS.test(r) || !gS.test(r) || e != null && r in Object(
  e);
}
n(bS, "isKey");
var vS = bS, TS = Rs(Object, "create"), $r = TS;
function ES() {
  this.__data__ = $r ? $r(null) : {}, this.size = 0;
}
n(ES, "hashClear");
var AS = ES;
function RS(r) {
  var e = this.has(r) && delete this.__data__[r];
  return this.size -= e ? 1 : 0, e;
}
n(RS, "hashDelete");
var wS = RS, xS = "__lodash_hash_undefined__", _S = Object.prototype, PS = _S.hasOwnProperty;
function OS(r) {
  var e = this.__data__;
  if ($r) {
    var t = e[r];
    return t === xS ? void 0 : t;
  }
  return PS.call(e, r) ? e[r] : void 0;
}
n(OS, "hashGet");
var CS = OS, IS = Object.prototype, FS = IS.hasOwnProperty;
function DS(r) {
  var e = this.__data__;
  return $r ? e[r] !== void 0 : FS.call(e, r);
}
n(DS, "hashHas");
var NS = DS, qS = "__lodash_hash_undefined__";
function LS(r, e) {
  var t = this.__data__;
  return this.size += this.has(r) ? 0 : 1, t[r] = $r && e === void 0 ? qS : e, this;
}
n(LS, "hashSet");
var MS = LS;
function tr(r) {
  var e = -1, t = r == null ? 0 : r.length;
  for (this.clear(); ++e < t; ) {
    var o = r[e];
    this.set(o[0], o[1]);
  }
}
n(tr, "Hash");
tr.prototype.clear = AS;
tr.prototype.delete = wS;
tr.prototype.get = CS;
tr.prototype.has = NS;
tr.prototype.set = MS;
var ms = tr;
function kS() {
  this.__data__ = [], this.size = 0;
}
n(kS, "listCacheClear");
var jS = kS;
function GS(r, e) {
  for (var t = r.length; t--; )
    if (mS(r[t][0], e))
      return t;
  return -1;
}
n(GS, "assocIndexOf");
var Wt = GS, BS = Array.prototype, US = BS.splice;
function HS(r) {
  var e = this.__data__, t = Wt(e, r);
  if (t < 0)
    return !1;
  var o = e.length - 1;
  return t == o ? e.pop() : US.call(e, t, 1), --this.size, !0;
}
n(HS, "listCacheDelete");
var VS = HS;
function $S(r) {
  var e = this.__data__, t = Wt(e, r);
  return t < 0 ? void 0 : e[t][1];
}
n($S, "listCacheGet");
var WS = $S;
function zS(r) {
  return Wt(this.__data__, r) > -1;
}
n(zS, "listCacheHas");
var YS = zS;
function KS(r, e) {
  var t = this.__data__, o = Wt(t, r);
  return o < 0 ? (++this.size, t.push([r, e])) : t[o][1] = e, this;
}
n(KS, "listCacheSet");
var XS = KS;
function or(r) {
  var e = -1, t = r == null ? 0 : r.length;
  for (this.clear(); ++e < t; ) {
    var o = r[e];
    this.set(o[0], o[1]);
  }
}
n(or, "ListCache");
or.prototype.clear = jS;
or.prototype.delete = VS;
or.prototype.get = WS;
or.prototype.has = YS;
or.prototype.set = XS;
var JS = or, QS = Rs(On, "Map"), ZS = QS;
function eb() {
  this.size = 0, this.__data__ = {
    hash: new ms(),
    map: new (ZS || JS)(),
    string: new ms()
  };
}
n(eb, "mapCacheClear");
var rb = eb;
function tb(r) {
  var e = typeof r;
  return e == "string" || e == "number" || e == "symbol" || e == "boolean" ? r !== "__proto__" : r === null;
}
n(tb, "isKeyable");
var ob = tb;
function nb(r, e) {
  var t = r.__data__;
  return ob(e) ? t[typeof e == "string" ? "string" : "hash"] : t.map;
}
n(nb, "getMapData");
var zt = nb;
function ab(r) {
  var e = zt(this, r).delete(r);
  return this.size -= e ? 1 : 0, e;
}
n(ab, "mapCacheDelete");
var ib = ab;
function sb(r) {
  return zt(this, r).get(r);
}
n(sb, "mapCacheGet");
var lb = sb;
function cb(r) {
  return zt(this, r).has(r);
}
n(cb, "mapCacheHas");
var ub = cb;
function pb(r, e) {
  var t = zt(this, r), o = t.size;
  return t.set(r, e), this.size += t.size == o ? 0 : 1, this;
}
n(pb, "mapCacheSet");
var db = pb;
function nr(r) {
  var e = -1, t = r == null ? 0 : r.length;
  for (this.clear(); ++e < t; ) {
    var o = r[e];
    this.set(o[0], o[1]);
  }
}
n(nr, "MapCache");
nr.prototype.clear = rb;
nr.prototype.delete = ib;
nr.prototype.get = lb;
nr.prototype.has = ub;
nr.prototype.set = db;
var ws = nr, fb = "Expected a function";
function Fn(r, e) {
  if (typeof r != "function" || e != null && typeof e != "function")
    throw new TypeError(fb);
  var t = /* @__PURE__ */ n(function() {
    var o = arguments, a = e ? e.apply(this, o) : o[0], i = t.cache;
    if (i.has(a))
      return i.get(a);
    var s = r.apply(this, o);
    return t.cache = i.set(a, s) || i, s;
  }, "memoized");
  return t.cache = new (Fn.Cache || ws)(), t;
}
n(Fn, "memoize");
Fn.Cache = ws;
var yb = Fn, hb = 500;
function mb(r) {
  var e = yb(r, function(o) {
    return t.size === hb && t.clear(), o;
  }), t = e.cache;
  return e;
}
n(mb, "memoizeCapped");
var gb = mb, Sb = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, bb = /\\(\\)?/g, vb = gb(
function(r) {
  var e = [];
  return r.charCodeAt(0) === 46 && e.push(""), r.replace(Sb, function(t, o, a, i) {
    e.push(a ? i.replace(bb, "$1") : o || t);
  }), e;
}), Tb = vb;
function Eb(r) {
  return r == null ? "" : Ug(r);
}
n(Eb, "toString");
var Ab = Eb;
function Rb(r, e) {
  return In(r) ? r : vS(r, e) ? [r] : Tb(Ab(r));
}
n(Rb, "castPath");
var wb = Rb, xb = 1 / 0;
function _b(r) {
  if (typeof r == "string" || Cn(r))
    return r;
  var e = r + "";
  return e == "0" && 1 / r == -xb ? "-0" : e;
}
n(_b, "toKey");
var Pb = _b;
function Ob(r, e) {
  e = wb(e, r);
  for (var t = 0, o = e.length; r != null && t < o; )
    r = r[Pb(e[t++])];
  return t && t == o ? r : void 0;
}
n(Ob, "baseGet");
var Cb = Ob;
function Ib(r, e, t) {
  var o = r == null ? void 0 : Cb(r, e);
  return o === void 0 ? t : o;
}
n(Ib, "get");
var Fb = Ib, $t = gg, Db = /* @__PURE__ */ n((r) => {
  let e = null, t = !1, o = !1, a = !1, i = "";
  if (r.indexOf("//") >= 0 || r.indexOf("/*") >= 0)
    for (let s = 0; s < r.length; s += 1)
      !e && !t && !o && !a ? r[s] === '"' || r[s] === "'" || r[s] === "`" ? e = r[s] : r[s] === "/" && r[s + 1] === "*" ? t = !0 : r[s] === "\
/" && r[s + 1] === "/" ? o = !0 : r[s] === "/" && r[s + 1] !== "/" && (a = !0) : (e && (r[s] === e && r[s - 1] !== "\\" || r[s] === `
` && e !== "`") && (e = null), a && (r[s] === "/" && r[s - 1] !== "\\" || r[s] === `
`) && (a = !1), t && r[s - 1] === "/" && r[s - 2] === "*" && (t = !1), o && r[s] === `
` && (o = !1)), !t && !o && (i += r[s]);
  else
    i = r;
  return i;
}, "removeCodeComments"), Nb = (0, xs.default)(1e4)(
  (r) => Db(r).replace(/\n\s*/g, "").trim()
), qb = /* @__PURE__ */ n(function(e, t) {
  let o = t.slice(0, t.indexOf("{")), a = t.slice(t.indexOf("{"));
  if (o.includes("=>") || o.includes("function"))
    return t;
  let i = o;
  return i = i.replace(e, "function"), i + a;
}, "convertShorthandMethods2"), Lb = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, Wr = /* @__PURE__ */ n((r) => r.match(/^[\[\{\"\}].*[\]\}\"]$/),
"isJSON");
function _s(r) {
  if (!$t(r))
    return r;
  let e = r, t = !1;
  return typeof Event < "u" && r instanceof Event && (e = us(e), t = !0), e = Object.keys(e).reduce((o, a) => {
    try {
      e[a] && e[a].toJSON, o[a] = e[a];
    } catch {
      t = !0;
    }
    return o;
  }, {}), t ? e : r;
}
n(_s, "convertUnconventionalData");
var Mb = /* @__PURE__ */ n(function(e) {
  let t, o, a, i;
  return /* @__PURE__ */ n(function(c, l) {
    try {
      if (c === "")
        return i = [], t = /* @__PURE__ */ new Map([[l, "[]"]]), o = /* @__PURE__ */ new Map(), a = [], l;
      let u = o.get(this) || this;
      for (; a.length && u !== a[0]; )
        a.shift(), i.pop();
      if (typeof l == "boolean")
        return l;
      if (l === void 0)
        return e.allowUndefined ? "_undefined_" : void 0;
      if (l === null)
        return null;
      if (typeof l == "number")
        return l === -1 / 0 ? "_-Infinity_" : l === 1 / 0 ? "_Infinity_" : Number.isNaN(l) ? "_NaN_" : l;
      if (typeof l == "bigint")
        return `_bigint_${l.toString()}`;
      if (typeof l == "string")
        return Lb.test(l) ? e.allowDate ? `_date_${l}` : void 0 : l;
      if ((0, yg.default)(l))
        return e.allowRegExp ? `_regexp_${l.flags}|${l.source}` : void 0;
      if ((0, hg.default)(l)) {
        if (!e.allowFunction)
          return;
        let { name: h } = l, d = l.toString();
        return d.match(
          /(\[native code\]|WEBPACK_IMPORTED_MODULE|__webpack_exports__|__webpack_require__)/
        ) ? `_function_${h}|${(() => {
        }).toString()}` : `_function_${h}|${Nb(qb(c, d))}`;
      }
      if ((0, mg.default)(l)) {
        if (!e.allowSymbol)
          return;
        let h = Symbol.keyFor(l);
        return h !== void 0 ? `_gsymbol_${h}` : `_symbol_${l.toString().slice(7, -1)}`;
      }
      if (a.length >= e.maxDepth)
        return Array.isArray(l) ? `[Array(${l.length})]` : "[Object]";
      if (l === this)
        return `_duplicate_${JSON.stringify(i)}`;
      if (l instanceof Error && e.allowError)
        return {
          __isConvertedError__: !0,
          errorProperties: {
            ...l.cause ? { cause: l.cause } : {},
            ...l,
            name: l.name,
            message: l.message,
            stack: l.stack,
            "_constructor-name_": l.constructor.name
          }
        };
      if (l.constructor && l.constructor.name && l.constructor.name !== "Object" && !Array.isArray(l) && !e.allowClass)
        return;
      let p = t.get(l);
      if (!p) {
        let h = Array.isArray(l) ? l : _s(l);
        if (l.constructor && l.constructor.name && l.constructor.name !== "Object" && !Array.isArray(l) && e.allowClass)
          try {
            Object.assign(h, { "_constructor-name_": l.constructor.name });
          } catch {
          }
        return i.push(c), a.unshift(h), t.set(l, JSON.stringify(i)), l !== h && o.set(l, h), h;
      }
      return `_duplicate_${p}`;
    } catch {
      return;
    }
  }, "replace");
}, "replacer2"), kb = /* @__PURE__ */ n(function reviver(options) {
  let refs = [], root;
  return /* @__PURE__ */ n(function revive(key, value) {
    if (key === "" && (root = value, refs.forEach(({ target: r, container: e, replacement: t }) => {
      let o = Wr(t) ? JSON.parse(t) : t.split(".");
      o.length === 0 ? e[r] = root : e[r] = Fb(root, o);
    })), key === "_constructor-name_")
      return value;
    if ($t(value) && value.__isConvertedError__) {
      let { message: r, ...e } = value.errorProperties, t = new Error(r);
      return Object.assign(t, e), t;
    }
    if ($t(value) && value["_constructor-name_"] && options.allowFunction) {
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
}, "reviver"), Ps = {
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
}, Yt = /* @__PURE__ */ n((r, e = {}) => {
  let t = { ...Ps, ...e };
  return JSON.stringify(_s(r), Mb(t), e.space);
}, "stringify"), jb = /* @__PURE__ */ n(() => {
  let r = /* @__PURE__ */ new Map();
  return /* @__PURE__ */ n(function e(t) {
    $t(t) && Object.entries(t).forEach(([o, a]) => {
      a === "_undefined_" ? t[o] = void 0 : r.get(a) || (r.set(a, !0), e(a));
    }), Array.isArray(t) && t.forEach((o, a) => {
      o === "_undefined_" ? (r.set(o, !0), t[a] = void 0) : r.get(o) || (r.set(o, !0), e(o));
    });
  }, "mutateUndefined");
}, "mutator"), Kt = /* @__PURE__ */ n((r, e = {}) => {
  let t = { ...Ps, ...e }, o = JSON.parse(r, kb(t));
  return jb()(o), o;
}, "parse");

// ../node_modules/tiny-invariant/dist/esm/tiny-invariant.js
var Gb = !1, Dn = "Invariant failed";
function fe(r, e) {
  if (!r) {
    if (Gb)
      throw new Error(Dn);
    var t = typeof e == "function" ? e() : e, o = t ? "".concat(Dn, ": ").concat(t) : Dn;
    throw new Error(o);
  }
}
n(fe, "invariant");

// src/channels/postmessage/getEventSourceUrl.ts
var Os = /* @__PURE__ */ n((r) => {
  let e = Array.from(
    document.querySelectorAll("iframe[data-is-storybook]")
  ), [t, ...o] = e.filter((i) => {
    try {
      return i.contentWindow?.location.origin === r.source.location.origin && i.contentWindow?.location.pathname === r.source.location.pathname;
    } catch {
    }
    try {
      return i.contentWindow === r.source;
    } catch {
    }
    let s = i.getAttribute("src"), c;
    try {
      if (!s)
        return !1;
      ({ origin: c } = new URL(s, document.location.toString()));
    } catch {
      return !1;
    }
    return c === r.origin;
  }), a = t?.getAttribute("src");
  if (a && o.length === 0) {
    let { protocol: i, host: s, pathname: c } = new URL(a, document.location.toString());
    return `${i}//${s}${c}`;
  }
  return o.length > 0 && C.error("found multiple candidates for event source"), null;
}, "getEventSourceUrl");

// src/channels/postmessage/index.ts
var { document: Nn, location: qn } = A, Cs = "storybook-channel", Bb = { allowFunction: !1, maxDepth: 25 }, Ln = class Ln {
  constructor(e) {
    this.config = e;
    this.connected = !1;
    if (this.buffer = [], typeof A?.addEventListener == "function" && A.addEventListener("message", this.handleEvent.bind(this), !1), e.page !==
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
      allowRegExp: a,
      allowFunction: i,
      allowSymbol: s,
      allowDate: c,
      allowError: l,
      allowUndefined: u,
      allowClass: p,
      maxDepth: h,
      space: d,
      lazyEval: g
    } = t || {}, m = Object.fromEntries(
      Object.entries({
        allowRegExp: a,
        allowFunction: i,
        allowSymbol: s,
        allowDate: c,
        allowError: l,
        allowUndefined: u,
        allowClass: p,
        maxDepth: h,
        space: d,
        lazyEval: g
      }).filter(([E, R]) => typeof R < "u")
    ), b = {
      ...Bb,
      ...A.CHANNEL_OPTIONS || {},
      ...m
    }, S = this.getFrames(o), T = new URLSearchParams(qn?.search || ""), v = Yt(
      {
        key: Cs,
        event: e,
        refId: T.get("refId")
      },
      b
    );
    return S.length ? (this.buffer.length && this.flush(), S.forEach((E) => {
      try {
        E.postMessage(v, "*");
      } catch {
        C.error("sending over postmessage fail");
      }
    }), Promise.resolve(null)) : new Promise((E, R) => {
      this.buffer.push({ event: e, resolve: E, reject: R });
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
        Nn.querySelectorAll("iframe[data-is-storybook][data-is-loaded]")
      ).flatMap((a) => {
        try {
          return a.contentWindow && a.dataset.isStorybook !== void 0 && a.id === e ? [a.contentWindow] : [];
        } catch {
          return [];
        }
      });
      return o?.length ? o : this.getCurrentFrames();
    }
    return A && A.parent && A.parent !== A.self ? [A.parent] : [];
  }
  getCurrentFrames() {
    return this.config.page === "manager" ? Array.from(
      Nn.querySelectorAll('[data-is-storybook="true"]')
    ).flatMap((t) => t.contentWindow ? [t.contentWindow] : []) : A && A.parent ? [A.parent] : [];
  }
  getLocalFrame() {
    return this.config.page === "manager" ? Array.from(
      Nn.querySelectorAll("#storybook-preview-iframe")
    ).flatMap((t) => t.contentWindow ? [t.contentWindow] : []) : A && A.parent ? [A.parent] : [];
  }
  handleEvent(e) {
    try {
      let { data: t } = e, { key: o, event: a, refId: i } = typeof t == "string" && Wr(t) ? Kt(t, A.CHANNEL_OPTIONS || {}) : t;
      if (o === Cs) {
        let s = this.config.page === "manager" ? '<span style="color: #37D5D3; background: black"> manager </span>' : '<span style="color: #\
1EA7FD; background: black"> preview </span>', c = Object.values(be).includes(a.type) ? `<span style="color: #FF4785">${a.type}</span>` : `<s\
pan style="color: #FFAE00">${a.type}</span>`;
        if (i && (a.refId = i), a.source = this.config.page === "preview" ? e.origin : Os(e), !a.source) {
          re.error(
            `${s} received ${c} but was unable to determine the source of the event`
          );
          return;
        }
        let l = `${s} received ${c} (${t.length})`;
        re.debug(
          qn.origin !== a.source ? l : `${l} <span style="color: gray">(on ${qn.origin} from ${a.source})</span>`,
          ...a.args
        ), fe(this.handler, "ChannelHandler should be set"), this.handler(a);
      }
    } catch (t) {
      C.error(t);
    }
  }
};
n(Ln, "PostMessageTransport");
var ar = Ln;

// src/channels/websocket/index.ts
var { WebSocket: Ub } = A, Mn = class Mn {
  constructor({ url: e, onError: t, page: o }) {
    this.buffer = [];
    this.isReady = !1;
    this.socket = new Ub(e), this.socket.onopen = () => {
      this.isReady = !0, this.flush();
    }, this.socket.onmessage = ({ data: a }) => {
      let i = typeof a == "string" && Wr(a) ? Kt(a) : a;
      fe(this.handler, "WebsocketTransport handler should be set"), this.handler(i);
    }, this.socket.onerror = (a) => {
      t && t(a);
    }, this.socket.onclose = () => {
      fe(this.handler, "WebsocketTransport handler should be set"), this.handler({ type: rn, args: [], from: o || "preview" });
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
    let t = Yt(e, {
      maxDepth: 15,
      allowFunction: !1,
      ...A.CHANNEL_OPTIONS
    });
    this.socket.send(t);
  }
  flush() {
    let { buffer: e } = this;
    this.buffer = [], e.forEach((t) => this.send(t));
  }
};
n(Mn, "WebsocketTransport");
var ir = Mn;

// src/channels/index.ts
var { CONFIG_TYPE: Hb } = A, Vb = ve;
function $b({ page: r, extraTransports: e = [] }) {
  let t = [new ar({ page: r }), ...e];
  if (Hb === "DEVELOPMENT") {
    let o = window.location.protocol === "http:" ? "ws" : "wss", { hostname: a, port: i } = window.location, s = `${o}://${a}:${i}/storybook\
-server-channel`;
    t.push(new ir({ url: s, onError: /* @__PURE__ */ n(() => {
    }, "onError"), page: r }));
  }
  return new ve({ transports: t });
}
n($b, "createBrowserChannel");

// src/types/index.ts
var Yr = {};
Ie(Yr, {
  Addon_TypesEnum: () => Is
});

// src/types/modules/addons.ts
var Is = /* @__PURE__ */ ((l) => (l.TAB = "tab", l.PANEL = "panel", l.TOOL = "tool", l.TOOLEXTRA = "toolextra", l.PREVIEW = "preview", l.experimental_PAGE =
"page", l.experimental_SIDEBAR_BOTTOM = "sidebar-bottom", l.experimental_SIDEBAR_TOP = "sidebar-top", l))(Is || {});

// src/preview-api/index.ts
var Nt = {};
Ie(Nt, {
  DocsContext: () => ye,
  HooksContext: () => Ee,
  Preview: () => He,
  PreviewWeb: () => Ft,
  PreviewWithSelection: () => Ve,
  StoryStore: () => Be,
  UrlStore: () => Ke,
  WebView: () => Je,
  addons: () => ne,
  applyHooks: () => Jt,
  combineArgs: () => vr,
  combineParameters: () => Q,
  composeConfigs: () => xr,
  composeStepRunners: () => xo,
  composeStories: () => If,
  composeStory: () => ii,
  createPlaywrightTest: () => Ff,
  decorateStory: () => ti,
  defaultDecorateStory: () => To,
  filterArgTypes: () => bt,
  inferControls: () => Rr,
  makeDecorator: () => Vs,
  mockChannel: () => Xt,
  normalizeStory: () => Er,
  prepareMeta: () => Ao,
  prepareStory: () => Ar,
  sanitizeStoryContextUpdate: () => oi,
  setDefaultProjectAnnotations: () => Of,
  setProjectAnnotations: () => Cf,
  simulateDOMContentLoaded: () => Dt,
  simulatePageLoad: () => os,
  sortStoriesV7: () => jf,
  useArgs: () => Us,
  useCallback: () => sr,
  useChannel: () => Gs,
  useEffect: () => Vn,
  useGlobals: () => Hs,
  useMemo: () => Ns,
  useParameter: () => Bs,
  useReducer: () => js,
  useRef: () => Ls,
  useState: () => ks,
  useStoryContext: () => Kr,
  userOrAutoTitle: () => Lf,
  userOrAutoTitleFromSpecifier: () => ui
});

// src/preview-api/modules/addons/storybook-channel-mock.ts
function Xt() {
  let r = {
    setHandler: /* @__PURE__ */ n(() => {
    }, "setHandler"),
    send: /* @__PURE__ */ n(() => {
    }, "send")
  };
  return new ve({ transport: r });
}
n(Xt, "mockChannel");

// src/preview-api/modules/addons/main.ts
var Gn = class Gn {
  constructor() {
    this.getChannel = /* @__PURE__ */ n(() => {
      if (!this.channel) {
        let e = Xt();
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
n(Gn, "AddonStore");
var jn = Gn, kn = "__STORYBOOK_ADDONS_PREVIEW";
function Wb() {
  return A[kn] || (A[kn] = new jn()), A[kn];
}
n(Wb, "getAddonsStore");
var ne = Wb();

// src/preview-api/modules/addons/hooks.ts
var $n = class $n {
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
    this.removeRenderListeners(), ne.getChannel().on(Ze, this.renderListener);
  }
  removeRenderListeners() {
    ne.getChannel().removeListener(Ze, this.renderListener);
  }
};
n($n, "HooksContext");
var Ee = $n;
function Fs(r) {
  let e = /* @__PURE__ */ n((...t) => {
    let { hooks: o } = typeof t[0] == "function" ? t[1] : t[0], a = o.currentPhase, i = o.currentHooks, s = o.nextHookIndex, c = o.currentDecoratorName;
    o.currentDecoratorName = r.name, o.prevMountedDecorators.has(r) ? (o.currentPhase = "UPDATE", o.currentHooks = o.hookListsMap.get(r) || []) :
    (o.currentPhase = "MOUNT", o.currentHooks = [], o.hookListsMap.set(r, o.currentHooks), o.prevMountedDecorators.add(r)), o.nextHookIndex =
    0;
    let l = A.STORYBOOK_HOOKS_CONTEXT;
    A.STORYBOOK_HOOKS_CONTEXT = o;
    let u = r(...t);
    if (A.STORYBOOK_HOOKS_CONTEXT = l, o.currentPhase === "UPDATE" && o.getNextHook() != null)
      throw new Error(
        "Rendered fewer hooks than expected. This may be caused by an accidental early return statement."
      );
    return o.currentPhase = a, o.currentHooks = i, o.nextHookIndex = s, o.currentDecoratorName = c, u;
  }, "hookified");
  return e.originalFn = r, e;
}
n(Fs, "hookify");
var Bn = 0, zb = 25, Jt = /* @__PURE__ */ n((r) => (e, t) => {
  let o = r(
    Fs(e),
    t.map((a) => Fs(a))
  );
  return (a) => {
    let { hooks: i } = a;
    i.prevMountedDecorators ??= /* @__PURE__ */ new Set(), i.mountedDecorators = /* @__PURE__ */ new Set([e, ...t]), i.currentContext = a, i.
    hasUpdates = !1;
    let s = o(a);
    for (Bn = 1; i.hasUpdates; )
      if (i.hasUpdates = !1, i.currentEffects = [], s = o(a), Bn += 1, Bn > zb)
        throw new Error(
          "Too many re-renders. Storybook limits the number of renders to prevent an infinite loop."
        );
    return i.addRenderListeners(), s;
  };
}, "applyHooks"), Yb = /* @__PURE__ */ n((r, e) => r.length === e.length && r.every((t, o) => t === e[o]), "areDepsEqual"), Un = /* @__PURE__ */ n(
() => new Error("Storybook preview hooks can only be called inside decorators and story functions."), "invalidHooksError");
function Ds() {
  return A.STORYBOOK_HOOKS_CONTEXT || null;
}
n(Ds, "getHooksContextOrNull");
function Hn() {
  let r = Ds();
  if (r == null)
    throw Un();
  return r;
}
n(Hn, "getHooksContextOrThrow");
function Kb(r, e, t) {
  let o = Hn();
  if (o.currentPhase === "MOUNT") {
    t != null && !Array.isArray(t) && C.warn(
      `${r} received a final argument that is not an array (instead, received ${t}). When specified, the final argument must be an array.`
    );
    let a = { name: r, deps: t };
    return o.currentHooks.push(a), e(a), a;
  }
  if (o.currentPhase === "UPDATE") {
    let a = o.getNextHook();
    if (a == null)
      throw new Error("Rendered more hooks than during the previous render.");
    return a.name !== r && C.warn(
      `Storybook has detected a change in the order of Hooks${o.currentDecoratorName ? ` called by ${o.currentDecoratorName}` : ""}. This wi\
ll lead to bugs and errors if not fixed.`
    ), t != null && a.deps == null && C.warn(
      `${r} received a final argument during this render, but not during the previous render. Even though the final argument is optional, it\
s type cannot change between renders.`
    ), t != null && a.deps != null && t.length !== a.deps.length && C.warn(`The final argument passed to ${r} changed size between renders. \
The order and size of this array must remain constant.
Previous: ${a.deps}
Incoming: ${t}`), (t == null || a.deps == null || !Yb(t, a.deps)) && (e(a), a.deps = t), a;
  }
  throw Un();
}
n(Kb, "useHook");
function Qt(r, e, t) {
  let { memoizedState: o } = Kb(
    r,
    (a) => {
      a.memoizedState = e();
    },
    t
  );
  return o;
}
n(Qt, "useMemoLike");
function Ns(r, e) {
  return Qt("useMemo", r, e);
}
n(Ns, "useMemo");
function sr(r, e) {
  return Qt("useCallback", () => r, e);
}
n(sr, "useCallback");
function qs(r, e) {
  return Qt(r, () => ({ current: e }), []);
}
n(qs, "useRefLike");
function Ls(r) {
  return qs("useRef", r);
}
n(Ls, "useRef");
function Xb() {
  let r = Ds();
  if (r != null && r.currentPhase !== "NONE")
    r.hasUpdates = !0;
  else
    try {
      ne.getChannel().emit(jr);
    } catch {
      C.warn("State updates of Storybook preview hooks work only in browser");
    }
}
n(Xb, "triggerUpdate");
function Ms(r, e) {
  let t = qs(
    r,
    // @ts-expect-error S type should never be function, but there's no way to tell that to TypeScript
    typeof e == "function" ? e() : e
  ), o = /* @__PURE__ */ n((a) => {
    t.current = typeof a == "function" ? a(t.current) : a, Xb();
  }, "setState");
  return [t.current, o];
}
n(Ms, "useStateLike");
function ks(r) {
  return Ms("useState", r);
}
n(ks, "useState");
function js(r, e, t) {
  let o = t != null ? () => t(e) : e, [a, i] = Ms("useReducer", o);
  return [a, /* @__PURE__ */ n((c) => i((l) => r(l, c)), "dispatch")];
}
n(js, "useReducer");
function Vn(r, e) {
  let t = Hn(), o = Qt("useEffect", () => ({ create: r }), e);
  t.currentEffects.includes(o) || t.currentEffects.push(o);
}
n(Vn, "useEffect");
function Gs(r, e = []) {
  let t = ne.getChannel();
  return Vn(() => (Object.entries(r).forEach(([o, a]) => t.on(o, a)), () => {
    Object.entries(r).forEach(
      ([o, a]) => t.removeListener(o, a)
    );
  }), [...Object.keys(r), ...e]), sr(t.emit.bind(t), [t]);
}
n(Gs, "useChannel");
function Kr() {
  let { currentContext: r } = Hn();
  if (r == null)
    throw Un();
  return r;
}
n(Kr, "useStoryContext");
function Bs(r, e) {
  let { parameters: t } = Kr();
  if (r)
    return t[r] ?? e;
}
n(Bs, "useParameter");
function Us() {
  let r = ne.getChannel(), { id: e, args: t } = Kr(), o = sr(
    (i) => r.emit(Ur, { storyId: e, updatedArgs: i }),
    [r, e]
  ), a = sr(
    (i) => r.emit(Gr, { storyId: e, argNames: i }),
    [r, e]
  );
  return [t, o, a];
}
n(Us, "useArgs");
function Hs() {
  let r = ne.getChannel(), { globals: e } = Kr(), t = sr(
    (o) => r.emit(Br, { globals: o }),
    [r]
  );
  return [e, t];
}
n(Hs, "useGlobals");

// src/preview-api/modules/addons/make-decorator.ts
var Vs = /* @__PURE__ */ n(({
  name: r,
  parameterName: e,
  wrapper: t,
  skipIfNoParametersOrOptions: o = !1
}) => {
  let a = /* @__PURE__ */ n((i) => (s, c) => {
    let l = c.parameters && c.parameters[e];
    return l && l.disable || o && !i && !l ? s(c) : t(s, c, {
      options: i,
      parameters: l
    });
  }, "decorator");
  return (...i) => typeof i[0] == "function" ? a()(...i) : (...s) => {
    if (s.length > 1)
      return i.length > 1 ? a(i)(...s) : a(...i)(...s);
    throw new Error(
      `Passing stories directly into ${r}() is not allowed,
        instead use addDecorator(${r}) and pass options with the '${e}' parameter`
    );
  };
}, "makeDecorator");

// src/preview-errors.ts
var st = {};
Ie(st, {
  CalledExtractOnStoreError: () => Jr,
  CalledPreviewMethodBeforeInitializationError: () => K,
  Category: () => Ws,
  EmptyIndexError: () => rt,
  ImplicitActionsDuringRendering: () => Wn,
  MdxFileWithNoCsfReferencesError: () => et,
  MissingRenderToCanvasError: () => Qr,
  MissingStoryAfterHmrError: () => Xr,
  MissingStoryFromCsfFileError: () => ot,
  MountMustBeDestructuredError: () => Ne,
  NextJsSharpError: () => zn,
  NextjsRouterMocksNotAvailable: () => Yn,
  NoRenderFunctionError: () => at,
  NoStoryMatchError: () => tt,
  NoStoryMountedError: () => it,
  StoryIndexFetchError: () => Zr,
  StoryStoreAccessedBeforeInitializationError: () => nt,
  UnknownArgTypesError: () => Kn,
  UnsupportedViewportDimensionError: () => Xn
});

// ../node_modules/ts-dedent/esm/index.js
function _(r) {
  for (var e = [], t = 1; t < arguments.length; t++)
    e[t - 1] = arguments[t];
  var o = Array.from(typeof r == "string" ? [r] : r);
  o[o.length - 1] = o[o.length - 1].replace(/\r?\n([\t ]*)$/, "");
  var a = o.reduce(function(c, l) {
    var u = l.match(/\n([\t ]+|(?!\s).)/g);
    return u ? c.concat(u.map(function(p) {
      var h, d;
      return (d = (h = p.match(/[\t ]/g)) === null || h === void 0 ? void 0 : h.length) !== null && d !== void 0 ? d : 0;
    })) : c;
  }, []);
  if (a.length) {
    var i = new RegExp(`
[	 ]{` + Math.min.apply(Math, a) + "}", "g");
    o = o.map(function(c) {
      return c.replace(i, `
`);
    });
  }
  o[0] = o[0].replace(/^\r?\n/, "");
  var s = o[0];
  return e.forEach(function(c, l) {
    var u = s.match(/(?:^|\n)( *)$/), p = u ? u[1] : "", h = c;
    typeof c == "string" && c.includes(`
`) && (h = String(c).split(`
`).map(function(d, g) {
      return g === 0 ? d : "" + p + d;
    }).join(`
`)), s += h + o[l + 1];
  }), s;
}
n(_, "dedent");

// src/storybook-error.ts
function $s({
  code: r,
  category: e
}) {
  let t = String(r).padStart(4, "0");
  return `SB_${e}_${t}`;
}
n($s, "parseErrorCode");
var Zt = class Zt extends Error {
  constructor(t) {
    super(Zt.getFullMessage(t));
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
    return $s({ code: this.code, category: this.category });
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
    category: a,
    message: i
  }) {
    let s;
    return t === !0 ? s = `https://storybook.js.org/error/${$s({ code: o, category: a })}` : typeof t == "string" ? s = t : Array.isArray(t) &&
    (s = `
${t.map((c) => `	- ${c}`).join(`
`)}`), `${i}${s != null ? `

More info: ${s}
` : ""}`;
  }
};
n(Zt, "StorybookError");
var B = Zt;

// src/preview-errors.ts
var Ws = /* @__PURE__ */ ((R) => (R.BLOCKS = "BLOCKS", R.DOCS_TOOLS = "DOCS-TOOLS", R.PREVIEW_CLIENT_LOGGER = "PREVIEW_CLIENT-LOGGER", R.PREVIEW_CHANNELS =
"PREVIEW_CHANNELS", R.PREVIEW_CORE_EVENTS = "PREVIEW_CORE-EVENTS", R.PREVIEW_INSTRUMENTER = "PREVIEW_INSTRUMENTER", R.PREVIEW_API = "PREVIEW\
_API", R.PREVIEW_REACT_DOM_SHIM = "PREVIEW_REACT-DOM-SHIM", R.PREVIEW_ROUTER = "PREVIEW_ROUTER", R.PREVIEW_THEMING = "PREVIEW_THEMING", R.RENDERER_HTML =
"RENDERER_HTML", R.RENDERER_PREACT = "RENDERER_PREACT", R.RENDERER_REACT = "RENDERER_REACT", R.RENDERER_SERVER = "RENDERER_SERVER", R.RENDERER_SVELTE =
"RENDERER_SVELTE", R.RENDERER_VUE = "RENDERER_VUE", R.RENDERER_VUE3 = "RENDERER_VUE3", R.RENDERER_WEB_COMPONENTS = "RENDERER_WEB-COMPONENTS",
R.FRAMEWORK_NEXTJS = "FRAMEWORK_NEXTJS", R.ADDON_VITEST = "ADDON_VITEST", R))(Ws || {}), Jn = class Jn extends B {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 1,
      message: _`
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
n(Jn, "MissingStoryAfterHmrError");
var Xr = Jn, Qn = class Qn extends B {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 2,
      documentation: "https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#using-implicit-actions-during-rendering-is-deprecated-\
for-example-in-the-play-function",
      message: _`
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
n(Qn, "ImplicitActionsDuringRendering");
var Wn = Qn, Zn = class Zn extends B {
  constructor() {
    super({
      category: "PREVIEW_API",
      code: 3,
      message: _`
        Cannot call \`storyStore.extract()\` without calling \`storyStore.cacheAllCsfFiles()\` first.

        You probably meant to call \`await preview.extract()\` which does the above for you.`
    });
  }
};
n(Zn, "CalledExtractOnStoreError");
var Jr = Zn, ea = class ea extends B {
  constructor() {
    super({
      category: "PREVIEW_API",
      code: 4,
      message: _`
        Expected your framework's preset to export a \`renderToCanvas\` field.

        Perhaps it needs to be upgraded for Storybook 7.0?`,
      documentation: "https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#mainjs-framework-field"
    });
  }
};
n(ea, "MissingRenderToCanvasError");
var Qr = ea, ra = class ra extends B {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 5,
      message: _`
        Called \`Preview.${t.methodName}()\` before initialization.
        
        The preview needs to load the story index before most methods can be called. If you want
        to call \`${t.methodName}\`, try \`await preview.initializationPromise;\` first.
        
        If you didn't call the above code, then likely it was called by an addon that needs to
        do the above.`
    });
    this.data = t;
  }
};
n(ra, "CalledPreviewMethodBeforeInitializationError");
var K = ra, ta = class ta extends B {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 6,
      message: _`
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
n(ta, "StoryIndexFetchError");
var Zr = ta, oa = class oa extends B {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 7,
      message: _`
        Tried to render docs entry ${t.storyId} but it is a MDX file that has no CSF
        references, or autodocs for a CSF file that some doesn't refer to itself.
        
        This likely is an internal error in Storybook's indexing, or you've attached the
        \`attached-mdx\` tag to an MDX file that is not attached.`
    });
    this.data = t;
  }
};
n(oa, "MdxFileWithNoCsfReferencesError");
var et = oa, na = class na extends B {
  constructor() {
    super({
      category: "PREVIEW_API",
      code: 8,
      message: _`
        Couldn't find any stories in your Storybook.

        - Please check your stories field of your main.js config: does it match correctly?
        - Also check the browser console and terminal for error messages.`
    });
  }
};
n(na, "EmptyIndexError");
var rt = na, aa = class aa extends B {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 9,
      message: _`
        Couldn't find story matching '${t.storySpecifier}'.

        - Are you sure a story with that id exists?
        - Please check your stories field of your main.js config.
        - Also check the browser console and terminal for error messages.`
    });
    this.data = t;
  }
};
n(aa, "NoStoryMatchError");
var tt = aa, ia = class ia extends B {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 10,
      message: _`
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
n(ia, "MissingStoryFromCsfFileError");
var ot = ia, sa = class sa extends B {
  constructor() {
    super({
      category: "PREVIEW_API",
      code: 11,
      message: _`
        Cannot access the Story Store until the index is ready.

        It is not recommended to use methods directly on the Story Store anyway, in Storybook 9 we will
        remove access to the store entirely`
    });
  }
};
n(sa, "StoryStoreAccessedBeforeInitializationError");
var nt = sa, la = class la extends B {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 12,
      message: _`
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
n(la, "MountMustBeDestructuredError");
var Ne = la, ca = class ca extends B {
  constructor(t) {
    super({
      category: "PREVIEW_API",
      code: 14,
      message: _`
        No render function available for storyId '${t.id}'
      `
    });
    this.data = t;
  }
};
n(ca, "NoRenderFunctionError");
var at = ca, ua = class ua extends B {
  constructor() {
    super({
      category: "PREVIEW_API",
      code: 15,
      message: _`
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
n(ua, "NoStoryMountedError");
var it = ua, pa = class pa extends B {
  constructor() {
    super({
      category: "FRAMEWORK_NEXTJS",
      code: 1,
      documentation: "https://storybook.js.org/docs/get-started/nextjs#faq",
      message: _`
      You are importing avif images, but you don't have sharp installed.

      You have to install sharp in order to use image optimization features in Next.js.
      `
    });
  }
};
n(pa, "NextJsSharpError");
var zn = pa, da = class da extends B {
  constructor(t) {
    super({
      category: "FRAMEWORK_NEXTJS",
      code: 2,
      message: _`
        Tried to access router mocks from "${t.importType}" but they were not created yet. You might be running code in an unsupported environment.
      `
    });
    this.data = t;
  }
};
n(da, "NextjsRouterMocksNotAvailable");
var Yn = da, fa = class fa extends B {
  constructor(t) {
    super({
      category: "DOCS-TOOLS",
      code: 1,
      documentation: "https://github.com/storybookjs/storybook/issues/26606",
      message: _`
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
n(fa, "UnknownArgTypesError");
var Kn = fa, ya = class ya extends B {
  constructor(t) {
    super({
      category: "ADDON_VITEST",
      code: 1,
      // TODO: Add documentation about viewports support
      // documentation: '',
      message: _`
        Encountered an unsupported value "${t.value}" when setting the viewport ${t.dimension} dimension.
        
        The Storybook plugin only supports values in the following units:
        - px, vh, vw, em, rem and %.
        
        You can either change the viewport for this story to use one of the supported units or skip the test by adding '!test' to the story's tags per https://storybook.js.org/docs/writing-stories/tags
      `
    });
    this.data = t;
  }
};
n(ya, "UnsupportedViewportDimensionError");
var Xn = ya;

// src/preview-api/modules/store/StoryStore.ts
var Nf = Y(gt(), 1), si = Y(Bd(), 1), _o = Y(Vt(), 1);

// ../node_modules/dequal/dist/index.mjs
var Ud = Object.prototype.hasOwnProperty;
function Hd(r, e, t) {
  for (t of r.keys())
    if (Sr(t, e)) return t;
}
n(Hd, "find");
function Sr(r, e) {
  var t, o, a;
  if (r === e) return !0;
  if (r && e && (t = r.constructor) === e.constructor) {
    if (t === Date) return r.getTime() === e.getTime();
    if (t === RegExp) return r.toString() === e.toString();
    if (t === Array) {
      if ((o = r.length) === e.length)
        for (; o-- && Sr(r[o], e[o]); ) ;
      return o === -1;
    }
    if (t === Set) {
      if (r.size !== e.size)
        return !1;
      for (o of r)
        if (a = o, a && typeof a == "object" && (a = Hd(e, a), !a) || !e.has(a)) return !1;
      return !0;
    }
    if (t === Map) {
      if (r.size !== e.size)
        return !1;
      for (o of r)
        if (a = o[0], a && typeof a == "object" && (a = Hd(e, a), !a) || !Sr(o[1], e.get(a)))
          return !1;
      return !0;
    }
    if (t === ArrayBuffer)
      r = new Uint8Array(r), e = new Uint8Array(e);
    else if (t === DataView) {
      if ((o = r.byteLength) === e.byteLength)
        for (; o-- && r.getInt8(o) === e.getInt8(o); ) ;
      return o === -1;
    }
    if (ArrayBuffer.isView(r)) {
      if ((o = r.byteLength) === e.byteLength)
        for (; o-- && r[o] === e[o]; ) ;
      return o === -1;
    }
    if (!t || typeof r == "object") {
      o = 0;
      for (t in r)
        if (Ud.call(r, t) && ++o && !Ud.call(e, t) || !(t in e) || !Sr(r[t], e[t])) return !1;
      return Object.keys(e).length === o;
    }
  }
  return r !== r && e !== e;
}
n(Sr, "dequal");

// src/preview-api/modules/store/args.ts
var St = Y(yo(), 1);
var br = Symbol("incompatible"), Xa = /* @__PURE__ */ n((r, e) => {
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
      return !t.value || !Array.isArray(r) ? br : r.reduce((o, a, i) => {
        let s = Xa(a, { type: t.value });
        return s !== br && (o[i] = s), o;
      }, new Array(r.length));
    case "object":
      return typeof r == "string" || typeof r == "number" ? r : !t.value || typeof r != "object" ? br : Object.entries(r).reduce((o, [a, i]) => {
        let s = Xa(i, { type: t.value[a] });
        return s === br ? o : Object.assign(o, { [a]: s });
      }, {});
    default:
      return br;
  }
}, "map"), zd = /* @__PURE__ */ n((r, e) => Object.entries(r).reduce((t, [o, a]) => {
  if (!e[o])
    return t;
  let i = Xa(a, e[o]);
  return i === br ? t : Object.assign(t, { [o]: i });
}, {}), "mapArgsToTypes"), vr = /* @__PURE__ */ n((r, e) => Array.isArray(r) && Array.isArray(e) ? e.reduce(
  (t, o, a) => (t[a] = vr(r[a], e[a]), t),
  [...r]
).filter((t) => t !== void 0) : !(0, St.default)(r) || !(0, St.default)(e) ? e : Object.keys({ ...r, ...e }).reduce((t, o) => {
  if (o in e) {
    let a = vr(r[o], e[o]);
    a !== void 0 && (t[o] = a);
  } else
    t[o] = r[o];
  return t;
}, {}), "combineArgs"), Yd = /* @__PURE__ */ n((r, e) => Object.entries(e).reduce((t, [o, { options: a }]) => {
  function i() {
    return o in r && (t[o] = r[o]), t;
  }
  if (n(i, "allowArg"), !a)
    return i();
  if (!Array.isArray(a))
    return k.error(_`
        Invalid argType: '${o}.options' should be an array.

        More info: https://storybook.js.org/docs/react/api/argtypes
      `), i();
  if (a.some((h) => h && ["object", "function"].includes(typeof h)))
    return k.error(_`
        Invalid argType: '${o}.options' should only contain primitives. Use a 'mapping' for complex values.

        More info: https://storybook.js.org/docs/react/writing-stories/args#mapping-to-complex-arg-values
      `), i();
  let s = Array.isArray(r[o]), c = s && r[o].findIndex((h) => !a.includes(h)), l = s && c === -1;
  if (r[o] === void 0 || a.includes(r[o]) || l)
    return i();
  let u = s ? `${o}[${c}]` : o, p = a.map((h) => typeof h == "string" ? `'${h}'` : String(h)).join(", ");
  return k.warn(`Received illegal value for '${u}'. Supported options: ${p}`), t;
}, {}), "validateOptions"), ke = Symbol("Deeply equal"), Tr = /* @__PURE__ */ n((r, e) => {
  if (typeof r != typeof e)
    return e;
  if (Sr(r, e))
    return ke;
  if (Array.isArray(r) && Array.isArray(e)) {
    let t = e.reduce((o, a, i) => {
      let s = Tr(r[i], a);
      return s !== ke && (o[i] = s), o;
    }, new Array(e.length));
    return e.length >= r.length ? t : t.concat(new Array(r.length - e.length).fill(void 0));
  }
  return (0, St.default)(r) && (0, St.default)(e) ? Object.keys({ ...r, ...e }).reduce((t, o) => {
    let a = Tr(r?.[o], e?.[o]);
    return a === ke ? t : Object.assign(t, { [o]: a });
  }, {}) : e;
}, "deepDiff"), Ja = "UNTARGETED";
function Kd({
  args: r,
  argTypes: e
}) {
  let t = {};
  return Object.entries(r).forEach(([o, a]) => {
    let { target: i = Ja } = e[o] || {};
    t[i] = t[i] || {}, t[i][o] = a;
  }), t;
}
n(Kd, "groupArgsByTarget");

// src/preview-api/modules/store/ArgsStore.ts
function pP(r) {
  return Object.keys(r).forEach((e) => r[e] === void 0 && delete r[e]), r;
}
n(pP, "deleteUndefined");
var Qa = class Qa {
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
      let t = Tr(this.initialArgsByStoryId[e.id], this.argsByStoryId[e.id]);
      this.initialArgsByStoryId[e.id] = e.initialArgs, this.argsByStoryId[e.id] = e.initialArgs, t !== ke && this.updateFromDelta(e, t);
    }
  }
  updateFromDelta(e, t) {
    let o = Yd(t, e.argTypes);
    this.argsByStoryId[e.id] = vr(this.argsByStoryId[e.id], o);
  }
  updateFromPersisted(e, t) {
    let o = zd(t, e.argTypes);
    return this.updateFromDelta(e, o);
  }
  update(e, t) {
    if (!(e in this.argsByStoryId))
      throw new Error(`No args known for ${e} -- has it been rendered yet?`);
    this.argsByStoryId[e] = pP({
      ...this.argsByStoryId[e],
      ...t
    });
  }
};
n(Qa, "ArgsStore");
var ho = Qa;

// src/preview-api/modules/store/csf/getValuesFromArgTypes.ts
var mo = /* @__PURE__ */ n((r = {}) => Object.entries(r).reduce((e, [t, { defaultValue: o }]) => (typeof o < "u" && (e[t] = o), e), {}), "ge\
tValuesFromArgTypes");

// src/preview-api/modules/store/GlobalsStore.ts
var Za = class Za {
  constructor({
    globals: e = {},
    globalTypes: t = {}
  }) {
    this.set({ globals: e, globalTypes: t });
  }
  set({ globals: e = {}, globalTypes: t = {} }) {
    let o = this.initialGlobals && Tr(this.initialGlobals, this.globals);
    this.allowedGlobalNames = /* @__PURE__ */ new Set([...Object.keys(e), ...Object.keys(t)]);
    let a = mo(t);
    this.initialGlobals = { ...a, ...e }, this.globals = this.initialGlobals, o && o !== ke && this.updateFromPersisted(o);
  }
  filterAllowedGlobals(e) {
    return Object.entries(e).reduce((t, [o, a]) => (this.allowedGlobalNames.has(o) ? t[o] = a : C.warn(
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
n(Za, "GlobalsStore");
var go = Za;

// src/preview-api/modules/store/StoryIndexStore.ts
var Xd = Y(Vt(), 1);
var dP = (0, Xd.default)(1)(
  (r) => Object.values(r).reduce(
    (e, t) => (e[t.importPath] = e[t.importPath] || t, e),
    {}
  )
), ei = class ei {
  constructor({ entries: e } = { v: 5, entries: {} }) {
    this.entries = e;
  }
  entryFromSpecifier(e) {
    let t = Object.values(this.entries);
    if (e === "*")
      return t[0];
    if (typeof e == "string")
      return this.entries[e] ? this.entries[e] : t.find((i) => i.id.startsWith(e));
    let { name: o, title: a } = e;
    return t.find((i) => i.name === o && i.title === a);
  }
  storyIdToEntry(e) {
    let t = this.entries[e];
    if (!t)
      throw new Xr({ storyId: e });
    return t;
  }
  importPathToEntry(e) {
    return dP(this.entries)[e];
  }
};
n(ei, "StoryIndexStore");
var So = ei;

// src/preview-api/modules/store/csf/normalizeInputTypes.ts
var Jd = Y(gt(), 1);
var fP = /* @__PURE__ */ n((r) => typeof r == "string" ? { name: r } : r, "normalizeType"), yP = /* @__PURE__ */ n((r) => typeof r == "strin\
g" ? { type: r } : r, "normalizeControl"), hP = /* @__PURE__ */ n((r, e) => {
  let { type: t, control: o, ...a } = r, i = {
    name: e,
    ...a
  };
  return t && (i.type = fP(t)), o ? i.control = yP(o) : o === !1 && (i.control = { disable: !0 }), i;
}, "normalizeInputType"), je = /* @__PURE__ */ n((r) => (0, Jd.default)(r, hP), "normalizeInputTypes");

// ../node_modules/@storybook/csf/dist/index.mjs
var mP = Object.create, rf = Object.defineProperty, gP = Object.getOwnPropertyDescriptor, SP = Object.getOwnPropertyNames, bP = Object.getPrototypeOf,
vP = Object.prototype.hasOwnProperty, TP = /* @__PURE__ */ n((r, e) => () => (e || r((e = { exports: {} }).exports, e), e.exports), "v"), EP = /* @__PURE__ */ n(
(r, e, t, o) => {
  if (e && typeof e == "object" || typeof e == "function") for (let a of SP(e)) !vP.call(r, a) && a !== t && rf(r, a, { get: /* @__PURE__ */ n(
  () => e[a], "get"), enumerable: !(o = gP(e, a)) || o.enumerable });
  return r;
}, "E"), AP = /* @__PURE__ */ n((r, e, t) => (t = r != null ? mP(bP(r)) : {}, EP(e || !r || !r.__esModule ? rf(t, "default", { value: r, enumerable: !0 }) :
t, r)), "I"), RP = TP((r) => {
  Object.defineProperty(r, "__esModule", { value: !0 }), r.isEqual = /* @__PURE__ */ function() {
    var e = Object.prototype.toString, t = Object.getPrototypeOf, o = Object.getOwnPropertySymbols ? function(a) {
      return Object.keys(a).concat(Object.getOwnPropertySymbols(a));
    } : Object.keys;
    return function(a, i) {
      return (/* @__PURE__ */ n(function s(c, l, u) {
        var p, h, d, g = e.call(c), m = e.call(l);
        if (c === l) return !0;
        if (c == null || l == null) return !1;
        if (u.indexOf(c) > -1 && u.indexOf(l) > -1) return !0;
        if (u.push(c, l), g != m || (p = o(c), h = o(l), p.length != h.length || p.some(function(b) {
          return !s(c[b], l[b], u);
        }))) return !1;
        switch (g.slice(8, -1)) {
          case "Symbol":
            return c.valueOf() == l.valueOf();
          case "Date":
          case "Number":
            return +c == +l || +c != +c && +l != +l;
          case "RegExp":
          case "Function":
          case "String":
          case "Boolean":
            return "" + c == "" + l;
          case "Set":
          case "Map":
            p = c.entries(), h = l.entries();
            do
              if (!s((d = p.next()).value, h.next().value, u)) return !1;
            while (!d.done);
            return !0;
          case "ArrayBuffer":
            c = new Uint8Array(c), l = new Uint8Array(l);
          case "DataView":
            c = new Uint8Array(c.buffer), l = new Uint8Array(l.buffer);
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
            if (c.length != l.length) return !1;
            for (d = 0; d < c.length; d++) if ((d in c || d in l) && (d in c != d in l || !s(c[d], l[d], u))) return !1;
            return !0;
          case "Object":
            return s(t(c), t(l), u);
          default:
            return !1;
        }
      }, "i"))(a, i, []);
    };
  }();
});
function wP(r) {
  return r.replace(/_/g, " ").replace(/-/g, " ").replace(/\./g, " ").replace(/([^\n])([A-Z])([a-z])/g, (e, t, o, a) => `${t} ${o}${a}`).replace(
  /([a-z])([A-Z])/g, (e, t, o) => `${t} ${o}`).replace(/([a-z])([0-9])/gi, (e, t, o) => `${t} ${o}`).replace(/([0-9])([a-z])/gi, (e, t, o) => `${t}\
 ${o}`).replace(/(\s|^)(\w)/g, (e, t, o) => `${t}${o.toUpperCase()}`).replace(/ +/g, " ").trim();
}
n(wP, "R");
var Qd = AP(RP()), tf = /* @__PURE__ */ n((r) => r.map((e) => typeof e < "u").filter(Boolean).length, "S"), xP = /* @__PURE__ */ n((r, e) => {
  let { exists: t, eq: o, neq: a, truthy: i } = r;
  if (tf([t, o, a, i]) > 1) throw new Error(`Invalid conditional test ${JSON.stringify({ exists: t, eq: o, neq: a })}`);
  if (typeof o < "u") return (0, Qd.isEqual)(e, o);
  if (typeof a < "u") return !(0, Qd.isEqual)(e, a);
  if (typeof t < "u") {
    let s = typeof e < "u";
    return t ? s : !s;
  }
  return typeof i > "u" || i ? !!e : !e;
}, "k"), of = /* @__PURE__ */ n((r, e, t) => {
  if (!r.if) return !0;
  let { arg: o, global: a } = r.if;
  if (tf([o, a]) !== 1) throw new Error(`Invalid conditional value ${JSON.stringify({ arg: o, global: a })}`);
  let i = o ? e[o] : t[a];
  return xP(r.if, i);
}, "P"), ri = /* @__PURE__ */ n((r) => r.toLowerCase().replace(/[ ’–—―′¿'`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, "-").replace(
/-+/g, "-").replace(/^-+/, "").replace(/-+$/, ""), "O"), Zd = /* @__PURE__ */ n((r, e) => {
  let t = ri(r);
  if (t === "") throw new Error(`Invalid ${e} '${r}', must include alphanumeric characters`);
  return t;
}, "m"), nf = /* @__PURE__ */ n((r, e) => `${Zd(r, "kind")}${e ? `--${Zd(e, "name")}` : ""}`, "G"), af = /* @__PURE__ */ n((r) => wP(r), "N");
function ef(r, e) {
  return Array.isArray(e) ? e.includes(r) : r.match(e);
}
n(ef, "f");
function bo(r, { includeStories: e, excludeStories: t }) {
  return r !== "__esModule" && (!e || ef(r, e)) && (!t || !ef(r, t));
}
n(bo, "M");
var sf = /* @__PURE__ */ n((...r) => {
  let e = r.reduce((t, o) => (o.startsWith("!") ? t.delete(o.slice(1)) : t.add(o), t), /* @__PURE__ */ new Set());
  return Array.from(e);
}, "z");

// src/preview-api/modules/store/csf/normalizeArrays.ts
var j = /* @__PURE__ */ n((r) => Array.isArray(r) ? r : r ? [r] : [], "normalizeArrays");

// src/preview-api/modules/store/csf/normalizeStory.ts
var _P = _`
CSF .story annotations deprecated; annotate story functions directly:
- StoryFn.story.name => StoryFn.storyName
- StoryFn.story.(parameters|decorators) => StoryFn.(parameters|decorators)
See https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#hoisted-csf-annotations for details and codemod.
`;
function Er(r, e, t) {
  let o = e, a = typeof e == "function" ? e : null, { story: i } = o;
  i && (C.debug("deprecated story", i), ae(_P));
  let s = af(r), c = typeof o != "function" && o.name || o.storyName || i?.name || s, l = [
    ...j(o.decorators),
    ...j(i?.decorators)
  ], u = { ...i?.parameters, ...o.parameters }, p = { ...i?.args, ...o.args }, h = { ...i?.argTypes, ...o.argTypes }, d = [...j(o.loaders), ...j(
  i?.loaders)], g = [
    ...j(o.beforeEach),
    ...j(i?.beforeEach)
  ], { render: m, play: b, tags: S = [], globals: T = {} } = o, v = u.__id || nf(t.id, s);
  return {
    moduleExport: e,
    id: v,
    name: c,
    tags: S,
    decorators: l,
    parameters: u,
    args: p,
    argTypes: je(h),
    loaders: d,
    beforeEach: g,
    globals: T,
    ...m && { render: m },
    ...a && { userStoryFn: a },
    ...b && { play: b }
  };
}
n(Er, "normalizeStory");

// src/preview-api/modules/store/csf/normalizeComponentAnnotations.ts
function vo(r, e = r.title, t) {
  let { id: o, argTypes: a } = r;
  return {
    id: ri(o || e),
    ...r,
    title: e,
    ...a && { argTypes: je(a) },
    parameters: {
      fileName: t,
      ...r.parameters
    }
  };
}
n(vo, "normalizeComponentAnnotations");

// src/preview-api/modules/store/csf/processCSFFile.ts
var PP = /* @__PURE__ */ n((r) => {
  let { globals: e, globalTypes: t } = r;
  (e || t) && C.error(
    "Global args/argTypes can only be set globally",
    JSON.stringify({
      globals: e,
      globalTypes: t
    })
  );
}, "checkGlobals"), OP = /* @__PURE__ */ n((r) => {
  let { options: e } = r;
  e?.storySort && C.error("The storySort option parameter can only be set globally");
}, "checkStorySort"), lf = /* @__PURE__ */ n((r) => {
  r && (PP(r), OP(r));
}, "checkDisallowedParameters");
function cf(r, e, t) {
  let { default: o, __namedExportsOrder: a, ...i } = r, s = vo(
    o,
    t,
    e
  );
  lf(s.parameters);
  let c = { meta: s, stories: {}, moduleExports: r };
  return Object.keys(i).forEach((l) => {
    if (bo(l, s)) {
      let u = Er(l, i[l], s);
      lf(u.parameters), c.stories[u.id] = u;
    }
  }), c;
}
n(cf, "processCSFFile");

// src/preview-api/modules/preview-web/render/mount-utils.ts
function pf(r) {
  return r != null && CP(r).includes("mount");
}
n(pf, "mountDestructured");
function CP(r) {
  let e = r.toString().match(/[^(]*\(([^)]*)/);
  if (!e)
    return [];
  let t = uf(e[1]);
  if (!t.length)
    return [];
  let o = t[0];
  return o.startsWith("{") && o.endsWith("}") ? uf(o.slice(1, -1).replace(/\s/g, "")).map((i) => i.replace(/:.*|=.*/g, "")) : [];
}
n(CP, "getUsedProps");
function uf(r) {
  let e = [], t = [], o = 0;
  for (let i = 0; i < r.length; i++)
    if (r[i] === "{" || r[i] === "[")
      t.push(r[i] === "{" ? "}" : "]");
    else if (r[i] === t[t.length - 1])
      t.pop();
    else if (!t.length && r[i] === ",") {
      let s = r.substring(o, i).trim();
      s && e.push(s), o = i + 1;
    }
  let a = r.substring(o).trim();
  return a && e.push(a), e;
}
n(uf, "splitByComma");

// src/preview-api/modules/store/decorators.ts
function ti(r, e, t) {
  let o = t(r);
  return (a) => e(o, a);
}
n(ti, "decorateStory");
function oi({
  componentId: r,
  title: e,
  kind: t,
  id: o,
  name: a,
  story: i,
  parameters: s,
  initialArgs: c,
  argTypes: l,
  ...u
} = {}) {
  return u;
}
n(oi, "sanitizeStoryContextUpdate");
function To(r, e) {
  let t = {}, o = /* @__PURE__ */ n((i) => (s) => {
    if (!t.value)
      throw new Error("Decorated function called without init");
    return t.value = {
      ...t.value,
      ...oi(s)
    }, i(t.value);
  }, "bindWithContext"), a = e.reduce(
    (i, s) => ti(i, s, o),
    r
  );
  return (i) => (t.value = i, a(i));
}
n(To, "defaultDecorateStory");

// src/preview-api/modules/store/parameters.ts
var Eo = Y(yo(), 1);
var Q = /* @__PURE__ */ n((...r) => {
  let e = {}, t = r.filter(Boolean), o = t.reduce((a, i) => (Object.entries(i).forEach(([s, c]) => {
    let l = a[s];
    Array.isArray(c) || typeof l > "u" ? a[s] = c : (0, Eo.default)(c) && (0, Eo.default)(l) ? e[s] = !0 : typeof c < "u" && (a[s] = c);
  }), a), {});
  return Object.keys(e).forEach((a) => {
    let i = t.filter(Boolean).map((s) => s[a]).filter((s) => typeof s < "u");
    i.every((s) => (0, Eo.default)(s)) ? o[a] = Q(...i) : o[a] = i[i.length - 1];
  }), o;
}, "combineParameters");

// src/preview-api/modules/store/csf/prepareStory.ts
function Ar(r, e, t) {
  let { moduleExport: o, id: a, name: i } = r || {}, s = df(
    r,
    e,
    t
  ), c = /* @__PURE__ */ n(async (w) => {
    let P = {};
    for (let M of [
      ..."__STORYBOOK_TEST_LOADERS__" in A && Array.isArray(A.__STORYBOOK_TEST_LOADERS__) ? [A.__STORYBOOK_TEST_LOADERS__] : [],
      j(t.loaders),
      j(e.loaders),
      j(r.loaders)
    ]) {
      if (w.abortSignal.aborted)
        return P;
      let F = await Promise.all(M.map((H) => H(w)));
      Object.assign(P, ...F);
    }
    return P;
  }, "applyLoaders"), l = /* @__PURE__ */ n(async (w) => {
    let P = new Array();
    for (let M of [
      ...j(t.beforeEach),
      ...j(e.beforeEach),
      ...j(r.beforeEach)
    ]) {
      if (w.abortSignal.aborted)
        return P;
      let F = await M(w);
      F && P.push(F);
    }
    return P;
  }, "applyBeforeEach"), u = /* @__PURE__ */ n((w) => w.originalStoryFn(w.args, w), "undecoratedStoryFn"), { applyDecorators: p = To, runStep: h } = t,
  d = [
    ...j(r?.decorators),
    ...j(e?.decorators),
    ...j(t?.decorators)
  ], g = r?.userStoryFn || r?.render || e.render || t.render, m = Jt(p)(u, d), b = /* @__PURE__ */ n((w) => m(w), "unboundStoryFn"), S = r?.
  play ?? e?.play, T = pf(S);
  if (!g && !T)
    throw new at({ id: a });
  let v = /* @__PURE__ */ n((w) => async () => (await w.renderToCanvas(), w.canvas), "defaultMount"), E = r.mount ?? e.mount ?? t.mount ?? v,
  R = t.testingLibraryRender;
  return {
    storyGlobals: {},
    ...s,
    moduleExport: o,
    id: a,
    name: i,
    story: i,
    originalStoryFn: g,
    undecoratedStoryFn: u,
    unboundStoryFn: b,
    applyLoaders: c,
    applyBeforeEach: l,
    playFunction: S,
    runStep: h,
    mount: E,
    testingLibraryRender: R,
    renderToCanvas: t.renderToCanvas,
    usesMount: T
  };
}
n(Ar, "prepareStory");
function Ao(r, e, t) {
  return {
    ...df(void 0, r, e),
    moduleExport: t
  };
}
n(Ao, "prepareMeta");
function df(r, e, t) {
  let o = ["dev", "test"], a = A.DOCS_OPTIONS?.autodocs === !0 ? ["autodocs"] : [], i = sf(
    ...o,
    ...a,
    ...t.tags ?? [],
    ...e.tags ?? [],
    ...r?.tags ?? []
  ), s = Q(
    t.parameters,
    e.parameters,
    r?.parameters
  ), { argTypesEnhancers: c = [], argsEnhancers: l = [] } = t, u = Q(
    t.argTypes,
    e.argTypes,
    r?.argTypes
  );
  if (r) {
    let T = r?.userStoryFn || r?.render || e.render || t.render;
    s.__isArgsStory = T && T.length > 0;
  }
  let p = {
    ...t.args,
    ...e.args,
    ...r?.args
  }, h = {
    ...e.globals,
    ...r?.globals
  }, d = {
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
    tags: i,
    parameters: s,
    initialArgs: p,
    argTypes: u,
    storyGlobals: h
  };
  d.argTypes = c.reduce(
    (T, v) => v({ ...d, argTypes: T }),
    d.argTypes
  );
  let g = { ...p };
  d.initialArgs = l.reduce(
    (T, v) => ({
      ...T,
      ...v({
        ...d,
        initialArgs: T
      })
    }),
    g
  );
  let { name: m, story: b, ...S } = d;
  return S;
}
n(df, "preparePartialAnnotations");
function Ro(r) {
  let { args: e } = r, t = {
    ...r,
    allArgs: void 0,
    argsByTarget: void 0
  };
  if (A.FEATURES?.argTypeTargetsV7) {
    let i = Kd(r);
    t = {
      ...r,
      allArgs: r.args,
      argsByTarget: i,
      args: i[Ja] || {}
    };
  }
  let o = Object.entries(t.args).reduce((i, [s, c]) => {
    if (!t.argTypes[s]?.mapping)
      return i[s] = c, i;
    let l = /* @__PURE__ */ n((u) => {
      let p = t.argTypes[s].mapping;
      return p && u in p ? p[u] : u;
    }, "mappingFn");
    return i[s] = Array.isArray(c) ? c.map(l) : l(c), i;
  }, {}), a = Object.entries(o).reduce((i, [s, c]) => {
    let l = t.argTypes[s] || {};
    return of(l, o, t.globals) && (i[s] = c), i;
  }, {});
  return { ...t, unmappedArgs: e, args: a };
}
n(Ro, "prepareContext");

// src/preview-api/modules/store/inferArgTypes.ts
var wo = Y(gt(), 1);
var ni = /* @__PURE__ */ n((r, e, t) => {
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
  return r ? t.has(r) ? (C.warn(_`
        We've detected a cycle in arg '${e}'. Args should be JSON-serializable.

        Consider using the mapping feature or fully custom args:
        - Mapping: https://storybook.js.org/docs/react/writing-stories/args#mapping-to-complex-arg-values
        - Custom args: https://storybook.js.org/docs/react/essentials/controls#fully-custom-args
      `), { name: "other", value: "cyclic object" }) : (t.add(r), Array.isArray(r) ? { name: "array", value: r.length > 0 ? ni(r[0], e, new Set(
  t)) : { name: "other", value: "unknown" } } : { name: "object", value: (0, wo.default)(r, (i) => ni(i, e, new Set(t))) }) : { name: "objec\
t", value: {} };
}, "inferType"), ai = /* @__PURE__ */ n((r) => {
  let { id: e, argTypes: t = {}, initialArgs: o = {} } = r, a = (0, wo.default)(o, (s, c) => ({
    name: c,
    type: ni(s, `${e}.${c}`, /* @__PURE__ */ new Set())
  })), i = (0, wo.default)(t, (s, c) => ({
    name: c
  }));
  return Q(a, i, t);
}, "inferArgTypes");
ai.secondPass = !0;

// src/preview-api/modules/store/inferControls.ts
var _f = Y(gt(), 1);

// src/preview-api/modules/store/filterArgTypes.ts
var xf = Y(Rf(), 1);
var wf = /* @__PURE__ */ n((r, e) => Array.isArray(e) ? e.includes(r) : r.match(e), "matches"), bt = /* @__PURE__ */ n((r, e, t) => !e && !t ?
r : r && (0, xf.default)(r, (o, a) => {
  let i = o.name || a;
  return (!e || wf(i, e)) && (!t || !wf(i, t));
}), "filterArgTypes");

// src/preview-api/modules/store/inferControls.ts
var oO = /* @__PURE__ */ n((r, e, t) => {
  let { type: o, options: a } = r;
  if (o) {
    if (t.color && t.color.test(e)) {
      let i = o.name;
      if (i === "string")
        return { control: { type: "color" } };
      i !== "enum" && C.warn(
        `Addon controls: Control of type color only supports string, received "${i}" instead`
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
        let { value: i } = o;
        return { control: { type: i?.length <= 5 ? "radio" : "select" }, options: i };
      }
      case "function":
      case "symbol":
        return null;
      default:
        return { control: { type: a ? "select" : "object" } };
    }
  }
}, "inferControl"), Rr = /* @__PURE__ */ n((r) => {
  let {
    argTypes: e,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    parameters: { __isArgsStory: t, controls: { include: o = null, exclude: a = null, matchers: i = {} } = {} }
  } = r;
  if (!t)
    return e;
  let s = bt(e, o, a), c = (0, _f.default)(s, (l, u) => l?.type && oO(l, u, i));
  return Q(c, s);
}, "inferControls");
Rr.secondPass = !0;

// src/preview-api/modules/store/csf/normalizeProjectAnnotations.ts
function vt({
  argTypes: r,
  globalTypes: e,
  argTypesEnhancers: t,
  decorators: o,
  loaders: a,
  beforeEach: i,
  globals: s,
  initialGlobals: c,
  ...l
}) {
  return s && Object.keys(s).length > 0 && ae(_`
      The preview.js 'globals' field is deprecated and will be removed in Storybook 9.0.
      Please use 'initialGlobals' instead. Learn more:

      https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#previewjs-globals-renamed-to-initialglobals
    `), {
    ...r && { argTypes: je(r) },
    ...e && { globalTypes: je(e) },
    decorators: j(o),
    loaders: j(a),
    beforeEach: j(i),
    argTypesEnhancers: [
      ...t || [],
      ai,
      // inferControls technically should only run if the user is using the controls addon,
      // and so should be added by a preset there. However, as it seems some code relies on controls
      // annotations (in particular the angular implementation's `cleanArgsDecorator`), for backwards
      // compatibility reasons, we will leave this in the store until 7.0
      Rr
    ],
    initialGlobals: Q(c, s),
    ...l
  };
}
n(vt, "normalizeProjectAnnotations");

// src/preview-api/modules/store/csf/beforeAll.ts
var Pf = /* @__PURE__ */ n((r) => async () => {
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
function xo(r) {
  return async (e, t, o) => {
    await r.reduceRight(
      (i, s) => async () => s(e, i, o),
      async () => t(o)
    )();
  };
}
n(xo, "composeStepRunners");

// src/preview-api/modules/store/csf/composeConfigs.ts
function Et(r, e) {
  return r.map((t) => t.default?.[e] ?? t[e]).filter(Boolean);
}
n(Et, "getField");
function Ge(r, e, t = {}) {
  return Et(r, e).reduce((o, a) => {
    let i = j(a);
    return t.reverseFileOrder ? [...i, ...o] : [...o, ...i];
  }, []);
}
n(Ge, "getArrayField");
function Tt(r, e) {
  return Object.assign({}, ...Et(r, e));
}
n(Tt, "getObjectField");
function wr(r, e) {
  return Et(r, e).pop();
}
n(wr, "getSingletonField");
function xr(r) {
  let e = Ge(r, "argTypesEnhancers"), t = Et(r, "runStep"), o = Ge(r, "beforeAll");
  return {
    parameters: Q(...Et(r, "parameters")),
    decorators: Ge(r, "decorators", {
      reverseFileOrder: !(A.FEATURES?.legacyDecoratorFileOrder ?? !1)
    }),
    args: Tt(r, "args"),
    argsEnhancers: Ge(r, "argsEnhancers"),
    argTypes: Tt(r, "argTypes"),
    argTypesEnhancers: [
      ...e.filter((a) => !a.secondPass),
      ...e.filter((a) => a.secondPass)
    ],
    globals: Tt(r, "globals"),
    initialGlobals: Tt(r, "initialGlobals"),
    globalTypes: Tt(r, "globalTypes"),
    loaders: Ge(r, "loaders"),
    beforeAll: Pf(o),
    beforeEach: Ge(r, "beforeEach"),
    render: wr(r, "render"),
    renderToCanvas: wr(r, "renderToCanvas"),
    renderToDOM: wr(r, "renderToDOM"),
    // deprecated
    applyDecorators: wr(r, "applyDecorators"),
    runStep: xo(t),
    tags: Ge(r, "tags"),
    mount: wr(r, "mount"),
    testingLibraryRender: wr(r, "testingLibraryRender")
  };
}
n(xr, "composeConfigs");

// src/preview-api/modules/store/csf/portable-stories.ts
function Of(r) {
  globalThis.defaultProjectAnnotations = r;
}
n(Of, "setDefaultProjectAnnotations");
var nO = "ComposedStory", aO = "Unnamed Story";
function iO(r) {
  return r ? "default" in r ? r.default : r : {};
}
n(iO, "extractAnnotation");
function Cf(r) {
  let e = Array.isArray(r) ? r : [r];
  return globalThis.globalProjectAnnotations = xr(e.map(iO)), xr([
    globalThis.defaultProjectAnnotations ?? {},
    globalThis.globalProjectAnnotations ?? {}
  ]);
}
n(Cf, "setProjectAnnotations");
var Re = [];
function ii(r, e, t, o, a) {
  if (r === void 0)
    throw new Error("Expected a story but received undefined.");
  e.title = e.title ?? nO;
  let i = vo(e), s = a || r.storyName || r.story?.name || r.name || aO, c = Er(
    s,
    r,
    i
  ), l = vt(
    xr([
      o && Object.keys(o).length > 0 ? o : globalThis.defaultProjectAnnotations ?? {},
      globalThis.globalProjectAnnotations ?? {},
      t ?? {}
    ])
  ), u = Ar(
    c,
    i,
    l
  ), p = mo(l.globalTypes), h = /* @__PURE__ */ n(() => {
    let T = Ro({
      hooks: new Ee(),
      globals: {
        // TODO: remove loading from globalTypes in 9.0
        ...p,
        ...l.initialGlobals,
        ...u.storyGlobals
      },
      args: { ...u.initialArgs },
      viewMode: "story",
      loaded: {},
      abortSignal: new AbortController().signal,
      step: /* @__PURE__ */ n((v, E) => u.runStep(v, E, T), "step"),
      canvasElement: null,
      canvas: {},
      globalTypes: l.globalTypes,
      ...u,
      context: null,
      mount: null
    });
    return T.context = T, u.renderToCanvas && (T.renderToCanvas = async () => {
      let v = await u.renderToCanvas?.(
        {
          componentId: u.componentId,
          title: u.title,
          id: u.id,
          name: u.name,
          tags: u.tags,
          showMain: /* @__PURE__ */ n(() => {
          }, "showMain"),
          showError: /* @__PURE__ */ n((E) => {
            throw new Error(`${E.title}
${E.description}`);
          }, "showError"),
          showException: /* @__PURE__ */ n((E) => {
            throw E;
          }, "showException"),
          forceRemount: !0,
          storyContext: T,
          storyFn: /* @__PURE__ */ n(() => u.unboundStoryFn(T), "storyFn"),
          unboundStoryFn: u.unboundStoryFn
        },
        T.canvasElement
      );
      v && Re.push(v);
    }), T.mount = u.mount(T), T;
  }, "initializeContext"), d, g = /* @__PURE__ */ n(async (T) => {
    let v = h();
    return v.canvasElement ??= globalThis?.document?.body, d && (v.loaded = d.loaded), Object.assign(v, T), u.playFunction(v);
  }, "play"), m = /* @__PURE__ */ n((T) => {
    let v = h();
    return Object.assign(v, T), lO(u, v);
  }, "run"), b = u.playFunction ? g : void 0;
  return Object.assign(
    /* @__PURE__ */ n(function(v) {
      let E = h();
      return d && (E.loaded = d.loaded), E.args = {
        ...E.initialArgs,
        ...v
      }, u.unboundStoryFn(E);
    }, "storyFn"),
    {
      id: u.id,
      storyName: s,
      load: /* @__PURE__ */ n(async () => {
        for (let v of [...Re].reverse())
          await v();
        Re.length = 0;
        let T = h();
        T.loaded = await u.applyLoaders(T), Re.push(...(await u.applyBeforeEach(T)).filter(Boolean)), d = T;
      }, "load"),
      args: u.initialArgs,
      parameters: u.parameters,
      argTypes: u.argTypes,
      play: b,
      run: m,
      tags: u.tags
    }
  );
}
n(ii, "composeStory");
var sO = /* @__PURE__ */ n((r, e, t, o) => ii(r, e, t, {}, o), "defaultComposeStory");
function If(r, e, t = sO) {
  let { default: o, __esModule: a, __namedExportsOrder: i, ...s } = r;
  return Object.entries(s).reduce((l, [u, p]) => bo(u, o) ? Object.assign(l, {
    [u]: t(
      p,
      o,
      e,
      u
    )
  }) : l, {});
}
n(If, "composeStories");
function Ff(r) {
  return r.extend({
    mount: /* @__PURE__ */ n(async ({ mount: e, page: t }, o) => {
      await o(async (a, ...i) => {
        if (!("__pw_type" in a) || "__pw_type" in a && a.__pw_type !== "jsx")
          throw new Error(_`
              Portable stories in Playwright CT only work when referencing JSX elements.
              Please use JSX format for your components such as:

              instead of:
              await mount(MyComponent, { props: { foo: 'bar' } })

              do:
              await mount(<MyComponent foo="bar"/>)

              More info: https://storybook.js.org/docs/api/portable-stories-playwright
            `);
        await t.evaluate(async (c) => {
          let l = await globalThis.__pwUnwrapObject?.(c);
          return ("__pw_type" in l ? l.type : l)?.load?.();
        }, a);
        let s = await e(a, ...i);
        return await t.evaluate(async (c) => {
          let l = await globalThis.__pwUnwrapObject?.(c), u = "__pw_type" in l ? l.type : l, p = document.querySelector("#root");
          return u?.play?.({ canvasElement: p });
        }, a), s;
      });
    }, "mount")
  });
}
n(Ff, "createPlaywrightTest");
async function lO(r, e) {
  for (let a of [...Re].reverse())
    await a();
  if (Re.length = 0, !e.canvasElement) {
    let a = document.createElement("div");
    globalThis?.document?.body?.appendChild(a), e.canvasElement = a, Re.push(() => {
      globalThis?.document?.body?.contains(a) && globalThis?.document?.body?.removeChild(a);
    });
  }
  if (e.loaded = await r.applyLoaders(e), e.abortSignal.aborted)
    return;
  Re.push(...(await r.applyBeforeEach(e)).filter(Boolean));
  let t = r.playFunction, o = r.usesMount;
  o || await e.mount(), !e.abortSignal.aborted && t && (o || (e.mount = async () => {
    throw new Ne({ playFunction: t.toString() });
  }), await t(e));
}
n(lO, "runStory");

// src/preview-api/modules/store/StoryStore.ts
var Df = 1e3, cO = 1e4, li = class li {
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
        stories: (0, Nf.default)(e.stories, (a) => {
          let { importPath: i } = this.storyIndex.entries[a.id];
          return {
            ...(0, si.default)(a, ["id", "name", "title"]),
            importPath: i,
            // These 3 fields were going to be dropped in v7, but instead we will keep them for the
            // 7.x cycle so that v7 Storybooks can be composed successfully in v6 Storybook.
            // In v8 we will (likely) completely drop support for `extract` and `getStoriesJsonData`
            kind: a.title,
            story: a.name,
            parameters: {
              ...(0, si.default)(a.parameters, t),
              fileName: i
            }
          };
        })
      };
    }, "getStoriesJsonData");
    this.storyIndex = new So(e), this.projectAnnotations = vt(o);
    let { initialGlobals: a, globalTypes: i } = this.projectAnnotations;
    this.args = new ho(), this.userGlobals = new go({ globals: a, globalTypes: i }), this.hooks = {}, this.cleanupCallbacks = {}, this.processCSFFileWithCache =
    (0, _o.default)(Df)(cf), this.prepareMetaWithCache = (0, _o.default)(Df)(Ao), this.prepareStoryWithCache = (0, _o.default)(cO)(Ar);
  }
  setProjectAnnotations(e) {
    this.projectAnnotations = vt(e);
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
    let { importPath: t, title: o } = this.storyIndex.storyIdToEntry(e), a = await this.importFn(t);
    return this.processCSFFileWithCache(a, t, o);
  }
  async loadAllCSFFiles() {
    let e = {};
    return Object.entries(this.storyIndex.entries).forEach(([o, { importPath: a }]) => {
      e[a] = o;
    }), (await Promise.all(
      Object.entries(e).map(async ([o, a]) => ({
        importPath: o,
        csfFile: await this.loadCSFFileByStoryId(a)
      }))
    )).reduce(
      (o, { importPath: a, csfFile: i }) => (o[a] = i, o),
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
      throw new ot({ storyId: e });
    let a = t.meta, i = this.prepareStoryWithCache(
      o,
      a,
      this.projectAnnotations
    );
    return this.args.setInitial(i), this.hooks[i.id] = this.hooks[i.id] || new Ee(), i;
  }
  // If we have a CSF file we can get all the stories from it synchronously
  componentStoriesFromCSFFile({
    csfFile: e
  }) {
    return Object.keys(this.storyIndex.entries).filter((t) => !!e.stories[t]).map((t) => this.storyFromCSFFile({ storyId: t, csfFile: e }));
  }
  async loadEntry(e) {
    let t = await this.storyIdToEntry(e), o = t.type === "docs" ? t.storiesImports : [], [a, ...i] = await Promise.all([
      this.importFn(t.importPath),
      ...o.map((s) => {
        let c = this.storyIndex.importPathToEntry(s);
        return this.loadCSFFileByStoryId(c.id);
      })
    ]);
    return { entryExports: a, csfFiles: i };
  }
  // A prepared story does not include args, globals or hooks. These are stored in the story store
  // and updated separtely to the (immutable) story.
  getStoryContext(e, { forceInitialArgs: t = !1 } = {}) {
    let o = this.userGlobals.get(), { initialGlobals: a } = this.userGlobals;
    return Ro({
      ...e,
      args: t ? e.initialArgs : this.args.get(e.id),
      initialGlobals: a,
      globalTypes: this.projectAnnotations.globalTypes,
      userGlobals: o,
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
      throw new Jr();
    return Object.entries(this.storyIndex.entries).reduce(
      (o, [a, { type: i, importPath: s }]) => {
        if (i === "docs")
          return o;
        let c = t[s], l = this.storyFromCSFFile({ storyId: a, csfFile: c });
        return !e.includeDocsOnly && l.parameters.docsOnly || (o[a] = Object.entries(l).reduce(
          (u, [p, h]) => p === "moduleExport" || typeof h == "function" ? u : Array.isArray(h) ? Object.assign(u, { [p]: h.slice().sort() }) :
          Object.assign(u, { [p]: h }),
          { args: l.initialArgs }
        )), o;
      },
      {}
    );
  }
  // TODO: Remove in 9.0
  getSetStoriesPayload() {
    let e = this.extract({ includeDocsOnly: !0 }), t = Object.values(e).reduce(
      (o, { title: a }) => (o[a] = {}, o),
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
    return ae(
      "StoryStore.raw() is deprecated and will be removed in 9.0, please use extract() instead"
    ), Object.values(this.extract()).map(({ id: e }) => this.fromId(e)).filter(Boolean);
  }
  fromId(e) {
    if (ae(
      "StoryStore.fromId() is deprecated and will be removed in 9.0, please use loadStory() instead"
    ), !this.cachedCSFFiles)
      throw new Error("Cannot call fromId/raw() unless you call cacheAllCSFFiles() first.");
    let t;
    try {
      ({ importPath: t } = this.storyIndex.storyIdToEntry(e));
    } catch {
      return null;
    }
    let o = this.cachedCSFFiles[t], a = this.storyFromCSFFile({ storyId: e, csfFile: o });
    return {
      ...a,
      storyFn: /* @__PURE__ */ n((i) => {
        let s = {
          ...this.getStoryContext(a),
          abortSignal: new AbortController().signal,
          canvasElement: null,
          loaded: {},
          step: /* @__PURE__ */ n((c, l) => a.runStep(c, l, s), "step"),
          context: null,
          mount: null,
          canvas: {},
          viewMode: "story"
        };
        return a.unboundStoryFn({ ...s, ...i });
      }, "storyFn")
    };
  }
};
n(li, "StoryStore");
var Be = li;

// ../node_modules/slash/index.js
function ci(r) {
  return r.startsWith("\\\\?\\") ? r : r.replace(/\\/g, "/");
}
n(ci, "slash");

// src/preview-api/modules/store/autoTitle.ts
var uO = /* @__PURE__ */ n((r) => {
  if (r.length === 0)
    return r;
  let e = r[r.length - 1], t = e?.replace(/(?:[.](?:story|stories))?([.][^.]+)$/i, "");
  if (r.length === 1)
    return [t];
  let o = r[r.length - 2];
  return t && o && t.toLowerCase() === o.toLowerCase() ? [...r.slice(0, -2), t] : t && (/^(story|stories)([.][^.]+)$/i.test(e) || /^index$/i.
  test(t)) ? r.slice(0, -1) : [...r.slice(0, -1), t];
}, "sanitize");
function qf(r) {
  return r.flatMap((e) => e.split("/")).filter(Boolean).join("/");
}
n(qf, "pathJoin");
var ui = /* @__PURE__ */ n((r, e, t) => {
  let { directory: o, importPathMatcher: a, titlePrefix: i = "" } = e || {};
  typeof r == "number" && k.warn(_`
      CSF Auto-title received a numeric fileName. This typically happens when
      webpack is mis-configured in production mode. To force webpack to produce
      filenames, set optimization.moduleIds = "named" in your webpack config.
    `);
  let s = ci(String(r));
  if (a.exec(s)) {
    if (!t) {
      let c = s.replace(o, ""), l = qf([i, c]).split("/");
      return l = uO(l), l.join("/");
    }
    return i ? qf([i, t]) : t;
  }
}, "userOrAutoTitleFromSpecifier"), Lf = /* @__PURE__ */ n((r, e, t) => {
  for (let o = 0; o < e.length; o += 1) {
    let a = ui(r, e[o], t);
    if (a)
      return a;
  }
  return t || void 0;
}, "userOrAutoTitle");

// src/preview-api/modules/store/storySort.ts
var Mf = /\s*\/\s*/, kf = /* @__PURE__ */ n((r = {}) => (e, t) => {
  if (e.title === t.title && !r.includeNames)
    return 0;
  let o = r.method || "configure", a = r.order || [], i = e.title.trim().split(Mf), s = t.title.trim().split(Mf);
  r.includeNames && (i.push(e.name), s.push(t.name));
  let c = 0;
  for (; i[c] || s[c]; ) {
    if (!i[c])
      return -1;
    if (!s[c])
      return 1;
    let l = i[c], u = s[c];
    if (l !== u) {
      let h = a.indexOf(l), d = a.indexOf(u), g = a.indexOf("*");
      return h !== -1 || d !== -1 ? (h === -1 && (g !== -1 ? h = g : h = a.length), d === -1 && (g !== -1 ? d = g : d = a.length), h - d) : o ===
      "configure" ? 0 : l.localeCompare(u, r.locales ? r.locales : void 0, {
        numeric: !0,
        sensitivity: "accent"
      });
    }
    let p = a.indexOf(l);
    p === -1 && (p = a.indexOf("*")), a = p !== -1 && Array.isArray(a[p + 1]) ? a[p + 1] : [], c += 1;
  }
  return 0;
}, "storySort");

// src/preview-api/modules/store/sortStories.ts
var pO = /* @__PURE__ */ n((r, e, t) => {
  if (e) {
    let o;
    typeof e == "function" ? o = e : o = kf(e), r.sort(o);
  } else
    r.sort(
      (o, a) => t.indexOf(o.importPath) - t.indexOf(a.importPath)
    );
  return r;
}, "sortStoriesCommon"), jf = /* @__PURE__ */ n((r, e, t) => {
  try {
    return pO(r, e, t);
  } catch (o) {
    throw new Error(_`
    Error sorting stories with sort parameter ${e}:

    > ${o.message}
    
    Are you using a V6-style sort function in V7 mode?

    More info: https://github.com/storybookjs/storybook/blob/next/MIGRATION.md#v7-style-story-sort
  `);
  }
}, "sortStoriesV7");

// src/preview-api/modules/preview-web/render/Render.ts
var we = new Error("prepareAborted");

// src/preview-api/modules/preview-web/render/StoryRender.ts
var { AbortController: Gf } = globalThis;
function Bf(r) {
  try {
    let { name: e = "Error", message: t = String(r), stack: o } = r;
    return { name: e, message: t, stack: o };
  } catch {
    return { name: "Error", message: String(r) };
  }
}
n(Bf, "serializeError");
var pi = class pi {
  constructor(e, t, o, a, i, s, c = { autoplay: !0, forceInitialArgs: !1 }, l) {
    this.channel = e;
    this.store = t;
    this.renderToScreen = o;
    this.callbacks = a;
    this.id = i;
    this.viewMode = s;
    this.renderOptions = c;
    this.type = "story";
    this.notYetRendered = !0;
    this.rerenderEnqueued = !1;
    this.disableKeyListeners = !1;
    this.teardownRender = /* @__PURE__ */ n(() => {
    }, "teardownRender");
    this.torndown = !1;
    this.abortController = new Gf(), l && (this.story = l, this.phase = "preparing");
  }
  async runPhase(e, t, o) {
    this.phase = t, this.channel.emit(De, { newPhase: this.phase, storyId: this.id }), o && (await o(), this.checkIfAborted(e));
  }
  checkIfAborted(e) {
    return e.aborted ? (this.phase = "aborted", this.channel.emit(De, { newPhase: this.phase, storyId: this.id }), !0) : !1;
  }
  async prepare() {
    if (await this.runPhase(this.abortController.signal, "preparing", async () => {
      this.story = await this.store.loadStory({ storyId: this.id });
    }), this.abortController.signal.aborted)
      throw await this.store.cleanupStory(this.story), we;
  }
  // The two story "renders" are equal and have both loaded the same story
  isEqual(e) {
    return !!(this.id === e.id && this.story && this.story === e.story);
  }
  isPreparing() {
    return ["preparing"].includes(this.phase);
  }
  isPending() {
    return ["loading", "beforeEach", "rendering", "playing"].includes(this.phase);
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
    let a = this.story;
    if (!o)
      throw new Error("cannot render when canvasElement is unset");
    let {
      id: i,
      componentId: s,
      title: c,
      name: l,
      tags: u,
      applyLoaders: p,
      applyBeforeEach: h,
      unboundStoryFn: d,
      playFunction: g,
      runStep: m
    } = a;
    t && !e && (this.cancelRender(), this.abortController = new Gf());
    let b = this.abortController.signal, S = !1, T = a.usesMount;
    try {
      let v = {
        ...this.storyContext(),
        viewMode: this.viewMode,
        abortSignal: b,
        canvasElement: o,
        loaded: {},
        step: /* @__PURE__ */ n((F, H) => m(F, H, v), "step"),
        context: null,
        canvas: {},
        renderToCanvas: /* @__PURE__ */ n(async () => {
          let F = await this.renderToScreen(E, o);
          this.teardownRender = F || (() => {
          }), S = !0;
        }, "renderToCanvas"),
        // The story provides (set in a renderer) a mount function that is a higher order function
        // (context) => (...args) => Canvas
        //
        // Before assigning it to the context, we resolve the context dependency,
        // so that a user can just call it as await mount(...args) in their play function.
        mount: /* @__PURE__ */ n(async (...F) => {
          this.callbacks.showStoryDuringRender?.();
          let H = null;
          return await this.runPhase(b, "rendering", async () => {
            H = await a.mount(v)(...F);
          }), T && await this.runPhase(b, "playing"), H;
        }, "mount")
      };
      v.context = v;
      let E = {
        componentId: s,
        title: c,
        kind: c,
        id: i,
        name: l,
        story: l,
        tags: u,
        ...this.callbacks,
        showError: /* @__PURE__ */ n((F) => (this.phase = "errored", this.callbacks.showError(F)), "showError"),
        showException: /* @__PURE__ */ n((F) => (this.phase = "errored", this.callbacks.showException(F)), "showException"),
        forceRemount: t || this.notYetRendered,
        storyContext: v,
        storyFn: /* @__PURE__ */ n(() => d(v), "storyFn"),
        unboundStoryFn: d
      };
      if (await this.runPhase(b, "loading", async () => {
        v.loaded = await p(v);
      }), b.aborted)
        return;
      let R = await h(v);
      if (this.store.addCleanupCallbacks(a, R), this.checkIfAborted(b) || (!S && !T && await v.mount(), this.notYetRendered = !1, b.aborted))
        return;
      let w = this.story.parameters?.test?.dangerouslyIgnoreUnhandledErrors === !0, P = /* @__PURE__ */ new Set(), M = /* @__PURE__ */ n((F) => P.
      add("error" in F ? F.error : F.reason), "onError");
      if (this.renderOptions.autoplay && t && g && this.phase !== "errored") {
        window.addEventListener("error", M), window.addEventListener("unhandledrejection", M), this.disableKeyListeners = !0;
        try {
          if (T ? await g(v) : (v.mount = async () => {
            throw new Ne({ playFunction: g.toString() });
          }, await this.runPhase(b, "playing", async () => g(v))), !S)
            throw new it();
          this.checkIfAborted(b), !w && P.size > 0 ? await this.runPhase(b, "errored") : await this.runPhase(b, "played");
        } catch (F) {
          if (this.callbacks.showStoryDuringRender?.(), await this.runPhase(b, "errored", async () => {
            this.channel.emit(an, Bf(F));
          }), this.story.parameters.throwPlayFunctionExceptions !== !1)
            throw F;
          console.error(F);
        }
        if (!w && P.size > 0 && this.channel.emit(
          sn,
          Array.from(P).map(Bf)
        ), this.disableKeyListeners = !1, window.removeEventListener("unhandledrejection", M), window.removeEventListener("error", M), b.aborted)
          return;
      }
      await this.runPhase(
        b,
        "completed",
        async () => this.channel.emit(Ze, i)
      );
    } catch (v) {
      this.phase = "errored", this.callbacks.showException(v);
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
n(pi, "StoryRender");
var Ue = pi;

// src/preview-api/modules/preview-web/Preview.tsx
var { fetch: dO } = A, fO = "./index.json", di = class di {
  constructor(e, t, o = ne.getChannel(), a = !0) {
    this.importFn = e;
    this.getProjectAnnotations = t;
    this.channel = o;
    this.storyRenders = [];
    this.storeInitializationPromise = new Promise((i, s) => {
      this.resolveStoreInitializationPromise = i, this.rejectStoreInitializationPromise = s;
    }), a && this.initialize();
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
            return ae("Accessing the Story Store is deprecated and will be removed in 9.0"), this.storyStoreValue[t];
          throw new nt();
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
    this.channel.on(hn, this.onStoryIndexChanged.bind(this)), this.channel.on(Br, this.onUpdateGlobals.bind(this)), this.channel.on(Ur, this.
    onUpdateArgs.bind(this)), this.channel.on(En, this.onRequestArgTypesInfo.bind(this)), this.channel.on(Gr, this.onResetArgs.bind(this)), this.
    channel.on(jr, this.onForceReRender.bind(this)), this.channel.on(nn, this.onForceRemount.bind(this));
  }
  async getProjectAnnotationsOrRenderError() {
    try {
      let e = await this.getProjectAnnotations();
      if (this.renderToCanvas = e.renderToCanvas, !this.renderToCanvas)
        throw new Qr();
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
    let e = await dO(fO);
    if (e.status === 200)
      return e.json();
    throw new Zr({ text: await e.text() });
  }
  // If initialization gets as far as the story index, this function runs.
  initializeWithStoryIndex(e) {
    if (!this.projectAnnotationsBeforeInitialization)
      throw new Error("Cannot call initializeWithStoryIndex until project annotations resolve");
    this.storyStoreValue = new Be(
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
      throw new K({ methodName: "emitGlobals" });
    let e = {
      globals: this.storyStoreValue.userGlobals.get() || {},
      globalTypes: this.storyStoreValue.projectAnnotations.globalTypes || {}
    };
    this.channel.emit(pn, e);
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
      throw new K({ methodName: "onStoriesChanged" });
    await this.storyStoreValue.onStoriesChanged({ importFn: e, storyIndex: t });
  }
  async onUpdateGlobals({
    globals: e,
    currentStory: t
  }) {
    if (this.storyStoreValue || await this.storeInitializationPromise, !this.storyStoreValue)
      throw new K({ methodName: "onUpdateGlobals" });
    if (this.storyStoreValue.userGlobals.update(e), t) {
      let { initialGlobals: o, storyGlobals: a, userGlobals: i, globals: s } = this.storyStoreValue.getStoryContext(t);
      this.channel.emit(Fe, {
        initialGlobals: o,
        userGlobals: i,
        storyGlobals: a,
        globals: s
      });
    } else {
      let { initialGlobals: o, globals: a } = this.storyStoreValue.userGlobals;
      this.channel.emit(Fe, {
        initialGlobals: o,
        userGlobals: a,
        storyGlobals: {},
        globals: a
      });
    }
    await Promise.all(this.storyRenders.map((o) => o.rerender()));
  }
  async onUpdateArgs({ storyId: e, updatedArgs: t }) {
    if (!this.storyStoreValue)
      throw new K({ methodName: "onUpdateArgs" });
    this.storyStoreValue.args.update(e, t), await Promise.all(
      this.storyRenders.filter((o) => o.id === e && !o.renderOptions.forceInitialArgs).map(
        (o) => (
          // We only run the play function, with in a force remount.
          // But when mount is destructured, the rendering happens inside of the play function.
          o.story && o.story.usesMount ? o.remount() : o.rerender()
        )
      )
    ), this.channel.emit(dn, {
      storyId: e,
      args: this.storyStoreValue.args.get(e)
    });
  }
  async onRequestArgTypesInfo({ id: e, payload: t }) {
    try {
      await this.storeInitializationPromise;
      let o = await this.storyStoreValue?.loadStory(t);
      this.channel.emit(Ut, {
        id: e,
        success: !0,
        payload: { argTypes: o?.argTypes || {} },
        error: null
      });
    } catch (o) {
      this.channel.emit(Ut, {
        id: e,
        success: !1,
        error: o?.message
      });
    }
  }
  async onResetArgs({ storyId: e, argNames: t }) {
    if (!this.storyStoreValue)
      throw new K({ methodName: "onResetArgs" });
    let a = this.storyRenders.find((c) => c.id === e)?.story || await this.storyStoreValue.loadStory({ storyId: e }), s = (t || [
      .../* @__PURE__ */ new Set([
        ...Object.keys(a.initialArgs),
        ...Object.keys(this.storyStoreValue.args.get(e))
      ])
    ]).reduce((c, l) => (c[l] = a.initialArgs[l], c), {});
    await this.onUpdateArgs({ storyId: e, updatedArgs: s });
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
  renderStoryToElement(e, t, o, a) {
    if (!this.renderToCanvas || !this.storyStoreValue)
      throw new K({
        methodName: "renderStoryToElement"
      });
    let i = new Ue(
      this.channel,
      this.storyStoreValue,
      this.renderToCanvas,
      o,
      e.id,
      "docs",
      a,
      e
    );
    return i.renderToElement(t), this.storyRenders.push(i), async () => {
      await this.teardownRender(i);
    };
  }
  async teardownRender(e, { viewModeChanged: t } = {}) {
    this.storyRenders = this.storyRenders.filter((o) => o !== e), await e?.teardown?.({ viewModeChanged: t });
  }
  // API
  async loadStory({ storyId: e }) {
    if (!this.storyStoreValue)
      throw new K({ methodName: "loadStory" });
    return this.storyStoreValue.loadStory({ storyId: e });
  }
  getStoryContext(e, { forceInitialArgs: t = !1 } = {}) {
    if (!this.storyStoreValue)
      throw new K({ methodName: "getStoryContext" });
    return this.storyStoreValue.getStoryContext(e, { forceInitialArgs: t });
  }
  async extract(e) {
    if (!this.storyStoreValue)
      throw new K({ methodName: "extract" });
    if (this.previewEntryError)
      throw this.previewEntryError;
    return await this.storyStoreValue.cacheAllCSFFiles(), this.storyStoreValue.extract(e);
  }
  // UTILITIES
  renderPreviewEntryError(e, t) {
    this.previewEntryError = t, C.error(e), C.error(t), this.channel.emit(tn, t);
  }
};
n(di, "Preview");
var He = di;

// src/preview-api/modules/preview-web/docs-context/DocsContext.ts
var fi = class fi {
  constructor(e, t, o, a) {
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
    a.forEach((i, s) => {
      this.referenceCSFFile(i);
    });
  }
  // This docs entry references this CSF file and can synchronously load the stories, as well
  // as reference them by module export. If the CSF is part of the "component" stories, they
  // can also be referenced by name and are in the componentStories list.
  referenceCSFFile(e) {
    this.exportsToCSFFile.set(e.moduleExports, e), this.exportsToCSFFile.set(e.moduleExports.default, e), this.store.componentStoriesFromCSFFile(
    { csfFile: e }).forEach((o) => {
      let a = e.stories[o.id];
      this.storyIdToCSFFile.set(a.id, e), this.exportToStory.set(a.moduleExport, o);
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
      let a = e;
      o = this.resolveAttachedModuleExportType(a);
    } else
      o = this.resolveModuleExport(e);
    if (t.length && !t.includes(o.type)) {
      let a = o.type === "component" ? "component or unknown" : o.type;
      throw new Error(_`Invalid value passed to the 'of' prop. The value was resolved to a '${a}' type but the only types for this block are: ${t.
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
n(fi, "DocsContext");
var ye = fi;

// src/preview-api/modules/preview-web/render/CsfDocsRender.ts
var yi = class yi {
  constructor(e, t, o, a) {
    this.channel = e;
    this.store = t;
    this.entry = o;
    this.callbacks = a;
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
      throw we;
    let { importPath: o, title: a } = this.entry, i = this.store.processCSFFileWithCache(
      e,
      o,
      a
    ), s = Object.keys(i.stories)[0];
    this.story = this.store.storyFromCSFFile({ storyId: s, csfFile: i }), this.csfFiles = [i, ...t], this.preparing = !1;
  }
  isEqual(e) {
    return !!(this.id === e.id && this.story && this.story === e.story);
  }
  docsContext(e) {
    if (!this.csfFiles)
      throw new Error("Cannot render docs before preparing");
    let t = new ye(
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
    let o = this.docsContext(t), { docs: a } = this.story.parameters || {};
    if (!a)
      throw new Error(
        "Cannot render a story in viewMode=docs if `@storybook/addon-docs` is not installed"
      );
    let i = await a.renderer(), { render: s } = i, c = /* @__PURE__ */ n(async () => {
      try {
        await s(o, a, e), this.channel.emit(kr, this.id);
      } catch (l) {
        this.callbacks.showException(l);
      }
    }, "renderDocs");
    return this.rerender = async () => c(), this.teardownRender = async ({ viewModeChanged: l }) => {
      !l || !e || i.unmount(e);
    }, c();
  }
  async teardown({ viewModeChanged: e } = {}) {
    this.teardownRender?.({ viewModeChanged: e }), this.torndown = !0;
  }
};
n(yi, "CsfDocsRender");
var At = yi;

// src/preview-api/modules/preview-web/render/MdxDocsRender.ts
var hi = class hi {
  constructor(e, t, o, a) {
    this.channel = e;
    this.store = t;
    this.entry = o;
    this.callbacks = a;
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
      throw we;
    this.csfFiles = t, this.exports = e, this.preparing = !1;
  }
  isEqual(e) {
    return !!(this.id === e.id && this.exports && this.exports === e.exports);
  }
  docsContext(e) {
    if (!this.csfFiles)
      throw new Error("Cannot render docs before preparing");
    return new ye(
      this.channel,
      this.store,
      e,
      this.csfFiles
    );
  }
  async renderToElement(e, t) {
    if (!this.exports || !this.csfFiles || !this.store.projectAnnotations)
      throw new Error("Cannot render docs before preparing");
    let o = this.docsContext(t), { docs: a } = this.store.projectAnnotations.parameters || {};
    if (!a)
      throw new Error(
        "Cannot render a story in viewMode=docs if `@storybook/addon-docs` is not installed"
      );
    let i = { ...a, page: this.exports.default }, s = await a.renderer(), { render: c } = s, l = /* @__PURE__ */ n(async () => {
      try {
        await c(o, i, e), this.channel.emit(kr, this.id);
      } catch (u) {
        this.callbacks.showException(u);
      }
    }, "renderDocs");
    return this.rerender = async () => l(), this.teardownRender = async ({ viewModeChanged: u } = {}) => {
      !u || !e || (s.unmount(e), this.torndown = !0);
    }, l();
  }
  async teardown({ viewModeChanged: e } = {}) {
    this.teardownRender?.({ viewModeChanged: e }), this.torndown = !0;
  }
};
n(hi, "MdxDocsRender");
var Rt = hi;

// src/preview-api/modules/preview-web/PreviewWithSelection.tsx
var yO = globalThis;
function hO(r) {
  let e = r.composedPath && r.composedPath()[0] || r.target;
  return /input|textarea/i.test(e.tagName) || e.getAttribute("contenteditable") !== null;
}
n(hO, "focusInInput");
var Uf = "attached-mdx", mO = "unattached-mdx";
function gO({ tags: r }) {
  return r?.includes(mO) || r?.includes(Uf);
}
n(gO, "isMdxEntry");
function mi(r) {
  return r.type === "story";
}
n(mi, "isStoryRender");
function SO(r) {
  return r.type === "docs";
}
n(SO, "isDocsRender");
function bO(r) {
  return SO(r) && r.subtype === "csf";
}
n(bO, "isCsfDocsRender");
var gi = class gi extends He {
  constructor(t, o, a, i) {
    super(t, o, void 0, !1);
    this.importFn = t;
    this.getProjectAnnotations = o;
    this.selectionStore = a;
    this.view = i;
    this.initialize();
  }
  setupListeners() {
    super.setupListeners(), yO.onkeydown = this.onKeydown.bind(this), this.channel.on(un, this.onSetCurrentStory.bind(this)), this.channel.on(
    vn, this.onUpdateQueryParams.bind(this)), this.channel.on(ln, this.onPreloadStories.bind(this));
  }
  async setInitialGlobals() {
    if (!this.storyStoreValue)
      throw new K({ methodName: "setInitialGlobals" });
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
      throw new K({
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
    let { storySpecifier: t, args: o } = this.selectionStore.selectionSpecifier, a = this.storyStoreValue.storyIndex.entryFromSpecifier(t);
    if (!a) {
      t === "*" ? this.renderStoryLoadingException(t, new rt()) : this.renderStoryLoadingException(
        t,
        new tt({ storySpecifier: t.toString() })
      );
      return;
    }
    let { id: i, type: s } = a;
    this.selectionStore.setSelection({ storyId: i, viewMode: s }), this.channel.emit(gn, this.selectionStore.selection), this.channel.emit(Gt,
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
    if (!this.storyRenders.find((o) => o.disableKeyListeners) && !hO(t)) {
      let { altKey: o, ctrlKey: a, metaKey: i, shiftKey: s, key: c, code: l, keyCode: u } = t;
      this.channel.emit(cn, {
        event: { altKey: o, ctrlKey: a, metaKey: i, shiftKey: s, key: c, code: l, keyCode: u }
      });
    }
  }
  async onSetCurrentStory(t) {
    this.selectionStore.setSelection({ viewMode: "story", ...t }), await this.storeInitializationPromise, this.channel.emit(Gt, this.selectionStore.
    selection), this.renderSelection();
  }
  onUpdateQueryParams(t) {
    this.selectionStore.setQueryParams(t);
  }
  async onUpdateGlobals({ globals: t }) {
    let o = this.currentRender instanceof Ue && this.currentRender.story || void 0;
    super.onUpdateGlobals({ globals: t, currentStory: o }), (this.currentRender instanceof Rt || this.currentRender instanceof At) && await this.
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
      throw new K({ methodName: "renderSelection" });
    let { selection: a } = this.selectionStore;
    if (!a)
      throw new Error("Cannot call renderSelection as no selection was made");
    let { storyId: i } = a, s;
    try {
      s = await this.storyStoreValue.storyIdToEntry(i);
    } catch (g) {
      this.currentRender && await this.teardownRender(this.currentRender), this.renderStoryLoadingException(i, g);
      return;
    }
    let c = this.currentSelection?.storyId !== i, l = this.currentRender?.type !== s.type;
    s.type === "story" ? this.view.showPreparingStory({ immediate: l }) : this.view.showPreparingDocs({ immediate: l }), this.currentRender?.
    isPreparing() && await this.teardownRender(this.currentRender);
    let u;
    s.type === "story" ? u = new Ue(
      this.channel,
      this.storyStoreValue,
      o,
      this.mainStoryCallbacks(i),
      i,
      "story"
    ) : gO(s) ? u = new Rt(
      this.channel,
      this.storyStoreValue,
      s,
      this.mainStoryCallbacks(i)
    ) : u = new At(
      this.channel,
      this.storyStoreValue,
      s,
      this.mainStoryCallbacks(i)
    );
    let p = this.currentSelection;
    this.currentSelection = a;
    let h = this.currentRender;
    this.currentRender = u;
    try {
      await u.prepare();
    } catch (g) {
      h && await this.teardownRender(h), g !== we && this.renderStoryLoadingException(i, g);
      return;
    }
    let d = !c && h && !u.isEqual(h);
    if (t && mi(u) && (fe(!!u.story), this.storyStoreValue.args.updateFromPersisted(u.story, t)), h && !h.torndown && !c && !d && !l) {
      this.currentRender = h, this.channel.emit(bn, i), this.view.showMain();
      return;
    }
    if (h && await this.teardownRender(h, { viewModeChanged: l }), p && (c || l) && this.channel.emit(fn, i), mi(u)) {
      fe(!!u.story);
      let {
        parameters: g,
        initialArgs: m,
        argTypes: b,
        unmappedArgs: S,
        initialGlobals: T,
        userGlobals: v,
        storyGlobals: E,
        globals: R
      } = this.storyStoreValue.getStoryContext(u.story);
      this.channel.emit(mn, {
        id: i,
        parameters: g,
        initialArgs: m,
        argTypes: b,
        args: S
      }), this.channel.emit(Fe, { userGlobals: v, storyGlobals: E, globals: R, initialGlobals: T });
    } else {
      let { parameters: g } = this.storyStoreValue.projectAnnotations, { initialGlobals: m, globals: b } = this.storyStoreValue.userGlobals;
      if (this.channel.emit(Fe, {
        globals: b,
        initialGlobals: m,
        storyGlobals: {},
        userGlobals: b
      }), bO(u) || u.entry.tags?.includes(Uf)) {
        if (!u.csfFiles)
          throw new et({ storyId: i });
        ({ parameters: g } = this.storyStoreValue.preparedMetaFromCSFFile({
          csfFile: u.csfFiles[0]
        }));
      }
      this.channel.emit(on, {
        id: i,
        parameters: g
      });
    }
    mi(u) ? (fe(!!u.story), this.storyRenders.push(u), this.currentRender.renderToElement(
      this.view.prepareForStory(u.story)
    )) : this.currentRender.renderToElement(
      this.view.prepareForDocs(),
      // This argument is used for docs, which is currently only compatible with HTMLElements
      this.renderStoryToElement.bind(this)
    );
  }
  async teardownRender(t, { viewModeChanged: o = !1 } = {}) {
    this.storyRenders = this.storyRenders.filter((a) => a !== t), await t?.teardown?.({ viewModeChanged: o });
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
    this.view.showNoPreview(), this.channel.emit(Bt);
  }
  renderStoryLoadingException(t, o) {
    C.error(o), this.view.showErrorDisplay(o), this.channel.emit(Bt, t);
  }
  // renderException is used if we fail to render the story and it is uncaught by the app layer
  renderException(t, o) {
    let { name: a = "Error", message: i = String(o), stack: s } = o;
    this.channel.emit(Sn, { name: a, message: i, stack: s }), this.channel.emit(De, { newPhase: "errored", storyId: t }), this.view.showErrorDisplay(
    o), C.error(`Error rendering story '${t}':`), C.error(o);
  }
  // renderError is used by the various app layers to inform the user they have done something
  // wrong -- for instance returned the wrong thing from a story
  renderError(t, { title: o, description: a }) {
    C.error(`Error rendering story ${o}: ${a}`), this.channel.emit(yn, { title: o, description: a }), this.channel.emit(De, { newPhase: "err\
ored", storyId: t }), this.view.showErrorDisplay({
      message: o,
      stack: a
    });
  }
};
n(gi, "PreviewWithSelection");
var Ve = gi;

// src/preview-api/modules/preview-web/UrlStore.ts
var Vo = Y(Ho(), 1);

// src/preview-api/modules/preview-web/parseArgsParam.ts
var _h = Y(yo(), 1), Ph = Y(Ho(), 1);
var xh = /^[a-zA-Z0-9 _-]*$/, Oh = /^-?[0-9]+(\.[0-9]+)?$/, SI = /^#([a-f0-9]{3,4}|[a-f0-9]{6}|[a-f0-9]{8})$/i, Ch = /^(rgba?|hsla?)\(([0-9]{1,3}),\s?([0-9]{1,3})%?,\s?([0-9]{1,3})%?,?\s?([0-9](\.[0-9]{1,2})?)?\)$/i,
Vi = /* @__PURE__ */ n((r = "", e) => r === null || r === "" || !xh.test(r) ? !1 : e == null || e instanceof Date || typeof e == "number" ||
typeof e == "boolean" ? !0 : typeof e == "string" ? xh.test(e) || Oh.test(e) || SI.test(e) || Ch.test(e) : Array.isArray(e) ? e.every((t) => Vi(
r, t)) : (0, _h.default)(e) ? Object.entries(e).every(([t, o]) => Vi(t, o)) : !1, "validateArgs"), bI = {
  delimiter: ";",
  // we're parsing a single query param
  allowDots: !0,
  // objects are encoded using dot notation
  allowSparse: !0,
  // arrays will be merged on top of their initial value
  decoder(r, e, t, o) {
    if (o === "value" && r.startsWith("!")) {
      if (r === "!undefined")
        return;
      if (r === "!null")
        return null;
      if (r === "!true")
        return !0;
      if (r === "!false")
        return !1;
      if (r.startsWith("!date(") && r.endsWith(")"))
        return new Date(r.slice(6, -1));
      if (r.startsWith("!hex(") && r.endsWith(")"))
        return `#${r.slice(5, -1)}`;
      let a = r.slice(1).match(Ch);
      if (a)
        return r.startsWith("!rgba") ? `${a[1]}(${a[2]}, ${a[3]}, ${a[4]}, ${a[5]})` : r.startsWith("!hsla") ? `${a[1]}(${a[2]}, ${a[3]}%, ${a[4]}\
%, ${a[5]})` : r.startsWith("!rgb") ? `${a[1]}(${a[2]}, ${a[3]}, ${a[4]})` : `${a[1]}(${a[2]}, ${a[3]}%, ${a[4]}%)`;
    }
    return o === "value" && Oh.test(r) ? Number(r) : e(r, e, t);
  }
}, $i = /* @__PURE__ */ n((r) => {
  let e = r.split(";").map((t) => t.replace("=", "~").replace(":", "="));
  return Object.entries(Ph.default.parse(e.join(";"), bI)).reduce((t, [o, a]) => Vi(o, a) ? Object.assign(t, { [o]: a }) : (k.warn(_`
      Omitted potentially unsafe URL args.

      More info: https://storybook.js.org/docs/react/writing-stories/args#setting-args-through-the-url
    `), t), {});
}, "parseArgsParam");

// src/preview-api/modules/preview-web/UrlStore.ts
var { history: Ih, document: he } = A;
function vI(r) {
  let e = (r || "").match(/^\/story\/(.+)/);
  if (!e)
    throw new Error(`Invalid path '${r}',  must start with '/story/'`);
  return e[1];
}
n(vI, "pathToId");
var Fh = /* @__PURE__ */ n(({
  selection: r,
  extraParams: e
}) => {
  let t = typeof he < "u" ? he.location.search : "", { path: o, selectedKind: a, selectedStory: i, ...s } = Vo.default.parse(t, {
    ignoreQueryPrefix: !0
  });
  return Vo.default.stringify(
    {
      ...s,
      ...e,
      ...r && { id: r.storyId, viewMode: r.viewMode }
    },
    { encode: !1, addQueryPrefix: !0 }
  );
}, "getQueryString"), TI = /* @__PURE__ */ n((r) => {
  if (!r)
    return;
  let e = Fh({ selection: r }), { hash: t = "" } = he.location;
  he.title = r.storyId, Ih.replaceState({}, "", `${he.location.pathname}${e}${t}`);
}, "setPath"), EI = /* @__PURE__ */ n((r) => r != null && typeof r == "object" && Array.isArray(r) === !1, "isObject"), Ct = /* @__PURE__ */ n(
(r) => {
  if (r !== void 0) {
    if (typeof r == "string")
      return r;
    if (Array.isArray(r))
      return Ct(r[0]);
    if (EI(r))
      return Ct(Object.values(r).filter(Boolean));
  }
}, "getFirstString"), AI = /* @__PURE__ */ n(() => {
  if (typeof he < "u") {
    let r = Vo.default.parse(he.location.search, { ignoreQueryPrefix: !0 }), e = typeof r.args == "string" ? $i(r.args) : void 0, t = typeof r.
    globals == "string" ? $i(r.globals) : void 0, o = Ct(r.viewMode);
    (typeof o != "string" || !o.match(/docs|story/)) && (o = "story");
    let a = Ct(r.path), i = a ? vI(a) : Ct(r.id);
    if (i)
      return { storySpecifier: i, args: e, globals: t, viewMode: o };
  }
  return null;
}, "getSelectionSpecifierFromPath"), Wi = class Wi {
  constructor() {
    this.selectionSpecifier = AI();
  }
  setSelection(e) {
    this.selection = e, TI(this.selection);
  }
  setQueryParams(e) {
    let t = Fh({ extraParams: e }), { hash: o = "" } = he.location;
    Ih.replaceState({}, "", `${he.location.pathname}${t}${o}`);
  }
};
n(Wi, "UrlStore");
var Ke = Wi;

// src/preview-api/modules/preview-web/WebView.ts
var um = Y(sm(), 1), pm = Y(Ho(), 1);
var { document: J } = A, lm = 100, dm = /* @__PURE__ */ ((i) => (i.MAIN = "MAIN", i.NOPREVIEW = "NOPREVIEW", i.PREPARING_STORY = "PREPARING_\
STORY", i.PREPARING_DOCS = "PREPARING_DOCS", i.ERROR = "ERROR", i))(dm || {}), Zi = {
  PREPARING_STORY: "sb-show-preparing-story",
  PREPARING_DOCS: "sb-show-preparing-docs",
  MAIN: "sb-show-main",
  NOPREVIEW: "sb-show-nopreview",
  ERROR: "sb-show-errordisplay"
}, es = {
  centered: "sb-main-centered",
  fullscreen: "sb-main-fullscreen",
  padded: "sb-main-padded"
}, cm = new um.default({
  escapeXML: !0
}), rs = class rs {
  constructor() {
    this.testing = !1;
    if (typeof J < "u") {
      let { __SPECIAL_TEST_PARAMETER__: e } = pm.default.parse(J.location.search, {
        ignoreQueryPrefix: !0
      });
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
    return this.showStory(), this.applyLayout(e.parameters.layout), J.documentElement.scrollTop = 0, J.documentElement.scrollLeft = 0, this.
    storyRoot();
  }
  storyRoot() {
    return J.getElementById("storybook-root");
  }
  prepareForDocs() {
    return this.showMain(), this.showDocs(), this.applyLayout("fullscreen"), J.documentElement.scrollTop = 0, J.documentElement.scrollLeft =
    0, this.docsRoot();
  }
  docsRoot() {
    return J.getElementById("storybook-docs");
  }
  applyLayout(e = "padded") {
    if (e === "none") {
      J.body.classList.remove(this.currentLayoutClass), this.currentLayoutClass = null;
      return;
    }
    this.checkIfLayoutExists(e);
    let t = es[e];
    J.body.classList.remove(this.currentLayoutClass), J.body.classList.add(t), this.currentLayoutClass = t;
  }
  checkIfLayoutExists(e) {
    es[e] || C.warn(
      _`
          The desired layout: ${e} is not a valid option.
          The possible options are: ${Object.keys(es).join(", ")}, none.
        `
    );
  }
  showMode(e) {
    clearTimeout(this.preparingTimeout), Object.keys(dm).forEach((t) => {
      t === e ? J.body.classList.add(Zi[t]) : J.body.classList.remove(Zi[t]);
    });
  }
  showErrorDisplay({ message: e = "", stack: t = "" }) {
    let o = e, a = t, i = e.split(`
`);
    i.length > 1 && ([o] = i, a = i.slice(1).join(`
`).replace(/^\n/, "")), J.getElementById("error-message").innerHTML = cm.toHtml(o), J.getElementById("error-stack").innerHTML = cm.toHtml(a),
    this.showMode("ERROR");
  }
  showNoPreview() {
    this.testing || (this.showMode("NOPREVIEW"), this.storyRoot()?.setAttribute("hidden", "true"), this.docsRoot()?.setAttribute("hidden", "\
true"));
  }
  showPreparingStory({ immediate: e = !1 } = {}) {
    clearTimeout(this.preparingTimeout), e ? this.showMode("PREPARING_STORY") : this.preparingTimeout = setTimeout(
      () => this.showMode("PREPARING_STORY"),
      lm
    );
  }
  showPreparingDocs({ immediate: e = !1 } = {}) {
    clearTimeout(this.preparingTimeout), e ? this.showMode("PREPARING_DOCS") : this.preparingTimeout = setTimeout(() => this.showMode("PREPA\
RING_DOCS"), lm);
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
    J.body.classList.add(Zi.MAIN);
  }
};
n(rs, "WebView");
var Je = rs;

// src/preview-api/modules/preview-web/PreviewWeb.tsx
var ts = class ts extends Ve {
  constructor(t, o) {
    super(t, o, new Ke(), new Je());
    this.importFn = t;
    this.getProjectAnnotations = o;
    A.__STORYBOOK_PREVIEW__ = this;
  }
};
n(ts, "PreviewWeb");
var Ft = ts;

// src/preview-api/modules/preview-web/simulate-pageload.ts
var { document: Qe } = A, nF = [
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
], aF = "script", fm = "scripts-root";
function Dt() {
  let r = Qe.createEvent("Event");
  r.initEvent("DOMContentLoaded", !0, !0), Qe.dispatchEvent(r);
}
n(Dt, "simulateDOMContentLoaded");
function iF(r, e, t) {
  let o = Qe.createElement("script");
  o.type = r.type === "module" ? "module" : "text/javascript", r.src ? (o.onload = e, o.onerror = e, o.src = r.src) : o.textContent = r.innerText,
  t ? t.appendChild(o) : Qe.head.appendChild(o), r.parentNode.removeChild(r), r.src || e();
}
n(iF, "insertScript");
function ym(r, e, t = 0) {
  r[t](() => {
    t++, t === r.length ? e() : ym(r, e, t);
  });
}
n(ym, "insertScriptsSequentially");
function os(r) {
  let e = Qe.getElementById(fm);
  e ? e.innerHTML = "" : (e = Qe.createElement("div"), e.id = fm, Qe.body.appendChild(e));
  let t = Array.from(r.querySelectorAll(aF));
  if (t.length) {
    let o = [];
    t.forEach((a) => {
      let i = a.getAttribute("type");
      (!i || nF.includes(i)) && o.push((s) => iF(a, s, e));
    }), o.length && ym(o, Dt, void 0);
  } else
    Dt();
}
n(os, "simulatePageLoad");

// src/preview/globals/runtime.ts
var hm = {
  "@storybook/global": Zo,
  "storybook/internal/channels": zr,
  "@storybook/channels": zr,
  "@storybook/core/channels": zr,
  "storybook/internal/client-logger": Hr,
  "@storybook/client-logger": Hr,
  "@storybook/core/client-logger": Hr,
  "storybook/internal/core-events": be,
  "@storybook/core-events": be,
  "@storybook/core/core-events": be,
  "storybook/internal/preview-errors": st,
  "@storybook/core-events/preview-errors": st,
  "@storybook/core/preview-errors": st,
  "storybook/internal/preview-api": Nt,
  "@storybook/preview-api": Nt,
  "@storybook/core/preview-api": Nt,
  "storybook/internal/types": Yr,
  "@storybook/types": Yr,
  "@storybook/core/types": Yr
};

// src/preview/utils.ts
var gm = Y(mm(), 1);
var is;
function sF() {
  return is || (is = new gm.default(A.navigator?.userAgent).getBrowserInfo()), is;
}
n(sF, "getBrowserInfo");
function Sm(r) {
  return r.browserInfo = sF(), r;
}
n(Sm, "prepareForTelemetry");

// src/preview/runtime.ts
ss.forEach((r) => {
  A[An[r]] = hm[r];
});
A.sendTelemetryError = (r) => {
  A.__STORYBOOK_ADDONS_CHANNEL__.emit(Tn, Sm(r));
};
A.addEventListener("error", (r) => {
  let e = r.error || r;
  e.fromStorybook && A.sendTelemetryError(e);
});
A.addEventListener("unhandledrejection", ({ reason: r }) => {
  r.fromStorybook && A.sendTelemetryError(r);
});
