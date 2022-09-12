let exponent;module.link("./exponent.js",{default(v){exponent=v}},0);

module.exportDefault(function(step, max) {
  step = Math.abs(step), max = Math.abs(max) - step;
  return Math.max(0, exponent(max) - exponent(step)) + 1;
});
