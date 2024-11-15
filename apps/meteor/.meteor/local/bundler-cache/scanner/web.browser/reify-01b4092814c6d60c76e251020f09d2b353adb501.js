let Transition;module.link("./transition/index",{Transition(v){Transition=v}},0);let SCHEDULED;module.link("./transition/schedule",{SCHEDULED(v){SCHEDULED=v}},1);


var root = [null];

module.exportDefault(function(node, name) {
  var schedules = node.__transition,
      schedule,
      i;

  if (schedules) {
    name = name == null ? null : name + "";
    for (i in schedules) {
      if ((schedule = schedules[i]).state > SCHEDULED && schedule.name === name) {
        return new Transition([[node]], root, name, +i);
      }
    }
  }

  return null;
});
