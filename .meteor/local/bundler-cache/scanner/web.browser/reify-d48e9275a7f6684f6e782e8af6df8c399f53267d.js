module.export({default:()=>get});let toPath;module.link('./_toPath.js',{default(v){toPath=v}},0);let deepGet;module.link('./_deepGet.js',{default(v){deepGet=v}},1);let isUndefined;module.link('./isUndefined.js',{default(v){isUndefined=v}},2);



// Get the value of the (deep) property on `path` from `object`.
// If any property in `path` does not exist or if the value is
// `undefined`, return `defaultValue` instead.
// The `path` is normalized through `_.toPath`.
function get(object, path, defaultValue) {
  var value = deepGet(object, toPath(path));
  return isUndefined(value) ? defaultValue : value;
}
