module.export({hclLong:function(){return hclLong}});var colorHcl;module.link("d3-color",{hcl:function(v){colorHcl=v}},0);var color,hue;module.link("./color.js",{default:function(v){color=v},hue:function(v){hue=v}},1);


function hcl(hue) {
  return function(start, end) {
    var h = hue((start = colorHcl(start)).h, (end = colorHcl(end)).h),
        c = color(start.c, end.c),
        l = color(start.l, end.l),
        opacity = color(start.opacity, end.opacity);
    return function(t) {
      start.h = h(t);
      start.c = c(t);
      start.l = l(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }
}

module.exportDefault(hcl(hue));
var hclLong = hcl(color);
