let event;module.link("./selection/on",{event(v){event=v}},0);

module.exportDefault(function() {
  var current = event, source;
  while (source = current.sourceEvent) current = source;
  return current;
});
