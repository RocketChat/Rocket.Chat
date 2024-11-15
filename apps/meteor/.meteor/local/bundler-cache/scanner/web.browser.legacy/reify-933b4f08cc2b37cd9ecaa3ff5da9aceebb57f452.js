function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "NumberFormatter", () => $0c1d5654b62fc485$export$cc77c4ff7e8673c5);
$parcel$export(module.exports, "NumberParser", () => $d68f3f4c684426c6$export$cd11ab140839f11d);
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
 */ let $0c1d5654b62fc485$var$formatterCache = new Map();
let $0c1d5654b62fc485$var$supportsSignDisplay = false;
try {
    // @ts-ignore
    $0c1d5654b62fc485$var$supportsSignDisplay = new Intl.NumberFormat("de-DE", {
        signDisplay: "exceptZero"
    }).resolvedOptions().signDisplay === "exceptZero";
// eslint-disable-next-line no-empty
} catch (e) {}
let $0c1d5654b62fc485$var$supportsUnit = false;
try {
    // @ts-ignore
    $0c1d5654b62fc485$var$supportsUnit = new Intl.NumberFormat("de-DE", {
        style: "unit",
        unit: "degree"
    }).resolvedOptions().style === "unit";
// eslint-disable-next-line no-empty
} catch (e1) {}
// Polyfill for units since Safari doesn't support them yet. See https://bugs.webkit.org/show_bug.cgi?id=215438.
// Currently only polyfilling the unit degree in narrow format for ColorSlider in our supported locales.
// Values were determined by switching to each locale manually in Chrome.
const $0c1d5654b62fc485$var$UNITS = {
    degree: {
        narrow: {
            default: "\xb0",
            "ja-JP": " 度",
            "zh-TW": "度",
            "sl-SI": " \xb0"
        }
    }
};
class $0c1d5654b62fc485$export$cc77c4ff7e8673c5 {
    /** Formats a number value as a string, according to the locale and options provided to the constructor. */ format(value) {
        let res = "";
        if (!$0c1d5654b62fc485$var$supportsSignDisplay && this.options.signDisplay != null) res = $0c1d5654b62fc485$export$711b50b3c525e0f2(this.numberFormatter, this.options.signDisplay, value);
        else res = this.numberFormatter.format(value);
        if (this.options.style === "unit" && !$0c1d5654b62fc485$var$supportsUnit) {
            var _UNITS_unit;
            let { unit: unit , unitDisplay: unitDisplay = "short" , locale: locale  } = this.resolvedOptions();
            let values = (_UNITS_unit = $0c1d5654b62fc485$var$UNITS[unit]) === null || _UNITS_unit === void 0 ? void 0 : _UNITS_unit[unitDisplay];
            res += values[locale] || values.default;
        }
        return res;
    }
    /** Formats a number to an array of parts such as separators, digits, punctuation, and more. */ formatToParts(value) {
        // TODO: implement signDisplay for formatToParts
        // @ts-ignore
        return this.numberFormatter.formatToParts(value);
    }
    /** Formats a number range as a string. */ formatRange(start, end) {
        // @ts-ignore
        if (typeof this.numberFormatter.formatRange === "function") // @ts-ignore
        return this.numberFormatter.formatRange(start, end);
        if (end < start) throw new RangeError("End date must be >= start date");
        // Very basic fallback for old browsers.
        return `${this.format(start)} – ${this.format(end)}`;
    }
    /** Formats a number range as an array of parts. */ formatRangeToParts(start, end) {
        // @ts-ignore
        if (typeof this.numberFormatter.formatRangeToParts === "function") // @ts-ignore
        return this.numberFormatter.formatRangeToParts(start, end);
        if (end < start) throw new RangeError("End date must be >= start date");
        let startParts = this.numberFormatter.formatToParts(start);
        let endParts = this.numberFormatter.formatToParts(end);
        return [
            ...startParts.map((p)=>({
                    ...p,
                    source: "startRange"
                })),
            {
                type: "literal",
                value: " – ",
                source: "shared"
            },
            ...endParts.map((p)=>({
                    ...p,
                    source: "endRange"
                }))
        ];
    }
    /** Returns the resolved formatting options based on the values passed to the constructor. */ resolvedOptions() {
        let options = this.numberFormatter.resolvedOptions();
        if (!$0c1d5654b62fc485$var$supportsSignDisplay && this.options.signDisplay != null) options = {
            ...options,
            signDisplay: this.options.signDisplay
        };
        if (!$0c1d5654b62fc485$var$supportsUnit && this.options.style === "unit") options = {
            ...options,
            style: "unit",
            unit: this.options.unit,
            unitDisplay: this.options.unitDisplay
        };
        return options;
    }
    constructor(locale, options = {}){
        this.numberFormatter = $0c1d5654b62fc485$var$getCachedNumberFormatter(locale, options);
        this.options = options;
    }
}
function $0c1d5654b62fc485$var$getCachedNumberFormatter(locale, options = {}) {
    let { numberingSystem: numberingSystem  } = options;
    if (numberingSystem && locale.indexOf("-u-nu-") === -1) locale = `${locale}-u-nu-${numberingSystem}`;
    if (options.style === "unit" && !$0c1d5654b62fc485$var$supportsUnit) {
        var _UNITS_unit;
        let { unit: unit , unitDisplay: unitDisplay = "short"  } = options;
        if (!unit) throw new Error('unit option must be provided with style: "unit"');
        if (!((_UNITS_unit = $0c1d5654b62fc485$var$UNITS[unit]) === null || _UNITS_unit === void 0 ? void 0 : _UNITS_unit[unitDisplay])) throw new Error(`Unsupported unit ${unit} with unitDisplay = ${unitDisplay}`);
        options = {
            ...options,
            style: "decimal"
        };
    }
    let cacheKey = locale + (options ? Object.entries(options).sort((a, b)=>a[0] < b[0] ? -1 : 1).join() : "");
    if ($0c1d5654b62fc485$var$formatterCache.has(cacheKey)) return $0c1d5654b62fc485$var$formatterCache.get(cacheKey);
    let numberFormatter = new Intl.NumberFormat(locale, options);
    $0c1d5654b62fc485$var$formatterCache.set(cacheKey, numberFormatter);
    return numberFormatter;
}
function $0c1d5654b62fc485$export$711b50b3c525e0f2(numberFormat, signDisplay, num) {
    if (signDisplay === "auto") return numberFormat.format(num);
    else if (signDisplay === "never") return numberFormat.format(Math.abs(num));
    else {
        let needsPositiveSign = false;
        if (signDisplay === "always") needsPositiveSign = num > 0 || Object.is(num, 0);
        else if (signDisplay === "exceptZero") {
            if (Object.is(num, -0) || Object.is(num, 0)) num = Math.abs(num);
            else needsPositiveSign = num > 0;
        }
        if (needsPositiveSign) {
            let negative = numberFormat.format(-num);
            let noSign = numberFormat.format(num);
            // ignore RTL/LTR marker character
            let minus = negative.replace(noSign, "").replace(/\u200e|\u061C/, "");
            if ([
                ...minus
            ].length !== 1) console.warn("@react-aria/i18n polyfill for NumberFormat signDisplay: Unsupported case");
            let positive = negative.replace(noSign, "!!!").replace(minus, "+").replace("!!!", noSign);
            return positive;
        } else return numberFormat.format(num);
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
 */ const $d68f3f4c684426c6$var$CURRENCY_SIGN_REGEX = new RegExp("^.*\\(.*\\).*$");
const $d68f3f4c684426c6$var$NUMBERING_SYSTEMS = [
    "latn",
    "arab",
    "hanidec"
];
class $d68f3f4c684426c6$export$cd11ab140839f11d {
    /**
   * Parses the given string to a number. Returns NaN if a valid number could not be parsed.
   */ parse(value) {
        return $d68f3f4c684426c6$var$getNumberParserImpl(this.locale, this.options, value).parse(value);
    }
    /**
   * Returns whether the given string could potentially be a valid number. This should be used to
   * validate user input as the user types. If a `minValue` or `maxValue` is provided, the validity
   * of the minus/plus sign characters can be checked.
   */ isValidPartialNumber(value, minValue, maxValue) {
        return $d68f3f4c684426c6$var$getNumberParserImpl(this.locale, this.options, value).isValidPartialNumber(value, minValue, maxValue);
    }
    /**
   * Returns a numbering system for which the given string is valid in the current locale.
   * If no numbering system could be detected, the default numbering system for the current
   * locale is returned.
   */ getNumberingSystem(value) {
        return $d68f3f4c684426c6$var$getNumberParserImpl(this.locale, this.options, value).options.numberingSystem;
    }
    constructor(locale, options = {}){
        this.locale = locale;
        this.options = options;
    }
}
const $d68f3f4c684426c6$var$numberParserCache = new Map();
function $d68f3f4c684426c6$var$getNumberParserImpl(locale, options, value) {
    // First try the default numbering system for the provided locale
    let defaultParser = $d68f3f4c684426c6$var$getCachedNumberParser(locale, options);
    // If that doesn't match, and the locale doesn't include a hard coded numbering system,
    // try each of the other supported numbering systems until we find one that matches.
    if (!locale.includes("-nu-") && !defaultParser.isValidPartialNumber(value)) {
        for (let numberingSystem of $d68f3f4c684426c6$var$NUMBERING_SYSTEMS)if (numberingSystem !== defaultParser.options.numberingSystem) {
            let parser = $d68f3f4c684426c6$var$getCachedNumberParser(locale + (locale.includes("-u-") ? "-nu-" : "-u-nu-") + numberingSystem, options);
            if (parser.isValidPartialNumber(value)) return parser;
        }
    }
    return defaultParser;
}
function $d68f3f4c684426c6$var$getCachedNumberParser(locale, options) {
    let cacheKey = locale + (options ? Object.entries(options).sort((a, b)=>a[0] < b[0] ? -1 : 1).join() : "");
    let parser = $d68f3f4c684426c6$var$numberParserCache.get(cacheKey);
    if (!parser) {
        parser = new $d68f3f4c684426c6$var$NumberParserImpl(locale, options);
        $d68f3f4c684426c6$var$numberParserCache.set(cacheKey, parser);
    }
    return parser;
}
// The actual number parser implementation. Instances of this class are cached
// based on the locale, options, and detected numbering system.
class $d68f3f4c684426c6$var$NumberParserImpl {
    parse(value) {
        // to parse the number, we need to remove anything that isn't actually part of the number, for example we want '-10.40' not '-10.40 USD'
        let fullySanitizedValue = this.sanitize(value);
        // Remove group characters, and replace decimal points and numerals with ASCII values.
        fullySanitizedValue = $d68f3f4c684426c6$var$replaceAll(fullySanitizedValue, this.symbols.group, "").replace(this.symbols.decimal, ".").replace(this.symbols.minusSign, "-").replace(this.symbols.numeral, this.symbols.index);
        let newValue = fullySanitizedValue ? +fullySanitizedValue : NaN;
        if (isNaN(newValue)) return NaN;
        // accounting will always be stripped to a positive number, so if it's accounting and has a () around everything, then we need to make it negative again
        if (this.options.currencySign === "accounting" && $d68f3f4c684426c6$var$CURRENCY_SIGN_REGEX.test(value)) newValue = -1 * newValue;
        // when reading the number, if it's a percent, then it should be interpreted as being divided by 100
        if (this.options.style === "percent") {
            newValue /= 100;
            var _this_options_maximumFractionDigits;
            // after dividing to get the percent value, javascript may get .0210999999 instead of .0211, so fix the number of fraction digits
            newValue = +newValue.toFixed(((_this_options_maximumFractionDigits = this.options.maximumFractionDigits) !== null && _this_options_maximumFractionDigits !== void 0 ? _this_options_maximumFractionDigits : 0) + 2);
        }
        return newValue;
    }
    sanitize(value) {
        // Remove literals and whitespace, which are allowed anywhere in the string
        value = value.replace(this.symbols.literals, "");
        // Replace the ASCII minus sign with the minus sign used in the current locale
        // so that both are allowed in case the user's keyboard doesn't have the locale's minus sign.
        value = value.replace("-", this.symbols.minusSign);
        // In arab numeral system, their decimal character is 1643, but most keyboards don't type that
        // instead they use the , (44) character or apparently the (1548) character.
        if (this.options.numberingSystem === "arab") {
            value = value.replace(",", this.symbols.decimal);
            value = value.replace(String.fromCharCode(1548), this.symbols.decimal);
            value = $d68f3f4c684426c6$var$replaceAll(value, ".", this.symbols.group);
        }
        // fr-FR group character is char code 8239, but that's not a key on the french keyboard,
        // so allow 'period' as a group char and replace it with a space
        if (this.options.locale === "fr-FR") value = $d68f3f4c684426c6$var$replaceAll(value, ".", String.fromCharCode(8239));
        return value;
    }
    isValidPartialNumber(value, minValue = -Infinity, maxValue = Infinity) {
        value = this.sanitize(value);
        // Remove minus or plus sign, which must be at the start of the string.
        if (value.startsWith(this.symbols.minusSign) && minValue < 0) value = value.slice(this.symbols.minusSign.length);
        else if (this.symbols.plusSign && value.startsWith(this.symbols.plusSign) && maxValue > 0) value = value.slice(this.symbols.plusSign.length);
        // Numbers cannot start with a group separator
        if (value.startsWith(this.symbols.group)) return false;
        // Remove numerals, groups, and decimals
        value = $d68f3f4c684426c6$var$replaceAll(value, this.symbols.group, "").replace(this.symbols.numeral, "").replace(this.symbols.decimal, "");
        // The number is valid if there are no remaining characters
        return value.length === 0;
    }
    constructor(locale, options = {}){
        this.formatter = new Intl.NumberFormat(locale, options);
        this.options = this.formatter.resolvedOptions();
        this.symbols = $d68f3f4c684426c6$var$getSymbols(this.formatter, this.options, options);
    }
}
const $d68f3f4c684426c6$var$nonLiteralParts = new Set([
    "decimal",
    "fraction",
    "integer",
    "minusSign",
    "plusSign",
    "group"
]);
function $d68f3f4c684426c6$var$getSymbols(formatter, intlOptions, originalOptions) {
    var _allParts_find, _posAllParts_find, _allParts_find1, _allParts_find2;
    // Note: some locale's don't add a group symbol until there is a ten thousands place
    let allParts = formatter.formatToParts(-10000.111);
    let posAllParts = formatter.formatToParts(10000.111);
    let singularParts = formatter.formatToParts(1);
    var _allParts_find_value;
    let minusSign = (_allParts_find_value = (_allParts_find = allParts.find((p)=>p.type === "minusSign")) === null || _allParts_find === void 0 ? void 0 : _allParts_find.value) !== null && _allParts_find_value !== void 0 ? _allParts_find_value : "-";
    let plusSign = (_posAllParts_find = posAllParts.find((p)=>p.type === "plusSign")) === null || _posAllParts_find === void 0 ? void 0 : _posAllParts_find.value;
    // Safari does not support the signDisplay option, but our number parser polyfills it.
    // If no plus sign was returned, but the original options contained signDisplay, default to the '+' character.
    // @ts-ignore
    if (!plusSign && ((originalOptions === null || originalOptions === void 0 ? void 0 : originalOptions.signDisplay) === "exceptZero" || (originalOptions === null || originalOptions === void 0 ? void 0 : originalOptions.signDisplay) === "always")) plusSign = "+";
    let decimal = (_allParts_find1 = allParts.find((p)=>p.type === "decimal")) === null || _allParts_find1 === void 0 ? void 0 : _allParts_find1.value;
    let group = (_allParts_find2 = allParts.find((p)=>p.type === "group")) === null || _allParts_find2 === void 0 ? void 0 : _allParts_find2.value;
    // this set is also for a regex, it's all literals that might be in the string we want to eventually parse that
    // don't contribute to the numerical value
    let pluralLiterals = allParts.filter((p)=>!$d68f3f4c684426c6$var$nonLiteralParts.has(p.type)).map((p)=>$d68f3f4c684426c6$var$escapeRegex(p.value));
    let singularLiterals = singularParts.filter((p)=>!$d68f3f4c684426c6$var$nonLiteralParts.has(p.type)).map((p)=>$d68f3f4c684426c6$var$escapeRegex(p.value));
    let sortedLiterals = [
        ...new Set([
            ...singularLiterals,
            ...pluralLiterals
        ])
    ].sort((a, b)=>b.length - a.length);
    let literals = sortedLiterals.length === 0 ? new RegExp("[\\p{White_Space}]", "gu") : new RegExp(`${sortedLiterals.join("|")}|[\\p{White_Space}]`, "gu");
    // These are for replacing non-latn characters with the latn equivalent
    let numerals = [
        ...new Intl.NumberFormat(intlOptions.locale, {
            useGrouping: false
        }).format(9876543210)
    ].reverse();
    let indexes = new Map(numerals.map((d, i)=>[
            d,
            i
        ]));
    let numeral = new RegExp(`[${numerals.join("")}]`, "g");
    let index = (d)=>String(indexes.get(d));
    return {
        minusSign: minusSign,
        plusSign: plusSign,
        decimal: decimal,
        group: group,
        literals: literals,
        numeral: numeral,
        index: index
    };
}
function $d68f3f4c684426c6$var$replaceAll(str, find, replace) {
    // @ts-ignore
    if (str.replaceAll) // @ts-ignore
    return str.replaceAll(find, replace);
    return str.split(find).join(replace);
}
function $d68f3f4c684426c6$var$escapeRegex(string) {
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}




//# sourceMappingURL=main.js.map
