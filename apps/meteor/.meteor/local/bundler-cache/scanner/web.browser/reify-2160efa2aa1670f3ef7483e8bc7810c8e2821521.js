let sourceEvent;module.link("./sourceEvent",{default(v){sourceEvent=v}},0);let point;module.link("./point",{default(v){point=v}},1);


module.exportDefault(function(node, touches, identifier) {
  if (arguments.length < 3) identifier = touches, touches = sourceEvent().changedTouches;

  for (var i = 0, n = touches ? touches.length : 0, touch; i < n; ++i) {
    if ((touch = touches[i]).identifier === identifier) {
      return point(node, touch);
    }
  }

  return null;
});
