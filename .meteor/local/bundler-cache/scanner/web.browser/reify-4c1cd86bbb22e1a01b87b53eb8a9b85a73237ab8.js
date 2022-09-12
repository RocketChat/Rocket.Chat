module.export({default:()=>eachWeekendOfYear});let eachWeekendOfInterval;module.link("../eachWeekendOfInterval/index.js",{default(v){eachWeekendOfInterval=v}},0);let endOfYear;module.link("../endOfYear/index.js",{default(v){endOfYear=v}},1);let startOfYear;module.link("../startOfYear/index.js",{default(v){startOfYear=v}},2);let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},3);



/**
 * @name eachWeekendOfYear
 * @category Year Helpers
 * @summary List all the Saturdays and Sundays in the year.
 *
 * @description
 * Get all the Saturdays and Sundays in the year.
 *
 * @param {Date|Number} date - the given year
 * @returns {Date[]} an array containing all the Saturdays and Sundays
 * @throws {TypeError} 1 argument required
 * @throws {RangeError} The passed date is invalid
 *
 * @example
 * // Lists all Saturdays and Sundays in the year
 * const result = eachWeekendOfYear(new Date(2020, 1, 1))
 * //=> [
 * //   Sat Jan 03 2020 00:00:00,
 * //   Sun Jan 04 2020 00:00:00,
 * //   ...
 * //   Sun Dec 27 2020 00:00:00
 * // ]
 * ]
 */

function eachWeekendOfYear(dirtyDate) {
  requiredArgs(1, arguments);
  var startDate = startOfYear(dirtyDate);
  var endDate = endOfYear(dirtyDate);
  return eachWeekendOfInterval({
    start: startDate,
    end: endDate
  });
}