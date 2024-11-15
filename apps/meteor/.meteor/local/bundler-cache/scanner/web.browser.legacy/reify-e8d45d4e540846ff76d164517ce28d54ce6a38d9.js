
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "LocalizedStringDictionary", () => $f80be5fd4d03dda9$export$c17fa47878dc55b6);
$parcel$export(module.exports, "LocalizedStringFormatter", () => $3e95fbf3429967d1$export$2f817fcdc4b89ae0);
/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ /*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ const $f80be5fd4d03dda9$var$localeSymbol = Symbol.for("react-aria.i18n.locale");
const $f80be5fd4d03dda9$var$stringsSymbol = Symbol.for("react-aria.i18n.strings");
let $f80be5fd4d03dda9$var$cachedGlobalStrings = undefined;
class $f80be5fd4d03dda9$export$c17fa47878dc55b6 {
    /** Returns a localized string for the given key and locale. */ getStringForLocale(key, locale) {
        let strings = this.getStringsForLocale(locale);
        let string = strings[key];
        if (!string) throw new Error(`Could not find intl message ${key} in ${locale} locale`);
        return string;
    }
    /** Returns all localized strings for the given locale. */ getStringsForLocale(locale) {
        let strings = this.strings[locale];
        if (!strings) {
            strings = $f80be5fd4d03dda9$var$getStringsForLocale(locale, this.strings, this.defaultLocale);
            this.strings[locale] = strings;
        }
        return strings;
    }
    static getGlobalDictionaryForPackage(packageName) {
        if (typeof window === "undefined") return null;
        let locale = window[$f80be5fd4d03dda9$var$localeSymbol];
        if ($f80be5fd4d03dda9$var$cachedGlobalStrings === undefined) {
            let globalStrings = window[$f80be5fd4d03dda9$var$stringsSymbol];
            if (!globalStrings) return null;
            $f80be5fd4d03dda9$var$cachedGlobalStrings = {};
            for(let pkg in globalStrings)$f80be5fd4d03dda9$var$cachedGlobalStrings[pkg] = new $f80be5fd4d03dda9$export$c17fa47878dc55b6({
                [locale]: globalStrings[pkg]
            }, locale);
        }
        let dictionary = $f80be5fd4d03dda9$var$cachedGlobalStrings === null || $f80be5fd4d03dda9$var$cachedGlobalStrings === void 0 ? void 0 : $f80be5fd4d03dda9$var$cachedGlobalStrings[packageName];
        if (!dictionary) throw new Error(`Strings for package "${packageName}" were not included by LocalizedStringProvider. Please add it to the list passed to createLocalizedStringDictionary.`);
        return dictionary;
    }
    constructor(messages, defaultLocale = "en-US"){
        // Clone messages so we don't modify the original object.
        this.strings = {
            ...messages
        };
        this.defaultLocale = defaultLocale;
    }
}
function $f80be5fd4d03dda9$var$getStringsForLocale(locale, strings, defaultLocale = "en-US") {
    // If there is an exact match, use it.
    if (strings[locale]) return strings[locale];
    // Attempt to find the closest match by language.
    // For example, if the locale is fr-CA (French Canadian), but there is only
    // an fr-FR (France) set of strings, use that.
    // This could be replaced with Intl.LocaleMatcher once it is supported.
    // https://github.com/tc39/proposal-intl-localematcher
    let language = $f80be5fd4d03dda9$var$getLanguage(locale);
    if (strings[language]) return strings[language];
    for(let key in strings){
        if (key.startsWith(language + "-")) return strings[key];
    }
    // Nothing close, use english.
    return strings[defaultLocale];
}
function $f80be5fd4d03dda9$var$getLanguage(locale) {
    // @ts-ignore
    if (Intl.Locale) // @ts-ignore
    return new Intl.Locale(locale).language;
    return locale.split("-")[0];
}


/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ const $3e95fbf3429967d1$var$pluralRulesCache = new Map();
const $3e95fbf3429967d1$var$numberFormatCache = new Map();
class $3e95fbf3429967d1$export$2f817fcdc4b89ae0 {
    /** Formats a localized string for the given key with the provided variables. */ format(key, variables) {
        let message = this.strings.getStringForLocale(key, this.locale);
        return typeof message === "function" ? message(variables, this) : message;
    }
    plural(count, options, type = "cardinal") {
        let opt = options["=" + count];
        if (opt) return typeof opt === "function" ? opt() : opt;
        let key = this.locale + ":" + type;
        let pluralRules = $3e95fbf3429967d1$var$pluralRulesCache.get(key);
        if (!pluralRules) {
            pluralRules = new Intl.PluralRules(this.locale, {
                type: type
            });
            $3e95fbf3429967d1$var$pluralRulesCache.set(key, pluralRules);
        }
        let selected = pluralRules.select(count);
        opt = options[selected] || options.other;
        return typeof opt === "function" ? opt() : opt;
    }
    number(value) {
        let numberFormat = $3e95fbf3429967d1$var$numberFormatCache.get(this.locale);
        if (!numberFormat) {
            numberFormat = new Intl.NumberFormat(this.locale);
            $3e95fbf3429967d1$var$numberFormatCache.set(this.locale, numberFormat);
        }
        return numberFormat.format(value);
    }
    select(options, value) {
        let opt = options[value] || options.other;
        return typeof opt === "function" ? opt() : opt;
    }
    constructor(locale, strings){
        this.locale = locale;
        this.strings = strings;
    }
}




//# sourceMappingURL=main.js.map
