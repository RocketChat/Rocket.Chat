module.export({default:()=>secondsToMilliseconds});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let millisecondsInSecond;module.link("../constants/index.js",{millisecondsInSecond(v){millisecondsInSecond=v}},1);

/**
 * @name secondsToMilliseconds
 * @category Conversion Helpers
 * @summary Convert seconds to milliseconds.
 *
 * @description
 * Convert a number of seconds to a full number of milliseconds.
 *
 * @param {number} seconds - number of seconds to be converted
 *
 * @returns {number} the number of seconds converted in milliseconds
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 2 seconds into milliseconds
 * const result = secondsToMilliseconds(2)
 * //=> 2000
 */

function secondsToMilliseconds(seconds) {
  requiredArgs(1, arguments);
  return seconds * millisecondsInSecond;
}