module.export({default:()=>minutesToMilliseconds});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let millisecondsInMinute;module.link("../constants/index.js",{millisecondsInMinute(v){millisecondsInMinute=v}},1);

/**
 * @name minutesToMilliseconds
 * @category Conversion Helpers
 * @summary Convert minutes to milliseconds.
 *
 * @description
 * Convert a number of minutes to a full number of milliseconds.
 *
 * @param {number} minutes - number of minutes to be converted
 *
 * @returns {number} the number of minutes converted in milliseconds
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 2 minutes to milliseconds
 * const result = minutesToMilliseconds(2)
 * //=> 120000
 */

function minutesToMilliseconds(minutes) {
  requiredArgs(1, arguments);
  return Math.floor(minutes * millisecondsInMinute);
}