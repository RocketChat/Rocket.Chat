module.export({default:()=>times});let optimizeCb;module.link('./_optimizeCb.js',{default(v){optimizeCb=v}},0);

// Run a function **n** times.
function times(n, iteratee, context) {
  var accum = Array(Math.max(0, n));
  iteratee = optimizeCb(iteratee, context, 1);
  for (var i = 0; i < n; i++) accum[i] = iteratee(i);
  return accum;
}
