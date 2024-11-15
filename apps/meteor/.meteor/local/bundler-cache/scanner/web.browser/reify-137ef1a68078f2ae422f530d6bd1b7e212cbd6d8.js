module.export({format:()=>format,formatPrefix:()=>formatPrefix,default:()=>defaultLocale});let formatLocale;module.link("./locale.js",{default(v){formatLocale=v}},0);

var locale;
var format;
var formatPrefix;

defaultLocale({
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});

function defaultLocale(definition) {
  locale = formatLocale(definition);
  module.runSetters(format = locale.format,["format"]);
  module.runSetters(formatPrefix = locale.formatPrefix,["formatPrefix"]);
  return locale;
}
