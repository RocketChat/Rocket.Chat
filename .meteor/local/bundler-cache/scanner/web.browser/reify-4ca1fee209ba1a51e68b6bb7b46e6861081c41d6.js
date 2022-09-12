let quantile;module.link("./quantile.js",{default(v){quantile=v}},0);

module.exportDefault(function(values, valueof) {
  return quantile(values, 0.5, valueof);
});
