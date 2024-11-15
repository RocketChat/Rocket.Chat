module.export({second:()=>second,seconds:()=>seconds},true);let timeInterval;module.link("./interval.js",{timeInterval(v){timeInterval=v}},0);let durationSecond;module.link("./duration.js",{durationSecond(v){durationSecond=v}},1);


const second = timeInterval((date) => {
  date.setTime(date - date.getMilliseconds());
}, (date, step) => {
  date.setTime(+date + step * durationSecond);
}, (start, end) => {
  return (end - start) / durationSecond;
}, (date) => {
  return date.getUTCSeconds();
});

const seconds = second.range;
