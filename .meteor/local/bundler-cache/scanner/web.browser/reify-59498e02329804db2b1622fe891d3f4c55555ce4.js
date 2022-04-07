module.export({default:()=>rest});let slice;module.link('./_setup.js',{slice(v){slice=v}},0);

// Returns everything but the first entry of the `array`. Especially useful on
// the `arguments` object. Passing an **n** will return the rest N values in the
// `array`.
function rest(array, n, guard) {
  return slice.call(array, n == null || guard ? 1 : n);
}
