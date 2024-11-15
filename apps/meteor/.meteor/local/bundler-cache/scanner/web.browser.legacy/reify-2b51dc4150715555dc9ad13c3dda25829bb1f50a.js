module.export({default:function(){return _typeof}});function _typeof(o) {
  "@babel/helpers - typeof";

  return module.runSetters(_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  },["default"]), _typeof(o);
}
