module.export({default:()=>getDayOfYear});let toDate;module.link("../toDate/index.js",{default(v){toDate=v}},0);let startOfYear;module.link("../startOfYear/index.js",{default(v){startOfYear=v}},1);let differenceInCalendarDays;module.link("../differenceInCalendarDays/index.js",{default(v){differenceInCalendarDays=v}},2);let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},3);



/**
 * @name getDayOfYear
 * @category Day Helpers
 * @summary Get the day of the year of the given date.
 *
 * @description
 * Get the day of the year of the given date.
 *
 * @param {Date|Number} date - the given date
 * @returns {Number} the day of year
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Which day of the year is 2 July 2014?
 * const result = getDayOfYear(new Date(2014, 6, 2))
 * //=> 183
 */

function getDayOfYear(dirtyDate) {
  requiredArgs(1, arguments);
  var date = toDate(dirtyDate);
  var diff = differenceInCalendarDays(date, startOfYear(date));
  var dayOfYear = diff + 1;
  return dayOfYear;
}