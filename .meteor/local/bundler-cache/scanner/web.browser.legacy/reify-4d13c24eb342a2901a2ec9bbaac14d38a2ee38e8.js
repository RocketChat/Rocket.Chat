var formatDistance;module.link("./_lib/formatDistance/index.js",{default:function(v){formatDistance=v}},0);var formatLong;module.link("./_lib/formatLong/index.js",{default:function(v){formatLong=v}},1);var formatRelative;module.link("./_lib/formatRelative/index.js",{default:function(v){formatRelative=v}},2);var localize;module.link("./_lib/localize/index.js",{default:function(v){localize=v}},3);var match;module.link("./_lib/match/index.js",{default:function(v){match=v}},4);





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