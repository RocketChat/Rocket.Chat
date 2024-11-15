module.export({default:()=>map});let cb;module.link('./_cb.js',{default(v){cb=v}},0);let isArrayLike;module.link('./_isArrayLike.js',{default(v){isArrayLike=v}},1);let keys;module.link('./keys.js',{default(v){keys=v}},2);



// Return the results of applying the iteratee to each element.
function map(obj, iteratee, context) {
  iteratee = cb(iteratee, context);
  var _keys = !isArrayLike(obj) && keys(obj),
      length = (_keys || obj).length,
      results = Array(length);
  for (var index = 0; index < length; index++) {
    var currentKey = _keys ? _keys[index] : index;
    results[index] = iteratee(obj[currentKey], currentKey, obj);
  }
  return results;
}
