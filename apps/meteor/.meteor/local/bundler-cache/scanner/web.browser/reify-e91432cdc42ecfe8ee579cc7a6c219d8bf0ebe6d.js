module.export({default:()=>millisecondsToSeconds});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let millisecondsInSecond;module.link("../constants/index.js",{millisecondsInSecond(v){millisecondsInSecond=v}},1);

/**
 * @name millisecondsToSeconds
 * @category Conversion Helpers
 * @summary Convert milliseconds to seconds.
 *
 * @description
 * Convert a number of milliseconds to a full number of seconds.
 *
 * @param {number} milliseconds - number of milliseconds to be converted
 *
 * @returns {number} the number of milliseconds converted in seconds
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 1000 miliseconds to seconds:
 * const result = millisecondsToSeconds(1000)
 * //=> 1
 *
 * @example
 * // It uses floor rounding:
 * const result = millisecondsToSeconds(1999)
 * //=> 1
 */

function millisecondsToSeconds(milliseconds) {
  requiredArgs(1, arguments);
  var seconds = milliseconds / millisecondsInSecond;
  return Math.floor(seconds);
}