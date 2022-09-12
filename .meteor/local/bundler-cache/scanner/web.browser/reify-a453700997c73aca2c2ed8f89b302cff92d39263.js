module.export({default:()=>deviation});let variance;module.link("./variance.js",{default(v){variance=v}},0);

function deviation(values, valueof) {
  const v = variance(values, valueof);
  return v ? Math.sqrt(v) : v;
}
