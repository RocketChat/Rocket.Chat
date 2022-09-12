module.export({default:()=>cb});let _;module.link('./underscore.js',{default(v){_=v}},0);let baseIteratee;module.link('./_baseIteratee.js',{default(v){baseIteratee=v}},1);let iteratee;module.link('./iteratee.js',{default(v){iteratee=v}},2);



// The function we call internally to generate a callback. It invokes
// `_.iteratee` if overridden, otherwise `baseIteratee`.
function cb(value, context, argCount) {
  if (_.iteratee !== iteratee) return _.iteratee(value, context);
  return baseIteratee(value, context, argCount);
}
