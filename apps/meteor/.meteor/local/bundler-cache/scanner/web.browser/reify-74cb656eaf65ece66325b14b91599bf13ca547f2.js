module.export({default:()=>previousMonday});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let previousDay;module.link("../previousDay/index.js",{default(v){previousDay=v}},1);

/**
 * @name previousMonday
 * @category Weekday Helpers
 * @summary When is the previous Monday?
 *
 * @description
 * When is the previous Monday?
 *
 * @param {Date | number} date - the date to start counting from
 * @returns {Date} the previous Monday
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // When is the previous Monday before Jun, 18, 2021?
 * const result = previousMonday(new Date(2021, 5, 18))
 * //=> Mon June 14 2021 00:00:00
 */

function previousMonday(date) {
  requiredArgs(1, arguments);
  return previousDay(date, 1);
}