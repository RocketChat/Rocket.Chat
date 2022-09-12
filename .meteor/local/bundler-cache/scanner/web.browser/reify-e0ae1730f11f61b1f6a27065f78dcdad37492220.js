module.export({default:()=>utcTime});let utcYear,utcMonth,utcWeek,utcDay,utcHour,utcMinute,utcSecond,utcTicks,utcTickInterval;module.link("d3-time",{utcYear(v){utcYear=v},utcMonth(v){utcMonth=v},utcWeek(v){utcWeek=v},utcDay(v){utcDay=v},utcHour(v){utcHour=v},utcMinute(v){utcMinute=v},utcSecond(v){utcSecond=v},utcTicks(v){utcTicks=v},utcTickInterval(v){utcTickInterval=v}},0);let utcFormat;module.link("d3-time-format",{utcFormat(v){utcFormat=v}},1);let calendar;module.link("./time.js",{calendar(v){calendar=v}},2);let initRange;module.link("./init.js",{initRange(v){initRange=v}},3);




function utcTime() {
  return initRange.apply(calendar(utcTicks, utcTickInterval, utcYear, utcMonth, utcWeek, utcDay, utcHour, utcMinute, utcSecond, utcFormat).domain([Date.UTC(2000, 0, 1), Date.UTC(2000, 0, 2)]), arguments);
}
