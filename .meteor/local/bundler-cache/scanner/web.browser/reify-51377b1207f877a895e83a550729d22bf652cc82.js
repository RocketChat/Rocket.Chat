let restArguments;module.link('./restArguments.js',{default(v){restArguments=v}},0);

// Delays a function for the given number of milliseconds, and then calls
// it with the arguments supplied.
module.exportDefault(restArguments(function(func, wait, args) {
  return setTimeout(function() {
    return func.apply(null, args);
  }, wait);
}));
