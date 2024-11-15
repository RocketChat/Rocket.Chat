module.export({default:()=>size});let isArrayLike;module.link('./_isArrayLike.js',{default(v){isArrayLike=v}},0);let keys;module.link('./keys.js',{default(v){keys=v}},1);


// Return the number of elements in a collection.
function size(obj) {
  if (obj == null) return 0;
  return isArrayLike(obj) ? obj.length : keys(obj).length;
}
