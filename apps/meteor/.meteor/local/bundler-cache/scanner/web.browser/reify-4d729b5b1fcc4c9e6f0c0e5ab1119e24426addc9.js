module.export({default:()=>monthsToYears});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let monthsInYear;module.link("../constants/index.js",{monthsInYear(v){monthsInYear=v}},1);

/**
 * @name monthsToYears
 * @category Conversion Helpers
 * @summary Convert number of months to years.
 *
 * @description
 * Convert a number of months to a full number of years.
 *
 * @param {number} months - number of months to be converted
 *
 * @returns {number} the number of months converted in years
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 36 months to years:
 * const result = monthsToYears(36)
 * //=> 3
 *
 * // It uses floor rounding:
 * const result = monthsToYears(40)
 * //=> 3
 */

function monthsToYears(months) {
  requiredArgs(1, arguments);
  var years = months / monthsInYear;
  return Math.floor(years);
}