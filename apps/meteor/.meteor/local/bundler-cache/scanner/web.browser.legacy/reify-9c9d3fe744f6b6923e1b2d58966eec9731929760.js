"use strict";
exports.setISOWeekYear = setISOWeekYear;
var _index = require("./constructFrom.js");
var _index2 = require("./differenceInCalendarDays.js");
var _index3 = require("./startOfISOWeekYear.js");
var _index4 = require("./toDate.js");

/**
 * @name setISOWeekYear
 * @category ISO Week-Numbering Year Helpers
 * @summary Set the ISO week-numbering year to the given date.
 *
 * @description
 * Set the ISO week-numbering year to the given date,
 * saving the week number and the weekday number.
 *
 * ISO week-numbering year: http://en.wikipedia.org/wiki/ISO_week_date
 *
 * @typeParam DateType - The `Date` type, the function operates on. Gets inferred from passed arguments. Allows to use extensions like [`UTCDate`](https://github.com/date-fns/utc).
 *
 * @param date - The date to be changed
 * @param weekYear - The ISO week-numbering year of the new date
 *
 * @returns The new date with the ISO week-numbering year set
 *
 * @example
 * // Set ISO week-numbering year 2007 to 29 December 2008:
 * const result = setISOWeekYear(new Date(2008, 11, 29), 2007)
 * //=> Mon Jan 01 2007 00:00:00
 */
function setISOWeekYear(date, weekYear) {
  let _date = (0, _index4.toDate)(date);
  const diff = (0, _index2.differenceInCalendarDays)(
    _date,
    (0, _index3.startOfISOWeekYear)(_date),
  );
  const fourthOfJanuary = (0, _index.constructFrom)(date, 0);
  fourthOfJanuary.setFullYear(weekYear, 0, 4);
  fourthOfJanuary.setHours(0, 0, 0, 0);
  _date = (0, _index3.startOfISOWeekYear)(fourthOfJanuary);
  _date.setDate(_date.getDate() + diff);
  return _date;
}
