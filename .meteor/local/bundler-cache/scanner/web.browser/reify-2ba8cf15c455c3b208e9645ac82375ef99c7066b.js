module.export({default:()=>wrap});let partial;module.link('./partial.js',{default(v){partial=v}},0);

// Returns the first function passed as an argument to the second,
// allowing you to adjust arguments, run code before and after, and
// conditionally execute the original function.
function wrap(func, wrapper) {
  return partial(wrapper, func);
}
