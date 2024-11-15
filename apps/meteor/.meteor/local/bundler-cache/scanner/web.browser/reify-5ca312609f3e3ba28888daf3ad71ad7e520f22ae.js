module.export({default:()=>eachWeekendOfInterval});let eachDayOfInterval;module.link("../eachDayOfInterval/index.js",{default(v){eachDayOfInterval=v}},0);let isSunday;module.link("../isSunday/index.js",{default(v){isSunday=v}},1);let isWeekend;module.link("../isWeekend/index.js",{default(v){isWeekend=v}},2);let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},3);



/**
 * @name eachWeekendOfInterval
 * @category Interval Helpers
 * @summary List all the Saturdays and Sundays in the given date interval.
 *
 * @description
 * Get all the Saturdays and Sundays in the given date interval.
 *
 * @param {Interval} interval - the given interval. See [Interval]{@link https://date-fns.org/docs/Interval}
 * @returns {Date[]} an array containing all the Saturdays and Sundays
 * @throws {TypeError} 1 argument required
 * @throws {RangeError} The start of an interval cannot be after its end
 * @throws {RangeError} Date in interval cannot be `Invalid Date`
 *
 * @example
 * // Lists all Saturdays and Sundays in the given date interval
 * const result = eachWeekendOfInterval({
 *   start: new Date(2018, 8, 17),
 *   end: new Date(2018, 8, 30)
 * })
 * //=> [
 * //   Sat Sep 22 2018 00:00:00,
 * //   Sun Sep 23 2018 00:00:00,
 * //   Sat Sep 29 2018 00:00:00,
 * //   Sun Sep 30 2018 00:00:00
 * // ]
 */

function eachWeekendOfInterval(interval) {
  requiredArgs(1, arguments);
  var dateInterval = eachDayOfInterval(interval);
  var weekends = [];
  var index = 0;

  while (index < dateInterval.length) {
    var date = dateInterval[index++];

    if (isWeekend(date)) {
      weekends.push(date);
      if (isSunday(date)) index = index + 5;
    }
  }

  return weekends;
}