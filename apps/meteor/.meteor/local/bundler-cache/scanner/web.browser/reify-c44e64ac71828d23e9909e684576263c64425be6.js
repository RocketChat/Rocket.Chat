module.export({default:()=>group});let cb;module.link('./_cb.js',{default(v){cb=v}},0);let each;module.link('./each.js',{default(v){each=v}},1);


// An internal function used for aggregate "group by" operations.
function group(behavior, partition) {
  return function(obj, iteratee, context) {
    var result = partition ? [[], []] : {};
    iteratee = cb(iteratee, context);
    each(obj, function(value, index) {
      var key = iteratee(value, index, obj);
      behavior(result, value, key);
    });
    return result;
  };
}
