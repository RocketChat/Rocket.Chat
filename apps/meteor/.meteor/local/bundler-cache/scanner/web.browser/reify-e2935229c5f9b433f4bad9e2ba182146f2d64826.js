module.export({useCalendarState:()=>$131cf43a05231e1e$export$6d095e787d2b5e1f,useRangeCalendarState:()=>$9a36b6ba2fb1a7c5$export$9a987164d97ecc90});let $keQhS$DateFormatter,$keQhS$toCalendar,$keQhS$toCalendarDate,$keQhS$today,$keQhS$GregorianCalendar,$keQhS$startOfWeek,$keQhS$startOfMonth,$keQhS$endOfWeek,$keQhS$endOfMonth,$keQhS$isSameDay,$keQhS$getDayOfWeek,$keQhS$startOfYear,$keQhS$maxDate,$keQhS$minDate,$keQhS$isEqualDay;module.link("@internationalized/date",{DateFormatter(v){$keQhS$DateFormatter=v},toCalendar(v){$keQhS$toCalendar=v},toCalendarDate(v){$keQhS$toCalendarDate=v},today(v){$keQhS$today=v},GregorianCalendar(v){$keQhS$GregorianCalendar=v},startOfWeek(v){$keQhS$startOfWeek=v},startOfMonth(v){$keQhS$startOfMonth=v},endOfWeek(v){$keQhS$endOfWeek=v},endOfMonth(v){$keQhS$endOfMonth=v},isSameDay(v){$keQhS$isSameDay=v},getDayOfWeek(v){$keQhS$getDayOfWeek=v},startOfYear(v){$keQhS$startOfYear=v},maxDate(v){$keQhS$maxDate=v},minDate(v){$keQhS$minDate=v},isEqualDay(v){$keQhS$isEqualDay=v}},0);let $keQhS$useControlledState;module.link("@react-stately/utils",{useControlledState(v){$keQhS$useControlledState=v}},1);let $keQhS$useMemo,$keQhS$useState,$keQhS$useRef;module.link("react",{useMemo(v){$keQhS$useMemo=v},useState(v){$keQhS$useState=v},useRef(v){$keQhS$useRef=v}},2);



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
function $f62d864046160412$export$eac50920cf2fd59a(date, minValue, maxValue) {
    return minValue != null && date.compare(minValue) < 0 || maxValue != null && date.compare(maxValue) > 0;
}
function $f62d864046160412$export$f4a51ff076cc9a09(date, duration, locale, minValue, maxValue) {
    let halfDuration = {};
    for(let key in duration){
        halfDuration[key] = Math.floor(duration[key] / 2);
        if (halfDuration[key] > 0 && duration[key] % 2 === 0) halfDuration[key]--;
    }
    let aligned = $f62d864046160412$export$144a00ba6044eb9(date, duration, locale).subtract(halfDuration);
    return $f62d864046160412$export$5bb865b12696a77d(date, aligned, duration, locale, minValue, maxValue);
}
function $f62d864046160412$export$144a00ba6044eb9(date, duration, locale, minValue, maxValue) {
    // align to the start of the largest unit
    let aligned = date;
    if (duration.years) aligned = (0, $keQhS$startOfYear)(date);
    else if (duration.months) aligned = (0, $keQhS$startOfMonth)(date);
    else if (duration.weeks) aligned = (0, $keQhS$startOfWeek)(date, locale);
    return $f62d864046160412$export$5bb865b12696a77d(date, aligned, duration, locale, minValue, maxValue);
}
function $f62d864046160412$export$530edbfc915b2b04(date, duration, locale, minValue, maxValue) {
    let d = {
        ...duration
    };
    // subtract 1 from the smallest unit
    if (duration.days) d.days--;
    else if (duration.weeks) d.weeks--;
    else if (duration.months) d.months--;
    else if (duration.years) d.years--;
    let aligned = $f62d864046160412$export$144a00ba6044eb9(date, duration, locale).subtract(d);
    return $f62d864046160412$export$5bb865b12696a77d(date, aligned, duration, locale, minValue, maxValue);
}
function $f62d864046160412$export$5bb865b12696a77d(date, aligned, duration, locale, minValue, maxValue) {
    if (minValue && date.compare(minValue) >= 0) aligned = (0, $keQhS$maxDate)(aligned, $f62d864046160412$export$144a00ba6044eb9((0, $keQhS$toCalendarDate)(minValue), duration, locale));
    if (maxValue && date.compare(maxValue) <= 0) aligned = (0, $keQhS$minDate)(aligned, $f62d864046160412$export$530edbfc915b2b04((0, $keQhS$toCalendarDate)(maxValue), duration, locale));
    return aligned;
}
function $f62d864046160412$export$4f5203c0d889109e(date, minValue, maxValue) {
    if (minValue) date = (0, $keQhS$maxDate)(date, (0, $keQhS$toCalendarDate)(minValue));
    if (maxValue) date = (0, $keQhS$minDate)(date, (0, $keQhS$toCalendarDate)(maxValue));
    return date;
}
function $f62d864046160412$export$a1d3911297b952d7(date, minValue, isDateUnavailable) {
    if (!isDateUnavailable) return date;
    while(date.compare(minValue) >= 0 && isDateUnavailable(date))date = date.subtract({
        days: 1
    });
    if (date.compare(minValue) >= 0) return date;
}





function $131cf43a05231e1e$export$6d095e787d2b5e1f(props) {
    let defaultFormatter = (0, $keQhS$useMemo)(()=>new (0, $keQhS$DateFormatter)(props.locale), [
        props.locale
    ]);
    let resolvedOptions = (0, $keQhS$useMemo)(()=>defaultFormatter.resolvedOptions(), [
        defaultFormatter
    ]);
    let { locale: locale , createCalendar: createCalendar , visibleDuration: visibleDuration = {
        months: 1
    } , minValue: minValue , maxValue: maxValue , selectionAlignment: selectionAlignment , isDateUnavailable: isDateUnavailable  } = props;
    let calendar = (0, $keQhS$useMemo)(()=>createCalendar(resolvedOptions.calendar), [
        createCalendar,
        resolvedOptions.calendar
    ]);
    let [value, setControlledValue] = (0, $keQhS$useControlledState)(props.value, props.defaultValue, props.onChange);
    let calendarDateValue = (0, $keQhS$useMemo)(()=>value ? (0, $keQhS$toCalendar)((0, $keQhS$toCalendarDate)(value), calendar) : null, [
        value,
        calendar
    ]);
    let timeZone = (0, $keQhS$useMemo)(()=>value && "timeZone" in value ? value.timeZone : resolvedOptions.timeZone, [
        value,
        resolvedOptions.timeZone
    ]);
    let focusedCalendarDate = (0, $keQhS$useMemo)(()=>props.focusedValue ? (0, $f62d864046160412$export$4f5203c0d889109e)((0, $keQhS$toCalendar)((0, $keQhS$toCalendarDate)(props.focusedValue), calendar), minValue, maxValue) : undefined, [
        props.focusedValue,
        calendar,
        minValue,
        maxValue
    ]);
    let defaultFocusedCalendarDate = (0, $keQhS$useMemo)(()=>(0, $f62d864046160412$export$4f5203c0d889109e)(props.defaultFocusedValue ? (0, $keQhS$toCalendar)((0, $keQhS$toCalendarDate)(props.defaultFocusedValue), calendar) : calendarDateValue || (0, $keQhS$toCalendar)((0, $keQhS$today)(timeZone), calendar), minValue, maxValue), [
        props.defaultFocusedValue,
        calendarDateValue,
        timeZone,
        calendar,
        minValue,
        maxValue
    ]);
    let [focusedDate, setFocusedDate] = (0, $keQhS$useControlledState)(focusedCalendarDate, defaultFocusedCalendarDate, props.onFocusChange);
    let [startDate, setStartDate] = (0, $keQhS$useState)(()=>{
        switch(selectionAlignment){
            case "start":
                return (0, $f62d864046160412$export$144a00ba6044eb9)(focusedDate, visibleDuration, locale, minValue, maxValue);
            case "end":
                return (0, $f62d864046160412$export$530edbfc915b2b04)(focusedDate, visibleDuration, locale, minValue, maxValue);
            case "center":
            default:
                return (0, $f62d864046160412$export$f4a51ff076cc9a09)(focusedDate, visibleDuration, locale, minValue, maxValue);
        }
    });
    let [isFocused, setFocused] = (0, $keQhS$useState)(props.autoFocus || false);
    let endDate = (0, $keQhS$useMemo)(()=>{
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
    let lastCalendarIdentifier = (0, $keQhS$useRef)(calendar.identifier);
    if (calendar.identifier !== lastCalendarIdentifier.current) {
        let newFocusedDate = (0, $keQhS$toCalendar)(focusedDate, calendar);
        setStartDate((0, $f62d864046160412$export$f4a51ff076cc9a09)(newFocusedDate, visibleDuration, locale, minValue, maxValue));
        setFocusedDate(newFocusedDate);
        lastCalendarIdentifier.current = calendar.identifier;
    }
    if ((0, $f62d864046160412$export$eac50920cf2fd59a)(focusedDate, minValue, maxValue)) // If the focused date was moved to an invalid value, it can't be focused, so constrain it.
    setFocusedDate((0, $f62d864046160412$export$4f5203c0d889109e)(focusedDate, minValue, maxValue));
    else if (focusedDate.compare(startDate) < 0) setStartDate((0, $f62d864046160412$export$530edbfc915b2b04)(focusedDate, visibleDuration, locale, minValue, maxValue));
    else if (focusedDate.compare(endDate) > 0) setStartDate((0, $f62d864046160412$export$144a00ba6044eb9)(focusedDate, visibleDuration, locale, minValue, maxValue));
    // Sets focus to a specific cell date
    function focusCell(date) {
        date = (0, $f62d864046160412$export$4f5203c0d889109e)(date, minValue, maxValue);
        setFocusedDate(date);
    }
    function setValue(newValue) {
        if (!props.isDisabled && !props.isReadOnly) {
            newValue = (0, $f62d864046160412$export$4f5203c0d889109e)(newValue, minValue, maxValue);
            newValue = (0, $f62d864046160412$export$a1d3911297b952d7)(newValue, startDate, isDateUnavailable);
            if (!newValue) return;
            // The display calendar should not have any effect on the emitted value.
            // Emit dates in the same calendar as the original value, if any, otherwise gregorian.
            newValue = (0, $keQhS$toCalendar)(newValue, (value === null || value === void 0 ? void 0 : value.calendar) || new (0, $keQhS$GregorianCalendar)());
            // Preserve time if the input value had one.
            if (value && "hour" in value) setControlledValue(value.set(newValue));
            else setControlledValue(newValue);
        }
    }
    let isUnavailable = (0, $keQhS$useMemo)(()=>{
        if (!calendarDateValue) return false;
        if (isDateUnavailable && isDateUnavailable(calendarDateValue)) return true;
        return (0, $f62d864046160412$export$eac50920cf2fd59a)(calendarDateValue, minValue, maxValue);
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
            setFocusedDate((0, $f62d864046160412$export$4f5203c0d889109e)(focusedDate.add(visibleDuration), minValue, maxValue));
            setStartDate((0, $f62d864046160412$export$144a00ba6044eb9)((0, $f62d864046160412$export$5bb865b12696a77d)(focusedDate, start, visibleDuration, locale, minValue, maxValue), visibleDuration, locale));
        },
        focusPreviousPage () {
            let start = startDate.subtract(visibleDuration);
            setFocusedDate((0, $f62d864046160412$export$4f5203c0d889109e)(focusedDate.subtract(visibleDuration), minValue, maxValue));
            setStartDate((0, $f62d864046160412$export$144a00ba6044eb9)((0, $f62d864046160412$export$5bb865b12696a77d)(focusedDate, start, visibleDuration, locale, minValue, maxValue), visibleDuration, locale));
        },
        focusSectionStart () {
            if (visibleDuration.days) focusCell(startDate);
            else if (visibleDuration.weeks) focusCell((0, $keQhS$startOfWeek)(focusedDate, locale));
            else if (visibleDuration.months || visibleDuration.years) focusCell((0, $keQhS$startOfMonth)(focusedDate));
        },
        focusSectionEnd () {
            if (visibleDuration.days) focusCell(endDate);
            else if (visibleDuration.weeks) focusCell((0, $keQhS$endOfWeek)(focusedDate, locale));
            else if (visibleDuration.months || visibleDuration.years) focusCell((0, $keQhS$endOfMonth)(focusedDate));
        },
        focusNextSection (larger) {
            if (!larger && !visibleDuration.days) {
                focusCell(focusedDate.add($131cf43a05231e1e$var$unitDuration(visibleDuration)));
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
                focusCell(focusedDate.subtract($131cf43a05231e1e$var$unitDuration(visibleDuration)));
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
            return (0, $f62d864046160412$export$eac50920cf2fd59a)(date, minValue, maxValue);
        },
        isSelected (date) {
            return calendarDateValue != null && (0, $keQhS$isSameDay)(date, calendarDateValue) && !this.isCellDisabled(date) && !this.isCellUnavailable(date);
        },
        isCellFocused (date) {
            return isFocused && focusedDate && (0, $keQhS$isSameDay)(date, focusedDate);
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
            return (0, $keQhS$isSameDay)(prev, startDate) || this.isInvalid(prev, minValue, maxValue);
        },
        isNextVisibleRangeInvalid () {
            // Adding may return the same date if we reached the end of time
            // according to the calendar system (e.g. 9999-12-31).
            let next = endDate.add({
                days: 1
            });
            return (0, $keQhS$isSameDay)(next, endDate) || this.isInvalid(next, minValue, maxValue);
        },
        getDatesInWeek (weekIndex, from = startDate) {
            // let date = startOfWeek(from, locale);
            let date = from.add({
                weeks: weekIndex
            });
            let dates = [];
            date = (0, $keQhS$startOfWeek)(date, locale);
            // startOfWeek will clamp dates within the calendar system's valid range, which may
            // start in the middle of a week. In this case, add null placeholders.
            let dayOfWeek = (0, $keQhS$getDayOfWeek)(date, locale);
            for(let i = 0; i < dayOfWeek; i++)dates.push(null);
            while(dates.length < 7){
                dates.push(date);
                let nextDate = date.add({
                    days: 1
                });
                if ((0, $keQhS$isSameDay)(date, nextDate)) break;
                date = nextDate;
            }
            // Add null placeholders if at the end of the calendar system.
            while(dates.length < 7)dates.push(null);
            return dates;
        }
    };
}
function $131cf43a05231e1e$var$unitDuration(duration) {
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




function $9a36b6ba2fb1a7c5$export$9a987164d97ecc90(props) {
    let { value: valueProp , defaultValue: defaultValue , onChange: onChange , createCalendar: createCalendar , locale: locale , visibleDuration: visibleDuration = {
        months: 1
    } , minValue: minValue , maxValue: maxValue , ...calendarProps } = props;
    let [value, setValue] = (0, $keQhS$useControlledState)(valueProp, defaultValue || null, onChange);
    let [anchorDate, setAnchorDateState] = (0, $keQhS$useState)(null);
    let alignment = "center";
    if (value && value.start && value.end) {
        let start = (0, $f62d864046160412$export$f4a51ff076cc9a09)((0, $keQhS$toCalendarDate)(value.start), visibleDuration, locale, minValue, maxValue);
        let end = start.add(visibleDuration).subtract({
            days: 1
        });
        if (value.end.compare(end) > 0) alignment = "start";
    }
    // Available range must be stored in a ref so we have access to the updated version immediately in `isInvalid`.
    let availableRangeRef = (0, $keQhS$useRef)(null);
    let [availableRange, setAvailableRange] = (0, $keQhS$useState)(null);
    let min = (0, $keQhS$useMemo)(()=>{
        return (0, $keQhS$maxDate)(minValue, availableRange === null || availableRange === void 0 ? void 0 : availableRange.start);
    }, [
        minValue,
        availableRange
    ]);
    let max = (0, $keQhS$useMemo)(()=>{
        return (0, $keQhS$minDate)(maxValue, availableRange === null || availableRange === void 0 ? void 0 : availableRange.end);
    }, [
        maxValue,
        availableRange
    ]);
    let calendar = (0, $131cf43a05231e1e$export$6d095e787d2b5e1f)({
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
                start: $9a36b6ba2fb1a7c5$var$nextUnavailableDate(date, calendar, -1),
                end: $9a36b6ba2fb1a7c5$var$nextUnavailableDate(date, calendar, 1)
            };
            setAvailableRange(availableRangeRef.current);
        } else {
            availableRangeRef.current = null;
            setAvailableRange(null);
        }
    };
    // If the visible range changes, we need to update the available range.
    let lastVisibleRange = (0, $keQhS$useRef)(calendar.visibleRange);
    if (!(0, $keQhS$isEqualDay)(calendar.visibleRange.start, lastVisibleRange.current.start) || !(0, $keQhS$isEqualDay)(calendar.visibleRange.end, lastVisibleRange.current.end)) {
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
    let highlightedRange = anchorDate ? $9a36b6ba2fb1a7c5$var$makeRange(anchorDate, calendar.focusedDate) : value && $9a36b6ba2fb1a7c5$var$makeRange(value.start, value.end);
    let selectDate = (date)=>{
        if (props.isReadOnly) return;
        date = (0, $f62d864046160412$export$4f5203c0d889109e)(date, min, max);
        date = (0, $f62d864046160412$export$a1d3911297b952d7)(date, calendar.visibleRange.start, props.isDateUnavailable);
        if (!date) return;
        if (!anchorDate) setAnchorDate(date);
        else {
            let range = $9a36b6ba2fb1a7c5$var$makeRange(anchorDate, date);
            setValue({
                start: $9a36b6ba2fb1a7c5$var$convertValue(range.start, value === null || value === void 0 ? void 0 : value.start),
                end: $9a36b6ba2fb1a7c5$var$convertValue(range.end, value === null || value === void 0 ? void 0 : value.end)
            });
            setAnchorDate(null);
        }
    };
    let [isDragging, setDragging] = (0, $keQhS$useState)(false);
    let { isDateUnavailable: isDateUnavailable  } = props;
    let isInvalidSelection = (0, $keQhS$useMemo)(()=>{
        if (!value || anchorDate) return false;
        if (isDateUnavailable && (isDateUnavailable(value.start) || isDateUnavailable(value.end))) return true;
        return (0, $f62d864046160412$export$eac50920cf2fd59a)(value.start, minValue, maxValue) || (0, $f62d864046160412$export$eac50920cf2fd59a)(value.end, minValue, maxValue);
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
            return calendar.isInvalid(date) || (0, $f62d864046160412$export$eac50920cf2fd59a)(date, (_availableRangeRef_current = availableRangeRef.current) === null || _availableRangeRef_current === void 0 ? void 0 : _availableRangeRef_current.start, (_availableRangeRef_current1 = availableRangeRef.current) === null || _availableRangeRef_current1 === void 0 ? void 0 : _availableRangeRef_current1.end);
        },
        isDragging: isDragging,
        setDragging: setDragging
    };
}
function $9a36b6ba2fb1a7c5$var$makeRange(start, end) {
    if (!start || !end) return null;
    if (end.compare(start) < 0) [start, end] = [
        end,
        start
    ];
    return {
        start: (0, $keQhS$toCalendarDate)(start),
        end: (0, $keQhS$toCalendarDate)(end)
    };
}
function $9a36b6ba2fb1a7c5$var$convertValue(newValue, oldValue) {
    // The display calendar should not have any effect on the emitted value.
    // Emit dates in the same calendar as the original value, if any, otherwise gregorian.
    newValue = (0, $keQhS$toCalendar)(newValue, (oldValue === null || oldValue === void 0 ? void 0 : oldValue.calendar) || new (0, $keQhS$GregorianCalendar)());
    // Preserve time if the input value had one.
    if (oldValue && "hour" in oldValue) return oldValue.set(newValue);
    return newValue;
}
function $9a36b6ba2fb1a7c5$var$nextUnavailableDate(anchorDate, state, dir) {
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





//# sourceMappingURL=module.js.map
