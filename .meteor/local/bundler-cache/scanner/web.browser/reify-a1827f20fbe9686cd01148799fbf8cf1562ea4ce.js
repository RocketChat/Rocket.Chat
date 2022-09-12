module.export({default:()=>quartersToYears});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let quartersInYear;module.link("../constants/index.js",{quartersInYear(v){quartersInYear=v}},1);

/**
 * @name quartersToYears
 * @category Conversion Helpers
 * @summary Convert number of quarters to years.
 *
 * @description
 * Convert a number of quarters to a full number of years.
 *
 * @param {number} quarters - number of quarters to be converted
 *
 * @returns {number} the number of quarters converted in years
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 8 quarters to years
 * const result = quartersToYears(8)
 * //=> 2
 *
 * @example
 * // It uses floor rounding:
 * const result = quartersToYears(11)
 * //=> 2
 */

function quartersToYears(quarters) {
  requiredArgs(1, arguments);
  var years = quarters / quartersInYear;
  return Math.floor(years);
}