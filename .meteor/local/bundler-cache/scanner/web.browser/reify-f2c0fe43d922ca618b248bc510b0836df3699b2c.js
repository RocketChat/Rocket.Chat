module.export({default:()=>isEmpty});let getLength;module.link('./_getLength.js',{default(v){getLength=v}},0);let isArray;module.link('./isArray.js',{default(v){isArray=v}},1);let isString;module.link('./isString.js',{default(v){isString=v}},2);let isArguments;module.link('./isArguments.js',{default(v){isArguments=v}},3);let keys;module.link('./keys.js',{default(v){keys=v}},4);





// Is a given array, string, or object empty?
// An "empty" object has no enumerable own-properties.
function isEmpty(obj) {
  if (obj == null) return true;
  // Skip the more expensive `toString`-based type checks if `obj` has no
  // `.length`.
  var length = getLength(obj);
  if (typeof length == 'number' && (
    isArray(obj) || isString(obj) || isArguments(obj)
  )) return length === 0;
  return getLength(keys(obj)) === 0;
}
