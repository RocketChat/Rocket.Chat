module.export({default:()=>every});let cb;module.link('./_cb.js',{default(v){cb=v}},0);let isArrayLike;module.link('./_isArrayLike.js',{default(v){isArrayLike=v}},1);let keys;module.link('./keys.js',{default(v){keys=v}},2);



// Determine whether all of the elements pass a truth test.
function every(obj, predicate, context) {
  predicate = cb(predicate, context);
  var _keys = !isArrayLike(obj) && keys(obj),
      length = (_keys || obj).length;
  for (var index = 0; index < length; index++) {
    var currentKey = _keys ? _keys[index] : index;
    if (!predicate(obj[currentKey], currentKey, obj)) return false;
  }
  return true;
}
