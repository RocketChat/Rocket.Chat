module.export({default:()=>getUTCWeek});let toDate;module.link("../../toDate/index.js",{default(v){toDate=v}},0);let startOfUTCWeek;module.link("../startOfUTCWeek/index.js",{default(v){startOfUTCWeek=v}},1);let startOfUTCWeekYear;module.link("../startOfUTCWeekYear/index.js",{default(v){startOfUTCWeekYear=v}},2);let requiredArgs;module.link("../requiredArgs/index.js",{default(v){requiredArgs=v}},3);



var MILLISECONDS_IN_WEEK = 604800000;
function getUTCWeek(dirtyDate, options) {
  requiredArgs(1, arguments);
  var date = toDate(dirtyDate);
  var diff = startOfUTCWeek(date, options).getTime() - startOfUTCWeekYear(date, options).getTime(); // Round the number of days to the nearest integer
  // because the number of milliseconds in a week is not constant
  // (e.g. it's different in the week of the daylight saving time clock shift)

  return Math.round(diff / MILLISECONDS_IN_WEEK) + 1;
}