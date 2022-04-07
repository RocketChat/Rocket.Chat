module.export({utcMinutes:()=>utcMinutes});let interval;module.link("./interval.js",{default(v){interval=v}},0);let durationMinute;module.link("./duration.js",{durationMinute(v){durationMinute=v}},1);


var utcMinute = interval(function(date) {
  date.setUTCSeconds(0, 0);
}, function(date, step) {
  date.setTime(+date + step * durationMinute);
}, function(start, end) {
  return (end - start) / durationMinute;
}, function(date) {
  return date.getUTCMinutes();
});

module.exportDefault(utcMinute);
var utcMinutes = utcMinute.range;
