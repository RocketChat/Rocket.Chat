module.export({default:()=>executeBound});let baseCreate;module.link('./_baseCreate.js',{default(v){baseCreate=v}},0);let isObject;module.link('./isObject.js',{default(v){isObject=v}},1);


// Internal function to execute `sourceFunc` bound to `context` with optional
// `args`. Determines whether to execute a function as a constructor or as a
// normal function.
function executeBound(sourceFunc, boundFunc, context, callingContext, args) {
  if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
  var self = baseCreate(sourceFunc.prototype);
  var result = sourceFunc.apply(self, args);
  if (isObject(result)) return result;
  return self;
}
