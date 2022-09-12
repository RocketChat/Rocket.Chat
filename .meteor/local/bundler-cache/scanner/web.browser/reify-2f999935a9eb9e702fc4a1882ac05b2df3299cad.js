module.export({default:()=>functions});let isFunction;module.link('./isFunction.js',{default(v){isFunction=v}},0);

// Return a sorted list of the function names available on the object.
function functions(obj) {
  var names = [];
  for (var key in obj) {
    if (isFunction(obj[key])) names.push(key);
  }
  return names.sort();
}
