let restArguments;module.link('./restArguments.js',{default(v){restArguments=v}},0);let difference;module.link('./difference.js',{default(v){difference=v}},1);


// Return a version of the array that does not contain the specified value(s).
module.exportDefault(restArguments(function(array, otherArrays) {
  return difference(array, otherArrays);
}));
