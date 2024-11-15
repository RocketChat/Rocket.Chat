module.export({default:()=>startOfUTCISOWeekYear});let getUTCISOWeekYear;module.link("../getUTCISOWeekYear/index.js",{default(v){getUTCISOWeekYear=v}},0);let startOfUTCISOWeek;module.link("../startOfUTCISOWeek/index.js",{default(v){startOfUTCISOWeek=v}},1);let requiredArgs;module.link("../requiredArgs/index.js",{default(v){requiredArgs=v}},2);

 // This function will be a part of public API when UTC function will be implemented.
// See issue: https://github.com/date-fns/date-fns/issues/376

function startOfUTCISOWeekYear(dirtyDate) {
  requiredArgs(1, arguments);
  var year = getUTCISOWeekYear(dirtyDate);
  var fourthOfJanuary = new Date(0);
  fourthOfJanuary.setUTCFullYear(year, 0, 4);
  fourthOfJanuary.setUTCHours(0, 0, 0, 0);
  var date = startOfUTCISOWeek(fourthOfJanuary);
  return date;
}