module.export({default:()=>previousSunday});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let previousDay;module.link("../previousDay/index.js",{default(v){previousDay=v}},1);

/**
 * @name previousSunday
 * @category Weekday Helpers
 * @summary When is the previous Sunday?
 *
 * @description
 * When is the previous Sunday?
 *
 * @param {Date | number} date - the date to start counting from
 * @returns {Date} the previous Sunday
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // When is the previous Sunday before Jun, 21, 2021?
 * const result = previousSunday(new Date(2021, 5, 21))
 * //=> Sun June 20 2021 00:00:00
 */

function previousSunday(date) {
  requiredArgs(1, arguments);
  return previousDay(date, 0);
}