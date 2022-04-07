module.export({minutes:()=>minutes});let interval;module.link("./interval.js",{default(v){interval=v}},0);let durationMinute,durationSecond;module.link("./duration.js",{durationMinute(v){durationMinute=v},durationSecond(v){durationSecond=v}},1);


var minute = interval(function(date) {
  date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond);
}, function(date, step) {
  date.setTime(+date + step * durationMinute);
}, function(start, end) {
  return (end - start) / durationMinute;
}, function(date) {
  return date.getMinutes();
});

module.exportDefault(minute);
var minutes = minute.range;
