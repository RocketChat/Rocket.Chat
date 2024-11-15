module.export({default:()=>_defineProperty});let toPropertyKey;module.link("./toPropertyKey.js",{default(v){toPropertyKey=v}},0);
function _defineProperty(e, r, t) {
  return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}
