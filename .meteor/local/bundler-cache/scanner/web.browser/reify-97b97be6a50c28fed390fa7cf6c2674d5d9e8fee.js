module.export({calendar:()=>calendar,default:()=>time});let timeYear,timeMonth,timeWeek,timeDay,timeHour,timeMinute,timeSecond,timeTicks,timeTickInterval;module.link("d3-time",{timeYear(v){timeYear=v},timeMonth(v){timeMonth=v},timeWeek(v){timeWeek=v},timeDay(v){timeDay=v},timeHour(v){timeHour=v},timeMinute(v){timeMinute=v},timeSecond(v){timeSecond=v},timeTicks(v){timeTicks=v},timeTickInterval(v){timeTickInterval=v}},0);let timeFormat;module.link("d3-time-format",{timeFormat(v){timeFormat=v}},1);let continuous,copy;module.link("./continuous.js",{default(v){continuous=v},copy(v){copy=v}},2);let initRange;module.link("./init.js",{initRange(v){initRange=v}},3);let nice;module.link("./nice.js",{default(v){nice=v}},4);





function date(t) {
  return new Date(t);
}

function number(t) {
  return t instanceof Date ? +t : +new Date(+t);
}

function calendar(ticks, tickInterval, year, month, week, day, hour, minute, second, format) {
  var scale = continuous(),
      invert = scale.invert,
      domain = scale.domain;

  var formatMillisecond = format(".%L"),
      formatSecond = format(":%S"),
      formatMinute = format("%I:%M"),
      formatHour = format("%I %p"),
      formatDay = format("%a %d"),
      formatWeek = format("%b %d"),
      formatMonth = format("%B"),
      formatYear = format("%Y");

  function tickFormat(date) {
    return (second(date) < date ? formatMillisecond
        : minute(date) < date ? formatSecond
        : hour(date) < date ? formatMinute
        : day(date) < date ? formatHour
        : month(date) < date ? (week(date) < date ? formatDay : formatWeek)
        : year(date) < date ? formatMonth
        : formatYear)(date);
  }

  scale.invert = function(y) {
    return new Date(invert(y));
  };

  scale.domain = function(_) {
    return arguments.length ? domain(Array.from(_, number)) : domain().map(date);
  };

  scale.ticks = function(interval) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], interval == null ? 10 : interval);
  };

  scale.tickFormat = function(count, specifier) {
    return specifier == null ? tickFormat : format(specifier);
  };

  scale.nice = function(interval) {
    var d = domain();
    if (!interval || typeof interval.range !== "function") interval = tickInterval(d[0], d[d.length - 1], interval == null ? 10 : interval);
    return interval ? domain(nice(d, interval)) : scale;
  };

  scale.copy = function() {
    return copy(scale, calendar(ticks, tickInterval, year, month, week, day, hour, minute, second, format));
  };

  return scale;
}

function time() {
  return initRange.apply(calendar(timeTicks, timeTickInterval, timeYear, timeMonth, timeWeek, timeDay, timeHour, timeMinute, timeSecond, timeFormat).domain([new Date(2000, 0, 1), new Date(2000, 0, 2)]), arguments);
}
