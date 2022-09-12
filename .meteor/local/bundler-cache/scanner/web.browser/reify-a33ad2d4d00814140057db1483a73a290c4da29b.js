module.export({default:()=>iteratee});let _;module.link('./underscore.js',{default(v){_=v}},0);let baseIteratee;module.link('./_baseIteratee.js',{default(v){baseIteratee=v}},1);


// External wrapper for our callback generator. Users may customize
// `_.iteratee` if they want additional predicate/iteratee shorthand styles.
// This abstraction hides the internal-only `argCount` argument.
function iteratee(value, context) {
  return baseIteratee(value, context, Infinity);
}
_.iteratee = iteratee;
