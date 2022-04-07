module.export({default:()=>flatten});let _flatten;module.link('./_flatten.js',{default(v){_flatten=v}},0);

// Flatten out an array, either recursively (by default), or up to `depth`.
// Passing `true` or `false` as `depth` means `1` or `Infinity`, respectively.
function flatten(array, depth) {
  return _flatten(array, depth, false);
}
