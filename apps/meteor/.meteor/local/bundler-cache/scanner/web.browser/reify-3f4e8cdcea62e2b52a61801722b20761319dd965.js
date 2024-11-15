module.export({default:()=>monthsToQuarters});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let monthsInQuarter;module.link("../constants/index.js",{monthsInQuarter(v){monthsInQuarter=v}},1);

/**
 * @name monthsToQuarters
 * @category Conversion Helpers
 * @summary Convert number of months to quarters.
 *
 * @description
 * Convert a number of months to a full number of quarters.
 *
 * @param {number} months - number of months to be converted.
 *
 * @returns {number} the number of months converted in quarters
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 6 months to quarters:
 * const result = monthsToQuarters(6)
 * //=> 2
 *
 * @example
 * // It uses floor rounding:
 * const result = monthsToQuarters(7)
 * //=> 2
 */

function monthsToQuarters(months) {
  requiredArgs(1, arguments);
  var quarters = months / monthsInQuarter;
  return Math.floor(quarters);
}