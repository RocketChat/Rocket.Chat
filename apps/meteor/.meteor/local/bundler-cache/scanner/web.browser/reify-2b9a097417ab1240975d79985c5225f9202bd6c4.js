module.export({default:()=>weeksToDays});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let daysInWeek;module.link("../constants/index.js",{daysInWeek(v){daysInWeek=v}},1);

/**
 * @name weeksToDays
 * @category Conversion Helpers
 * @summary Convert weeks to days.
 *
 * @description
 * Convert a number of weeks to a full number of days.
 *
 * @param {number} weeks - number of weeks to be converted
 *
 * @returns {number} the number of weeks converted in days
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 2 weeks into days
 * const result = weeksToDays(2)
 * //=> 14
 */

function weeksToDays(weeks) {
  requiredArgs(1, arguments);
  return Math.floor(weeks * daysInWeek);
}