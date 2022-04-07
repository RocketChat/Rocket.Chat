module.export({default:()=>flatten});let getLength;module.link('./_getLength.js',{default(v){getLength=v}},0);let isArrayLike;module.link('./_isArrayLike.js',{default(v){isArrayLike=v}},1);let isArray;module.link('./isArray.js',{default(v){isArray=v}},2);let isArguments;module.link('./isArguments.js',{default(v){isArguments=v}},3);




// Internal implementation of a recursive `flatten` function.
function flatten(input, depth, strict, output) {
  output = output || [];
  if (!depth && depth !== 0) {
    depth = Infinity;
  } else if (depth <= 0) {
    return output.concat(input);
  }
  var idx = output.length;
  for (var i = 0, length = getLength(input); i < length; i++) {
    var value = input[i];
    if (isArrayLike(value) && (isArray(value) || isArguments(value))) {
      // Flatten current level of array or arguments object.
      if (depth > 1) {
        flatten(value, depth - 1, strict, output);
        idx = output.length;
      } else {
        var j = 0, len = value.length;
        while (j < len) output[idx++] = value[j++];
      }
    } else if (!strict) {
      output[idx++] = value;
    }
  }
  return output;
}
