let restArguments;module.link('./restArguments.js',{default(v){restArguments=v}},0);let isFunction;module.link('./isFunction.js',{default(v){isFunction=v}},1);let optimizeCb;module.link('./_optimizeCb.js',{default(v){optimizeCb=v}},2);let allKeys;module.link('./allKeys.js',{default(v){allKeys=v}},3);let keyInObj;module.link('./_keyInObj.js',{default(v){keyInObj=v}},4);let flatten;module.link('./_flatten.js',{default(v){flatten=v}},5);






// Return a copy of the object only containing the allowed properties.
module.exportDefault(restArguments(function(obj, keys) {
  var result = {}, iteratee = keys[0];
  if (obj == null) return result;
  if (isFunction(iteratee)) {
    if (keys.length > 1) iteratee = optimizeCb(iteratee, keys[1]);
    keys = allKeys(obj);
  } else {
    iteratee = keyInObj;
    keys = flatten(keys, false, false);
    obj = Object(obj);
  }
  for (var i = 0, length = keys.length; i < length; i++) {
    var key = keys[i];
    var value = obj[key];
    if (iteratee(value, key, obj)) result[key] = value;
  }
  return result;
}));
