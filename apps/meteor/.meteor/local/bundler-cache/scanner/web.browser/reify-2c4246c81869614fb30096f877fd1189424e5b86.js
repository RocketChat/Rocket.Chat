module.export({default:()=>keys});let isObject;module.link('./isObject.js',{default(v){isObject=v}},0);let nativeKeys,hasEnumBug;module.link('./_setup.js',{nativeKeys(v){nativeKeys=v},hasEnumBug(v){hasEnumBug=v}},1);let has;module.link('./_has.js',{default(v){has=v}},2);let collectNonEnumProps;module.link('./_collectNonEnumProps.js',{default(v){collectNonEnumProps=v}},3);




// Retrieve the names of an object's own properties.
// Delegates to **ECMAScript 5**'s native `Object.keys`.
function keys(obj) {
  if (!isObject(obj)) return [];
  if (nativeKeys) return nativeKeys(obj);
  var keys = [];
  for (var key in obj) if (has(obj, key)) keys.push(key);
  // Ahem, IE < 9.
  if (hasEnumBug) collectNonEnumProps(obj, keys);
  return keys;
}
