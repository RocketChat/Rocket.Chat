module.export({default:function(){return lab}});var colorLab;module.link("d3-color",{lab:function(v){colorLab=v}},0);var color;module.link("./color.js",{default:function(v){color=v}},1);


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
