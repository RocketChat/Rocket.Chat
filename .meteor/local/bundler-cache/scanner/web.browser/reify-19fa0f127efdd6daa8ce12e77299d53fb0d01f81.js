let restArguments;module.link('./restArguments.js',{default(v){restArguments=v}},0);let flatten;module.link('./_flatten.js',{default(v){flatten=v}},1);let filter;module.link('./filter.js',{default(v){filter=v}},2);let contains;module.link('./contains.js',{default(v){contains=v}},3);




// Take the difference between one array and a number of other arrays.
// Only the elements present in just the first array will remain.
module.exportDefault(restArguments(function(array, rest) {
  rest = flatten(rest, true, true);
  return filter(array, function(value){
    return !contains(rest, value);
  });
}));
