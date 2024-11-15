module.export({default:()=>previousFriday});let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},0);let previousDay;module.link("../previousDay/index.js",{default(v){previousDay=v}},1);

/**
 * @name previousFriday
 * @category Weekday Helpers
 * @summary When is the previous Friday?
 *
 * @description
 * When is the previous Friday?
 *
 * @param {Date | number} date - the date to start counting from
 * @returns {Date} the previous Friday
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // When is the previous Friday before Jun, 19, 2021?
 * const result = previousFriday(new Date(2021, 5, 19))
 * //=> Fri June 18 2021 00:00:00
 */

function previousFriday(date) {
  requiredArgs(1, arguments);
  return previousDay(date, 5);
}