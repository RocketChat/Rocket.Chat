module.export({default:()=>_isNativeReflectConstruct});function _isNativeReflectConstruct() {
  try {
    var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
  } catch (t) {}
  return (module.runSetters(_isNativeReflectConstruct = function _isNativeReflectConstruct() {
    return !!t;
  },["default"]))();
}
