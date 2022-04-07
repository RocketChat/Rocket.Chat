let exponent;module.link("./exponent.js",{default(v){exponent=v}},0);

module.exportDefault(function(step) {
  return Math.max(0, -exponent(Math.abs(step)));
});
