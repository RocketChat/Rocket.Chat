module.export({default:()=>minutesToSeconds});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let secondsInMinute;module.link("../constants/index.js",{secondsInMinute(v){secondsInMinute=v}},1);

/**
 * @name minutesToSeconds
 * @category Conversion Helpers
 * @summary Convert minutes to seconds.
 *
 * @description
 * Convert a number of minutes to a full number of seconds.
 *
 * @param { number } minutes - number of minutes to be converted
 *
 * @returns {number} the number of minutes converted in seconds
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 2 minutes to seconds
 * const result = minutesToSeconds(2)
 * //=> 120
 */

function minutesToSeconds(minutes) {
  requiredArgs(1, arguments);
  return Math.floor(minutes * secondsInMinute);
}