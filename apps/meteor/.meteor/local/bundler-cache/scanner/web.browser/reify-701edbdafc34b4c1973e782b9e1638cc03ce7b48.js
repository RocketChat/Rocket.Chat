module.export({default:()=>millisecondsToHours});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let millisecondsInHour;module.link("../constants/index.js",{millisecondsInHour(v){millisecondsInHour=v}},1);

/**
 * @name millisecondsToHours
 * @category Conversion Helpers
 * @summary Convert milliseconds to hours.
 *
 * @description
 * Convert a number of milliseconds to a full number of hours.
 *
 * @param {number} milliseconds - number of milliseconds to be converted
 *
 * @returns {number} the number of milliseconds converted in hours
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 7200000 milliseconds to hours:
 * const result = millisecondsToHours(7200000)
 * //=> 2
 *
 * @example
 * // It uses floor rounding:
 * const result = millisecondsToHours(7199999)
 * //=> 1
 */

function millisecondsToHours(milliseconds) {
  requiredArgs(1, arguments);
  var hours = milliseconds / millisecondsInHour;
  return Math.floor(hours);
}