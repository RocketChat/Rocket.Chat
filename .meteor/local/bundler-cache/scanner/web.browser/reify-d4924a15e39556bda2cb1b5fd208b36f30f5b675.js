module.export({default:()=>findKey});let cb;module.link('./_cb.js',{default(v){cb=v}},0);let keys;module.link('./keys.js',{default(v){keys=v}},1);


// Returns the first key on an object that passes a truth test.
function findKey(obj, predicate, context) {
  predicate = cb(predicate, context);
  var _keys = keys(obj), key;
  for (var i = 0, length = _keys.length; i < length; i++) {
    key = _keys[i];
    if (predicate(obj[key], key, obj)) return key;
  }
}
