module.export({default:()=>hoursToMinutes});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let minutesInHour;module.link("../constants/index.js",{minutesInHour(v){minutesInHour=v}},1);

/**
 * @name hoursToMinutes
 * @category Conversion Helpers
 * @summary Convert hours to minutes.
 *
 * @description
 * Convert a number of hours to a full number of minutes.
 *
 * @param {number} hours - number of hours to be converted
 *
 * @returns {number} the number of hours converted in minutes
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Convert 2 hours to minutes:
 * const result = hoursToMinutes(2)
 * //=> 120
 */

function hoursToMinutes(hours) {
  requiredArgs(1, arguments);
  return Math.floor(hours * minutesInHour);
}