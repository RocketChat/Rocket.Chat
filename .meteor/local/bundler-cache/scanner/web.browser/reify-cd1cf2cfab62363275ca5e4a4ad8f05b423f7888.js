module.export({default:()=>lab});let colorLab;module.link("d3-color",{lab(v){colorLab=v}},0);let color;module.link("./color.js",{default(v){color=v}},1);


function lab(start, end) {
  var l = color((start = colorLab(start)).l, (end = colorLab(end)).l),
      a = color(start.a, end.a),
      b = color(start.b, end.b),
      opacity = color(start.opacity, end.opacity);
  return function(t) {
    start.l = l(t);
    start.a = a(t);
    start.b = b(t);
    start.opacity = opacity(t);
    return start + "";
  };
}
