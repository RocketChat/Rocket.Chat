module.export({default:()=>addISOWeekYears});let toInteger;module.link("../_lib/toInteger/index.js",{default(v){toInteger=v}},0);let getISOWeekYear;module.link("../getISOWeekYear/index.js",{default(v){getISOWeekYear=v}},1);let setISOWeekYear;module.link("../setISOWeekYear/index.js",{default(v){setISOWeekYear=v}},2);let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},3);



/**
 * @name addISOWeekYears
 * @category ISO Week-Numbering Year Helpers
 * @summary Add the specified number of ISO week-numbering years to the given date.
 *
 * @description
 * Add the specified number of ISO week-numbering years to the given date.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @param {Date|Number} date - the date to be changed
 * @param {Number} amount - the amount of ISO week-numbering years to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
 * @returns {Date} the new date with the ISO week-numbering years added
 * @throws {TypeError} 2 arguments required
 *
 * @example
 * // Add 5 ISO week-numbering years to 2 July 2010:
 * const result = addISOWeekYears(new Date(2010, 6, 2), 5)
 * //=> Fri Jun 26 2015 00:00:00
 */

function addISOWeekYears(dirtyDate, dirtyAmount) {
  requiredArgs(2, arguments);
  var amount = toInteger(dirtyAmount);
  return setISOWeekYear(dirtyDate, getISOWeekYear(dirtyDate) + amount);
}