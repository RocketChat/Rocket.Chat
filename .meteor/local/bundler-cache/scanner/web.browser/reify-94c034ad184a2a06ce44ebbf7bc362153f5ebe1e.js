module.export({default:()=>findWhere});let find;module.link('./find.js',{default(v){find=v}},0);let matcher;module.link('./matcher.js',{default(v){matcher=v}},1);


// Convenience version of a common use case of `_.find`: getting the first
// object containing specific `key:value` pairs.
function findWhere(obj, attrs) {
  return find(obj, matcher(attrs));
}
