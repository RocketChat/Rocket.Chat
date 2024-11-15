let hue;module.link("./color.js",{hue(v){hue=v}},0);

module.exportDefault(function(a, b) {
  var i = hue(+a, +b);
  return function(t) {
    var x = i(t);
    return x - 360 * Math.floor(x / 360);
  };
});
