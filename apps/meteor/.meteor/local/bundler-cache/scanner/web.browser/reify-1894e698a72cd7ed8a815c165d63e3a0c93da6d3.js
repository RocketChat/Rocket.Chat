module.export({utcSunday:()=>utcSunday,utcMonday:()=>utcMonday,utcTuesday:()=>utcTuesday,utcWednesday:()=>utcWednesday,utcThursday:()=>utcThursday,utcFriday:()=>utcFriday,utcSaturday:()=>utcSaturday,utcSundays:()=>utcSundays,utcMondays:()=>utcMondays,utcTuesdays:()=>utcTuesdays,utcWednesdays:()=>utcWednesdays,utcThursdays:()=>utcThursdays,utcFridays:()=>utcFridays,utcSaturdays:()=>utcSaturdays});let interval;module.link("./interval.js",{default(v){interval=v}},0);let durationWeek;module.link("./duration.js",{durationWeek(v){durationWeek=v}},1);


function utcWeekday(i) {
  return interval(function(date) {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCDate(date.getUTCDate() + step * 7);
  }, function(start, end) {
    return (end - start) / durationWeek;
  });
}

var utcSunday = utcWeekday(0);
var utcMonday = utcWeekday(1);
var utcTuesday = utcWeekday(2);
var utcWednesday = utcWeekday(3);
var utcThursday = utcWeekday(4);
var utcFriday = utcWeekday(5);
var utcSaturday = utcWeekday(6);

var utcSundays = utcSunday.range;
var utcMondays = utcMonday.range;
var utcTuesdays = utcTuesday.range;
var utcWednesdays = utcWednesday.range;
var utcThursdays = utcThursday.range;
var utcFridays = utcFriday.range;
var utcSaturdays = utcSaturday.range;
