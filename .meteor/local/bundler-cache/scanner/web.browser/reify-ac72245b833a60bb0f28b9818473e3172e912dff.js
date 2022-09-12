module.export({genericArray:()=>genericArray});let value;module.link("./value.js",{default(v){value=v}},0);let numberArray,isNumberArray;module.link("./numberArray.js",{default(v){numberArray=v},isNumberArray(v){isNumberArray=v}},1);


module.exportDefault(function(a, b) {
  return (isNumberArray(b) ? numberArray : genericArray)(a, b);
});

function genericArray(a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(na),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) x[i] = value(a[i], b[i]);
  for (; i < nb; ++i) c[i] = b[i];

  return function(t) {
    for (i = 0; i < na; ++i) c[i] = x[i](t);
    return c;
  };
}
