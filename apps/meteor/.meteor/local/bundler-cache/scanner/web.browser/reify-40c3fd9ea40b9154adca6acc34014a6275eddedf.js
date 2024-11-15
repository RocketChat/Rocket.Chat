let color;module.link("d3-color",{color(v){color=v}},0);let interpolateNumber,interpolateRgb,interpolateString;module.link("d3-interpolate",{interpolateNumber(v){interpolateNumber=v},interpolateRgb(v){interpolateRgb=v},interpolateString(v){interpolateString=v}},1);


module.exportDefault(function(a, b) {
  var c;
  return (typeof b === "number" ? interpolateNumber
      : b instanceof color ? interpolateRgb
      : (c = color(b)) ? (b = c, interpolateRgb)
      : interpolateString)(a, b);
});
