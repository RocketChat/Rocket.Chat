"use strict";
exports.isLastDayOfMonth = isLastDayOfMonth;
var _index = require("./endOfDay.js");
var _index2 = require("./endOfMonth.js");
var _index3 = require("./toDate.js");

/**
 * @name isLastDayOfMonth
 * @category Month Helpers
 * @summary Is the given date the last day of a month?
 *
 * @description
 * Is the given date the last day of a month?
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 *
 * @param date - The date to check

 * @returns The date is the last day of a month
 *
 * @example
 * // Is 28 February 2014 the last day of a month?
 * const result = isLastDayOfMonth(new Date(2014, 1, 28))
 * //=> true
 */
function isLastDayOfMonth(date) {
  const _date = (0, _index3.toDate)(date);
  return +(0, _index.endOfDay)(_date) === +(0, _index2.endOfMonth)(_date);
}
