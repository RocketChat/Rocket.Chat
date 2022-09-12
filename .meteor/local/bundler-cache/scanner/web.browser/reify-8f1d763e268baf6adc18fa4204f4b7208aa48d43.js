module.export({default:()=>getDefaultOptions});let getInternalDefaultOptions;module.link("../_lib/defaultOptions/index.js",{getDefaultOptions(v){getInternalDefaultOptions=v}},0);let assign;module.link("../_lib/assign/index.js",{default(v){assign=v}},1);

/**
 * @name getDefaultOptions
 * @category Common Helpers
 * @summary Get default options.
 * @pure false
 *
 * @description
 * Returns an object that contains defaults for
 * `options.locale`, `options.weekStartsOn` and `options.firstWeekContainsDate`
 * arguments for all functions.
 *
 * You can change these with [setDefaultOptions]{@link https://date-fns.org/docs/setDefaultOptions}.
 *
 * @returns {Object} default options
 *
 * @example
 * const result = getDefaultOptions()
 * //=> {}
 *
 * @example
 * setDefaultOptions({ weekStarsOn: 1, firstWeekContainsDate: 4 })
 * const result = getDefaultOptions()
 * //=> { weekStarsOn: 1, firstWeekContainsDate: 4 }
 */

function getDefaultOptions() {
  return assign({}, getInternalDefaultOptions());
}