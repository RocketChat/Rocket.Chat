module.export({default:()=>has});let _has;module.link('./_has.js',{default(v){_has=v}},0);let toPath;module.link('./_toPath.js',{default(v){toPath=v}},1);


// Shortcut function for checking if an object has a given property directly on
// itself (in other words, not on a prototype). Unlike the internal `has`
// function, this public version can also traverse nested properties.
function has(obj, path) {
  path = toPath(path);
  var length = path.length;
  for (var i = 0; i < length; i++) {
    var key = path[i];
    if (!_has(obj, key)) return false;
    obj = obj[key];
  }
  return !!length;
}
