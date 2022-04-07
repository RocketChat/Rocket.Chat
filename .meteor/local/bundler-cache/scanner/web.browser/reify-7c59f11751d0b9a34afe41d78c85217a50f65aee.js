module.export({default:()=>property});let deepGet;module.link('./_deepGet.js',{default(v){deepGet=v}},0);let toPath;module.link('./_toPath.js',{default(v){toPath=v}},1);


// Creates a function that, when passed an object, will traverse that object’s
// properties down the given `path`, specified as an array of keys or indices.
function property(path) {
  path = toPath(path);
  return function(obj) {
    return deepGet(obj, path);
  };
}
