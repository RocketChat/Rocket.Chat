module.export({default:()=>intervalToDuration});let compareAsc;module.link("../compareAsc/index.js",{default(v){compareAsc=v}},0);let differenceInYears;module.link("../differenceInYears/index.js",{default(v){differenceInYears=v}},1);let differenceInMonths;module.link("../differenceInMonths/index.js",{default(v){differenceInMonths=v}},2);let differenceInDays;module.link("../differenceInDays/index.js",{default(v){differenceInDays=v}},3);let differenceInHours;module.link("../differenceInHours/index.js",{default(v){differenceInHours=v}},4);let differenceInMinutes;module.link("../differenceInMinutes/index.js",{default(v){differenceInMinutes=v}},5);let differenceInSeconds;module.link("../differenceInSeconds/index.js",{default(v){differenceInSeconds=v}},6);let isValid;module.link("../isValid/index.js",{default(v){isValid=v}},7);let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},8);let toDate;module.link("../toDate/index.js",{default(v){toDate=v}},9);let sub;module.link("../sub/index.js",{default(v){sub=v}},10);










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

function intervalToDuration(_ref) {
  var start = _ref.start,
      end = _ref.end;
  requiredArgs(1, arguments);
  var dateLeft = toDate(start);
  var dateRight = toDate(end);

  if (!isValid(dateLeft)) {
    throw new RangeError('Start Date is invalid');
  }

  if (!isValid(dateRight)) {
    throw new RangeError('End Date is invalid');
  }

  var duration = {
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };
  var sign = compareAsc(dateLeft, dateRight);
  duration.years = Math.abs(differenceInYears(dateLeft, dateRight));
  var remainingMonths = sub(dateLeft, {
    years: sign * duration.years
  });
  duration.months = Math.abs(differenceInMonths(remainingMonths, dateRight));
  var remainingDays = sub(remainingMonths, {
    months: sign * duration.months
  });
  duration.days = Math.abs(differenceInDays(remainingDays, dateRight));
  var remainingHours = sub(remainingDays, {
    days: sign * duration.days
  });
  duration.hours = Math.abs(differenceInHours(remainingHours, dateRight));
  var remainingMinutes = sub(remainingHours, {
    hours: sign * duration.hours
  });
  duration.minutes = Math.abs(differenceInMinutes(remainingMinutes, dateRight));
  var remainingSeconds = sub(remainingMinutes, {
    minutes: sign * duration.minutes
  });
  duration.seconds = Math.abs(differenceInSeconds(remainingSeconds, dateRight));
  return duration;
}