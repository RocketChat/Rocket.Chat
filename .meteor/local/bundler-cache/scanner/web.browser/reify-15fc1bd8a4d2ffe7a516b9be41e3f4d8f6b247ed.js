module.export({default:()=>previousThursday});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let previousDay;module.link("../previousDay/index.js",{default(v){previousDay=v}},1);

/**
 * @name previousThursday
 * @category Weekday Helpers
 * @summary When is the previous Thursday?
 *
 * @description
 * When is the previous Thursday?
 *
 * @param {Date | number} date - the date to start counting from
 * @returns {Date} the previous Thursday
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // When is the previous Thursday before Jun, 18, 2021?
 * const result = previousThursday(new Date(2021, 5, 18))
 * //=> Thu June 17 2021 00:00:00
 */

function previousThursday(date) {
  requiredArgs(1, arguments);
  return previousDay(date, 4);
}