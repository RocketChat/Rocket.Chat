module.export({sum:()=>sum});let none;module.link("./none.js",{default(v){none=v}},0);

module.exportDefault(function(series) {
  var sums = series.map(sum);
  return none(series).sort(function(a, b) { return sums[a] - sums[b]; });
});

function sum(series) {
  var s = 0, i = -1, n = series.length, v;
  while (++i < n) if (v = +series[i][1]) s += v;
  return s;
}
