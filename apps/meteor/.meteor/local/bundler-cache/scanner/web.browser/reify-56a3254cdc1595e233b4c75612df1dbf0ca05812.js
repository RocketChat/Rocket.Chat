module.export({default:()=>median,medianIndex:()=>medianIndex});let quantile,quantileIndex;module.link("./quantile.js",{default(v){quantile=v},quantileIndex(v){quantileIndex=v}},0);

function median(values, valueof) {
  return quantile(values, 0.5, valueof);
}

function medianIndex(values, valueof) {
  return quantileIndex(values, 0.5, valueof);
}
