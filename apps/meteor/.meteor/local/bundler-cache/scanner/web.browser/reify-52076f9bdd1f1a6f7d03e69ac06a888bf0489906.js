"use strict";
exports.intervalToDuration = intervalToDuration;
var _index = require("./add.js");
var _index2 = require("./differenceInDays.js");
var _index3 = require("./differenceInHours.js");
var _index4 = require("./differenceInMinutes.js");
var _index5 = require("./differenceInMonths.js");
var _index6 = require("./differenceInSeconds.js");
var _index7 = require("./differenceInYears.js");
var _index8 = require("./toDate.js");

/**
 * @name intervalToDuration
 * @category Common Helpers
 * @summary Convert interval to duration
 *
 * @description
 * Convert a interval object to a duration object.
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 *
 * @param interval - The interval to convert to duration
 *
 * @returns The duration object
 *
 * @example
 * // Get the duration between January 15, 1929 and April 4, 1968.
 * intervalToDuration({
 *   start: new Date(1929, 0, 15, 12, 0, 0),
 *   end: new Date(1968, 3, 4, 19, 5, 0)
 * })
 * // => { years: 39, months: 2, days: 20, hours: 7, minutes: 5, seconds: 0 }
 */
function intervalToDuration(interval) {
  const start = (0, _index8.toDate)(interval.start);
  const end = (0, _index8.toDate)(interval.end);

  const duration = {};

  const years = (0, _index7.differenceInYears)(end, start);
  if (years) duration.years = years;

  const remainingMonths = (0, _index.add)(start, { years: duration.years });

  const months = (0, _index5.differenceInMonths)(end, remainingMonths);
  if (months) duration.months = months;

  const remainingDays = (0, _index.add)(remainingMonths, {
    months: duration.months,
  });

  const days = (0, _index2.differenceInDays)(end, remainingDays);
  if (days) duration.days = days;

  const remainingHours = (0, _index.add)(remainingDays, {
    days: duration.days,
  });

  const hours = (0, _index3.differenceInHours)(end, remainingHours);
  if (hours) duration.hours = hours;

  const remainingMinutes = (0, _index.add)(remainingHours, {
    hours: duration.hours,
  });

  const minutes = (0, _index4.differenceInMinutes)(end, remainingMinutes);
  if (minutes) duration.minutes = minutes;

  const remainingSeconds = (0, _index.add)(remainingMinutes, {
    minutes: duration.minutes,
  });

  const seconds = (0, _index6.differenceInSeconds)(end, remainingSeconds);
  if (seconds) duration.seconds = seconds;

  return duration;
}
