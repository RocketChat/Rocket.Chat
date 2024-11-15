module.export({default:()=>_createSuper});let getPrototypeOf;module.link("./getPrototypeOf.js",{default(v){getPrototypeOf=v}},0);let isNativeReflectConstruct;module.link("./isNativeReflectConstruct.js",{default(v){isNativeReflectConstruct=v}},1);let possibleConstructorReturn;module.link("./possibleConstructorReturn.js",{default(v){possibleConstructorReturn=v}},2);


function _createSuper(t) {
  var r = isNativeReflectConstruct();
  return function () {
    var e,
      o = getPrototypeOf(t);
    if (r) {
      var s = getPrototypeOf(this).constructor;
      e = Reflect.construct(o, arguments, s);
    } else e = o.apply(this, arguments);
    return possibleConstructorReturn(this, e);
  };
}
