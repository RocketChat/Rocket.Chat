let formatDecimal;module.link("./formatDecimal.js",{default(v){formatDecimal=v}},0);let formatPrefixAuto;module.link("./formatPrefixAuto.js",{default(v){formatPrefixAuto=v}},1);let formatRounded;module.link("./formatRounded.js",{default(v){formatRounded=v}},2);



module.exportDefault({
  "%": (x, p) => (x * 100).toFixed(p),
  "b": (x) => Math.round(x).toString(2),
  "c": (x) => x + "",
  "d": formatDecimal,
  "e": (x, p) => x.toExponential(p),
  "f": (x, p) => x.toFixed(p),
  "g": (x, p) => x.toPrecision(p),
  "o": (x) => Math.round(x).toString(8),
  "p": (x, p) => formatRounded(x * 100, p),
  "r": formatRounded,
  "s": formatPrefixAuto,
  "X": (x) => Math.round(x).toString(16).toUpperCase(),
  "x": (x) => Math.round(x).toString(16)
});
