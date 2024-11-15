module.export({default:()=>thresholdSturges});let count;module.link("../count.js",{default(v){count=v}},0);

function thresholdSturges(values) {
  return Math.max(1, Math.ceil(Math.log(count(values)) / Math.LN2) + 1);
}
