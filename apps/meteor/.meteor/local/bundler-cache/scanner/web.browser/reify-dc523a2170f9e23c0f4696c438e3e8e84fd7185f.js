let sourceEvent;module.link("./sourceEvent",{default(v){sourceEvent=v}},0);let point;module.link("./point",{default(v){point=v}},1);


module.exportDefault(function(node) {
  var event = sourceEvent();
  if (event.changedTouches) event = event.changedTouches[0];
  return point(node, event);
});
