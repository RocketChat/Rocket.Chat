module.export({default:()=>sample});let isArrayLike;module.link('./_isArrayLike.js',{default(v){isArrayLike=v}},0);let values;module.link('./values.js',{default(v){values=v}},1);let getLength;module.link('./_getLength.js',{default(v){getLength=v}},2);let random;module.link('./random.js',{default(v){random=v}},3);let toArray;module.link('./toArray.js',{default(v){toArray=v}},4);





// Sample **n** random values from a collection using the modern version of the
// [Fisher-Yates shuffle](https://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
// If **n** is not specified, returns a single random element.
// The internal `guard` argument allows it to work with `_.map`.
function sample(obj, n, guard) {
  if (n == null || guard) {
    if (!isArrayLike(obj)) obj = values(obj);
    return obj[random(obj.length - 1)];
  }
  var sample = toArray(obj);
  var length = getLength(sample);
  n = Math.max(Math.min(n, length), 0);
  var last = length - 1;
  for (var index = 0; index < n; index++) {
    var rand = random(index, last);
    var temp = sample[index];
    sample[index] = sample[rand];
    sample[rand] = temp;
  }
  return sample.slice(0, n);
}
