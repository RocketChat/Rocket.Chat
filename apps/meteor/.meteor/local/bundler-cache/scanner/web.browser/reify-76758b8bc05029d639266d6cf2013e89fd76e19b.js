module.export({timeMinute:()=>timeMinute,timeMinutes:()=>timeMinutes,utcMinute:()=>utcMinute,utcMinutes:()=>utcMinutes},true);let timeInterval;module.link("./interval.js",{timeInterval(v){timeInterval=v}},0);let durationMinute,durationSecond;module.link("./duration.js",{durationMinute(v){durationMinute=v},durationSecond(v){durationSecond=v}},1);


const timeMinute = timeInterval((date) => {
  date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond);
}, (date, step) => {
  date.setTime(+date + step * durationMinute);
}, (start, end) => {
  return (end - start) / durationMinute;
}, (date) => {
  return date.getMinutes();
});

const timeMinutes = timeMinute.range;

const utcMinute = timeInterval((date) => {
  date.setUTCSeconds(0, 0);
}, (date, step) => {
  date.setTime(+date + step * durationMinute);
}, (start, end) => {
  return (end - start) / durationMinute;
}, (date) => {
  return date.getUTCMinutes();
});

const utcMinutes = utcMinute.range;
