module.export({default:()=>intervalToDuration});let compareAsc;module.link("../compareAsc/index.js",{default(v){compareAsc=v}},0);let add;module.link("../add/index.js",{default(v){add=v}},1);let differenceInDays;module.link("../differenceInDays/index.js",{default(v){differenceInDays=v}},2);let differenceInHours;module.link("../differenceInHours/index.js",{default(v){differenceInHours=v}},3);let differenceInMinutes;module.link("../differenceInMinutes/index.js",{default(v){differenceInMinutes=v}},4);let differenceInMonths;module.link("../differenceInMonths/index.js",{default(v){differenceInMonths=v}},5);let differenceInSeconds;module.link("../differenceInSeconds/index.js",{default(v){differenceInSeconds=v}},6);let differenceInYears;module.link("../differenceInYears/index.js",{default(v){differenceInYears=v}},7);let toDate;module.link("../toDate/index.js",{default(v){toDate=v}},8);let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},9);









/**
 * @name intervalToDuration
 * @category Common Helpers
 * @summary Convert interval to duration
 *
 * @description
 * Convert a interval object to a duration object.
 *
 * @param {Interval} interval - the interval to convert to duration
 *
 * @returns {Duration} The duration Object
 * @throws {TypeError} Requires 2 arguments
 * @throws {RangeError} `start` must not be Invalid Date
 * @throws {RangeError} `end` must not be Invalid Date
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
  requiredArgs(1, arguments);
  var start = toDate(interval.start);
  var end = toDate(interval.end);
  if (isNaN(start.getTime())) throw new RangeError('Start Date is invalid');
  if (isNaN(end.getTime())) throw new RangeError('End Date is invalid');
  var duration = {};
  duration.years = Math.abs(differenceInYears(end, start));
  var sign = compareAsc(end, start);
  var remainingMonths = add(start, {
    years: sign * duration.years
  });
  duration.months = Math.abs(differenceInMonths(end, remainingMonths));
  var remainingDays = add(remainingMonths, {
    months: sign * duration.months
  });
  duration.days = Math.abs(differenceInDays(end, remainingDays));
  var remainingHours = add(remainingDays, {
    days: sign * duration.days
  });
  duration.hours = Math.abs(differenceInHours(end, remainingHours));
  var remainingMinutes = add(remainingHours, {
    hours: sign * duration.hours
  });
  duration.minutes = Math.abs(differenceInMinutes(end, remainingMinutes));
  var remainingSeconds = add(remainingMinutes, {
    minutes: sign * duration.minutes
  });
  duration.seconds = Math.abs(differenceInSeconds(end, remainingSeconds));
  return duration;
}