let restArguments;module.link('./restArguments.js',{default(v){restArguments=v}},0);let flatten;module.link('./_flatten.js',{default(v){flatten=v}},1);let bind;module.link('./bind.js',{default(v){bind=v}},2);



// Bind a number of an object's methods to that object. Remaining arguments
// are the method names to be bound. Useful for ensuring that all callbacks
// defined on an object belong to it.
module.exportDefault(restArguments(function(obj, keys) {
  keys = flatten(keys, false, false);
  var index = keys.length;
  if (index < 1) throw new Error('bindAll must be passed function names');
  while (index--) {
    var key = keys[index];
    obj[key] = bind(obj[key], obj);
  }
  return obj;
}));
