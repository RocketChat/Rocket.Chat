"use strict";
exports.getDaysInYear = getDaysInYear;
var _index = require("./isLeapYear.js");
var _index2 = require("./toDate.js");

/**
 * @name getDaysInYear
 * @category Year Helpers
 * @summary Get the number of days in a year of the given date.
 *
 * @description
 * Get the number of days in a year of the given date.
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 *
 * @param date - The given date
 *
 * @returns The number of days in a year
 *
 * @example
 * // How many days are in 2012?
 * const result = getDaysInYear(new Date(2012, 0, 1))
 * //=> 366
 */
function getDaysInYear(date) {
  const _date = (0, _index2.toDate)(date);

  if (String(new Date(_date)) === "Invalid Date") {
    return NaN;
  }

  return (0, _index.isLeapYear)(_date) ? 366 : 365;
}
