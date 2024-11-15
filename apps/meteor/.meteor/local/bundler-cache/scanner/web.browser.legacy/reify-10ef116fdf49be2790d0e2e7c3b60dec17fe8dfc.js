module.export({rgbBasis:function(){return rgbBasis},rgbBasisClosed:function(){return rgbBasisClosed}});var colorRgb;module.link("d3-color",{rgb:function(v){colorRgb=v}},0);var basis;module.link("./basis.js",{default:function(v){basis=v}},1);var basisClosed;module.link("./basisClosed.js",{default:function(v){basisClosed=v}},2);var nogamma,gamma;module.link("./color.js",{default:function(v){nogamma=v},gamma:function(v){gamma=v}},3);




module.exportDefault((function rgbGamma(y) {
  var color = gamma(y);

  function rgb(start, end) {
    var r = color((start = colorRgb(start)).r, (end = colorRgb(end)).r),
        g = color(start.g, end.g),
        b = color(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb.gamma = rgbGamma;

  return rgb;
})(1));

function rgbSpline(spline) {
  return function(colors) {
    var n = colors.length,
        r = new Array(n),
        g = new Array(n),
        b = new Array(n),
        i, color;
    for (i = 0; i < n; ++i) {
      color = colorRgb(colors[i]);
      r[i] = color.r || 0;
      g[i] = color.g || 0;
      b[i] = color.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b = spline(b);
    color.opacity = 1;
    return function(t) {
      color.r = r(t);
      color.g = g(t);
      color.b = b(t);
      return color + "";
    };
  };
}

var rgbBasis = rgbSpline(basis);
var rgbBasisClosed = rgbSpline(basisClosed);
