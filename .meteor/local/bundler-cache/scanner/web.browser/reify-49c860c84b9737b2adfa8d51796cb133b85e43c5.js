let restArguments;module.link('./restArguments.js',{default(v){restArguments=v}},0);let uniq;module.link('./uniq.js',{default(v){uniq=v}},1);let flatten;module.link('./_flatten.js',{default(v){flatten=v}},2);



// Produce an array that contains the union: each distinct element from all of
// the passed-in arrays.
module.exportDefault(restArguments(function(arrays) {
  return uniq(flatten(arrays, true, true));
}));
