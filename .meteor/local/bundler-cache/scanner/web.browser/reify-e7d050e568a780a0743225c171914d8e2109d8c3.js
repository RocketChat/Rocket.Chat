module.export({default:()=>toPath});let _;module.link('./underscore.js',{default(v){_=v}},0);let isArray;module.link('./isArray.js',{default(v){isArray=v}},1);


// Normalize a (deep) property `path` to array.
// Like `_.iteratee`, this function can be customized.
function toPath(path) {
  return isArray(path) ? path : [path];
}
_.toPath = toPath;
