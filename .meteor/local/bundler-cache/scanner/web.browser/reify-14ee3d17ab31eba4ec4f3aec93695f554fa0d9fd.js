module.export({default:()=>_possibleConstructorReturn});let _typeof;module.link("./typeof.js",{default(v){_typeof=v}},0);let assertThisInitialized;module.link("./assertThisInitialized.js",{default(v){assertThisInitialized=v}},1);

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  } else if (call !== void 0) {
    throw new TypeError("Derived constructors may only return object or undefined");
  }

  return assertThisInitialized(self);
}