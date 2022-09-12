module.export({default:()=>baseIteratee});let identity;module.link('./identity.js',{default(v){identity=v}},0);let isFunction;module.link('./isFunction.js',{default(v){isFunction=v}},1);let isObject;module.link('./isObject.js',{default(v){isObject=v}},2);let isArray;module.link('./isArray.js',{default(v){isArray=v}},3);let matcher;module.link('./matcher.js',{default(v){matcher=v}},4);let property;module.link('./property.js',{default(v){property=v}},5);let optimizeCb;module.link('./_optimizeCb.js',{default(v){optimizeCb=v}},6);







// An internal function to generate callbacks that can be applied to each
// element in a collection, returning the desired result — either `_.identity`,
// an arbitrary callback, a property matcher, or a property accessor.
function baseIteratee(value, context, argCount) {
  if (value == null) return identity;
  if (isFunction(value)) return optimizeCb(value, context, argCount);
  if (isObject(value) && !isArray(value)) return matcher(value);
  return property(value);
}
