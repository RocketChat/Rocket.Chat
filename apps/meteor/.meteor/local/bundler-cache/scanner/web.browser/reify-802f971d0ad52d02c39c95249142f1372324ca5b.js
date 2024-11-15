module.export({useLocalizedStringDictionary:()=>$fca6afa0e843324b$export$87b761675e8eaa10,useLocalizedStringFormatter:()=>$fca6afa0e843324b$export$f12b703ca79dfbb1});let $18f2051aff69b9bf$export$43bb16f9c6d9e3f7;module.link("./context.module.js",{useLocale(v){$18f2051aff69b9bf$export$43bb16f9c6d9e3f7=v}},0);let $6ksNp$LocalizedStringDictionary,$6ksNp$LocalizedStringFormatter;module.link("@internationalized/string",{LocalizedStringDictionary(v){$6ksNp$LocalizedStringDictionary=v},LocalizedStringFormatter(v){$6ksNp$LocalizedStringFormatter=v}},1);let $6ksNp$useMemo;module.link("react",{useMemo(v){$6ksNp$useMemo=v}},2);



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


const $fca6afa0e843324b$var$cache = new WeakMap();
function $fca6afa0e843324b$var$getCachedDictionary(strings) {
    let dictionary = $fca6afa0e843324b$var$cache.get(strings);
    if (!dictionary) {
        dictionary = new (0, $6ksNp$LocalizedStringDictionary)(strings);
        $fca6afa0e843324b$var$cache.set(strings, dictionary);
    }
    return dictionary;
}
function $fca6afa0e843324b$export$87b761675e8eaa10(strings, packageName) {
    return packageName && (0, $6ksNp$LocalizedStringDictionary).getGlobalDictionaryForPackage(packageName) || $fca6afa0e843324b$var$getCachedDictionary(strings);
}
function $fca6afa0e843324b$export$f12b703ca79dfbb1(strings, packageName) {
    let { locale: locale } = (0, $18f2051aff69b9bf$export$43bb16f9c6d9e3f7)();
    let dictionary = $fca6afa0e843324b$export$87b761675e8eaa10(strings, packageName);
    return (0, $6ksNp$useMemo)(()=>new (0, $6ksNp$LocalizedStringFormatter)(locale, dictionary), [
        locale,
        dictionary
    ]);
}



//# sourceMappingURL=useLocalizedStringFormatter.module.js.map
