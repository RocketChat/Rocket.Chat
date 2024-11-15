let sourceEvent;module.link("./sourceEvent",{default(v){sourceEvent=v}},0);let point;module.link("./point",{default(v){point=v}},1);


module.exportDefault(function(node, touches) {
  if (touches == null) touches = sourceEvent().touches;

  for (var i = 0, n = touches ? touches.length : 0, points = new Array(n); i < n; ++i) {
    points[i] = point(node, touches[i]);
  }

  return points;
});
