let Timer;module.link("./timer.js",{Timer(v){Timer=v}},0);

module.exportDefault(function(callback, delay, time) {
  var t = new Timer;
  delay = delay == null ? 0 : +delay;
  t.restart(function(elapsed) {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
});
