module.export({default:()=>eachWeekendOfMonth});let eachWeekendOfInterval;module.link("../eachWeekendOfInterval/index.js",{default(v){eachWeekendOfInterval=v}},0);let startOfMonth;module.link("../startOfMonth/index.js",{default(v){startOfMonth=v}},1);let endOfMonth;module.link("../endOfMonth/index.js",{default(v){endOfMonth=v}},2);let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},3);



/**
 * @name eachWeekendOfMonth
 * @category Month Helpers
 * @summary List all the Saturdays and Sundays in the given month.
 *
 * @description
 * Get all the Saturdays and Sundays in the given month.
 *
 * @param {Date|Number} date - the given month
 * @returns {Date[]} an array containing all the Saturdays and Sundays
 * @throws {TypeError} 1 argument required
 * @throws {RangeError} The passed date is invalid
 *
 * @example
 * // Lists all Saturdays and Sundays in the given month
 * const result = eachWeekendOfMonth(new Date(2022, 1, 1))
 * //=> [
 * //   Sat Feb 05 2022 00:00:00,
 * //   Sun Feb 06 2022 00:00:00,
 * //   Sat Feb 12 2022 00:00:00,
 * //   Sun Feb 13 2022 00:00:00,
 * //   Sat Feb 19 2022 00:00:00,
 * //   Sun Feb 20 2022 00:00:00,
 * //   Sat Feb 26 2022 00:00:00,
 * //   Sun Feb 27 2022 00:00:00
 * // ]
 */

function eachWeekendOfMonth(dirtyDate) {
  requiredArgs(1, arguments);
  var startDate = startOfMonth(dirtyDate);
  if (isNaN(startDate.getTime())) throw new RangeError('The passed date is invalid');
  var endDate = endOfMonth(dirtyDate);
  return eachWeekendOfInterval({
    start: startDate,
    end: endDate
  });
}