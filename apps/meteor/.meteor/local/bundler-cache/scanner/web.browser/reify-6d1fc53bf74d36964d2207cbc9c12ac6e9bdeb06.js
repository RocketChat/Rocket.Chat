module.export({default:()=>getUTCDayOfYear});let toDate;module.link("../../toDate/index.js",{default(v){toDate=v}},0);let requiredArgs;module.link("../requiredArgs/index.js",{default(v){requiredArgs=v}},1);

var MILLISECONDS_IN_DAY = 86400000;
function getUTCDayOfYear(dirtyDate) {
  requiredArgs(1, arguments);
  var date = toDate(dirtyDate);
  var timestamp = date.getTime();
  date.setUTCMonth(0, 1);
  date.setUTCHours(0, 0, 0, 0);
  var startOfYearTimestamp = date.getTime();
  var difference = timestamp - startOfYearTimestamp;
  return Math.floor(difference / MILLISECONDS_IN_DAY) + 1;
}