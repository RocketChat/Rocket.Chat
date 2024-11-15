let exponent;module.link("./exponent.js",{default(v){exponent=v}},0);

module.exportDefault(function(step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
});
