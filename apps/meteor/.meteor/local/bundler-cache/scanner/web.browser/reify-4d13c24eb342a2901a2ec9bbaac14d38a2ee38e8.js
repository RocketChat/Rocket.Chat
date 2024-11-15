let formatDistance;module.link("./_lib/formatDistance/index.js",{default(v){formatDistance=v}},0);let formatLong;module.link("./_lib/formatLong/index.js",{default(v){formatLong=v}},1);let formatRelative;module.link("./_lib/formatRelative/index.js",{default(v){formatRelative=v}},2);let localize;module.link("./_lib/localize/index.js",{default(v){localize=v}},3);let match;module.link("./_lib/match/index.js",{default(v){match=v}},4);





/**
 * @type {Locale}
 * @category Locales
 * @summary English locale (United States).
 * @language English
 * @iso-639-2 eng
 * @author Sasha Koss [@kossnocorp]{@link https://github.com/kossnocorp}
 * @author Lesha Koss [@leshakoss]{@link https://github.com/leshakoss}
 */
var locale = {
  code: 'en-US',
  formatDistance: formatDistance,
  formatLong: formatLong,
  formatRelative: formatRelative,
  localize: localize,
  match: match,
  options: {
    weekStartsOn: 0
    /* Sunday */
    ,
    firstWeekContainsDate: 1
  }
};
module.exportDefault(locale);