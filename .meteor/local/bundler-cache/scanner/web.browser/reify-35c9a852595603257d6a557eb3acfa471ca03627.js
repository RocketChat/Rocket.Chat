module.export({default:()=>find});let isArrayLike;module.link('./_isArrayLike.js',{default(v){isArrayLike=v}},0);let findIndex;module.link('./findIndex.js',{default(v){findIndex=v}},1);let findKey;module.link('./findKey.js',{default(v){findKey=v}},2);



// Return the first value which passes a truth test.
function find(obj, predicate, context) {
  var keyFinder = isArrayLike(obj) ? findIndex : findKey;
  var key = keyFinder(obj, predicate, context);
  if (key !== void 0 && key !== -1) return obj[key];
}
