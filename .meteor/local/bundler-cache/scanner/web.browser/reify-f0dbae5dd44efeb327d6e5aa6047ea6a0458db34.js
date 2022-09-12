let formatDecimalParts;module.link("./formatDecimal.js",{formatDecimalParts(v){formatDecimalParts=v}},0);

module.exportDefault(function(x) {
  return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
});
