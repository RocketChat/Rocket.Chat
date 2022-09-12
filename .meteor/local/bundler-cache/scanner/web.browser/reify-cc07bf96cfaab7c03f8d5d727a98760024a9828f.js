module.export({default:()=>nextThursday});let nextDay;module.link("../nextDay/index.js",{default(v){nextDay=v}},0);let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},1);

/**
 * @name nextThursday
 * @category Weekday Helpers
 * @summary When is the next Thursday?
 *
 * @description
 * When is the next Thursday?
 *
 * @param {Date | number} date - the date to start counting from
 * @returns {Date} the next Thursday
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // When is the next Thursday after Mar, 22, 2020?
 * const result = nextThursday(new Date(2020, 2, 22))
 * //=> Thur Mar 26 2020 00:00:00
 */

function nextThursday(date) {
  requiredArgs(1, arguments);
  return nextDay(date, 4);
}