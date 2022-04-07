let restArguments;module.link('./restArguments.js',{default(v){restArguments=v}},0);let isFunction;module.link('./isFunction.js',{default(v){isFunction=v}},1);let executeBound;module.link('./_executeBound.js',{default(v){executeBound=v}},2);



// Create a function bound to a given object (assigning `this`, and arguments,
// optionally).
module.exportDefault(restArguments(function(func, context, args) {
  if (!isFunction(func)) throw new TypeError('Bind must be called on a function');
  var bound = restArguments(function(callArgs) {
    return executeBound(func, bound, context, this, args.concat(callArgs));
  });
  return bound;
}));
