module.export({hours:()=>hours});let interval;module.link("./interval.js",{default(v){interval=v}},0);let durationHour,durationMinute,durationSecond;module.link("./duration.js",{durationHour(v){durationHour=v},durationMinute(v){durationMinute=v},durationSecond(v){durationSecond=v}},1);


var hour = interval(function(date) {
  date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond - date.getMinutes() * durationMinute);
}, function(date, step) {
  date.setTime(+date + step * durationHour);
}, function(start, end) {
  return (end - start) / durationHour;
}, function(date) {
  return date.getHours();
});

module.exportDefault(hour);
var hours = hour.range;
