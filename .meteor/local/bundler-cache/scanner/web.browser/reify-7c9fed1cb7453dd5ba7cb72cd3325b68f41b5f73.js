module.export({default:()=>fromUnixTime});let toDate;module.link("../toDate/index.js",{default(v){toDate=v}},0);let toInteger;module.link("../_lib/toInteger/index.js",{default(v){toInteger=v}},1);let requiredArgs;module.link("../_lib/requiredArgs/index.js",{default(v){requiredArgs=v}},2);


/**
 * @name fromUnixTime
 * @category Timestamp Helpers
 * @summary Create a date from a Unix timestamp.
 *
 * @description
 * Create a date from a Unix timestamp (in seconds). Decimal values will be discarded.
 *
 * @param {Number} unixTime - the given Unix timestamp (in seconds)
 * @returns {Date} the date
 * @throws {TypeError} 1 argument required
 *
 * @example
 * // Create the date 29 February 2012 11:45:05:
 * const result = fromUnixTime(1330515905)
 * //=> Wed Feb 29 2012 11:45:05
 */

function fromUnixTime(dirtyUnixTime) {
  requiredArgs(1, arguments);
  var unixTime = toInteger(dirtyUnixTime);
  return toDate(unixTime * 1000);
}