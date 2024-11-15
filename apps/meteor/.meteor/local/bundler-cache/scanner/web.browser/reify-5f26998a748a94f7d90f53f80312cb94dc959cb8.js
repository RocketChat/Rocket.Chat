"use strict";
exports.differenceInHours = differenceInHours;
var _index = require("./_lib/getRoundingMethod.js");
var _index2 = require("./constants.js");
var _index3 = require("./differenceInMilliseconds.js");

/**
 * The {@link differenceInHours} function options.
 */

/**
 * @name differenceInHours
 * @category Hour Helpers
 * @summary Get the number of hours between the given dates.
 *
 * @description
 * Get the number of hours between the given dates.
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 *
 * @param dateLeft - The later date
 * @param dateRight - The earlier date
 * @param options - An object with options.
 *
 * @returns The number of hours
 *
 * @example
 * // How many hours are between 2 July 2014 06:50:00 and 2 July 2014 19:00:00?
 * const result = differenceInHours(
 *   new Date(2014, 6, 2, 19, 0),
 *   new Date(2014, 6, 2, 6, 50)
 * )
 * //=> 12
 */
function differenceInHours(dateLeft, dateRight, options) {
  const diff =
    (0, _index3.differenceInMilliseconds)(dateLeft, dateRight) /
    _index2.millisecondsInHour;
  return (0, _index.getRoundingMethod)(options?.roundingMethod)(diff);
}
