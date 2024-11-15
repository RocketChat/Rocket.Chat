module.export({default:()=>quantile,quantileSorted:()=>quantileSorted,quantileIndex:()=>quantileIndex});let max;module.link("./max.js",{default(v){max=v}},0);let maxIndex;module.link("./maxIndex.js",{default(v){maxIndex=v}},1);let min;module.link("./min.js",{default(v){min=v}},2);let minIndex;module.link("./minIndex.js",{default(v){minIndex=v}},3);let quickselect;module.link("./quickselect.js",{default(v){quickselect=v}},4);let number,numbers;module.link("./number.js",{default(v){number=v},numbers(v){numbers=v}},5);let ascendingDefined;module.link("./sort.js",{ascendingDefined(v){ascendingDefined=v}},6);let greatest;module.link("./greatest.js",{default(v){greatest=v}},7);








function quantile(values, p, valueof) {
  values = Float64Array.from(numbers(values, valueof));
  if (!(n = values.length) || isNaN(p = +p)) return;
  if (p <= 0 || n < 2) return min(values);
  if (p >= 1) return max(values);
  var n,
      i = (n - 1) * p,
      i0 = Math.floor(i),
      value0 = max(quickselect(values, i0).subarray(0, i0 + 1)),
      value1 = min(values.subarray(i0 + 1));
  return value0 + (value1 - value0) * (i - i0);
}

function quantileSorted(values, p, valueof = number) {
  if (!(n = values.length) || isNaN(p = +p)) return;
  if (p <= 0 || n < 2) return +valueof(values[0], 0, values);
  if (p >= 1) return +valueof(values[n - 1], n - 1, values);
  var n,
      i = (n - 1) * p,
      i0 = Math.floor(i),
      value0 = +valueof(values[i0], i0, values),
      value1 = +valueof(values[i0 + 1], i0 + 1, values);
  return value0 + (value1 - value0) * (i - i0);
}

function quantileIndex(values, p, valueof = number) {
  if (isNaN(p = +p)) return;
  numbers = Float64Array.from(values, (_, i) => number(valueof(values[i], i, values)));
  if (p <= 0) return minIndex(numbers);
  if (p >= 1) return maxIndex(numbers);
  var numbers,
      index = Uint32Array.from(values, (_, i) => i),
      j = numbers.length - 1,
      i = Math.floor(j * p);
  quickselect(index, i, 0, j, (i, j) => ascendingDefined(numbers[i], numbers[j]));
  i = greatest(index.subarray(0, i + 1), (i) => numbers[i]);
  return i >= 0 ? i : -1;
}
