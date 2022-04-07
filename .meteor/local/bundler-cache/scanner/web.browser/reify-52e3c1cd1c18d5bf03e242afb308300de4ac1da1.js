module.export({default:()=>toPath});let _;module.link('./underscore.js',{default(v){_=v}},0);module.link('./toPath.js');


// Internal wrapper for `_.toPath` to enable minification.
// Similar to `cb` for `_.iteratee`.
function toPath(path) {
  return _.toPath(path);
}
