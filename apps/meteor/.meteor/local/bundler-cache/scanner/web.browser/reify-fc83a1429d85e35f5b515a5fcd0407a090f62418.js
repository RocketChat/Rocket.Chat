module.export({lineRadial:()=>lineRadial});let curveRadial,curveRadialLinear;module.link("./curve/radial.js",{default(v){curveRadial=v},curveRadialLinear(v){curveRadialLinear=v}},0);let line;module.link("./line.js",{default(v){line=v}},1);


function lineRadial(l) {
  var c = l.curve;

  l.angle = l.x, delete l.x;
  l.radius = l.y, delete l.y;

  l.curve = function(_) {
    return arguments.length ? c(curveRadial(_)) : c()._curve;
  };

  return l;
}

module.exportDefault(function() {
  return lineRadial(line().curve(curveRadialLinear));
});
