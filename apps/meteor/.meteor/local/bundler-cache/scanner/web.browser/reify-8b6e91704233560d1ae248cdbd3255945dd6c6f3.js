module.export({default:()=>quartersToMonths});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let monthsInQuarter;module.link("../constants/index.js",{monthsInQuarter(v){monthsInQuarter=v}},1);

/**
 * @name quartersToMonths
 * @category Conversion Helpers
 * @summary Convert number of quarters to months.
 *
 * @description
 * Convert a number of quarters to a full number of months.
 *
 * @param {number} quarters - number of quarters to be converted
 *
 * @returns {number} the number of quarters converted in months
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 2 quarters to months
 * const result = quartersToMonths(2)
 * //=> 6
 */

function quartersToMonths(quarters) {
  requiredArgs(1, arguments);
  return Math.floor(quarters * monthsInQuarter);
}