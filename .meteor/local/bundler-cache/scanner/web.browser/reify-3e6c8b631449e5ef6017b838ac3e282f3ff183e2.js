module.export({sunday:()=>sunday,monday:()=>monday,tuesday:()=>tuesday,wednesday:()=>wednesday,thursday:()=>thursday,friday:()=>friday,saturday:()=>saturday,sundays:()=>sundays,mondays:()=>mondays,tuesdays:()=>tuesdays,wednesdays:()=>wednesdays,thursdays:()=>thursdays,fridays:()=>fridays,saturdays:()=>saturdays});let interval;module.link("./interval.js",{default(v){interval=v}},0);let durationMinute,durationWeek;module.link("./duration.js",{durationMinute(v){durationMinute=v},durationWeek(v){durationWeek=v}},1);


function weekday(i) {
  return interval(function(date) {
    date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setDate(date.getDate() + step * 7);
  }, function(start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
  });
}

var sunday = weekday(0);
var monday = weekday(1);
var tuesday = weekday(2);
var wednesday = weekday(3);
var thursday = weekday(4);
var friday = weekday(5);
var saturday = weekday(6);

var sundays = sunday.range;
var mondays = monday.range;
var tuesdays = tuesday.range;
var wednesdays = wednesday.range;
var thursdays = thursday.range;
var fridays = friday.range;
var saturdays = saturday.range;
