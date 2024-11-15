module.export({parseTime:()=>$fae977aafc393c5c$export$c9698ec7f05a07e1,parseDate:()=>$fae977aafc393c5c$export$6b862160d295c8e,parseDateTime:()=>$fae977aafc393c5c$export$588937bcd60ade55,parseZonedDateTime:()=>$fae977aafc393c5c$export$fd7893f06e92a6a4,dateTimeToString:()=>$fae977aafc393c5c$export$4223de14708adc63,parseAbsolute:()=>$fae977aafc393c5c$export$5adfdab05168c219,parseAbsoluteToLocal:()=>$fae977aafc393c5c$export$8e384432362ed0f0,timeToString:()=>$fae977aafc393c5c$export$f59dee82248f5ad4,dateToString:()=>$fae977aafc393c5c$export$60dfd74aa96791bd,zonedDateTimeToString:()=>$fae977aafc393c5c$export$bf79f1ebf4b18792,parseDuration:()=>$fae977aafc393c5c$export$ecae829bb3747ea6});let $35ea8db9cb2ccb90$export$99faa760c7908e4f,$35ea8db9cb2ccb90$export$ca871e8dbb80966f,$35ea8db9cb2ccb90$export$680ea196effce5f,$35ea8db9cb2ccb90$export$d3b7288e7994edea;module.link("./CalendarDate.module.js",{CalendarDate(v){$35ea8db9cb2ccb90$export$99faa760c7908e4f=v},CalendarDateTime(v){$35ea8db9cb2ccb90$export$ca871e8dbb80966f=v},Time(v){$35ea8db9cb2ccb90$export$680ea196effce5f=v},ZonedDateTime(v){$35ea8db9cb2ccb90$export$d3b7288e7994edea=v}},0);let $11d87f3f76e88657$export$bd4fb2bc8bb06fb,$11d87f3f76e88657$export$1b96692a1ba042ac,$11d87f3f76e88657$export$136f38efe7caf549,$11d87f3f76e88657$export$5107c82f94518f5c,$11d87f3f76e88657$export$b4a036af3fc0b032,$11d87f3f76e88657$export$b21e0b124e224484,$11d87f3f76e88657$export$538b00033cc11c75;module.link("./conversion.module.js",{epochFromDate(v){$11d87f3f76e88657$export$bd4fb2bc8bb06fb=v},fromAbsolute(v){$11d87f3f76e88657$export$1b96692a1ba042ac=v},possibleAbsolutes(v){$11d87f3f76e88657$export$136f38efe7caf549=v},toAbsolute(v){$11d87f3f76e88657$export$5107c82f94518f5c=v},toCalendar(v){$11d87f3f76e88657$export$b4a036af3fc0b032=v},toCalendarDateTime(v){$11d87f3f76e88657$export$b21e0b124e224484=v},toTimeZone(v){$11d87f3f76e88657$export$538b00033cc11c75=v}},1);let $14e0f24ef4ac5c92$export$aa8b41735afcabd2;module.link("./queries.module.js",{getLocalTimeZone(v){$14e0f24ef4ac5c92$export$aa8b41735afcabd2=v}},2);let $3b62074eb05584b2$export$80ee6245ec4f29ec;module.link("./GregorianCalendar.module.js",{GregorianCalendar(v){$3b62074eb05584b2$export$80ee6245ec4f29ec=v}},3);




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



const $fae977aafc393c5c$var$TIME_RE = /^(\d{2})(?::(\d{2}))?(?::(\d{2}))?(\.\d+)?$/;
const $fae977aafc393c5c$var$DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const $fae977aafc393c5c$var$DATE_TIME_RE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}))?(?::(\d{2}))?(?::(\d{2}))?(\.\d+)?$/;
const $fae977aafc393c5c$var$ZONED_DATE_TIME_RE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}))?(?::(\d{2}))?(?::(\d{2}))?(\.\d+)?(?:([+-]\d{2})(?::?(\d{2}))?)?\[(.*?)\]$/;
const $fae977aafc393c5c$var$ABSOLUTE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}))?(?::(\d{2}))?(?::(\d{2}))?(\.\d+)?(?:(?:([+-]\d{2})(?::?(\d{2}))?)|Z)$/;
const $fae977aafc393c5c$var$DATE_TIME_DURATION_RE = /^((?<negative>-)|\+)?P((?<years>\d*)Y)?((?<months>\d*)M)?((?<weeks>\d*)W)?((?<days>\d*)D)?((?<time>T)((?<hours>\d*[.,]?\d{1,9})H)?((?<minutes>\d*[.,]?\d{1,9})M)?((?<seconds>\d*[.,]?\d{1,9})S)?)?$/;
const $fae977aafc393c5c$var$requiredDurationTimeGroups = [
    'hours',
    'minutes',
    'seconds'
];
const $fae977aafc393c5c$var$requiredDurationGroups = [
    'years',
    'months',
    'weeks',
    'days',
    ...$fae977aafc393c5c$var$requiredDurationTimeGroups
];
function $fae977aafc393c5c$export$c9698ec7f05a07e1(value) {
    let m = value.match($fae977aafc393c5c$var$TIME_RE);
    if (!m) throw new Error('Invalid ISO 8601 time string: ' + value);
    return new (0, $35ea8db9cb2ccb90$export$680ea196effce5f)($fae977aafc393c5c$var$parseNumber(m[1], 0, 23), m[2] ? $fae977aafc393c5c$var$parseNumber(m[2], 0, 59) : 0, m[3] ? $fae977aafc393c5c$var$parseNumber(m[3], 0, 59) : 0, m[4] ? $fae977aafc393c5c$var$parseNumber(m[4], 0, Infinity) * 1000 : 0);
}
function $fae977aafc393c5c$export$6b862160d295c8e(value) {
    let m = value.match($fae977aafc393c5c$var$DATE_RE);
    if (!m) throw new Error('Invalid ISO 8601 date string: ' + value);
    let date = new (0, $35ea8db9cb2ccb90$export$99faa760c7908e4f)($fae977aafc393c5c$var$parseNumber(m[1], 0, 9999), $fae977aafc393c5c$var$parseNumber(m[2], 1, 12), 1);
    date.day = $fae977aafc393c5c$var$parseNumber(m[3], 0, date.calendar.getDaysInMonth(date));
    return date;
}
function $fae977aafc393c5c$export$588937bcd60ade55(value) {
    let m = value.match($fae977aafc393c5c$var$DATE_TIME_RE);
    if (!m) throw new Error('Invalid ISO 8601 date time string: ' + value);
    let date = new (0, $35ea8db9cb2ccb90$export$ca871e8dbb80966f)($fae977aafc393c5c$var$parseNumber(m[1], 1, 9999), $fae977aafc393c5c$var$parseNumber(m[2], 1, 12), 1, m[4] ? $fae977aafc393c5c$var$parseNumber(m[4], 0, 23) : 0, m[5] ? $fae977aafc393c5c$var$parseNumber(m[5], 0, 59) : 0, m[6] ? $fae977aafc393c5c$var$parseNumber(m[6], 0, 59) : 0, m[7] ? $fae977aafc393c5c$var$parseNumber(m[7], 0, Infinity) * 1000 : 0);
    date.day = $fae977aafc393c5c$var$parseNumber(m[3], 0, date.calendar.getDaysInMonth(date));
    return date;
}
function $fae977aafc393c5c$export$fd7893f06e92a6a4(value, disambiguation) {
    let m = value.match($fae977aafc393c5c$var$ZONED_DATE_TIME_RE);
    if (!m) throw new Error('Invalid ISO 8601 date time string: ' + value);
    let date = new (0, $35ea8db9cb2ccb90$export$d3b7288e7994edea)($fae977aafc393c5c$var$parseNumber(m[1], 1, 9999), $fae977aafc393c5c$var$parseNumber(m[2], 1, 12), 1, m[10], 0, m[4] ? $fae977aafc393c5c$var$parseNumber(m[4], 0, 23) : 0, m[5] ? $fae977aafc393c5c$var$parseNumber(m[5], 0, 59) : 0, m[6] ? $fae977aafc393c5c$var$parseNumber(m[6], 0, 59) : 0, m[7] ? $fae977aafc393c5c$var$parseNumber(m[7], 0, Infinity) * 1000 : 0);
    date.day = $fae977aafc393c5c$var$parseNumber(m[3], 0, date.calendar.getDaysInMonth(date));
    let plainDateTime = (0, $11d87f3f76e88657$export$b21e0b124e224484)(date);
    let ms;
    if (m[8]) {
        var _m_;
        date.offset = $fae977aafc393c5c$var$parseNumber(m[8], -23, 23) * 3600000 + $fae977aafc393c5c$var$parseNumber((_m_ = m[9]) !== null && _m_ !== void 0 ? _m_ : '0', 0, 59) * 60000;
        ms = (0, $11d87f3f76e88657$export$bd4fb2bc8bb06fb)(date) - date.offset;
        // Validate offset against parsed date.
        let absolutes = (0, $11d87f3f76e88657$export$136f38efe7caf549)(plainDateTime, date.timeZone);
        if (!absolutes.includes(ms)) throw new Error(`Offset ${$fae977aafc393c5c$var$offsetToString(date.offset)} is invalid for ${$fae977aafc393c5c$export$4223de14708adc63(date)} in ${date.timeZone}`);
    } else // Convert to absolute and back to fix invalid times due to DST.
    ms = (0, $11d87f3f76e88657$export$5107c82f94518f5c)((0, $11d87f3f76e88657$export$b21e0b124e224484)(plainDateTime), date.timeZone, disambiguation);
    return (0, $11d87f3f76e88657$export$1b96692a1ba042ac)(ms, date.timeZone);
}
function $fae977aafc393c5c$export$5adfdab05168c219(value, timeZone) {
    let m = value.match($fae977aafc393c5c$var$ABSOLUTE_RE);
    if (!m) throw new Error('Invalid ISO 8601 date time string: ' + value);
    let date = new (0, $35ea8db9cb2ccb90$export$d3b7288e7994edea)($fae977aafc393c5c$var$parseNumber(m[1], 1, 9999), $fae977aafc393c5c$var$parseNumber(m[2], 1, 12), 1, timeZone, 0, m[4] ? $fae977aafc393c5c$var$parseNumber(m[4], 0, 23) : 0, m[5] ? $fae977aafc393c5c$var$parseNumber(m[5], 0, 59) : 0, m[6] ? $fae977aafc393c5c$var$parseNumber(m[6], 0, 59) : 0, m[7] ? $fae977aafc393c5c$var$parseNumber(m[7], 0, Infinity) * 1000 : 0);
    date.day = $fae977aafc393c5c$var$parseNumber(m[3], 0, date.calendar.getDaysInMonth(date));
    var _m_;
    if (m[8]) date.offset = $fae977aafc393c5c$var$parseNumber(m[8], -23, 23) * 3600000 + $fae977aafc393c5c$var$parseNumber((_m_ = m[9]) !== null && _m_ !== void 0 ? _m_ : '0', 0, 59) * 60000;
    return (0, $11d87f3f76e88657$export$538b00033cc11c75)(date, timeZone);
}
function $fae977aafc393c5c$export$8e384432362ed0f0(value) {
    return $fae977aafc393c5c$export$5adfdab05168c219(value, (0, $14e0f24ef4ac5c92$export$aa8b41735afcabd2)());
}
function $fae977aafc393c5c$var$parseNumber(value, min, max) {
    let val = Number(value);
    if (val < min || val > max) throw new RangeError(`Value out of range: ${min} <= ${val} <= ${max}`);
    return val;
}
function $fae977aafc393c5c$export$f59dee82248f5ad4(time) {
    return `${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}:${String(time.second).padStart(2, '0')}${time.millisecond ? String(time.millisecond / 1000).slice(1) : ''}`;
}
function $fae977aafc393c5c$export$60dfd74aa96791bd(date) {
    let gregorianDate = (0, $11d87f3f76e88657$export$b4a036af3fc0b032)(date, new (0, $3b62074eb05584b2$export$80ee6245ec4f29ec)());
    return `${String(gregorianDate.year).padStart(4, '0')}-${String(gregorianDate.month).padStart(2, '0')}-${String(gregorianDate.day).padStart(2, '0')}`;
}
function $fae977aafc393c5c$export$4223de14708adc63(date) {
    // @ts-ignore
    return `${$fae977aafc393c5c$export$60dfd74aa96791bd(date)}T${$fae977aafc393c5c$export$f59dee82248f5ad4(date)}`;
}
function $fae977aafc393c5c$var$offsetToString(offset) {
    let sign = Math.sign(offset) < 0 ? '-' : '+';
    offset = Math.abs(offset);
    let offsetHours = Math.floor(offset / 3600000);
    let offsetMinutes = offset % 3600000 / 60000;
    return `${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
}
function $fae977aafc393c5c$export$bf79f1ebf4b18792(date) {
    return `${$fae977aafc393c5c$export$4223de14708adc63(date)}${$fae977aafc393c5c$var$offsetToString(date.offset)}[${date.timeZone}]`;
}
function $fae977aafc393c5c$export$ecae829bb3747ea6(value) {
    var _match_groups, _match_groups1, _match_groups2, _match_groups3, _match_groups4, _match_groups5, _match_groups6, _match_groups7, _match_groups8;
    const match = value.match($fae977aafc393c5c$var$DATE_TIME_DURATION_RE);
    if (!match) throw new Error(`Invalid ISO 8601 Duration string: ${value}`);
    const parseDurationGroup = (group, isNegative, min, max)=>{
        if (!group) return 0;
        try {
            const sign = isNegative ? -1 : 1;
            return sign * $fae977aafc393c5c$var$parseNumber(group.replace(',', '.'), min, max);
        } catch  {
            throw new Error(`Invalid ISO 8601 Duration string: ${value}`);
        }
    };
    const isNegative = !!((_match_groups = match.groups) === null || _match_groups === void 0 ? void 0 : _match_groups.negative);
    const hasRequiredGroups = $fae977aafc393c5c$var$requiredDurationGroups.some((group)=>{
        var _match_groups;
        return (_match_groups = match.groups) === null || _match_groups === void 0 ? void 0 : _match_groups[group];
    });
    if (!hasRequiredGroups) throw new Error(`Invalid ISO 8601 Duration string: ${value}`);
    const durationStringIncludesTime = (_match_groups1 = match.groups) === null || _match_groups1 === void 0 ? void 0 : _match_groups1.time;
    if (durationStringIncludesTime) {
        const hasRequiredDurationTimeGroups = $fae977aafc393c5c$var$requiredDurationTimeGroups.some((group)=>{
            var _match_groups;
            return (_match_groups = match.groups) === null || _match_groups === void 0 ? void 0 : _match_groups[group];
        });
        if (!hasRequiredDurationTimeGroups) throw new Error(`Invalid ISO 8601 Duration string: ${value}`);
    }
    const duration = {
        years: parseDurationGroup((_match_groups2 = match.groups) === null || _match_groups2 === void 0 ? void 0 : _match_groups2.years, isNegative, 0, 9999),
        months: parseDurationGroup((_match_groups3 = match.groups) === null || _match_groups3 === void 0 ? void 0 : _match_groups3.months, isNegative, 0, 12),
        weeks: parseDurationGroup((_match_groups4 = match.groups) === null || _match_groups4 === void 0 ? void 0 : _match_groups4.weeks, isNegative, 0, Infinity),
        days: parseDurationGroup((_match_groups5 = match.groups) === null || _match_groups5 === void 0 ? void 0 : _match_groups5.days, isNegative, 0, 31),
        hours: parseDurationGroup((_match_groups6 = match.groups) === null || _match_groups6 === void 0 ? void 0 : _match_groups6.hours, isNegative, 0, 23),
        minutes: parseDurationGroup((_match_groups7 = match.groups) === null || _match_groups7 === void 0 ? void 0 : _match_groups7.minutes, isNegative, 0, 59),
        seconds: parseDurationGroup((_match_groups8 = match.groups) === null || _match_groups8 === void 0 ? void 0 : _match_groups8.seconds, isNegative, 0, 59)
    };
    if (duration.hours !== undefined && duration.hours % 1 !== 0 && (duration.minutes || duration.seconds)) throw new Error(`Invalid ISO 8601 Duration string: ${value} - only the smallest unit can be fractional`);
    if (duration.minutes !== undefined && duration.minutes % 1 !== 0 && duration.seconds) throw new Error(`Invalid ISO 8601 Duration string: ${value} - only the smallest unit can be fractional`);
    return duration;
}



//# sourceMappingURL=string.module.js.map
