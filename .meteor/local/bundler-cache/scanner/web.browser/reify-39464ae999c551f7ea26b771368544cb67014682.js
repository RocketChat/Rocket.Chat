module.export({default:()=>has});let hasOwnProperty;module.link('./_setup.js',{hasOwnProperty(v){hasOwnProperty=v}},0);

// Internal function to check whether `key` is an own property name of `obj`.
function has(obj, key) {
  return obj != null && hasOwnProperty.call(obj, key);
}
