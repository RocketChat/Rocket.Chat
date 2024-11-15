module.export({default:()=>unzip});let max;module.link('./max.js',{default(v){max=v}},0);let getLength;module.link('./_getLength.js',{default(v){getLength=v}},1);let pluck;module.link('./pluck.js',{default(v){pluck=v}},2);



// Complement of zip. Unzip accepts an array of arrays and groups
// each array's elements on shared indices.
function unzip(array) {
  var length = (array && max(array, getLength).length) || 0;
  var result = Array(length);

  for (var index = 0; index < length; index++) {
    result[index] = pluck(array, index);
  }
  return result;
}
