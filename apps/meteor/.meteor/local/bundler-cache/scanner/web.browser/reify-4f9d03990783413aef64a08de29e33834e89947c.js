module.export({cubehelixLong:()=>cubehelixLong});let colorCubehelix;module.link("d3-color",{cubehelix(v){colorCubehelix=v}},0);let color,hue;module.link("./color.js",{default(v){color=v},hue(v){hue=v}},1);


function cubehelix(hue) {
  return (function cubehelixGamma(y) {
    y = +y;

    function cubehelix(start, end) {
      var h = hue((start = colorCubehelix(start)).h, (end = colorCubehelix(end)).h),
          s = color(start.s, end.s),
          l = color(start.l, end.l),
          opacity = color(start.opacity, end.opacity);
      return function(t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(Math.pow(t, y));
        start.opacity = opacity(t);
        return start + "";
      };
    }

    cubehelix.gamma = cubehelixGamma;

    return cubehelix;
  })(1);
}

module.exportDefault(cubehelix(hue));
var cubehelixLong = cubehelix(color);
