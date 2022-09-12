module.export({default:()=>getDaysInYear});let toDate;module.link("../toDate/index.js",{default(v){toDate=v}},0);let isLeapYear;module.link("../isLeapYear/index.js",{default(v){isLeapYear=v}},1);let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},2);


/**
 * @name getDaysInYear
 * @category Year Helpers
 * @summary Get the number of days in a year of the given date.
 *
 * @description
 * Get the number of days in a year of the given date.
 *
 * @param {Date|Number} date - the given date
 * @returns {Number} the number of days in a year
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // How many days are in 2012?
 * const result = getDaysInYear(new Date(2012, 0, 1))
 * //=> 366
 */

function getDaysInYear(dirtyDate) {
  requiredArgs(1, arguments);
  var date = toDate(dirtyDate);

  if (String(new Date(date)) === 'Invalid Date') {
    return NaN;
  }

  return isLeapYear(date) ? 366 : 365;
}