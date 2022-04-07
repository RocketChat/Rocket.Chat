module.export({default:()=>toArray});let isArray;module.link('./isArray.js',{default(v){isArray=v}},0);let slice;module.link('./_setup.js',{slice(v){slice=v}},1);let isString;module.link('./isString.js',{default(v){isString=v}},2);let isArrayLike;module.link('./_isArrayLike.js',{default(v){isArrayLike=v}},3);let map;module.link('./map.js',{default(v){map=v}},4);let identity;module.link('./identity.js',{default(v){identity=v}},5);let values;module.link('./values.js',{default(v){values=v}},6);







// Safely create a real, live array from anything iterable.
var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
function toArray(obj) {
  if (!obj) return [];
  if (isArray(obj)) return slice.call(obj);
  if (isString(obj)) {
    // Keep surrogate pair characters together.
    return obj.match(reStrSymbol);
  }
  if (isArrayLike(obj)) return map(obj, identity);
  return values(obj);
}
