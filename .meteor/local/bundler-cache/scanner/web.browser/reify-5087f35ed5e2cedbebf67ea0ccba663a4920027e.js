module.export({seconds:()=>seconds});let interval;module.link("./interval.js",{default(v){interval=v}},0);let durationSecond;module.link("./duration.js",{durationSecond(v){durationSecond=v}},1);


var second = interval(function(date) {
  date.setTime(date - date.getMilliseconds());
}, function(date, step) {
  date.setTime(+date + step * durationSecond);
}, function(start, end) {
  return (end - start) / durationSecond;
}, function(date) {
  return date.getUTCSeconds();
});

module.exportDefault(second);
var seconds = second.range;
