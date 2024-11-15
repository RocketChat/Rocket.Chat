var $h2qOe$internationalizeddate = require("@internationalized/date");
var $h2qOe$reactstatelyoverlays = require("@react-stately/overlays");
var $h2qOe$reactstatelyutils = require("@react-stately/utils");
var $h2qOe$react = require("react");
var $h2qOe$internationalizedstring = require("@internationalized/string");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "useDatePickerState", () => $aaab7a647e17e1fd$export$87194bb378cc3ac2);
$parcel$export(module.exports, "useDateFieldState", () => $596a1f0f523d6752$export$60e84778edff6d26);
$parcel$export(module.exports, "useDateRangePickerState", () => $7072d26f58deb33b$export$e50a61c1de9f574);
$parcel$export(module.exports, "useTimeFieldState", () => $2654e87be0231a69$export$fd53cef0cc796101);
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
 */ 
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

function $50d5d6a623389320$export$eac50920cf2fd59a(value, minValue, maxValue) {
    return value != null && (minValue != null && value.compare(minValue) < 0 || maxValue != null && value.compare(maxValue) > 0);
}
const $50d5d6a623389320$var$DEFAULT_FIELD_OPTIONS = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
};
function $50d5d6a623389320$export$7e319ea407e63bc0(fieldOptions, options) {
    fieldOptions = {
        ...$50d5d6a623389320$var$DEFAULT_FIELD_OPTIONS,
        ...fieldOptions
    };
    let granularity = options.granularity || "minute";
    let keys = Object.keys(fieldOptions);
    var _options_maxGranularity;
    let startIdx = keys.indexOf((_options_maxGranularity = options.maxGranularity) !== null && _options_maxGranularity !== void 0 ? _options_maxGranularity : "year");
    if (startIdx < 0) startIdx = 0;
    let endIdx = keys.indexOf(granularity);
    if (endIdx < 0) endIdx = 2;
    if (startIdx > endIdx) throw new Error("maxGranularity must be greater than granularity");
    let opts = keys.slice(startIdx, endIdx + 1).reduce((opts, key)=>{
        opts[key] = fieldOptions[key];
        return opts;
    }, {});
    if (options.hourCycle != null) opts.hour12 = options.hourCycle === 12;
    opts.timeZone = options.timeZone || "UTC";
    let hasTime = granularity === "hour" || granularity === "minute" || granularity === "second";
    if (hasTime && options.timeZone && !options.hideTimeZone) opts.timeZoneName = "short";
    if (options.showEra && startIdx === 0) opts.era = "short";
    return opts;
}
function $50d5d6a623389320$export$c5221a78ef73c5e9(placeholderValue) {
    if (placeholderValue && "hour" in placeholderValue) return placeholderValue;
    return new (0, $h2qOe$internationalizeddate.Time)();
}
function $50d5d6a623389320$export$61a490a80c552550(value, calendar) {
    if (value === null) return null;
    if (!value) return undefined;
    return (0, $h2qOe$internationalizeddate.toCalendar)(value, calendar);
}
function $50d5d6a623389320$export$66aa2b09de4b1ea5(placeholderValue, granularity, calendar, timeZone) {
    if (placeholderValue) return $50d5d6a623389320$export$61a490a80c552550(placeholderValue, calendar);
    let date = (0, $h2qOe$internationalizeddate.toCalendar)((0, $h2qOe$internationalizeddate.now)(timeZone).set({
        hour: 0,
        minute: 0,
        second: 0,
        millisecond: 0
    }), calendar);
    if (granularity === "year" || granularity === "month" || granularity === "day") return (0, $h2qOe$internationalizeddate.toCalendarDate)(date);
    if (!timeZone) return (0, $h2qOe$internationalizeddate.toCalendarDateTime)(date);
    return date;
}
function $50d5d6a623389320$export$2440da353cedad43(v, granularity) {
    // Compute default granularity and time zone from the value. If the value becomes null, keep the last values.
    let lastValue = (0, $h2qOe$react.useRef)(v);
    if (v) lastValue.current = v;
    v = lastValue.current;
    let defaultTimeZone = v && "timeZone" in v ? v.timeZone : undefined;
    granularity = granularity || (v && "minute" in v ? "minute" : "day");
    // props.granularity must actually exist in the value if one is provided.
    if (v && !(granularity in v)) throw new Error("Invalid granularity " + granularity + " for value " + v.toString());
    return [
        granularity,
        defaultTimeZone
    ];
}






function $aaab7a647e17e1fd$export$87194bb378cc3ac2(props) {
    var _props_isDateUnavailable;
    let overlayState = (0, $h2qOe$reactstatelyoverlays.useOverlayTriggerState)(props);
    let [value, setValue] = (0, $h2qOe$reactstatelyutils.useControlledState)(props.value, props.defaultValue || null, props.onChange);
    let v = value || props.placeholderValue;
    let [granularity, defaultTimeZone] = (0, $50d5d6a623389320$export$2440da353cedad43)(v, props.granularity);
    let dateValue = value != null ? value.toDate(defaultTimeZone !== null && defaultTimeZone !== void 0 ? defaultTimeZone : "UTC") : null;
    let hasTime = granularity === "hour" || granularity === "minute" || granularity === "second";
    var _props_shouldCloseOnSelect;
    let shouldCloseOnSelect = (_props_shouldCloseOnSelect = props.shouldCloseOnSelect) !== null && _props_shouldCloseOnSelect !== void 0 ? _props_shouldCloseOnSelect : true;
    let [selectedDate, setSelectedDate] = (0, $h2qOe$react.useState)(null);
    let [selectedTime, setSelectedTime] = (0, $h2qOe$react.useState)(null);
    if (value) {
        selectedDate = value;
        if ("hour" in value) selectedTime = value;
    }
    // props.granularity must actually exist in the value if one is provided.
    if (v && !(granularity in v)) throw new Error("Invalid granularity " + granularity + " for value " + v.toString());
    let commitValue = (date, time)=>{
        setValue("timeZone" in time ? time.set((0, $h2qOe$internationalizeddate.toCalendarDate)(date)) : (0, $h2qOe$internationalizeddate.toCalendarDateTime)(date, time));
        setSelectedDate(null);
        setSelectedTime(null);
    };
    // Intercept setValue to make sure the Time section is not changed by date selection in Calendar
    let selectDate = (newValue)=>{
        let shouldClose = typeof shouldCloseOnSelect === "function" ? shouldCloseOnSelect() : shouldCloseOnSelect;
        if (hasTime) {
            if (selectedTime || shouldClose) commitValue(newValue, selectedTime || (0, $50d5d6a623389320$export$c5221a78ef73c5e9)(props.placeholderValue));
            else setSelectedDate(newValue);
        } else setValue(newValue);
        if (shouldClose) overlayState.setOpen(false);
    };
    let selectTime = (newValue)=>{
        if (selectedDate) commitValue(selectedDate, newValue);
        else setSelectedTime(newValue);
    };
    let validationState = props.validationState || ((0, $50d5d6a623389320$export$eac50920cf2fd59a)(value, props.minValue, props.maxValue) ? "invalid" : null) || (value && ((_props_isDateUnavailable = props.isDateUnavailable) === null || _props_isDateUnavailable === void 0 ? void 0 : _props_isDateUnavailable.call(props, value)) ? "invalid" : null);
    return {
        value: value,
        setValue: setValue,
        dateValue: selectedDate,
        timeValue: selectedTime,
        setDateValue: selectDate,
        setTimeValue: selectTime,
        granularity: granularity,
        hasTime: hasTime,
        ...overlayState,
        setOpen (isOpen) {
            // Commit the selected date when the calendar is closed. Use a placeholder time if one wasn't set.
            // If only the time was set and not the date, don't commit. The state will be preserved until
            // the user opens the popover again.
            if (!isOpen && !value && selectedDate && hasTime) commitValue(selectedDate, selectedTime || (0, $50d5d6a623389320$export$c5221a78ef73c5e9)(props.placeholderValue));
            overlayState.setOpen(isOpen);
        },
        validationState: validationState,
        formatValue (locale, fieldOptions) {
            if (!dateValue) return "";
            let formatOptions = (0, $50d5d6a623389320$export$7e319ea407e63bc0)(fieldOptions, {
                granularity: granularity,
                timeZone: defaultTimeZone,
                hideTimeZone: props.hideTimeZone,
                hourCycle: props.hourCycle,
                showEra: value.calendar.identifier === "gregory" && value.era === "BC"
            });
            let formatter = new (0, $h2qOe$internationalizeddate.DateFormatter)(locale, formatOptions);
            return formatter.format(dateValue);
        }
    };
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
// These placeholders are based on the strings used by the <input type="date">
// implementations in Chrome and Firefox. Additional languages are supported
// here than React Spectrum's typical translations.
const $e1e8ada727fae1a1$var$placeholders = new (0, $h2qOe$internationalizedstring.LocalizedStringDictionary)({
    ach: {
        year: "mwaka",
        month: "dwe",
        day: "nino"
    },
    af: {
        year: "jjjj",
        month: "mm",
        day: "dd"
    },
    am: {
        year: "ዓዓዓዓ",
        month: "ሚሜ",
        day: "ቀቀ"
    },
    an: {
        year: "aaaa",
        month: "mm",
        day: "dd"
    },
    ar: {
        year: "سنة",
        month: "شهر",
        day: "يوم"
    },
    ast: {
        year: "aaaa",
        month: "mm",
        day: "dd"
    },
    az: {
        year: "iiii",
        month: "aa",
        day: "gg"
    },
    be: {
        year: "гггг",
        month: "мм",
        day: "дд"
    },
    bg: {
        year: "гггг",
        month: "мм",
        day: "дд"
    },
    bn: {
        year: "yyyy",
        month: "মিমি",
        day: "dd"
    },
    br: {
        year: "bbbb",
        month: "mm",
        day: "dd"
    },
    bs: {
        year: "gggg",
        month: "mm",
        day: "dd"
    },
    ca: {
        year: "aaaa",
        month: "mm",
        day: "dd"
    },
    cak: {
        year: "jjjj",
        month: "ii",
        day: "q'q'"
    },
    ckb: {
        year: "ساڵ",
        month: "مانگ",
        day: "ڕۆژ"
    },
    cs: {
        year: "rrrr",
        month: "mm",
        day: "dd"
    },
    cy: {
        year: "bbbb",
        month: "mm",
        day: "dd"
    },
    da: {
        year: "\xe5\xe5\xe5\xe5",
        month: "mm",
        day: "dd"
    },
    de: {
        year: "jjjj",
        month: "mm",
        day: "tt"
    },
    dsb: {
        year: "llll",
        month: "mm",
        day: "źź"
    },
    el: {
        year: "εεεε",
        month: "μμ",
        day: "ηη"
    },
    en: {
        year: "yyyy",
        month: "mm",
        day: "dd"
    },
    eo: {
        year: "jjjj",
        month: "mm",
        day: "tt"
    },
    es: {
        year: "aaaa",
        month: "mm",
        day: "dd"
    },
    et: {
        year: "aaaa",
        month: "kk",
        day: "pp"
    },
    eu: {
        year: "uuuu",
        month: "hh",
        day: "ee"
    },
    fa: {
        year: "سال",
        month: "ماه",
        day: "روز"
    },
    ff: {
        year: "hhhh",
        month: "ll",
        day: "\xf1\xf1"
    },
    fi: {
        year: "vvvv",
        month: "kk",
        day: "pp"
    },
    fr: {
        year: "aaaa",
        month: "mm",
        day: "jj"
    },
    fy: {
        year: "jjjj",
        month: "mm",
        day: "dd"
    },
    ga: {
        year: "bbbb",
        month: "mm",
        day: "ll"
    },
    gd: {
        year: "bbbb",
        month: "mm",
        day: "ll"
    },
    gl: {
        year: "aaaa",
        month: "mm",
        day: "dd"
    },
    he: {
        year: "שנה",
        month: "חודש",
        day: "יום"
    },
    hr: {
        year: "gggg",
        month: "mm",
        day: "dd"
    },
    hsb: {
        year: "llll",
        month: "mm",
        day: "dd"
    },
    hu: {
        year: "\xe9\xe9\xe9\xe9",
        month: "hh",
        day: "nn"
    },
    ia: {
        year: "aaaa",
        month: "mm",
        day: "dd"
    },
    id: {
        year: "tttt",
        month: "bb",
        day: "hh"
    },
    it: {
        year: "aaaa",
        month: "mm",
        day: "gg"
    },
    ja: {
        year: " 年 ",
        month: "月",
        day: "日"
    },
    ka: {
        year: "წწწწ",
        month: "თთ",
        day: "რრ"
    },
    kk: {
        year: "жжжж",
        month: "аа",
        day: "кк"
    },
    kn: {
        year: "ವವವವ",
        month: "ಮಿಮೀ",
        day: "ದಿದಿ"
    },
    ko: {
        year: "연도",
        month: "월",
        day: "일"
    },
    lb: {
        year: "jjjj",
        month: "mm",
        day: "dd"
    },
    lo: {
        year: "ປປປປ",
        month: "ດດ",
        day: "ວວ"
    },
    lt: {
        year: "mmmm",
        month: "mm",
        day: "dd"
    },
    lv: {
        year: "gggg",
        month: "mm",
        day: "dd"
    },
    meh: {
        year: "aaaa",
        month: "mm",
        day: "dd"
    },
    ml: {
        year: "വർഷം",
        month: "മാസം",
        day: "തീയതി"
    },
    ms: {
        year: "tttt",
        month: "mm",
        day: "hh"
    },
    nl: {
        year: "jjjj",
        month: "mm",
        day: "dd"
    },
    nn: {
        year: "\xe5\xe5\xe5\xe5",
        month: "mm",
        day: "dd"
    },
    no: {
        year: "\xe5\xe5\xe5\xe5",
        month: "mm",
        day: "dd"
    },
    oc: {
        year: "aaaa",
        month: "mm",
        day: "jj"
    },
    pl: {
        year: "rrrr",
        month: "mm",
        day: "dd"
    },
    pt: {
        year: "aaaa",
        month: "mm",
        day: "dd"
    },
    rm: {
        year: "oooo",
        month: "mm",
        day: "dd"
    },
    ro: {
        year: "aaaa",
        month: "ll",
        day: "zz"
    },
    ru: {
        year: "гггг",
        month: "мм",
        day: "дд"
    },
    sc: {
        year: "aaaa",
        month: "mm",
        day: "dd"
    },
    scn: {
        year: "aaaa",
        month: "mm",
        day: "jj"
    },
    sk: {
        year: "rrrr",
        month: "mm",
        day: "dd"
    },
    sl: {
        year: "llll",
        month: "mm",
        day: "dd"
    },
    sr: {
        year: "гггг",
        month: "мм",
        day: "дд"
    },
    sv: {
        year: "\xe5\xe5\xe5\xe5",
        month: "mm",
        day: "dd"
    },
    szl: {
        year: "rrrr",
        month: "mm",
        day: "dd"
    },
    tg: {
        year: "сссс",
        month: "мм",
        day: "рр"
    },
    th: {
        year: "ปปปป",
        month: "ดด",
        day: "วว"
    },
    tr: {
        year: "yyyy",
        month: "aa",
        day: "gg"
    },
    uk: {
        year: "рррр",
        month: "мм",
        day: "дд"
    },
    "zh-CN": {
        year: "年",
        month: "月",
        day: "日"
    },
    "zh-TW": {
        year: "年",
        month: "月",
        day: "日"
    }
}, "en");
function $e1e8ada727fae1a1$export$d3f5c5e0a5023fa0(field, value, locale) {
    // Use the actual placeholder value for the era and day period fields.
    if (field === "era" || field === "dayPeriod") return value;
    if (field === "year" || field === "month" || field === "day") return $e1e8ada727fae1a1$var$placeholders.getStringForLocale(field, locale);
    // For time fields (e.g. hour, minute, etc.), use two dashes as the placeholder.
    return "––";
}




const $596a1f0f523d6752$var$EDITABLE_SEGMENTS = {
    year: true,
    month: true,
    day: true,
    hour: true,
    minute: true,
    second: true,
    dayPeriod: true,
    era: true
};
const $596a1f0f523d6752$var$PAGE_STEP = {
    year: 5,
    month: 2,
    day: 7,
    hour: 2,
    minute: 15,
    second: 15
};
// Node seems to convert everything to lowercase...
const $596a1f0f523d6752$var$TYPE_MAPPING = {
    dayperiod: "dayPeriod"
};
function $596a1f0f523d6752$export$60e84778edff6d26(props) {
    let { locale: locale , createCalendar: createCalendar , hideTimeZone: hideTimeZone , isDisabled: isDisabled , isReadOnly: isReadOnly , isRequired: isRequired  } = props;
    let v = props.value || props.defaultValue || props.placeholderValue;
    let [granularity, defaultTimeZone] = (0, $50d5d6a623389320$export$2440da353cedad43)(v, props.granularity);
    let timeZone = defaultTimeZone || "UTC";
    // props.granularity must actually exist in the value if one is provided.
    if (v && !(granularity in v)) throw new Error("Invalid granularity " + granularity + " for value " + v.toString());
    let defaultFormatter = (0, $h2qOe$react.useMemo)(()=>new (0, $h2qOe$internationalizeddate.DateFormatter)(locale), [
        locale
    ]);
    let calendar = (0, $h2qOe$react.useMemo)(()=>createCalendar(defaultFormatter.resolvedOptions().calendar), [
        createCalendar,
        defaultFormatter
    ]);
    let [value, setDate] = (0, $h2qOe$reactstatelyutils.useControlledState)(props.value, props.defaultValue, props.onChange);
    let calendarValue = (0, $h2qOe$react.useMemo)(()=>(0, $50d5d6a623389320$export$61a490a80c552550)(value, calendar), [
        value,
        calendar
    ]);
    // We keep track of the placeholder date separately in state so that onChange is not called
    // until all segments are set. If the value === null (not undefined), then assume the component
    // is controlled, so use the placeholder as the value until all segments are entered so it doesn't
    // change from uncontrolled to controlled and emit a warning.
    let [placeholderDate, setPlaceholderDate] = (0, $h2qOe$react.useState)(()=>(0, $50d5d6a623389320$export$66aa2b09de4b1ea5)(props.placeholderValue, granularity, calendar, defaultTimeZone));
    let val = calendarValue || placeholderDate;
    let showEra = calendar.identifier === "gregory" && val.era === "BC";
    var _props_maxGranularity;
    let formatOpts = (0, $h2qOe$react.useMemo)(()=>({
            granularity: granularity,
            maxGranularity: (_props_maxGranularity = props.maxGranularity) !== null && _props_maxGranularity !== void 0 ? _props_maxGranularity : "year",
            timeZone: defaultTimeZone,
            hideTimeZone: hideTimeZone,
            hourCycle: props.hourCycle,
            showEra: showEra
        }), [
        props.maxGranularity,
        granularity,
        props.hourCycle,
        defaultTimeZone,
        hideTimeZone,
        showEra
    ]);
    let opts = (0, $h2qOe$react.useMemo)(()=>(0, $50d5d6a623389320$export$7e319ea407e63bc0)({}, formatOpts), [
        formatOpts
    ]);
    let dateFormatter = (0, $h2qOe$react.useMemo)(()=>new (0, $h2qOe$internationalizeddate.DateFormatter)(locale, opts), [
        locale,
        opts
    ]);
    let resolvedOptions = (0, $h2qOe$react.useMemo)(()=>dateFormatter.resolvedOptions(), [
        dateFormatter
    ]);
    // Determine how many editable segments there are for validation purposes.
    // The result is cached for performance.
    let allSegments = (0, $h2qOe$react.useMemo)(()=>dateFormatter.formatToParts(new Date()).filter((seg)=>$596a1f0f523d6752$var$EDITABLE_SEGMENTS[seg.type]).reduce((p, seg)=>(p[seg.type] = true, p), {}), [
        dateFormatter
    ]);
    let [validSegments, setValidSegments] = (0, $h2qOe$react.useState)(()=>props.value || props.defaultValue ? {
            ...allSegments
        } : {});
    // Reset placeholder when calendar changes
    let lastCalendarIdentifier = (0, $h2qOe$react.useRef)(calendar.identifier);
    (0, $h2qOe$react.useEffect)(()=>{
        if (calendar.identifier !== lastCalendarIdentifier.current) {
            lastCalendarIdentifier.current = calendar.identifier;
            setPlaceholderDate((placeholder)=>Object.keys(validSegments).length > 0 ? (0, $h2qOe$internationalizeddate.toCalendar)(placeholder, calendar) : (0, $50d5d6a623389320$export$66aa2b09de4b1ea5)(props.placeholderValue, granularity, calendar, defaultTimeZone));
        }
    }, [
        calendar,
        granularity,
        validSegments,
        defaultTimeZone,
        props.placeholderValue
    ]);
    // If there is a value prop, and some segments were previously placeholders, mark them all as valid.
    if (value && Object.keys(validSegments).length < Object.keys(allSegments).length) {
        validSegments = {
            ...allSegments
        };
        setValidSegments(validSegments);
    }
    // If the value is set to null and all segments are valid, reset the placeholder.
    if (value == null && Object.keys(validSegments).length === Object.keys(allSegments).length) {
        validSegments = {};
        setValidSegments(validSegments);
        setPlaceholderDate((0, $50d5d6a623389320$export$66aa2b09de4b1ea5)(props.placeholderValue, granularity, calendar, defaultTimeZone));
    }
    // If all segments are valid, use the date from state, otherwise use the placeholder date.
    let displayValue = calendarValue && Object.keys(validSegments).length >= Object.keys(allSegments).length ? calendarValue : placeholderDate;
    let setValue = (newValue)=>{
        if (props.isDisabled || props.isReadOnly) return;
        if (Object.keys(validSegments).length >= Object.keys(allSegments).length) {
            // The display calendar should not have any effect on the emitted value.
            // Emit dates in the same calendar as the original value, if any, otherwise gregorian.
            newValue = (0, $h2qOe$internationalizeddate.toCalendar)(newValue, (v === null || v === void 0 ? void 0 : v.calendar) || new (0, $h2qOe$internationalizeddate.GregorianCalendar)());
            setDate(newValue);
        } else setPlaceholderDate(newValue);
    };
    let dateValue = (0, $h2qOe$react.useMemo)(()=>displayValue.toDate(timeZone), [
        displayValue,
        timeZone
    ]);
    let segments = (0, $h2qOe$react.useMemo)(()=>dateFormatter.formatToParts(dateValue).map((segment)=>{
            let isEditable = $596a1f0f523d6752$var$EDITABLE_SEGMENTS[segment.type];
            if (segment.type === "era" && calendar.getEras().length === 1) isEditable = false;
            let isPlaceholder = $596a1f0f523d6752$var$EDITABLE_SEGMENTS[segment.type] && !validSegments[segment.type];
            let placeholder = $596a1f0f523d6752$var$EDITABLE_SEGMENTS[segment.type] ? (0, $e1e8ada727fae1a1$export$d3f5c5e0a5023fa0)(segment.type, segment.value, locale) : null;
            return {
                type: $596a1f0f523d6752$var$TYPE_MAPPING[segment.type] || segment.type,
                text: isPlaceholder ? placeholder : segment.value,
                ...$596a1f0f523d6752$var$getSegmentLimits(displayValue, segment.type, resolvedOptions),
                isPlaceholder: isPlaceholder,
                placeholder: placeholder,
                isEditable: isEditable
            };
        }), [
        dateValue,
        validSegments,
        dateFormatter,
        resolvedOptions,
        displayValue,
        calendar,
        locale
    ]);
    // When the era field appears, mark it valid if the year field is already valid.
    // If the era field disappears, remove it from the valid segments.
    if (allSegments.era && validSegments.year && !validSegments.era) {
        validSegments.era = true;
        setValidSegments({
            ...validSegments
        });
    } else if (!allSegments.era && validSegments.era) {
        delete validSegments.era;
        setValidSegments({
            ...validSegments
        });
    }
    let markValid = (part)=>{
        validSegments[part] = true;
        if (part === "year" && allSegments.era) validSegments.era = true;
        setValidSegments({
            ...validSegments
        });
    };
    let adjustSegment = (type, amount)=>{
        if (!validSegments[type]) {
            markValid(type);
            if (Object.keys(validSegments).length >= Object.keys(allSegments).length) setValue(displayValue);
        } else setValue($596a1f0f523d6752$var$addSegment(displayValue, type, amount, resolvedOptions));
    };
    let validationState = props.validationState || ((0, $50d5d6a623389320$export$eac50920cf2fd59a)(calendarValue, props.minValue, props.maxValue) ? "invalid" : null);
    var _props_maxGranularity1;
    return {
        value: calendarValue,
        dateValue: dateValue,
        calendar: calendar,
        setValue: setValue,
        segments: segments,
        dateFormatter: dateFormatter,
        validationState: validationState,
        granularity: granularity,
        maxGranularity: (_props_maxGranularity1 = props.maxGranularity) !== null && _props_maxGranularity1 !== void 0 ? _props_maxGranularity1 : "year",
        isDisabled: isDisabled,
        isReadOnly: isReadOnly,
        isRequired: isRequired,
        increment (part) {
            adjustSegment(part, 1);
        },
        decrement (part) {
            adjustSegment(part, -1);
        },
        incrementPage (part) {
            adjustSegment(part, $596a1f0f523d6752$var$PAGE_STEP[part] || 1);
        },
        decrementPage (part) {
            adjustSegment(part, -($596a1f0f523d6752$var$PAGE_STEP[part] || 1));
        },
        setSegment (part, v) {
            markValid(part);
            setValue($596a1f0f523d6752$var$setSegment(displayValue, part, v, resolvedOptions));
        },
        confirmPlaceholder () {
            if (props.isDisabled || props.isReadOnly) return;
            // Confirm the placeholder if only the day period is not filled in.
            let validKeys = Object.keys(validSegments);
            let allKeys = Object.keys(allSegments);
            if (validKeys.length === allKeys.length - 1 && allSegments.dayPeriod && !validSegments.dayPeriod) {
                validSegments = {
                    ...allSegments
                };
                setValidSegments(validSegments);
                setValue(displayValue.copy());
            }
        },
        clearSegment (part) {
            delete validSegments[part];
            setValidSegments({
                ...validSegments
            });
            let placeholder = (0, $50d5d6a623389320$export$66aa2b09de4b1ea5)(props.placeholderValue, granularity, calendar, defaultTimeZone);
            let value = displayValue;
            // Reset day period to default without changing the hour.
            if (part === "dayPeriod" && "hour" in displayValue && "hour" in placeholder) {
                let isPM = displayValue.hour >= 12;
                let shouldBePM = placeholder.hour >= 12;
                if (isPM && !shouldBePM) value = displayValue.set({
                    hour: displayValue.hour - 12
                });
                else if (!isPM && shouldBePM) value = displayValue.set({
                    hour: displayValue.hour + 12
                });
            } else if (part in displayValue) value = displayValue.set({
                [part]: placeholder[part]
            });
            setDate(null);
            setValue(value);
        },
        formatValue (fieldOptions) {
            if (!calendarValue) return "";
            let formatOptions = (0, $50d5d6a623389320$export$7e319ea407e63bc0)(fieldOptions, formatOpts);
            let formatter = new (0, $h2qOe$internationalizeddate.DateFormatter)(locale, formatOptions);
            return formatter.format(dateValue);
        }
    };
}
function $596a1f0f523d6752$var$getSegmentLimits(date, type, options) {
    switch(type){
        case "era":
            {
                let eras = date.calendar.getEras();
                return {
                    value: eras.indexOf(date.era),
                    minValue: 0,
                    maxValue: eras.length - 1
                };
            }
        case "year":
            return {
                value: date.year,
                minValue: 1,
                maxValue: date.calendar.getYearsInEra(date)
            };
        case "month":
            return {
                value: date.month,
                minValue: (0, $h2qOe$internationalizeddate.getMinimumMonthInYear)(date),
                maxValue: date.calendar.getMonthsInYear(date)
            };
        case "day":
            return {
                value: date.day,
                minValue: (0, $h2qOe$internationalizeddate.getMinimumDayInMonth)(date),
                maxValue: date.calendar.getDaysInMonth(date)
            };
    }
    if ("hour" in date) switch(type){
        case "dayPeriod":
            return {
                value: date.hour >= 12 ? 12 : 0,
                minValue: 0,
                maxValue: 12
            };
        case "hour":
            if (options.hour12) {
                let isPM = date.hour >= 12;
                return {
                    value: date.hour,
                    minValue: isPM ? 12 : 0,
                    maxValue: isPM ? 23 : 11
                };
            }
            return {
                value: date.hour,
                minValue: 0,
                maxValue: 23
            };
        case "minute":
            return {
                value: date.minute,
                minValue: 0,
                maxValue: 59
            };
        case "second":
            return {
                value: date.second,
                minValue: 0,
                maxValue: 59
            };
    }
    return {};
}
function $596a1f0f523d6752$var$addSegment(value, part, amount, options) {
    switch(part){
        case "era":
        case "year":
        case "month":
        case "day":
            return value.cycle(part, amount, {
                round: part === "year"
            });
    }
    if ("hour" in value) switch(part){
        case "dayPeriod":
            {
                let hours = value.hour;
                let isPM = hours >= 12;
                return value.set({
                    hour: isPM ? hours - 12 : hours + 12
                });
            }
        case "hour":
        case "minute":
        case "second":
            return value.cycle(part, amount, {
                round: part !== "hour",
                hourCycle: options.hour12 ? 12 : 24
            });
    }
}
function $596a1f0f523d6752$var$setSegment(value, part, segmentValue, options) {
    switch(part){
        case "day":
        case "month":
        case "year":
        case "era":
            return value.set({
                [part]: segmentValue
            });
    }
    if ("hour" in value) switch(part){
        case "dayPeriod":
            {
                let hours = value.hour;
                let wasPM = hours >= 12;
                let isPM = segmentValue >= 12;
                if (isPM === wasPM) return value;
                return value.set({
                    hour: wasPM ? hours - 12 : hours + 12
                });
            }
        case "hour":
            // In 12 hour time, ensure that AM/PM does not change
            if (options.hour12) {
                let hours1 = value.hour;
                let wasPM1 = hours1 >= 12;
                if (!wasPM1 && segmentValue === 12) segmentValue = 0;
                if (wasPM1 && segmentValue < 12) segmentValue += 12;
            }
        // fallthrough
        case "minute":
        case "second":
            return value.set({
                [part]: segmentValue
            });
    }
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




function $7072d26f58deb33b$export$e50a61c1de9f574(props) {
    var _props_isDateUnavailable, _props_isDateUnavailable1;
    let overlayState = (0, $h2qOe$reactstatelyoverlays.useOverlayTriggerState)(props);
    let [controlledValue, setControlledValue] = (0, $h2qOe$reactstatelyutils.useControlledState)(props.value, props.defaultValue || null, props.onChange);
    let [placeholderValue, setPlaceholderValue] = (0, $h2qOe$react.useState)(()=>controlledValue || {
            start: null,
            end: null
        });
    // Reset the placeholder if the value prop is set to null.
    if (controlledValue == null && placeholderValue.start && placeholderValue.end) {
        placeholderValue = {
            start: null,
            end: null
        };
        setPlaceholderValue(placeholderValue);
    }
    let value = controlledValue || placeholderValue;
    let setValue = (value)=>{
        setPlaceholderValue(value);
        if ((value === null || value === void 0 ? void 0 : value.start) && value.end) setControlledValue(value);
        else setControlledValue(null);
    };
    let v = (value === null || value === void 0 ? void 0 : value.start) || (value === null || value === void 0 ? void 0 : value.end) || props.placeholderValue;
    let [granularity] = (0, $50d5d6a623389320$export$2440da353cedad43)(v, props.granularity);
    let hasTime = granularity === "hour" || granularity === "minute" || granularity === "second";
    var _props_shouldCloseOnSelect;
    let shouldCloseOnSelect = (_props_shouldCloseOnSelect = props.shouldCloseOnSelect) !== null && _props_shouldCloseOnSelect !== void 0 ? _props_shouldCloseOnSelect : true;
    let [dateRange, setSelectedDateRange] = (0, $h2qOe$react.useState)(null);
    let [timeRange, setSelectedTimeRange] = (0, $h2qOe$react.useState)(null);
    if (value && value.start && value.end) {
        dateRange = value;
        if ("hour" in value.start) timeRange = value;
    }
    let commitValue = (dateRange, timeRange)=>{
        setValue({
            start: "timeZone" in timeRange.start ? timeRange.start.set((0, $h2qOe$internationalizeddate.toCalendarDate)(dateRange.start)) : (0, $h2qOe$internationalizeddate.toCalendarDateTime)(dateRange.start, timeRange.start),
            end: "timeZone" in timeRange.end ? timeRange.end.set((0, $h2qOe$internationalizeddate.toCalendarDate)(dateRange.end)) : (0, $h2qOe$internationalizeddate.toCalendarDateTime)(dateRange.end, timeRange.end)
        });
        setSelectedDateRange(null);
        setSelectedTimeRange(null);
    };
    // Intercept setValue to make sure the Time section is not changed by date selection in Calendar
    let setDateRange = (range)=>{
        let shouldClose = typeof shouldCloseOnSelect === "function" ? shouldCloseOnSelect() : shouldCloseOnSelect;
        if (hasTime) {
            if (shouldClose || range.start && range.end && (timeRange === null || timeRange === void 0 ? void 0 : timeRange.start) && (timeRange === null || timeRange === void 0 ? void 0 : timeRange.end)) commitValue(range, {
                start: (timeRange === null || timeRange === void 0 ? void 0 : timeRange.start) || (0, $50d5d6a623389320$export$c5221a78ef73c5e9)(props.placeholderValue),
                end: (timeRange === null || timeRange === void 0 ? void 0 : timeRange.end) || (0, $50d5d6a623389320$export$c5221a78ef73c5e9)(props.placeholderValue)
            });
            else setSelectedDateRange(range);
        } else if (range.start && range.end) setValue(range);
        else setSelectedDateRange(range);
        if (shouldClose) overlayState.setOpen(false);
    };
    let setTimeRange = (range)=>{
        if ((dateRange === null || dateRange === void 0 ? void 0 : dateRange.start) && (dateRange === null || dateRange === void 0 ? void 0 : dateRange.end) && range.start && range.end) commitValue(dateRange, range);
        else setSelectedTimeRange(range);
    };
    let validationState = props.validationState || (value != null && ((0, $50d5d6a623389320$export$eac50920cf2fd59a)(value.start, props.minValue, props.maxValue) || (0, $50d5d6a623389320$export$eac50920cf2fd59a)(value.end, props.minValue, props.maxValue) || value.end != null && value.start != null && value.end.compare(value.start) < 0 || (value === null || value === void 0 ? void 0 : value.start) && ((_props_isDateUnavailable = props.isDateUnavailable) === null || _props_isDateUnavailable === void 0 ? void 0 : _props_isDateUnavailable.call(props, value.start)) || (value === null || value === void 0 ? void 0 : value.end) && ((_props_isDateUnavailable1 = props.isDateUnavailable) === null || _props_isDateUnavailable1 === void 0 ? void 0 : _props_isDateUnavailable1.call(props, value.end))) ? "invalid" : null);
    return {
        value: value,
        setValue: setValue,
        dateRange: dateRange,
        timeRange: timeRange,
        granularity: granularity,
        hasTime: hasTime,
        setDate (part, date) {
            setDateRange({
                ...dateRange,
                [part]: date
            });
        },
        setTime (part, time) {
            setTimeRange({
                ...timeRange,
                [part]: time
            });
        },
        setDateTime (part, dateTime) {
            setValue({
                ...value,
                [part]: dateTime
            });
        },
        setDateRange: setDateRange,
        setTimeRange: setTimeRange,
        ...overlayState,
        setOpen (isOpen) {
            // Commit the selected date range when the calendar is closed. Use a placeholder time if one wasn't set.
            // If only the time range was set and not the date range, don't commit. The state will be preserved until
            // the user opens the popover again.
            if (!isOpen && !((value === null || value === void 0 ? void 0 : value.start) && (value === null || value === void 0 ? void 0 : value.end)) && (dateRange === null || dateRange === void 0 ? void 0 : dateRange.start) && (dateRange === null || dateRange === void 0 ? void 0 : dateRange.end) && hasTime) commitValue(dateRange, {
                start: (timeRange === null || timeRange === void 0 ? void 0 : timeRange.start) || (0, $50d5d6a623389320$export$c5221a78ef73c5e9)(props.placeholderValue),
                end: (timeRange === null || timeRange === void 0 ? void 0 : timeRange.end) || (0, $50d5d6a623389320$export$c5221a78ef73c5e9)(props.placeholderValue)
            });
            overlayState.setOpen(isOpen);
        },
        validationState: validationState,
        formatValue (locale, fieldOptions) {
            if (!value || !value.start || !value.end) return null;
            let startTimeZone = "timeZone" in value.start ? value.start.timeZone : undefined;
            let startGranularity = props.granularity || (value.start && "minute" in value.start ? "minute" : "day");
            let endTimeZone = "timeZone" in value.end ? value.end.timeZone : undefined;
            let endGranularity = props.granularity || (value.end && "minute" in value.end ? "minute" : "day");
            let startOptions = (0, $50d5d6a623389320$export$7e319ea407e63bc0)(fieldOptions, {
                granularity: startGranularity,
                timeZone: startTimeZone,
                hideTimeZone: props.hideTimeZone,
                hourCycle: props.hourCycle,
                showEra: value.start.calendar.identifier === "gregory" && value.start.era === "BC" || value.end.calendar.identifier === "gregory" && value.end.era === "BC"
            });
            let startDate = value.start.toDate(startTimeZone || "UTC");
            let endDate = value.end.toDate(endTimeZone || "UTC");
            let startFormatter = new (0, $h2qOe$internationalizeddate.DateFormatter)(locale, startOptions);
            let endFormatter;
            if (startTimeZone === endTimeZone && startGranularity === endGranularity && value.start.compare(value.end) !== 0) {
                // Use formatRange, as it results in shorter output when some of the fields
                // are shared between the start and end dates (e.g. the same month).
                // Formatting will fail if the end date is before the start date. Fall back below when that happens.
                try {
                    let parts = startFormatter.formatRangeToParts(startDate, endDate);
                    // Find the separator between the start and end date. This is determined
                    // by finding the last shared literal before the end range.
                    let separatorIndex = -1;
                    for(let i = 0; i < parts.length; i++){
                        let part = parts[i];
                        if (part.source === "shared" && part.type === "literal") separatorIndex = i;
                        else if (part.source === "endRange") break;
                    }
                    // Now we can combine the parts into start and end strings.
                    let start = "";
                    let end = "";
                    for(let i1 = 0; i1 < parts.length; i1++){
                        if (i1 < separatorIndex) start += parts[i1].value;
                        else if (i1 > separatorIndex) end += parts[i1].value;
                    }
                    return {
                        start: start,
                        end: end
                    };
                } catch (e) {
                // ignore
                }
                endFormatter = startFormatter;
            } else {
                let endOptions = (0, $50d5d6a623389320$export$7e319ea407e63bc0)(fieldOptions, {
                    granularity: endGranularity,
                    timeZone: endTimeZone,
                    hideTimeZone: props.hideTimeZone,
                    hourCycle: props.hourCycle
                });
                endFormatter = new (0, $h2qOe$internationalizeddate.DateFormatter)(locale, endOptions);
            }
            return {
                start: startFormatter.format(startDate),
                end: endFormatter.format(endDate)
            };
        }
    };
}


/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 



function $2654e87be0231a69$export$fd53cef0cc796101(props) {
    let { placeholderValue: placeholderValue = new (0, $h2qOe$internationalizeddate.Time)() , minValue: minValue , maxValue: maxValue , granularity: granularity  } = props;
    let [value, setValue] = (0, $h2qOe$reactstatelyutils.useControlledState)(props.value, props.defaultValue, props.onChange);
    let v = value || placeholderValue;
    let day = v && "day" in v ? v : undefined;
    let placeholderDate = (0, $h2qOe$react.useMemo)(()=>$2654e87be0231a69$var$convertValue(placeholderValue), [
        placeholderValue
    ]);
    let minDate = (0, $h2qOe$react.useMemo)(()=>$2654e87be0231a69$var$convertValue(minValue, day), [
        minValue,
        day
    ]);
    let maxDate = (0, $h2qOe$react.useMemo)(()=>$2654e87be0231a69$var$convertValue(maxValue, day), [
        maxValue,
        day
    ]);
    let dateTime = (0, $h2qOe$react.useMemo)(()=>value == null ? null : $2654e87be0231a69$var$convertValue(value), [
        value
    ]);
    let onChange = (newValue)=>{
        setValue(v && "day" in v ? newValue : newValue && (0, $h2qOe$internationalizeddate.toTime)(newValue));
    };
    return (0, $596a1f0f523d6752$export$60e84778edff6d26)({
        ...props,
        value: dateTime,
        defaultValue: undefined,
        minValue: minDate,
        maxValue: maxDate,
        onChange: onChange,
        granularity: granularity || "minute",
        maxGranularity: "hour",
        placeholderValue: placeholderDate,
        // Calendar should not matter for time fields.
        createCalendar: ()=>new (0, $h2qOe$internationalizeddate.GregorianCalendar)()
    });
}
function $2654e87be0231a69$var$convertValue(value, date = (0, $h2qOe$internationalizeddate.today)((0, $h2qOe$internationalizeddate.getLocalTimeZone)())) {
    if (!value) return null;
    if ("day" in value) return value;
    return (0, $h2qOe$internationalizeddate.toCalendarDateTime)(date, value);
}




//# sourceMappingURL=main.js.map
