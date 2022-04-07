module.export({default:()=>createPredicateIndexFinder});let cb;module.link('./_cb.js',{default(v){cb=v}},0);let getLength;module.link('./_getLength.js',{default(v){getLength=v}},1);


// Internal function to generate `_.findIndex` and `_.findLastIndex`.
function createPredicateIndexFinder(dir) {
  return function(array, predicate, context) {
    predicate = cb(predicate, context);
    var length = getLength(array);
    var index = dir > 0 ? 0 : length - 1;
    for (; index >= 0 && index < length; index += dir) {
      if (predicate(array[index], index, array)) return index;
    }
    return -1;
  };
}
