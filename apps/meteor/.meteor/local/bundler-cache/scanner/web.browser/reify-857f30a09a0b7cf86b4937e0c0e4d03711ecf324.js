module.export({utcTicks:()=>utcTicks,utcTickInterval:()=>utcTickInterval,timeTicks:()=>timeTicks,timeTickInterval:()=>timeTickInterval});let bisector,tickStep;module.link("d3-array",{bisector(v){bisector=v},tickStep(v){tickStep=v}},0);let durationDay,durationHour,durationMinute,durationMonth,durationSecond,durationWeek,durationYear;module.link("./duration.js",{durationDay(v){durationDay=v},durationHour(v){durationHour=v},durationMinute(v){durationMinute=v},durationMonth(v){durationMonth=v},durationSecond(v){durationSecond=v},durationWeek(v){durationWeek=v},durationYear(v){durationYear=v}},1);let millisecond;module.link("./millisecond.js",{default(v){millisecond=v}},2);let second;module.link("./second.js",{default(v){second=v}},3);let minute;module.link("./minute.js",{default(v){minute=v}},4);let hour;module.link("./hour.js",{default(v){hour=v}},5);let day;module.link("./day.js",{default(v){day=v}},6);let week;module.link("./week.js",{sunday(v){week=v}},7);let month;module.link("./month.js",{default(v){month=v}},8);let year;module.link("./year.js",{default(v){year=v}},9);let utcMinute;module.link("./utcMinute.js",{default(v){utcMinute=v}},10);let utcHour;module.link("./utcHour.js",{default(v){utcHour=v}},11);let utcDay;module.link("./utcDay.js",{default(v){utcDay=v}},12);let utcWeek;module.link("./utcWeek.js",{utcSunday(v){utcWeek=v}},13);let utcMonth;module.link("./utcMonth.js",{default(v){utcMonth=v}},14);let utcYear;module.link("./utcYear.js",{default(v){utcYear=v}},15);
















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

const [utcTicks, utcTickInterval] = ticker(utcYear, utcMonth, utcWeek, utcDay, utcHour, utcMinute);
const [timeTicks, timeTickInterval] = ticker(year, month, week, day, hour, minute);


