let ascending;module.link("./ascending.js",{default(v){ascending=v}},0);

module.exportDefault(function(series) {
  return ascending(series).reverse();
});
