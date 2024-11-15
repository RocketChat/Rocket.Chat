module.export({default:()=>isBoolean});let toString;module.link('./_setup.js',{toString(v){toString=v}},0);

// Is a given value a boolean?
function isBoolean(obj) {
  return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
}
