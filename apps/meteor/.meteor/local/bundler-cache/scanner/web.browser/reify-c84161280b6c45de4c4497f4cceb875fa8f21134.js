module.export({default:()=>daysToWeeks});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let daysInWeek;module.link("../constants/index.js",{daysInWeek(v){daysInWeek=v}},1);

/**
 * @name daysToWeeks
 * @category Conversion Helpers
 * @summary Convert days to weeks.
 *
 * @description
 * Convert a number of days to a full number of weeks.
 *
 * @param {number} days - number of days to be converted
 *
 * @returns {number} the number of days converted in weeks
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 14 days to weeks:
 * const result = daysToWeeks(14)
 * //=> 2
 *
 * @example
 * // It uses floor rounding:
 * const result = daysToWeeks(13)
 * //=> 1
 */

function daysToWeeks(days) {
  requiredArgs(1, arguments);
  var weeks = days / daysInWeek;
  return Math.floor(weeks);
}