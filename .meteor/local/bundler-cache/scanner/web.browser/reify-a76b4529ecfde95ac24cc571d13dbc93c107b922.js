let count;module.link("../count.js",{default(v){count=v}},0);let deviation;module.link("../deviation.js",{default(v){deviation=v}},1);


module.exportDefault(function(values, min, max) {
  return Math.ceil((max - min) / (3.5 * deviation(values) * Math.pow(count(values), -1 / 3)));
});
