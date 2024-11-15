module.export({default:()=>each});let optimizeCb;module.link('./_optimizeCb.js',{default(v){optimizeCb=v}},0);let isArrayLike;module.link('./_isArrayLike.js',{default(v){isArrayLike=v}},1);let keys;module.link('./keys.js',{default(v){keys=v}},2);



// The cornerstone for collection functions, an `each`
// implementation, aka `forEach`.
// Handles raw objects in addition to array-likes. Treats all
// sparse array-likes as if they were dense.
function each(obj, iteratee, context) {
  iteratee = optimizeCb(iteratee, context);
  var i, length;
  if (isArrayLike(obj)) {
    for (i = 0, length = obj.length; i < length; i++) {
      iteratee(obj[i], i, obj);
    }
  } else {
    var _keys = keys(obj);
    for (i = 0, length = _keys.length; i < length; i++) {
      iteratee(obj[_keys[i]], _keys[i], obj);
    }
  }
  return obj;
}
