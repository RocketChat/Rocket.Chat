let count;module.link("../count.js",{default(v){count=v}},0);

module.exportDefault(function(values) {
  return Math.ceil(Math.log(count(values)) / Math.LN2) + 1;
});
