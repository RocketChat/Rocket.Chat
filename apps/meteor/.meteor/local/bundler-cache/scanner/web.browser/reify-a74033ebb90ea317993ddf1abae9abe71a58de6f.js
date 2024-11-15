let restArguments;module.link('./restArguments.js',{default(v){restArguments=v}},0);let isFunction;module.link('./isFunction.js',{default(v){isFunction=v}},1);let negate;module.link('./negate.js',{default(v){negate=v}},2);let map;module.link('./map.js',{default(v){map=v}},3);let flatten;module.link('./_flatten.js',{default(v){flatten=v}},4);let contains;module.link('./contains.js',{default(v){contains=v}},5);let pick;module.link('./pick.js',{default(v){pick=v}},6);







// Return a copy of the object without the disallowed properties.
module.exportDefault(restArguments(function(obj, keys) {
  var iteratee = keys[0], context;
  if (isFunction(iteratee)) {
    iteratee = negate(iteratee);
    if (keys.length > 1) context = keys[1];
  } else {
    keys = map(flatten(keys, false, false), String);
    iteratee = function(value, key) {
      return !contains(keys, key);
    };
  }
  return pick(obj, iteratee, context);
}));
