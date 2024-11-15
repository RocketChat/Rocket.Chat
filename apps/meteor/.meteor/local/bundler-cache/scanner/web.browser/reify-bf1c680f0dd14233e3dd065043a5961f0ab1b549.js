module.export({default:()=>setUTCISOWeek});let toInteger;module.link("../toInteger/index.js",{default(v){toInteger=v}},0);let toDate;module.link("../../toDate/index.js",{default(v){toDate=v}},1);let getUTCISOWeek;module.link("../getUTCISOWeek/index.js",{default(v){getUTCISOWeek=v}},2);let requiredArgs;module.link("../requiredArgs/index.js",{default(v){requiredArgs=v}},3);



function setUTCISOWeek(dirtyDate, dirtyISOWeek) {
  requiredArgs(2, arguments);
  var date = toDate(dirtyDate);
  var isoWeek = toInteger(dirtyISOWeek);
  var diff = getUTCISOWeek(date) - isoWeek;
  date.setUTCDate(date.getUTCDate() - diff * 7);
  return date;
}