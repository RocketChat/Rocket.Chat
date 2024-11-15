module.export({timeHour:()=>timeHour,timeHours:()=>timeHours,utcHour:()=>utcHour,utcHours:()=>utcHours},true);let timeInterval;module.link("./interval.js",{timeInterval(v){timeInterval=v}},0);let durationHour,durationMinute,durationSecond;module.link("./duration.js",{durationHour(v){durationHour=v},durationMinute(v){durationMinute=v},durationSecond(v){durationSecond=v}},1);


const timeHour = timeInterval((date) => {
  date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond - date.getMinutes() * durationMinute);
}, (date, step) => {
  date.setTime(+date + step * durationHour);
}, (start, end) => {
  return (end - start) / durationHour;
}, (date) => {
  return date.getHours();
});

const timeHours = timeHour.range;

const utcHour = timeInterval((date) => {
  date.setUTCMinutes(0, 0, 0);
}, (date, step) => {
  date.setTime(+date + step * durationHour);
}, (start, end) => {
  return (end - start) / durationHour;
}, (date) => {
  return date.getUTCHours();
});

const utcHours = utcHour.range;
