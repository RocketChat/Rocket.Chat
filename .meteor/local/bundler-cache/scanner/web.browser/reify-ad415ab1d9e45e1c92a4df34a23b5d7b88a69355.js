module.export({utcMonths:()=>utcMonths});let interval;module.link("./interval.js",{default(v){interval=v}},0);

var utcMonth = interval(function(date) {
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCMonth(date.getUTCMonth() + step);
}, function(start, end) {
  return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
}, function(date) {
  return date.getUTCMonth();
});

module.exportDefault(utcMonth);
var utcMonths = utcMonth.range;
