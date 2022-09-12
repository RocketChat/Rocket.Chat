module.export({parsers:()=>parsers});let EraParser;module.link("./EraParser.js",{EraParser(v){EraParser=v}},0);let YearParser;module.link("./YearParser.js",{YearParser(v){YearParser=v}},1);let LocalWeekYearParser;module.link("./LocalWeekYearParser.js",{LocalWeekYearParser(v){LocalWeekYearParser=v}},2);let ISOWeekYearParser;module.link("./ISOWeekYearParser.js",{ISOWeekYearParser(v){ISOWeekYearParser=v}},3);let ExtendedYearParser;module.link("./ExtendedYearParser.js",{ExtendedYearParser(v){ExtendedYearParser=v}},4);let QuarterParser;module.link("./QuarterParser.js",{QuarterParser(v){QuarterParser=v}},5);let StandAloneQuarterParser;module.link("./StandAloneQuarterParser.js",{StandAloneQuarterParser(v){StandAloneQuarterParser=v}},6);let MonthParser;module.link("./MonthParser.js",{MonthParser(v){MonthParser=v}},7);let StandAloneMonthParser;module.link("./StandAloneMonthParser.js",{StandAloneMonthParser(v){StandAloneMonthParser=v}},8);let LocalWeekParser;module.link("./LocalWeekParser.js",{LocalWeekParser(v){LocalWeekParser=v}},9);let ISOWeekParser;module.link("./ISOWeekParser.js",{ISOWeekParser(v){ISOWeekParser=v}},10);let DateParser;module.link("./DateParser.js",{DateParser(v){DateParser=v}},11);let DayOfYearParser;module.link("./DayOfYearParser.js",{DayOfYearParser(v){DayOfYearParser=v}},12);let DayParser;module.link("./DayParser.js",{DayParser(v){DayParser=v}},13);let LocalDayParser;module.link("./LocalDayParser.js",{LocalDayParser(v){LocalDayParser=v}},14);let StandAloneLocalDayParser;module.link("./StandAloneLocalDayParser.js",{StandAloneLocalDayParser(v){StandAloneLocalDayParser=v}},15);let ISODayParser;module.link("./ISODayParser.js",{ISODayParser(v){ISODayParser=v}},16);let AMPMParser;module.link("./AMPMParser.js",{AMPMParser(v){AMPMParser=v}},17);let AMPMMidnightParser;module.link("./AMPMMidnightParser.js",{AMPMMidnightParser(v){AMPMMidnightParser=v}},18);let DayPeriodParser;module.link("./DayPeriodParser.js",{DayPeriodParser(v){DayPeriodParser=v}},19);let Hour1to12Parser;module.link("./Hour1to12Parser.js",{Hour1to12Parser(v){Hour1to12Parser=v}},20);let Hour0to23Parser;module.link("./Hour0to23Parser.js",{Hour0to23Parser(v){Hour0to23Parser=v}},21);let Hour0To11Parser;module.link("./Hour0To11Parser.js",{Hour0To11Parser(v){Hour0To11Parser=v}},22);let Hour1To24Parser;module.link("./Hour1To24Parser.js",{Hour1To24Parser(v){Hour1To24Parser=v}},23);let MinuteParser;module.link("./MinuteParser.js",{MinuteParser(v){MinuteParser=v}},24);let SecondParser;module.link("./SecondParser.js",{SecondParser(v){SecondParser=v}},25);let FractionOfSecondParser;module.link("./FractionOfSecondParser.js",{FractionOfSecondParser(v){FractionOfSecondParser=v}},26);let ISOTimezoneWithZParser;module.link("./ISOTimezoneWithZParser.js",{ISOTimezoneWithZParser(v){ISOTimezoneWithZParser=v}},27);let ISOTimezoneParser;module.link("./ISOTimezoneParser.js",{ISOTimezoneParser(v){ISOTimezoneParser=v}},28);let TimestampSecondsParser;module.link("./TimestampSecondsParser.js",{TimestampSecondsParser(v){TimestampSecondsParser=v}},29);let TimestampMillisecondsParser;module.link("./TimestampMillisecondsParser.js",{TimestampMillisecondsParser(v){TimestampMillisecondsParser=v}},30);






























/*
 * |     | Unit                           |     | Unit                           |
 * |-----|--------------------------------|-----|--------------------------------|
 * |  a  | AM, PM                         |  A* | Milliseconds in day            |
 * |  b  | AM, PM, noon, midnight         |  B  | Flexible day period            |
 * |  c  | Stand-alone local day of week  |  C* | Localized hour w/ day period   |
 * |  d  | Day of month                   |  D  | Day of year                    |
 * |  e  | Local day of week              |  E  | Day of week                    |
 * |  f  |                                |  F* | Day of week in month           |
 * |  g* | Modified Julian day            |  G  | Era                            |
 * |  h  | Hour [1-12]                    |  H  | Hour [0-23]                    |
 * |  i! | ISO day of week                |  I! | ISO week of year               |
 * |  j* | Localized hour w/ day period   |  J* | Localized hour w/o day period  |
 * |  k  | Hour [1-24]                    |  K  | Hour [0-11]                    |
 * |  l* | (deprecated)                   |  L  | Stand-alone month              |
 * |  m  | Minute                         |  M  | Month                          |
 * |  n  |                                |  N  |                                |
 * |  o! | Ordinal number modifier        |  O* | Timezone (GMT)                 |
 * |  p  |                                |  P  |                                |
 * |  q  | Stand-alone quarter            |  Q  | Quarter                        |
 * |  r* | Related Gregorian year         |  R! | ISO week-numbering year        |
 * |  s  | Second                         |  S  | Fraction of second             |
 * |  t! | Seconds timestamp              |  T! | Milliseconds timestamp         |
 * |  u  | Extended year                  |  U* | Cyclic year                    |
 * |  v* | Timezone (generic non-locat.)  |  V* | Timezone (location)            |
 * |  w  | Local week of year             |  W* | Week of month                  |
 * |  x  | Timezone (ISO-8601 w/o Z)      |  X  | Timezone (ISO-8601)            |
 * |  y  | Year (abs)                     |  Y  | Local week-numbering year      |
 * |  z* | Timezone (specific non-locat.) |  Z* | Timezone (aliases)             |
 *
 * Letters marked by * are not implemented but reserved by Unicode standard.
 *
 * Letters marked by ! are non-standard, but implemented by date-fns:
 * - `o` modifies the previous token to turn it into an ordinal (see `parse` docs)
 * - `i` is ISO day of week. For `i` and `ii` is returns numeric ISO week days,
 *   i.e. 7 for Sunday, 1 for Monday, etc.
 * - `I` is ISO week of year, as opposed to `w` which is local week of year.
 * - `R` is ISO week-numbering year, as opposed to `Y` which is local week-numbering year.
 *   `R` is supposed to be used in conjunction with `I` and `i`
 *   for universal ISO week-numbering date, whereas
 *   `Y` is supposed to be used in conjunction with `w` and `e`
 *   for week-numbering date specific to the locale.
 */

var parsers = {
  G: new EraParser(),
  y: new YearParser(),
  Y: new LocalWeekYearParser(),
  R: new ISOWeekYearParser(),
  u: new ExtendedYearParser(),
  Q: new QuarterParser(),
  q: new StandAloneQuarterParser(),
  M: new MonthParser(),
  L: new StandAloneMonthParser(),
  w: new LocalWeekParser(),
  I: new ISOWeekParser(),
  d: new DateParser(),
  D: new DayOfYearParser(),
  E: new DayParser(),
  e: new LocalDayParser(),
  c: new StandAloneLocalDayParser(),
  i: new ISODayParser(),
  a: new AMPMParser(),
  b: new AMPMMidnightParser(),
  B: new DayPeriodParser(),
  h: new Hour1to12Parser(),
  H: new Hour0to23Parser(),
  K: new Hour0To11Parser(),
  k: new Hour1To24Parser(),
  m: new MinuteParser(),
  s: new SecondParser(),
  S: new FractionOfSecondParser(),
  X: new ISOTimezoneWithZParser(),
  x: new ISOTimezoneParser(),
  t: new TimestampSecondsParser(),
  T: new TimestampMillisecondsParser()
};