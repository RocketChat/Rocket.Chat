module.export({default:()=>isUndefined});// Is a given variable undefined?
function isUndefined(obj) {
  return obj === void 0;
}
