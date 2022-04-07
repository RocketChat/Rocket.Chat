let count;module.link("../count.js",{default(v){count=v}},0);let quantile;module.link("../quantile.js",{default(v){quantile=v}},1);


module.exportDefault(function(values, min, max) {
  return Math.ceil((max - min) / (2 * (quantile(values, 0.75) - quantile(values, 0.25)) * Math.pow(count(values), -1 / 3)));
});
