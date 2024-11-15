module.export({isSameDay:()=>$14e0f24ef4ac5c92$export$ea39ec197993aef0,isSameMonth:()=>$14e0f24ef4ac5c92$export$a18c89cbd24170ff,startOfMonth:()=>$14e0f24ef4ac5c92$export$a5a3b454ada2268e,isSameYear:()=>$14e0f24ef4ac5c92$export$5841f9eb9773f25f,startOfYear:()=>$14e0f24ef4ac5c92$export$f91e89d3d0406102,isEqualDay:()=>$14e0f24ef4ac5c92$export$91b62ebf2ba703ee,isEqualMonth:()=>$14e0f24ef4ac5c92$export$5a8da0c44a3afdf2,isEqualYear:()=>$14e0f24ef4ac5c92$export$ea840f5a6dda8147,isToday:()=>$14e0f24ef4ac5c92$export$629b0a497aa65267,today:()=>$14e0f24ef4ac5c92$export$d0bdf45af03a6ea3,getDayOfWeek:()=>$14e0f24ef4ac5c92$export$2061056d06d7cdf7,now:()=>$14e0f24ef4ac5c92$export$461939dd4422153,compareDate:()=>$14e0f24ef4ac5c92$export$68781ddf31c0090f,compareTime:()=>$14e0f24ef4ac5c92$export$c19a80a9721b80f6,getHoursInDay:()=>$14e0f24ef4ac5c92$export$126c91c941de7e,getLocalTimeZone:()=>$14e0f24ef4ac5c92$export$aa8b41735afcabd2,endOfMonth:()=>$14e0f24ef4ac5c92$export$a2258d9c4118825c,endOfYear:()=>$14e0f24ef4ac5c92$export$8b7aa55c66d5569e,getMinimumMonthInYear:()=>$14e0f24ef4ac5c92$export$5412ac11713b72ad,getMinimumDayInMonth:()=>$14e0f24ef4ac5c92$export$b2f4953d301981d5,startOfWeek:()=>$14e0f24ef4ac5c92$export$42c81a444fbfb5d4,endOfWeek:()=>$14e0f24ef4ac5c92$export$ef8b6d9133084f4e,getWeeksInMonth:()=>$14e0f24ef4ac5c92$export$ccc1b2479e7dd654,minDate:()=>$14e0f24ef4ac5c92$export$5c333a116e949cdd,maxDate:()=>$14e0f24ef4ac5c92$export$a75f2bff57811055,isWeekend:()=>$14e0f24ef4ac5c92$export$618d60ea299da42,isWeekday:()=>$14e0f24ef4ac5c92$export$ee9d87258e1d19ed});let $11d87f3f76e88657$export$1b96692a1ba042ac,$11d87f3f76e88657$export$5107c82f94518f5c,$11d87f3f76e88657$export$b4a036af3fc0b032,$11d87f3f76e88657$export$93522d1a439f3617;module.link("./conversion.module.js",{fromAbsolute(v){$11d87f3f76e88657$export$1b96692a1ba042ac=v},toAbsolute(v){$11d87f3f76e88657$export$5107c82f94518f5c=v},toCalendar(v){$11d87f3f76e88657$export$b4a036af3fc0b032=v},toCalendarDate(v){$11d87f3f76e88657$export$93522d1a439f3617=v}},0);let $2fe286d2fb449abb$export$7a5acbd77d414bd9;module.link("./weekStartData.module.js",{weekStartData(v){$2fe286d2fb449abb$export$7a5acbd77d414bd9=v}},1);


/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 

function $14e0f24ef4ac5c92$export$ea39ec197993aef0(a, b) {
    b = (0, $11d87f3f76e88657$export$b4a036af3fc0b032)(b, a.calendar);
    return a.era === b.era && a.year === b.year && a.month === b.month && a.day === b.day;
}
function $14e0f24ef4ac5c92$export$a18c89cbd24170ff(a, b) {
    b = (0, $11d87f3f76e88657$export$b4a036af3fc0b032)(b, a.calendar);
    // In the Japanese calendar, months can span multiple eras/years, so only compare the first of the month.
    a = $14e0f24ef4ac5c92$export$a5a3b454ada2268e(a);
    b = $14e0f24ef4ac5c92$export$a5a3b454ada2268e(b);
    return a.era === b.era && a.year === b.year && a.month === b.month;
}
function $14e0f24ef4ac5c92$export$5841f9eb9773f25f(a, b) {
    b = (0, $11d87f3f76e88657$export$b4a036af3fc0b032)(b, a.calendar);
    a = $14e0f24ef4ac5c92$export$f91e89d3d0406102(a);
    b = $14e0f24ef4ac5c92$export$f91e89d3d0406102(b);
    return a.era === b.era && a.year === b.year;
}
function $14e0f24ef4ac5c92$export$91b62ebf2ba703ee(a, b) {
    return a.calendar.identifier === b.calendar.identifier && a.era === b.era && a.year === b.year && a.month === b.month && a.day === b.day;
}
function $14e0f24ef4ac5c92$export$5a8da0c44a3afdf2(a, b) {
    a = $14e0f24ef4ac5c92$export$a5a3b454ada2268e(a);
    b = $14e0f24ef4ac5c92$export$a5a3b454ada2268e(b);
    return a.calendar.identifier === b.calendar.identifier && a.era === b.era && a.year === b.year && a.month === b.month;
}
function $14e0f24ef4ac5c92$export$ea840f5a6dda8147(a, b) {
    a = $14e0f24ef4ac5c92$export$f91e89d3d0406102(a);
    b = $14e0f24ef4ac5c92$export$f91e89d3d0406102(b);
    return a.calendar.identifier === b.calendar.identifier && a.era === b.era && a.year === b.year;
}
function $14e0f24ef4ac5c92$export$629b0a497aa65267(date, timeZone) {
    return $14e0f24ef4ac5c92$export$ea39ec197993aef0(date, $14e0f24ef4ac5c92$export$d0bdf45af03a6ea3(timeZone));
}
function $14e0f24ef4ac5c92$export$2061056d06d7cdf7(date, locale) {
    let julian = date.calendar.toJulianDay(date);
    // If julian is negative, then julian % 7 will be negative, so we adjust
    // accordingly.  Julian day 0 is Monday.
    let dayOfWeek = Math.ceil(julian + 1 - $14e0f24ef4ac5c92$var$getWeekStart(locale)) % 7;
    if (dayOfWeek < 0) dayOfWeek += 7;
    return dayOfWeek;
}
function $14e0f24ef4ac5c92$export$461939dd4422153(timeZone) {
    return (0, $11d87f3f76e88657$export$1b96692a1ba042ac)(Date.now(), timeZone);
}
function $14e0f24ef4ac5c92$export$d0bdf45af03a6ea3(timeZone) {
    return (0, $11d87f3f76e88657$export$93522d1a439f3617)($14e0f24ef4ac5c92$export$461939dd4422153(timeZone));
}
function $14e0f24ef4ac5c92$export$68781ddf31c0090f(a, b) {
    return a.calendar.toJulianDay(a) - b.calendar.toJulianDay(b);
}
function $14e0f24ef4ac5c92$export$c19a80a9721b80f6(a, b) {
    return $14e0f24ef4ac5c92$var$timeToMs(a) - $14e0f24ef4ac5c92$var$timeToMs(b);
}
function $14e0f24ef4ac5c92$var$timeToMs(a) {
    return a.hour * 3600000 + a.minute * 60000 + a.second * 1000 + a.millisecond;
}
function $14e0f24ef4ac5c92$export$126c91c941de7e(a, timeZone) {
    let ms = (0, $11d87f3f76e88657$export$5107c82f94518f5c)(a, timeZone);
    let tomorrow = a.add({
        days: 1
    });
    let tomorrowMs = (0, $11d87f3f76e88657$export$5107c82f94518f5c)(tomorrow, timeZone);
    return (tomorrowMs - ms) / 3600000;
}
let $14e0f24ef4ac5c92$var$localTimeZone = null;
function $14e0f24ef4ac5c92$export$aa8b41735afcabd2() {
    // TODO: invalidate this somehow?
    if ($14e0f24ef4ac5c92$var$localTimeZone == null) $14e0f24ef4ac5c92$var$localTimeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
    return $14e0f24ef4ac5c92$var$localTimeZone;
}
function $14e0f24ef4ac5c92$export$a5a3b454ada2268e(date) {
    // Use `subtract` instead of `set` so we don't get constrained in an era.
    return date.subtract({
        days: date.day - 1
    });
}
function $14e0f24ef4ac5c92$export$a2258d9c4118825c(date) {
    return date.add({
        days: date.calendar.getDaysInMonth(date) - date.day
    });
}
function $14e0f24ef4ac5c92$export$f91e89d3d0406102(date) {
    return $14e0f24ef4ac5c92$export$a5a3b454ada2268e(date.subtract({
        months: date.month - 1
    }));
}
function $14e0f24ef4ac5c92$export$8b7aa55c66d5569e(date) {
    return $14e0f24ef4ac5c92$export$a2258d9c4118825c(date.add({
        months: date.calendar.getMonthsInYear(date) - date.month
    }));
}
function $14e0f24ef4ac5c92$export$5412ac11713b72ad(date) {
    if (date.calendar.getMinimumMonthInYear) return date.calendar.getMinimumMonthInYear(date);
    return 1;
}
function $14e0f24ef4ac5c92$export$b2f4953d301981d5(date) {
    if (date.calendar.getMinimumDayInMonth) return date.calendar.getMinimumDayInMonth(date);
    return 1;
}
function $14e0f24ef4ac5c92$export$42c81a444fbfb5d4(date, locale) {
    let dayOfWeek = $14e0f24ef4ac5c92$export$2061056d06d7cdf7(date, locale);
    return date.subtract({
        days: dayOfWeek
    });
}
function $14e0f24ef4ac5c92$export$ef8b6d9133084f4e(date, locale) {
    return $14e0f24ef4ac5c92$export$42c81a444fbfb5d4(date, locale).add({
        days: 6
    });
}
const $14e0f24ef4ac5c92$var$cachedRegions = new Map();
function $14e0f24ef4ac5c92$var$getRegion(locale) {
    // If the Intl.Locale API is available, use it to get the region for the locale.
    // @ts-ignore
    if (Intl.Locale) {
        // Constructing an Intl.Locale is expensive, so cache the result.
        let region = $14e0f24ef4ac5c92$var$cachedRegions.get(locale);
        if (!region) {
            // @ts-ignore
            region = new Intl.Locale(locale).maximize().region;
            if (region) $14e0f24ef4ac5c92$var$cachedRegions.set(locale, region);
        }
        return region;
    }
    // If not, just try splitting the string.
    // If the second part of the locale string is 'u',
    // then this is a unicode extension, so ignore it.
    // Otherwise, it should be the region.
    let part = locale.split('-')[1];
    return part === 'u' ? undefined : part;
}
function $14e0f24ef4ac5c92$var$getWeekStart(locale) {
    // TODO: use Intl.Locale for this once browsers support the weekInfo property
    // https://github.com/tc39/proposal-intl-locale-info
    let region = $14e0f24ef4ac5c92$var$getRegion(locale);
    return region ? (0, $2fe286d2fb449abb$export$7a5acbd77d414bd9)[region] || 0 : 0;
}
function $14e0f24ef4ac5c92$export$ccc1b2479e7dd654(date, locale) {
    let days = date.calendar.getDaysInMonth(date);
    return Math.ceil(($14e0f24ef4ac5c92$export$2061056d06d7cdf7($14e0f24ef4ac5c92$export$a5a3b454ada2268e(date), locale) + days) / 7);
}
function $14e0f24ef4ac5c92$export$5c333a116e949cdd(a, b) {
    if (a && b) return a.compare(b) <= 0 ? a : b;
    return a || b;
}
function $14e0f24ef4ac5c92$export$a75f2bff57811055(a, b) {
    if (a && b) return a.compare(b) >= 0 ? a : b;
    return a || b;
}
const $14e0f24ef4ac5c92$var$WEEKEND_DATA = {
    AF: [
        4,
        5
    ],
    AE: [
        5,
        6
    ],
    BH: [
        5,
        6
    ],
    DZ: [
        5,
        6
    ],
    EG: [
        5,
        6
    ],
    IL: [
        5,
        6
    ],
    IQ: [
        5,
        6
    ],
    IR: [
        5,
        5
    ],
    JO: [
        5,
        6
    ],
    KW: [
        5,
        6
    ],
    LY: [
        5,
        6
    ],
    OM: [
        5,
        6
    ],
    QA: [
        5,
        6
    ],
    SA: [
        5,
        6
    ],
    SD: [
        5,
        6
    ],
    SY: [
        5,
        6
    ],
    YE: [
        5,
        6
    ]
};
function $14e0f24ef4ac5c92$export$618d60ea299da42(date, locale) {
    let julian = date.calendar.toJulianDay(date);
    // If julian is negative, then julian % 7 will be negative, so we adjust
    // accordingly.  Julian day 0 is Monday.
    let dayOfWeek = Math.ceil(julian + 1) % 7;
    if (dayOfWeek < 0) dayOfWeek += 7;
    let region = $14e0f24ef4ac5c92$var$getRegion(locale);
    // Use Intl.Locale for this once weekInfo is supported.
    // https://github.com/tc39/proposal-intl-locale-info
    let [start, end] = $14e0f24ef4ac5c92$var$WEEKEND_DATA[region] || [
        6,
        0
    ];
    return dayOfWeek === start || dayOfWeek === end;
}
function $14e0f24ef4ac5c92$export$ee9d87258e1d19ed(date, locale) {
    return !$14e0f24ef4ac5c92$export$618d60ea299da42(date, locale);
}



//# sourceMappingURL=queries.module.js.map
