module.export({default:()=>startOfUTCISOWeek});let toDate;module.link("../../toDate/index.js",{default(v){toDate=v}},0);let requiredArgs;module.link("../requiredArgs/index.js",{default(v){requiredArgs=v}},1);

function startOfUTCISOWeek(dirtyDate) {
  requiredArgs(1, arguments);
  var weekStartsOn = 1;
  var date = toDate(dirtyDate);
  var day = date.getUTCDay();
  var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  date.setUTCDate(date.getUTCDate() - diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}