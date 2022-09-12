module.export({default:()=>yearsToQuarters});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let quartersInYear;module.link("../constants/index.js",{quartersInYear(v){quartersInYear=v}},1);

/**
 * @name yearsToQuarters
 * @category Conversion Helpers
 * @summary Convert years to quarters.
 *
 * @description
 * Convert a number of years to a full number of quarters.
 *
 * @param {number} years - number of years to be converted
 *
 * @returns {number} the number of years converted in quarters
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 2 years to quarters
 * const result = yearsToQuarters(2)
 * //=> 8
 */

function yearsToQuarters(years) {
  requiredArgs(1, arguments);
  return Math.floor(years * quartersInYear);
}