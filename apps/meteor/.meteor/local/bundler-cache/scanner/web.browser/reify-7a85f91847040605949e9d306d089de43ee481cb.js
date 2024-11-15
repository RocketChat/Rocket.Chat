module.export({default:()=>leastIndex});let ascending;module.link("./ascending.js",{default(v){ascending=v}},0);let minIndex;module.link("./minIndex.js",{default(v){minIndex=v}},1);


function leastIndex(values, compare = ascending) {
  if (compare.length === 1) return minIndex(values, compare);
  let minValue;
  let min = -1;
  let index = -1;
  for (const value of values) {
    ++index;
    if (min < 0
        ? compare(value, value) === 0
        : compare(value, minValue) < 0) {
      minValue = value;
      min = index;
    }
  }
  return min;
}
