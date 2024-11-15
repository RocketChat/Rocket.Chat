var $hEzMm$internationalizeddate = require("@internationalized/date");
var $hEzMm$reactstatelyutils = require("@react-stately/utils");
var $hEzMm$react = require("react");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useCalendarState", () => $6adad0c8536fc209$export$6d095e787d2b5e1f);
$parcel$export(module.exports, "useRangeCalendarState", () => $e49f7b861e5e8049$export$9a987164d97ecc90);
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
 */ /*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ /*
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
function $4301262d71f567b9$export$eac50920cf2fd59a(date, minValue, maxValue) {
    return minValue != null && date.compare(minValue) < 0 || maxValue != null && date.compare(maxValue) > 0;
}
function $4301262d71f567b9$export$f4a51ff076cc9a09(date, duration, locale, minValue, maxValue) {
    let halfDuration = {};
    for(let key in duration){
        halfDuration[key] = Math.floor(duration[key] / 2);
        if (halfDuration[key] > 0 && duration[key] % 2 === 0) halfDuration[key]--;
    }
    let aligned = $4301262d71f567b9$export$144a00ba6044eb9(date, duration, locale).subtract(halfDuration);
    return $4301262d71f567b9$export$5bb865b12696a77d(date, aligned, duration, locale, minValue, maxValue);
}
function $4301262d71f567b9$export$144a00ba6044eb9(date, duration, locale, minValue, maxValue) {
    // align to the start of the largest unit
    let aligned = date;
    if (duration.years) aligned = (0, $hEzMm$internationalizeddate.startOfYear)(date);
    else if (duration.months) aligned = (0, $hEzMm$internationalizeddate.startOfMonth)(date);
    else if (duration.weeks) aligned = (0, $hEzMm$internationalizeddate.startOfWeek)(date, locale);
    return $4301262d71f567b9$export$5bb865b12696a77d(date, aligned, duration, locale, minValue, maxValue);
}
function $4301262d71f567b9$export$530edbfc915b2b04(date, duration, locale, minValue, maxValue) {
    let d = {
        ...duration
    };
    // subtract 1 from the smallest unit
    if (duration.days) d.days--;
    else if (duration.weeks) d.weeks--;
    else if (duration.months) d.months--;
    else if (duration.years) d.years--;
    let aligned = $4301262d71f567b9$export$144a00ba6044eb9(date, duration, locale).subtract(d);
    return $4301262d71f567b9$export$5bb865b12696a77d(date, aligned, duration, locale, minValue, maxValue);
}
function $4301262d71f567b9$export$5bb865b12696a77d(date, aligned, duration, locale, minValue, maxValue) {
    if (minValue && date.compare(minValue) >= 0) aligned = (0, $hEzMm$internationalizeddate.maxDate)(aligned, $4301262d71f567b9$export$144a00ba6044eb9((0, $hEzMm$internationalizeddate.toCalendarDate)(minValue), duration, locale));
    if (maxValue && date.compare(maxValue) <= 0) aligned = (0, $hEzMm$internationalizeddate.minDate)(aligned, $4301262d71f567b9$export$530edbfc915b2b04((0, $hEzMm$internationalizeddate.toCalendarDate)(maxValue), duration, locale));
    return aligned;
}
function $4301262d71f567b9$export$4f5203c0d889109e(date, minValue, maxValue) {
    if (minValue) date = (0, $hEzMm$internationalizeddate.maxDate)(date, (0, $hEzMm$internationalizeddate.toCalendarDate)(minValue));
    if (maxValue) date = (0, $hEzMm$internationalizeddate.minDate)(date, (0, $hEzMm$internationalizeddate.toCalendarDate)(maxValue));
    return date;
}
function $4301262d71f567b9$export$a1d3911297b952d7(date, minValue, isDateUnavailable) {
    if (!isDateUnavailable) return date;
    while(date.compare(minValue) >= 0 && isDateUnavailable(date))date = date.subtract({
        days: 1
    });
    if (date.compare(minValue) >= 0) return date;
}





function $6adad0c8536fc209$export$6d095e787d2b5e1f(props) {
    let defaultFormatter = (0, $hEzMm$react.useMemo)(()=>new (0, $hEzMm$internationalizeddate.DateFormatter)(props.locale), [
        props.locale
    ]);
    let resolvedOptions = (0, $hEzMm$react.useMemo)(()=>defaultFormatter.resolvedOptions(), [
        defaultFormatter
    ]);
    let { locale: locale , createCalendar: createCalendar , visibleDuration: visibleDuration = {
        months: 1
    } , minValue: minValue , maxValue: maxValue , selectionAlignment: selectionAlignment , isDateUnavailable: isDateUnavailable  } = props;
    let calendar = (0, $hEzMm$react.useMemo)(()=>createCalendar(resolvedOptions.calendar), [
        createCalendar,
        resolvedOptions.calendar
    ]);
    let [value, setControlledValue] = (0, $hEzMm$reactstatelyutils.useControlledState)(props.value, props.defaultValue, props.onChange);
    let calendarDateValue = (0, $hEzMm$react.useMemo)(()=>value ? (0, $hEzMm$internationalizeddate.toCalendar)((0, $hEzMm$internationalizeddate.toCalendarDate)(value), calendar) : null, [
        value,
        calendar
    ]);
    let timeZone = (0, $hEzMm$react.useMemo)(()=>value && "timeZone" in value ? value.timeZone : resolvedOptions.timeZone, [
        value,
        resolvedOptions.timeZone
    ]);
    let focusedCalendarDate = (0, $hEzMm$react.useMemo)(()=>props.focusedValue ? (0, $4301262d71f567b9$export$4f5203c0d889109e)((0, $hEzMm$internationalizeddate.toCalendar)((0, $hEzMm$internationalizeddate.toCalendarDate)(props.focusedValue), calendar), minValue, maxValue) : undefined, [
        props.focusedValue,
        calendar,
        minValue,
        maxValue
    ]);
    let defaultFocusedCalendarDate = (0, $hEzMm$react.useMemo)(()=>(0, $4301262d71f567b9$export$4f5203c0d889109e)(props.defaultFocusedValue ? (0, $hEzMm$internationalizeddate.toCalendar)((0, $hEzMm$internationalizeddate.toCalendarDate)(props.defaultFocusedValue), calendar) : calendarDateValue || (0, $hEzMm$internationalizeddate.toCalendar)((0, $hEzMm$internationalizeddate.today)(timeZone), calendar), minValue, maxValue), [
        props.defaultFocusedValue,
        calendarDateValue,
        timeZone,
        calendar,
        minValue,
        maxValue
    ]);
    let [focusedDate, setFocusedDate] = (0, $hEzMm$reactstatelyutils.useControlledState)(focusedCalendarDate, defaultFocusedCalendarDate, props.onFocusChange);
    let [startDate, setStartDate] = (0, $hEzMm$react.useState)(()=>{
        switch(selectionAlignment){
            case "start":
                return (0, $4301262d71f567b9$export$144a00ba6044eb9)(focusedDate, visibleDuration, locale, minValue, maxValue);
            case "end":
                return (0, $4301262d71f567b9$export$530edbfc915b2b04)(focusedDate, visibleDuration, locale, minValue, maxValue);
            case "center":
            default:
                return (0, $4301262d71f567b9$export$f4a51ff076cc9a09)(focusedDate, visibleDuration, locale, minValue, maxValue);
        }
    });
    let [isFocused, setFocused] = (0, $hEzMm$react.useState)(props.autoFocus || false);
    let endDate = (0, $hEzMm$react.useMemo)(()=>{
        let duration = {
            ...visibleDuration
        };
        if (duration.days) duration.days--;
        else duration.days = -1;
        return startDate.add(duration);
    }, [
        startDate,
        visibleDuration
    ]);
    // Reset focused date and visible range when calendar changes.
    let lastCalendarIdentifier = (0, $hEzMm$react.useRef)(calendar.identifier);
    if (calendar.identifier !== lastCalendarIdentifier.current) {
        let newFocusedDate = (0, $hEzMm$internationalizeddate.toCalendar)(focusedDate, calendar);
        setStartDate((0, $4301262d71f567b9$export$f4a51ff076cc9a09)(newFocusedDate, visibleDuration, locale, minValue, maxValue));
        setFocusedDate(newFocusedDate);
        lastCalendarIdentifier.current = calendar.identifier;
    }
    if ((0, $4301262d71f567b9$export$eac50920cf2fd59a)(focusedDate, minValue, maxValue)) // If the focused date was moved to an invalid value, it can't be focused, so constrain it.
    setFocusedDate((0, $4301262d71f567b9$export$4f5203c0d889109e)(focusedDate, minValue, maxValue));
    else if (focusedDate.compare(startDate) < 0) setStartDate((0, $4301262d71f567b9$export$530edbfc915b2b04)(focusedDate, visibleDuration, locale, minValue, maxValue));
    else if (focusedDate.compare(endDate) > 0) setStartDate((0, $4301262d71f567b9$export$144a00ba6044eb9)(focusedDate, visibleDuration, locale, minValue, maxValue));
    // Sets focus to a specific cell date
    function focusCell(date) {
        date = (0, $4301262d71f567b9$export$4f5203c0d889109e)(date, minValue, maxValue);
        setFocusedDate(date);
    }
    function setValue(newValue) {
        if (!props.isDisabled && !props.isReadOnly) {
            newValue = (0, $4301262d71f567b9$export$4f5203c0d889109e)(newValue, minValue, maxValue);
            newValue = (0, $4301262d71f567b9$export$a1d3911297b952d7)(newValue, startDate, isDateUnavailable);
            if (!newValue) return;
            // The display calendar should not have any effect on the emitted value.
            // Emit dates in the same calendar as the original value, if any, otherwise gregorian.
            newValue = (0, $hEzMm$internationalizeddate.toCalendar)(newValue, (value === null || value === void 0 ? void 0 : value.calendar) || new (0, $hEzMm$internationalizeddate.GregorianCalendar)());
            // Preserve time if the input value had one.
            if (value && "hour" in value) setControlledValue(value.set(newValue));
            else setControlledValue(newValue);
        }
    }
    let isUnavailable = (0, $hEzMm$react.useMemo)(()=>{
        if (!calendarDateValue) return false;
        if (isDateUnavailable && isDateUnavailable(calendarDateValue)) return true;
        return (0, $4301262d71f567b9$export$eac50920cf2fd59a)(calendarDateValue, minValue, maxValue);
    }, [
        calendarDateValue,
        isDateUnavailable,
        minValue,
        maxValue
    ]);
    let validationState = props.validationState || (isUnavailable ? "invalid" : null);
    return {
        isDisabled: props.isDisabled,
        isReadOnly: props.isReadOnly,
        value: calendarDateValue,
        setValue: setValue,
        visibleRange: {
            start: startDate,
            end: endDate
        },
        minValue: minValue,
        maxValue: maxValue,
        focusedDate: focusedDate,
        timeZone: timeZone,
        validationState: validationState,
        setFocusedDate (date) {
            focusCell(date);
            setFocused(true);
        },
        focusNextDay () {
            focusCell(focusedDate.add({
                days: 1
            }));
        },
        focusPreviousDay () {
            focusCell(focusedDate.subtract({
                days: 1
            }));
        },
        focusNextRow () {
            if (visibleDuration.days) this.focusNextPage();
            else if (visibleDuration.weeks || visibleDuration.months || visibleDuration.years) focusCell(focusedDate.add({
                weeks: 1
            }));
        },
        focusPreviousRow () {
            if (visibleDuration.days) this.focusPreviousPage();
            else if (visibleDuration.weeks || visibleDuration.months || visibleDuration.years) focusCell(focusedDate.subtract({
                weeks: 1
            }));
        },
        focusNextPage () {
            let start = startDate.add(visibleDuration);
            setFocusedDate((0, $4301262d71f567b9$export$4f5203c0d889109e)(focusedDate.add(visibleDuration), minValue, maxValue));
            setStartDate((0, $4301262d71f567b9$export$144a00ba6044eb9)((0, $4301262d71f567b9$export$5bb865b12696a77d)(focusedDate, start, visibleDuration, locale, minValue, maxValue), visibleDuration, locale));
        },
        focusPreviousPage () {
            let start = startDate.subtract(visibleDuration);
            setFocusedDate((0, $4301262d71f567b9$export$4f5203c0d889109e)(focusedDate.subtract(visibleDuration), minValue, maxValue));
            setStartDate((0, $4301262d71f567b9$export$144a00ba6044eb9)((0, $4301262d71f567b9$export$5bb865b12696a77d)(focusedDate, start, visibleDuration, locale, minValue, maxValue), visibleDuration, locale));
        },
        focusSectionStart () {
            if (visibleDuration.days) focusCell(startDate);
            else if (visibleDuration.weeks) focusCell((0, $hEzMm$internationalizeddate.startOfWeek)(focusedDate, locale));
            else if (visibleDuration.months || visibleDuration.years) focusCell((0, $hEzMm$internationalizeddate.startOfMonth)(focusedDate));
        },
        focusSectionEnd () {
            if (visibleDuration.days) focusCell(endDate);
            else if (visibleDuration.weeks) focusCell((0, $hEzMm$internationalizeddate.endOfWeek)(focusedDate, locale));
            else if (visibleDuration.months || visibleDuration.years) focusCell((0, $hEzMm$internationalizeddate.endOfMonth)(focusedDate));
        },
        focusNextSection (larger) {
            if (!larger && !visibleDuration.days) {
                focusCell(focusedDate.add($6adad0c8536fc209$var$unitDuration(visibleDuration)));
                return;
            }
            if (visibleDuration.days) this.focusNextPage();
            else if (visibleDuration.weeks) focusCell(focusedDate.add({
                months: 1
            }));
            else if (visibleDuration.months || visibleDuration.years) focusCell(focusedDate.add({
                years: 1
            }));
        },
        focusPreviousSection (larger) {
            if (!larger && !visibleDuration.days) {
                focusCell(focusedDate.subtract($6adad0c8536fc209$var$unitDuration(visibleDuration)));
                return;
            }
            if (visibleDuration.days) this.focusPreviousPage();
            else if (visibleDuration.weeks) focusCell(focusedDate.subtract({
                months: 1
            }));
            else if (visibleDuration.months || visibleDuration.years) focusCell(focusedDate.subtract({
                years: 1
            }));
        },
        selectFocusedDate () {
            setValue(focusedDate);
        },
        selectDate (date) {
            setValue(date);
        },
        isFocused: isFocused,
        setFocused: setFocused,
        isInvalid (date) {
            return (0, $4301262d71f567b9$export$eac50920cf2fd59a)(date, minValue, maxValue);
        },
        isSelected (date) {
            return calendarDateValue != null && (0, $hEzMm$internationalizeddate.isSameDay)(date, calendarDateValue) && !this.isCellDisabled(date) && !this.isCellUnavailable(date);
        },
        isCellFocused (date) {
            return isFocused && focusedDate && (0, $hEzMm$internationalizeddate.isSameDay)(date, focusedDate);
        },
        isCellDisabled (date) {
            return props.isDisabled || date.compare(startDate) < 0 || date.compare(endDate) > 0 || this.isInvalid(date, minValue, maxValue);
        },
        isCellUnavailable (date) {
            return props.isDateUnavailable && props.isDateUnavailable(date);
        },
        isPreviousVisibleRangeInvalid () {
            let prev = startDate.subtract({
                days: 1
            });
            return (0, $hEzMm$internationalizeddate.isSameDay)(prev, startDate) || this.isInvalid(prev, minValue, maxValue);
        },
        isNextVisibleRangeInvalid () {
            // Adding may return the same date if we reached the end of time
            // according to the calendar system (e.g. 9999-12-31).
            let next = endDate.add({
                days: 1
            });
            return (0, $hEzMm$internationalizeddate.isSameDay)(next, endDate) || this.isInvalid(next, minValue, maxValue);
        },
        getDatesInWeek (weekIndex, from = startDate) {
            // let date = startOfWeek(from, locale);
            let date = from.add({
                weeks: weekIndex
            });
            let dates = [];
            date = (0, $hEzMm$internationalizeddate.startOfWeek)(date, locale);
            // startOfWeek will clamp dates within the calendar system's valid range, which may
            // start in the middle of a week. In this case, add null placeholders.
            let dayOfWeek = (0, $hEzMm$internationalizeddate.getDayOfWeek)(date, locale);
            for(let i = 0; i < dayOfWeek; i++)dates.push(null);
            while(dates.length < 7){
                dates.push(date);
                let nextDate = date.add({
                    days: 1
                });
                if ((0, $hEzMm$internationalizeddate.isSameDay)(date, nextDate)) break;
                date = nextDate;
            }
            // Add null placeholders if at the end of the calendar system.
            while(dates.length < 7)dates.push(null);
            return dates;
        }
    };
}
function $6adad0c8536fc209$var$unitDuration(duration) {
    let unit = {
        ...duration
    };
    for(let key in duration)unit[key] = 1;
    return unit;
}


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




function $e49f7b861e5e8049$export$9a987164d97ecc90(props) {
    let { value: valueProp , defaultValue: defaultValue , onChange: onChange , createCalendar: createCalendar , locale: locale , visibleDuration: visibleDuration = {
        months: 1
    } , minValue: minValue , maxValue: maxValue , ...calendarProps } = props;
    let [value, setValue] = (0, $hEzMm$reactstatelyutils.useControlledState)(valueProp, defaultValue || null, onChange);
    let [anchorDate, setAnchorDateState] = (0, $hEzMm$react.useState)(null);
    let alignment = "center";
    if (value && value.start && value.end) {
        let start = (0, $4301262d71f567b9$export$f4a51ff076cc9a09)((0, $hEzMm$internationalizeddate.toCalendarDate)(value.start), visibleDuration, locale, minValue, maxValue);
        let end = start.add(visibleDuration).subtract({
            days: 1
        });
        if (value.end.compare(end) > 0) alignment = "start";
    }
    // Available range must be stored in a ref so we have access to the updated version immediately in `isInvalid`.
    let availableRangeRef = (0, $hEzMm$react.useRef)(null);
    let [availableRange, setAvailableRange] = (0, $hEzMm$react.useState)(null);
    let min = (0, $hEzMm$react.useMemo)(()=>{
        return (0, $hEzMm$internationalizeddate.maxDate)(minValue, availableRange === null || availableRange === void 0 ? void 0 : availableRange.start);
    }, [
        minValue,
        availableRange
    ]);
    let max = (0, $hEzMm$react.useMemo)(()=>{
        return (0, $hEzMm$internationalizeddate.minDate)(maxValue, availableRange === null || availableRange === void 0 ? void 0 : availableRange.end);
    }, [
        maxValue,
        availableRange
    ]);
    let calendar = (0, $6adad0c8536fc209$export$6d095e787d2b5e1f)({
        ...calendarProps,
        value: value && value.start,
        createCalendar: createCalendar,
        locale: locale,
        visibleDuration: visibleDuration,
        minValue: min,
        maxValue: max,
        selectionAlignment: alignment
    });
    let updateAvailableRange = (date)=>{
        if (date && props.isDateUnavailable && !props.allowsNonContiguousRanges) {
            availableRangeRef.current = {
                start: $e49f7b861e5e8049$var$nextUnavailableDate(date, calendar, -1),
                end: $e49f7b861e5e8049$var$nextUnavailableDate(date, calendar, 1)
            };
            setAvailableRange(availableRangeRef.current);
        } else {
            availableRangeRef.current = null;
            setAvailableRange(null);
        }
    };
    // If the visible range changes, we need to update the available range.
    let lastVisibleRange = (0, $hEzMm$react.useRef)(calendar.visibleRange);
    if (!(0, $hEzMm$internationalizeddate.isEqualDay)(calendar.visibleRange.start, lastVisibleRange.current.start) || !(0, $hEzMm$internationalizeddate.isEqualDay)(calendar.visibleRange.end, lastVisibleRange.current.end)) {
        updateAvailableRange(anchorDate);
        lastVisibleRange.current = calendar.visibleRange;
    }
    let setAnchorDate = (date)=>{
        if (date) {
            setAnchorDateState(date);
            updateAvailableRange(date);
        } else {
            setAnchorDateState(null);
            updateAvailableRange(null);
        }
    };
    let highlightedRange = anchorDate ? $e49f7b861e5e8049$var$makeRange(anchorDate, calendar.focusedDate) : value && $e49f7b861e5e8049$var$makeRange(value.start, value.end);
    let selectDate = (date)=>{
        if (props.isReadOnly) return;
        date = (0, $4301262d71f567b9$export$4f5203c0d889109e)(date, min, max);
        date = (0, $4301262d71f567b9$export$a1d3911297b952d7)(date, calendar.visibleRange.start, props.isDateUnavailable);
        if (!date) return;
        if (!anchorDate) setAnchorDate(date);
        else {
            let range = $e49f7b861e5e8049$var$makeRange(anchorDate, date);
            setValue({
                start: $e49f7b861e5e8049$var$convertValue(range.start, value === null || value === void 0 ? void 0 : value.start),
                end: $e49f7b861e5e8049$var$convertValue(range.end, value === null || value === void 0 ? void 0 : value.end)
            });
            setAnchorDate(null);
        }
    };
    let [isDragging, setDragging] = (0, $hEzMm$react.useState)(false);
    let { isDateUnavailable: isDateUnavailable  } = props;
    let isInvalidSelection = (0, $hEzMm$react.useMemo)(()=>{
        if (!value || anchorDate) return false;
        if (isDateUnavailable && (isDateUnavailable(value.start) || isDateUnavailable(value.end))) return true;
        return (0, $4301262d71f567b9$export$eac50920cf2fd59a)(value.start, minValue, maxValue) || (0, $4301262d71f567b9$export$eac50920cf2fd59a)(value.end, minValue, maxValue);
    }, [
        isDateUnavailable,
        value,
        anchorDate,
        minValue,
        maxValue
    ]);
    let validationState = props.validationState || (isInvalidSelection ? "invalid" : null);
    return {
        ...calendar,
        value: value,
        setValue: setValue,
        anchorDate: anchorDate,
        setAnchorDate: setAnchorDate,
        highlightedRange: highlightedRange,
        validationState: validationState,
        selectFocusedDate () {
            selectDate(calendar.focusedDate);
        },
        selectDate: selectDate,
        highlightDate (date) {
            if (anchorDate) calendar.setFocusedDate(date);
        },
        isSelected (date) {
            return highlightedRange && date.compare(highlightedRange.start) >= 0 && date.compare(highlightedRange.end) <= 0 && !calendar.isCellDisabled(date) && !calendar.isCellUnavailable(date);
        },
        isInvalid (date) {
            var _availableRangeRef_current, _availableRangeRef_current1;
            return calendar.isInvalid(date) || (0, $4301262d71f567b9$export$eac50920cf2fd59a)(date, (_availableRangeRef_current = availableRangeRef.current) === null || _availableRangeRef_current === void 0 ? void 0 : _availableRangeRef_current.start, (_availableRangeRef_current1 = availableRangeRef.current) === null || _availableRangeRef_current1 === void 0 ? void 0 : _availableRangeRef_current1.end);
        },
        isDragging: isDragging,
        setDragging: setDragging
    };
}
function $e49f7b861e5e8049$var$makeRange(start, end) {
    if (!start || !end) return null;
    if (end.compare(start) < 0) [start, end] = [
        end,
        start
    ];
    return {
        start: (0, $hEzMm$internationalizeddate.toCalendarDate)(start),
        end: (0, $hEzMm$internationalizeddate.toCalendarDate)(end)
    };
}
function $e49f7b861e5e8049$var$convertValue(newValue, oldValue) {
    // The display calendar should not have any effect on the emitted value.
    // Emit dates in the same calendar as the original value, if any, otherwise gregorian.
    newValue = (0, $hEzMm$internationalizeddate.toCalendar)(newValue, (oldValue === null || oldValue === void 0 ? void 0 : oldValue.calendar) || new (0, $hEzMm$internationalizeddate.GregorianCalendar)());
    // Preserve time if the input value had one.
    if (oldValue && "hour" in oldValue) return oldValue.set(newValue);
    return newValue;
}
function $e49f7b861e5e8049$var$nextUnavailableDate(anchorDate, state, dir) {
    let nextDate = anchorDate.add({
        days: dir
    });
    while((dir < 0 ? nextDate.compare(state.visibleRange.start) >= 0 : nextDate.compare(state.visibleRange.end) <= 0) && !state.isCellUnavailable(nextDate))nextDate = nextDate.add({
        days: dir
    });
    if (state.isCellUnavailable(nextDate)) return nextDate.add({
        days: -dir
    });
    return null;
}




//# sourceMappingURL=main.js.map
