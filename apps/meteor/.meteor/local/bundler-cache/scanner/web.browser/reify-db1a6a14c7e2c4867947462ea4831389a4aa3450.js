module.export({timeSunday:()=>timeSunday,timeMonday:()=>timeMonday,timeTuesday:()=>timeTuesday,timeWednesday:()=>timeWednesday,timeThursday:()=>timeThursday,timeFriday:()=>timeFriday,timeSaturday:()=>timeSaturday,timeSundays:()=>timeSundays,timeMondays:()=>timeMondays,timeTuesdays:()=>timeTuesdays,timeWednesdays:()=>timeWednesdays,timeThursdays:()=>timeThursdays,timeFridays:()=>timeFridays,timeSaturdays:()=>timeSaturdays,utcSunday:()=>utcSunday,utcMonday:()=>utcMonday,utcTuesday:()=>utcTuesday,utcWednesday:()=>utcWednesday,utcThursday:()=>utcThursday,utcFriday:()=>utcFriday,utcSaturday:()=>utcSaturday,utcSundays:()=>utcSundays,utcMondays:()=>utcMondays,utcTuesdays:()=>utcTuesdays,utcWednesdays:()=>utcWednesdays,utcThursdays:()=>utcThursdays,utcFridays:()=>utcFridays,utcSaturdays:()=>utcSaturdays},true);let timeInterval;module.link("./interval.js",{timeInterval(v){timeInterval=v}},0);let durationMinute,durationWeek;module.link("./duration.js",{durationMinute(v){durationMinute=v},durationWeek(v){durationWeek=v}},1);


function timeWeekday(i) {
  return timeInterval((date) => {
    date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    date.setHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setDate(date.getDate() + step * 7);
  }, (start, end) => {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
  });
}

const timeSunday = timeWeekday(0);
const timeMonday = timeWeekday(1);
const timeTuesday = timeWeekday(2);
const timeWednesday = timeWeekday(3);
const timeThursday = timeWeekday(4);
const timeFriday = timeWeekday(5);
const timeSaturday = timeWeekday(6);

const timeSundays = timeSunday.range;
const timeMondays = timeMonday.range;
const timeTuesdays = timeTuesday.range;
const timeWednesdays = timeWednesday.range;
const timeThursdays = timeThursday.range;
const timeFridays = timeFriday.range;
const timeSaturdays = timeSaturday.range;

function utcWeekday(i) {
  return timeInterval((date) => {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    date.setUTCHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setUTCDate(date.getUTCDate() + step * 7);
  }, (start, end) => {
    return (end - start) / durationWeek;
  });
}

const utcSunday = utcWeekday(0);
const utcMonday = utcWeekday(1);
const utcTuesday = utcWeekday(2);
const utcWednesday = utcWeekday(3);
const utcThursday = utcWeekday(4);
const utcFriday = utcWeekday(5);
const utcSaturday = utcWeekday(6);

const utcSundays = utcSunday.range;
const utcMondays = utcMonday.range;
const utcTuesdays = utcTuesday.range;
const utcWednesdays = utcWednesday.range;
const utcThursdays = utcThursday.range;
const utcFridays = utcFriday.range;
const utcSaturdays = utcSaturday.range;
