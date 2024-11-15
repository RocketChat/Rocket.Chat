module.export({default:()=>matcher});let extendOwn;module.link('./extendOwn.js',{default(v){extendOwn=v}},0);let isMatch;module.link('./isMatch.js',{default(v){isMatch=v}},1);


// Returns a predicate for checking whether an object has a given set of
// `key:value` pairs.
function matcher(attrs) {
  attrs = extendOwn({}, attrs);
  return function(obj) {
    return isMatch(obj, attrs);
  };
}
