module.export({default:()=>where});let filter;module.link('./filter.js',{default(v){filter=v}},0);let matcher;module.link('./matcher.js',{default(v){matcher=v}},1);


// Convenience version of a common use case of `_.filter`: selecting only
// objects containing specific `key:value` pairs.
function where(obj, attrs) {
  return filter(obj, matcher(attrs));
}
