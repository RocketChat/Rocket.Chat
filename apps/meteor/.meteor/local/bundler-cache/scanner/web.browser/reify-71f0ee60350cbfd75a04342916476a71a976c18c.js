let Transition,newId;module.link("../transition/index",{Transition(v){Transition=v},newId(v){newId=v}},0);let schedule;module.link("../transition/schedule",{default(v){schedule=v}},1);let easeCubicInOut;module.link("d3-ease",{easeCubicInOut(v){easeCubicInOut=v}},2);let now;module.link("d3-timer",{now(v){now=v}},3);




var defaultTiming = {
  time: null, // Set on use.
  delay: 0,
  duration: 250,
  ease: easeCubicInOut
};

function inherit(node, id) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id])) {
    if (!(node = node.parentNode)) {
      return defaultTiming.time = now(), defaultTiming;
    }
  }
  return timing;
}

module.exportDefault(function(name) {
  var id,
      timing;

  if (name instanceof Transition) {
    id = name._id, name = name._name;
  } else {
    id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        schedule(node, name, id, i, group, timing || inherit(node, id));
      }
    }
  }

  return new Transition(groups, this._parents, name, id);
});
