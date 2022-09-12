module.export({default:()=>getUTCISOWeek});let toDate;module.link("../../toDate/index.js",{default(v){toDate=v}},0);let startOfUTCISOWeek;module.link("../startOfUTCISOWeek/index.js",{default(v){startOfUTCISOWeek=v}},1);let startOfUTCISOWeekYear;module.link("../startOfUTCISOWeekYear/index.js",{default(v){startOfUTCISOWeekYear=v}},2);let requiredArgs;module.link("../requiredArgs/index.js",{default(v){requiredArgs=v}},3);



var MILLISECONDS_IN_WEEK = 604800000;
function getUTCISOWeek(dirtyDate) {
  requiredArgs(1, arguments);
  var date = toDate(dirtyDate);
  var diff = startOfUTCISOWeek(date).getTime() - startOfUTCISOWeekYear(date).getTime(); // Round the number of days to the nearest integer
  // because the number of milliseconds in a week is not constant
  // (e.g. it's different in the week of the daylight saving time clock shift)

  return Math.round(diff / MILLISECONDS_IN_WEEK) + 1;
}