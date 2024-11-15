module.export({default:()=>setUTCWeek});let toInteger;module.link("../toInteger/index.js",{default(v){toInteger=v}},0);let toDate;module.link("../../toDate/index.js",{default(v){toDate=v}},1);let getUTCWeek;module.link("../getUTCWeek/index.js",{default(v){getUTCWeek=v}},2);let requiredArgs;module.link("../requiredArgs/index.js",{default(v){requiredArgs=v}},3);



function setUTCWeek(dirtyDate, dirtyWeek, options) {
  requiredArgs(2, arguments);
  var date = toDate(dirtyDate);
  var week = toInteger(dirtyWeek);
  var diff = getUTCWeek(date, options) - week;
  date.setUTCDate(date.getUTCDate() - diff * 7);
  return date;
}