module.export({utcHours:()=>utcHours});let interval;module.link("./interval.js",{default(v){interval=v}},0);let durationHour;module.link("./duration.js",{durationHour(v){durationHour=v}},1);


var utcHour = interval(function(date) {
  date.setUTCMinutes(0, 0, 0);
}, function(date, step) {
  date.setTime(+date + step * durationHour);
}, function(start, end) {
  return (end - start) / durationHour;
}, function(date) {
  return date.getUTCHours();
});

module.exportDefault(utcHour);
var utcHours = utcHour.range;
