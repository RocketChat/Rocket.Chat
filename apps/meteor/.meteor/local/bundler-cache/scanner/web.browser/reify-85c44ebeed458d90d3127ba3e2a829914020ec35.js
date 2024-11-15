module.export({default:()=>greatestIndex});let ascending;module.link("./ascending.js",{default(v){ascending=v}},0);let maxIndex;module.link("./maxIndex.js",{default(v){maxIndex=v}},1);


function greatestIndex(values, compare = ascending) {
  if (compare.length === 1) return maxIndex(values, compare);
  let maxValue;
  let max = -1;
  let index = -1;
  for (const value of values) {
    ++index;
    if (max < 0
        ? compare(value, value) === 0
        : compare(value, maxValue) > 0) {
      maxValue = value;
      max = index;
    }
  }
  return max;
}
