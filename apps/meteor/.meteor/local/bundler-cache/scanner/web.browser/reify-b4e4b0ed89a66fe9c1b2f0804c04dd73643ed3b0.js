module.export({utcTicks:()=>utcTicks,utcTickInterval:()=>utcTickInterval,timeTicks:()=>timeTicks,timeTickInterval:()=>timeTickInterval});let bisector,tickStep;module.link("d3-array",{bisector(v){bisector=v},tickStep(v){tickStep=v}},0);let durationDay,durationHour,durationMinute,durationMonth,durationSecond,durationWeek,durationYear;module.link("./duration.js",{durationDay(v){durationDay=v},durationHour(v){durationHour=v},durationMinute(v){durationMinute=v},durationMonth(v){durationMonth=v},durationSecond(v){durationSecond=v},durationWeek(v){durationWeek=v},durationYear(v){durationYear=v}},1);let millisecond;module.link("./millisecond.js",{millisecond(v){millisecond=v}},2);let second;module.link("./second.js",{second(v){second=v}},3);let timeMinute,utcMinute;module.link("./minute.js",{timeMinute(v){timeMinute=v},utcMinute(v){utcMinute=v}},4);let timeHour,utcHour;module.link("./hour.js",{timeHour(v){timeHour=v},utcHour(v){utcHour=v}},5);let timeDay,unixDay;module.link("./day.js",{timeDay(v){timeDay=v},unixDay(v){unixDay=v}},6);let timeSunday,utcSunday;module.link("./week.js",{timeSunday(v){timeSunday=v},utcSunday(v){utcSunday=v}},7);let timeMonth,utcMonth;module.link("./month.js",{timeMonth(v){timeMonth=v},utcMonth(v){utcMonth=v}},8);let timeYear,utcYear;module.link("./year.js",{timeYear(v){timeYear=v},utcYear(v){utcYear=v}},9);










function ticker(year, month, week, day, hour, minute) {

  const tickIntervals = [
    [second,  1,      durationSecond],
    [second,  5,  5 * durationSecond],
    [second, 15, 15 * durationSecond],
    [second, 30, 30 * durationSecond],
    [minute,  1,      durationMinute],
    [minute,  5,  5 * durationMinute],
    [minute, 15, 15 * durationMinute],
    [minute, 30, 30 * durationMinute],
    [  hour,  1,      durationHour  ],
    [  hour,  3,  3 * durationHour  ],
    [  hour,  6,  6 * durationHour  ],
    [  hour, 12, 12 * durationHour  ],
    [   day,  1,      durationDay   ],
    [   day,  2,  2 * durationDay   ],
    [  week,  1,      durationWeek  ],
    [ month,  1,      durationMonth ],
    [ month,  3,  3 * durationMonth ],
    [  year,  1,      durationYear  ]
  ];

  function ticks(start, stop, count) {
    const reverse = stop < start;
    if (reverse) [start, stop] = [stop, start];
    const interval = count && typeof count.range === "function" ? count : tickInterval(start, stop, count);
    const ticks = interval ? interval.range(start, +stop + 1) : []; // inclusive stop
    return reverse ? ticks.reverse() : ticks;
  }

  function tickInterval(start, stop, count) {
    const target = Math.abs(stop - start) / count;
    const i = bisector(([,, step]) => step).right(tickIntervals, target);
    if (i === tickIntervals.length) return year.every(tickStep(start / durationYear, stop / durationYear, count));
    if (i === 0) return millisecond.every(Math.max(tickStep(start, stop, count), 1));
    const [t, step] = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i];
    return t.every(step);
  }

  return [ticks, tickInterval];
}

const [utcTicks, utcTickInterval] = ticker(utcYear, utcMonth, utcSunday, unixDay, utcHour, utcMinute);
const [timeTicks, timeTickInterval] = ticker(timeYear, timeMonth, timeSunday, timeDay, timeHour, timeMinute);


