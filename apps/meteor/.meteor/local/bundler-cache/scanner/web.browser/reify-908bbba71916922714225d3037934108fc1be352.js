module.export({default:()=>thresholdFreedmanDiaconis});let count;module.link("../count.js",{default(v){count=v}},0);let quantile;module.link("../quantile.js",{default(v){quantile=v}},1);


function thresholdFreedmanDiaconis(values, min, max) {
  const c = count(values), d = quantile(values, 0.75) - quantile(values, 0.25);
  return c && d ? Math.ceil((max - min) / (2 * d * Math.pow(c, -1 / 3))) : 1;
}
