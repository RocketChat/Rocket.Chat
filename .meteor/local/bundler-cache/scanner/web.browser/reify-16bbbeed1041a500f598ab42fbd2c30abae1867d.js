module.export({days:()=>days});let interval;module.link("./interval.js",{default(v){interval=v}},0);let durationDay,durationMinute;module.link("./duration.js",{durationDay(v){durationDay=v},durationMinute(v){durationMinute=v}},1);


var day = interval(
  date => date.setHours(0, 0, 0, 0),
  (date, step) => date.setDate(date.getDate() + step),
  (start, end) => (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay,
  date => date.getDate() - 1
);

module.exportDefault(day);
var days = day.range;
