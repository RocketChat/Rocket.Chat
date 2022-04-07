module.export({default:()=>filter});let cb;module.link('./_cb.js',{default(v){cb=v}},0);let each;module.link('./each.js',{default(v){each=v}},1);


// Return all the elements that pass a truth test.
function filter(obj, predicate, context) {
  var results = [];
  predicate = cb(predicate, context);
  each(obj, function(value, index, list) {
    if (predicate(value, index, list)) results.push(value);
  });
  return results;
}
