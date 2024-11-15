module.export({timeFormat:()=>timeFormat,timeParse:()=>timeParse,utcFormat:()=>utcFormat,utcParse:()=>utcParse,default:()=>defaultLocale});let formatLocale;module.link("./locale.js",{default(v){formatLocale=v}},0);

var locale;
var timeFormat;
var timeParse;
var utcFormat;
var utcParse;

defaultLocale({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

function defaultLocale(definition) {
  locale = formatLocale(definition);
  module.runSetters(timeFormat = locale.format,["timeFormat"]);
  module.runSetters(timeParse = locale.parse,["timeParse"]);
  module.runSetters(utcFormat = locale.utcFormat,["utcFormat"]);
  module.runSetters(utcParse = locale.utcParse,["utcParse"]);
  return locale;
}
