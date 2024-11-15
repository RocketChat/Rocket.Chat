let ascending;module.link("./ascending",{default(v){ascending=v}},0);

module.exportDefault(function(series) {
  return ascending(series).reverse();
});
