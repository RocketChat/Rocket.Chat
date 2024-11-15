module.export({default:()=>thresholdScott});let count;module.link("../count.js",{default(v){count=v}},0);let deviation;module.link("../deviation.js",{default(v){deviation=v}},1);


function thresholdScott(values, min, max) {
  const c = count(values), d = deviation(values);
  return c && d ? Math.ceil((max - min) * Math.cbrt(c) / (3.49 * d)) : 1;
}
