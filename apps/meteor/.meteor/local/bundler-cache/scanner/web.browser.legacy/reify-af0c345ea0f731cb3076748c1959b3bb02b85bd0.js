"use strict";
exports.eachQuarterOfInterval = eachQuarterOfInterval;
var _index = require("./addQuarters.js");
var _index2 = require("./startOfQuarter.js");
var _index3 = require("./toDate.js");

/**
 * The {@link eachQuarterOfInterval} function options.
 */

/**
 * @name eachQuarterOfInterval
 * @category Interval Helpers
 * @summary Return the array of quarters within the specified time interval.
 *
 * @description
 * Return the array of quarters within the specified time interval.
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 *
 * @param interval - The interval
 *
 * @returns The array with starts of quarters from the quarter of the interval start to the quarter of the interval end
 *
 * @example
 * // Each quarter within interval 6 February 2014 - 10 August 2014:
 * const result = eachQuarterOfInterval({
 *   start: new Date(2014, 1, 6),
 *   end: new Date(2014, 7, 10)
 * })
 * //=> [
 * //   Wed Jan 01 2014 00:00:00,
 * //   Tue Apr 01 2014 00:00:00,
 * //   Tue Jul 01 2014 00:00:00,
 * // ]
 */
function eachQuarterOfInterval(interval, options) {
  const startDate = (0, _index3.toDate)(interval.start);
  const endDate = (0, _index3.toDate)(interval.end);

  let reversed = +startDate > +endDate;
  const endTime = reversed
    ? +(0, _index2.startOfQuarter)(startDate)
    : +(0, _index2.startOfQuarter)(endDate);
  let currentDate = reversed
    ? (0, _index2.startOfQuarter)(endDate)
    : (0, _index2.startOfQuarter)(startDate);

  let step = options?.step ?? 1;
  if (!step) return [];
  if (step < 0) {
    step = -step;
    reversed = !reversed;
  }

  const dates = [];

  while (+currentDate <= endTime) {
    dates.push((0, _index3.toDate)(currentDate));
    currentDate = (0, _index.addQuarters)(currentDate, step);
  }

  return reversed ? dates.reverse() : dates;
}
