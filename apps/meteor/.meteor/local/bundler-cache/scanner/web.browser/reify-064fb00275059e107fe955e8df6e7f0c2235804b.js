module.export({days:()=>days});let interval;module.link("./interval.js",{default(v){interval=v}},0);let durationDay,durationMinute;module.link("./duration.js",{durationDay(v){durationDay=v},durationMinute(v){durationMinute=v}},1);


var day = interval(function(date) {
  date.setHours(0, 0, 0, 0);
}, function(date, step) {
  date.setDate(date.getDate() + step);
}, function(start, end) {
  return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay;
}, function(date) {
  return date.getDate() - 1;
});

module.exportDefault(day);
var days = day.range;
