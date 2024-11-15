module.export({default:()=>startOfUTCWeekYear});let getUTCWeekYear;module.link("../getUTCWeekYear/index.js",{default(v){getUTCWeekYear=v}},0);let requiredArgs;module.link("../requiredArgs/index.js",{default(v){requiredArgs=v}},1);let startOfUTCWeek;module.link("../startOfUTCWeek/index.js",{default(v){startOfUTCWeek=v}},2);let toInteger;module.link("../toInteger/index.js",{default(v){toInteger=v}},3);


 // This function will be a part of public API when UTC function will be implemented.
// See issue: https://github.com/date-fns/date-fns/issues/376

function startOfUTCWeekYear(dirtyDate, dirtyOptions) {
  requiredArgs(1, arguments);
  var options = dirtyOptions || {};
  var locale = options.locale;
  var localeFirstWeekContainsDate = locale && locale.options && locale.options.firstWeekContainsDate;
  var defaultFirstWeekContainsDate = localeFirstWeekContainsDate == null ? 1 : toInteger(localeFirstWeekContainsDate);
  var firstWeekContainsDate = options.firstWeekContainsDate == null ? defaultFirstWeekContainsDate : toInteger(options.firstWeekContainsDate);
  var year = getUTCWeekYear(dirtyDate, dirtyOptions);
  var firstWeek = new Date(0);
  firstWeek.setUTCFullYear(year, 0, firstWeekContainsDate);
  firstWeek.setUTCHours(0, 0, 0, 0);
  var date = startOfUTCWeek(firstWeek, dirtyOptions);
  return date;
}