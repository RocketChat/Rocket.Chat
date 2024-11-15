var $87SwK$react = require("react");
var $87SwK$reactariassr = require("@react-aria/ssr");
var $87SwK$internationalizedstring = require("@internationalized/string");
var $87SwK$internationalizeddate = require("@internationalized/date");
var $87SwK$internationalizednumber = require("@internationalized/number");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}

$parcel$export(module.exports, "I18nProvider", () => $47fa5ec5ff482271$export$a54013f0d02a8f82);
$parcel$export(module.exports, "useLocale", () => $47fa5ec5ff482271$export$43bb16f9c6d9e3f7);
$parcel$export(module.exports, "useMessageFormatter", () => $227f31f0c647c5fc$exports.useMessageFormatter);
$parcel$export(module.exports, "useLocalizedStringFormatter", () => $fc53663969a3d00a$export$f12b703ca79dfbb1);
$parcel$export(module.exports, "useListFormatter", () => $cb6a3e7d490e97a4$export$a2f47a3d2973640);
$parcel$export(module.exports, "useDateFormatter", () => $b80c530ff2e20243$export$85fd5fdf27bacc79);
$parcel$export(module.exports, "useNumberFormatter", () => $fea93c5b7c90d9f4$export$b7a616150fdb9f44);
$parcel$export(module.exports, "useCollator", () => $27a5ce66022270ad$export$a16aca283550c30d);
$parcel$export(module.exports, "useFilter", () => $832d079b867c7223$export$3274cf84b703fff);
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
 */ // https://en.wikipedia.org/wiki/Right-to-left
const $4d65847630a056a8$var$RTL_SCRIPTS = new Set([
    "Arab",
    "Syrc",
    "Samr",
    "Mand",
    "Thaa",
    "Mend",
    "Nkoo",
    "Adlm",
    "Rohg",
    "Hebr"
]);
const $4d65847630a056a8$var$RTL_LANGS = new Set([
    "ae",
    "ar",
    "arc",
    "bcc",
    "bqi",
    "ckb",
    "dv",
    "fa",
    "glk",
    "he",
    "ku",
    "mzn",
    "nqo",
    "pnb",
    "ps",
    "sd",
    "ug",
    "ur",
    "yi"
]);
function $4d65847630a056a8$export$702d680b21cbd764(locale) {
    // If the Intl.Locale API is available, use it to get the script for the locale.
    // This is more accurate than guessing by language, since languages can be written in multiple scripts.
    // @ts-ignore
    if (Intl.Locale) {
        // @ts-ignore
        let script = new Intl.Locale(locale).maximize().script;
        return $4d65847630a056a8$var$RTL_SCRIPTS.has(script);
    }
    // If not, just guess by the language (first part of the locale)
    let lang = locale.split("-")[0];
    return $4d65847630a056a8$var$RTL_LANGS.has(lang);
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


function $2919bdec75484e64$export$f09106e7c6677ec5() {
    // @ts-ignore
    let locale = typeof navigator !== "undefined" && (navigator.language || navigator.userLanguage) || "en-US";
    try {
        // @ts-ignore
        Intl.DateTimeFormat.supportedLocalesOf([
            locale
        ]);
    } catch (_err) {
        locale = "en-US";
    }
    return {
        locale: locale,
        direction: (0, $4d65847630a056a8$export$702d680b21cbd764)(locale) ? "rtl" : "ltr"
    };
}
let $2919bdec75484e64$var$currentLocale = $2919bdec75484e64$export$f09106e7c6677ec5();
let $2919bdec75484e64$var$listeners = new Set();
function $2919bdec75484e64$var$updateLocale() {
    $2919bdec75484e64$var$currentLocale = $2919bdec75484e64$export$f09106e7c6677ec5();
    for (let listener of $2919bdec75484e64$var$listeners)listener($2919bdec75484e64$var$currentLocale);
}
function $2919bdec75484e64$export$188ec29ebc2bdc3a() {
    let isSSR = (0, $87SwK$reactariassr.useIsSSR)();
    let [defaultLocale, setDefaultLocale] = (0, $87SwK$react.useState)($2919bdec75484e64$var$currentLocale);
    (0, $87SwK$react.useEffect)(()=>{
        if ($2919bdec75484e64$var$listeners.size === 0) window.addEventListener("languagechange", $2919bdec75484e64$var$updateLocale);
        $2919bdec75484e64$var$listeners.add(setDefaultLocale);
        return ()=>{
            $2919bdec75484e64$var$listeners.delete(setDefaultLocale);
            if ($2919bdec75484e64$var$listeners.size === 0) window.removeEventListener("languagechange", $2919bdec75484e64$var$updateLocale);
        };
    }, []);
    // We cannot determine the browser's language on the server, so default to
    // en-US. This will be updated after hydration on the client to the correct value.
    if (isSSR) return {
        locale: "en-US",
        direction: "ltr"
    };
    return defaultLocale;
}



const $47fa5ec5ff482271$var$I18nContext = /*#__PURE__*/ (0, ($parcel$interopDefault($87SwK$react))).createContext(null);
function $47fa5ec5ff482271$export$a54013f0d02a8f82(props) {
    let { locale: locale , children: children  } = props;
    let defaultLocale = (0, $2919bdec75484e64$export$188ec29ebc2bdc3a)();
    let value = locale ? {
        locale: locale,
        direction: (0, $4d65847630a056a8$export$702d680b21cbd764)(locale) ? "rtl" : "ltr"
    } : defaultLocale;
    return /*#__PURE__*/ (0, ($parcel$interopDefault($87SwK$react))).createElement($47fa5ec5ff482271$var$I18nContext.Provider, {
        value: value
    }, children);
}
function $47fa5ec5ff482271$export$43bb16f9c6d9e3f7() {
    let defaultLocale = (0, $2919bdec75484e64$export$188ec29ebc2bdc3a)();
    let context = (0, $87SwK$react.useContext)($47fa5ec5ff482271$var$I18nContext);
    return context || defaultLocale;
}


var $227f31f0c647c5fc$exports = {};
"use strict";


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
 */ 


const $fc53663969a3d00a$var$cache = new WeakMap();
function $fc53663969a3d00a$var$getCachedDictionary(strings) {
    let dictionary = $fc53663969a3d00a$var$cache.get(strings);
    if (!dictionary) {
        dictionary = new (0, $87SwK$internationalizedstring.LocalizedStringDictionary)(strings);
        $fc53663969a3d00a$var$cache.set(strings, dictionary);
    }
    return dictionary;
}
function $fc53663969a3d00a$export$f12b703ca79dfbb1(strings) {
    let { locale: locale  } = (0, $47fa5ec5ff482271$export$43bb16f9c6d9e3f7)();
    let dictionary = (0, $87SwK$react.useMemo)(()=>$fc53663969a3d00a$var$getCachedDictionary(strings), [
        strings
    ]);
    return (0, $87SwK$react.useMemo)(()=>new (0, $87SwK$internationalizedstring.LocalizedStringFormatter)(locale, dictionary), [
        locale,
        dictionary
    ]);
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

function $cb6a3e7d490e97a4$export$a2f47a3d2973640(options = {}) {
    let { locale: locale  } = (0, $47fa5ec5ff482271$export$43bb16f9c6d9e3f7)();
    // @ts-ignore
    return (0, $87SwK$react.useMemo)(()=>new Intl.ListFormat(locale, options), [
        locale,
        options
    ]);
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


function $b80c530ff2e20243$export$85fd5fdf27bacc79(options) {
    // Reuse last options object if it is shallowly equal, which allows the useMemo result to also be reused.
    let lastOptions = (0, $87SwK$react.useRef)(null);
    if (options && lastOptions.current && $b80c530ff2e20243$var$isEqual(options, lastOptions.current)) options = lastOptions.current;
    lastOptions.current = options;
    let { locale: locale  } = (0, $47fa5ec5ff482271$export$43bb16f9c6d9e3f7)();
    return (0, $87SwK$react.useMemo)(()=>new (0, $87SwK$internationalizeddate.DateFormatter)(locale, options), [
        locale,
        options
    ]);
}
function $b80c530ff2e20243$var$isEqual(a, b) {
    if (a === b) return true;
    let aKeys = Object.keys(a);
    let bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (let key of aKeys){
        if (b[key] !== a[key]) return false;
    }
    return true;
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


function $fea93c5b7c90d9f4$export$b7a616150fdb9f44(options = {}) {
    let { locale: locale  } = (0, $47fa5ec5ff482271$export$43bb16f9c6d9e3f7)();
    return (0, $87SwK$react.useMemo)(()=>new (0, $87SwK$internationalizednumber.NumberFormatter)(locale, options), [
        locale,
        options
    ]);
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
let $27a5ce66022270ad$var$cache = new Map();
function $27a5ce66022270ad$export$a16aca283550c30d(options) {
    let { locale: locale  } = (0, $47fa5ec5ff482271$export$43bb16f9c6d9e3f7)();
    let cacheKey = locale + (options ? Object.entries(options).sort((a, b)=>a[0] < b[0] ? -1 : 1).join() : "");
    if ($27a5ce66022270ad$var$cache.has(cacheKey)) return $27a5ce66022270ad$var$cache.get(cacheKey);
    let formatter = new Intl.Collator(locale, options);
    $27a5ce66022270ad$var$cache.set(cacheKey, formatter);
    return formatter;
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

function $832d079b867c7223$export$3274cf84b703fff(options) {
    let collator = (0, $27a5ce66022270ad$export$a16aca283550c30d)({
        usage: "search",
        ...options
    });
    // TODO(later): these methods don't currently support the ignorePunctuation option.
    let startsWith = (0, $87SwK$react.useCallback)((string, substring)=>{
        if (substring.length === 0) return true;
        // Normalize both strings so we can slice safely
        // TODO: take into account the ignorePunctuation option as well...
        string = string.normalize("NFC");
        substring = substring.normalize("NFC");
        return collator.compare(string.slice(0, substring.length), substring) === 0;
    }, [
        collator
    ]);
    let endsWith = (0, $87SwK$react.useCallback)((string, substring)=>{
        if (substring.length === 0) return true;
        string = string.normalize("NFC");
        substring = substring.normalize("NFC");
        return collator.compare(string.slice(-substring.length), substring) === 0;
    }, [
        collator
    ]);
    let contains = (0, $87SwK$react.useCallback)((string, substring)=>{
        if (substring.length === 0) return true;
        string = string.normalize("NFC");
        substring = substring.normalize("NFC");
        let scan = 0;
        let sliceLen = substring.length;
        for(; scan + sliceLen <= string.length; scan++){
            let slice = string.slice(scan, scan + sliceLen);
            if (collator.compare(substring, slice) === 0) return true;
        }
        return false;
    }, [
        collator
    ]);
    return (0, $87SwK$react.useMemo)(()=>({
            startsWith: startsWith,
            endsWith: endsWith,
            contains: contains
        }), [
        startsWith,
        endsWith,
        contains
    ]);
}




//# sourceMappingURL=real-main.js.map
