"use strict";
exports.differenceInCalendarISOWeeks = differenceInCalendarISOWeeks;
var _index = require("./constants.js");
var _index2 = require("./startOfISOWeek.js");
var _index3 = require("./_lib/getTimezoneOffsetInMilliseconds.js");

/**
 * @name differenceInCalendarISOWeeks
 * @category ISO Week Helpers
 * @summary Get the number of calendar ISO weeks between the given dates.
 *
 * @description
 * Get the number of calendar ISO weeks between the given dates.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 *
 * @param dateLeft - The later date
 * @param dateRight - The earlier date
 *
 * @returns The number of calendar ISO weeks
 *
 * @example
 * // How many calendar ISO weeks are between 6 July 2014 and 21 July 2014?
 * const result = differenceInCalendarISOWeeks(
 *   new Date(2014, 6, 21),
 *   new Date(2014, 6, 6)
 * )
 * //=> 3
 */
function differenceInCalendarISOWeeks(dateLeft, dateRight) {
  const startOfISOWeekLeft = (0, _index2.startOfISOWeek)(dateLeft);
  const startOfISOWeekRight = (0, _index2.startOfISOWeek)(dateRight);

  const timestampLeft =
    +startOfISOWeekLeft -
    (0, _index3.getTimezoneOffsetInMilliseconds)(startOfISOWeekLeft);
  const timestampRight =
    +startOfISOWeekRight -
    (0, _index3.getTimezoneOffsetInMilliseconds)(startOfISOWeekRight);

  // Round the number of weeks to the nearest integer because the number of
  // milliseconds in a week is not constant (e.g. it's different in the week of
  // the daylight saving time clock shift).
  return Math.round(
    (timestampLeft - timestampRight) / _index.millisecondsInWeek,
  );
}
