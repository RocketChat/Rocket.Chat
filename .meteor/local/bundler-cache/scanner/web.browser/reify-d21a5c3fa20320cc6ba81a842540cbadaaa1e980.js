module.export({default:()=>allKeys});let isObject;module.link('./isObject.js',{default(v){isObject=v}},0);let hasEnumBug;module.link('./_setup.js',{hasEnumBug(v){hasEnumBug=v}},1);let collectNonEnumProps;module.link('./_collectNonEnumProps.js',{default(v){collectNonEnumProps=v}},2);



// Retrieve all the enumerable property names of an object.
function allKeys(obj) {
  if (!isObject(obj)) return [];
  var keys = [];
  for (var key in obj) keys.push(key);
  // Ahem, IE < 9.
  if (hasEnumBug) collectNonEnumProps(obj, keys);
  return keys;
}
