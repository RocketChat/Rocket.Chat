module.export({default:()=>reject});let filter;module.link('./filter.js',{default(v){filter=v}},0);let negate;module.link('./negate.js',{default(v){negate=v}},1);let cb;module.link('./_cb.js',{default(v){cb=v}},2);



// Return all the elements for which a truth test fails.
function reject(obj, predicate, context) {
  return filter(obj, negate(cb(predicate)), context);
}
