module.export({utcDays:()=>utcDays});let interval;module.link("./interval.js",{default(v){interval=v}},0);let durationDay;module.link("./duration.js",{durationDay(v){durationDay=v}},1);


var utcDay = interval(function(date) {
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCDate(date.getUTCDate() + step);
}, function(start, end) {
  return (end - start) / durationDay;
}, function(date) {
  return date.getUTCDate() - 1;
});

module.exportDefault(utcDay);
var utcDays = utcDay.range;
