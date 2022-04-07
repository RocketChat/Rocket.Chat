module.export({warm:()=>warm,cool:()=>cool});let cubehelix;module.link("d3-color",{cubehelix(v){cubehelix=v}},0);let interpolateCubehelixLong;module.link("d3-interpolate",{interpolateCubehelixLong(v){interpolateCubehelixLong=v}},1);


var warm = interpolateCubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var cool = interpolateCubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var c = cubehelix();

module.exportDefault(function(t) {
  if (t < 0 || t > 1) t -= Math.floor(t);
  var ts = Math.abs(t - 0.5);
  c.h = 360 * t - 100;
  c.s = 1.5 - 1.5 * ts;
  c.l = 0.8 - 0.9 * ts;
  return c + "";
});
