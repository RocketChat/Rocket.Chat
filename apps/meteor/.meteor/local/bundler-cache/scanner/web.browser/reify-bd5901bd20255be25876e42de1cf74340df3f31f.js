module.export({default:()=>yearsToMonths});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let monthsInYear;module.link("../constants/index.js",{monthsInYear(v){monthsInYear=v}},1);

/**
 * @name yearsToMonths
 * @category Conversion Helpers
 * @summary Convert years to months.
 *
 * @description
 * Convert a number of years to a full number of months.
 *
 * @param {number} years - number of years to be converted
 *
 * @returns {number} the number of years converted in months
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 2 years into months
 * const result = yearsToMonths(2)
 * //=> 24
 */

function yearsToMonths(years) {
  requiredArgs(1, arguments);
  return Math.floor(years * monthsInYear);
}