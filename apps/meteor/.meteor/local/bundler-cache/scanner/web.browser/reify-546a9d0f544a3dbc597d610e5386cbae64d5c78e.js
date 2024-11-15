module.export({useMessageFormatter:()=>$321bc95feeb923dd$export$ec23bf898b1eed85});let $18f2051aff69b9bf$export$43bb16f9c6d9e3f7;module.link("./context.module.js",{useLocale(v){$18f2051aff69b9bf$export$43bb16f9c6d9e3f7=v}},0);let $eZWU1$MessageDictionary,$eZWU1$MessageFormatter;module.link("@internationalized/message",{MessageDictionary(v){$eZWU1$MessageDictionary=v},MessageFormatter(v){$eZWU1$MessageFormatter=v}},1);let $eZWU1$useMemo,$eZWU1$useCallback;module.link("react",{useMemo(v){$eZWU1$useMemo=v},useCallback(v){$eZWU1$useCallback=v}},2);



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


const $321bc95feeb923dd$var$cache = new WeakMap();
function $321bc95feeb923dd$var$getCachedDictionary(strings) {
    let dictionary = $321bc95feeb923dd$var$cache.get(strings);
    if (!dictionary) {
        dictionary = new (0, $eZWU1$MessageDictionary)(strings);
        $321bc95feeb923dd$var$cache.set(strings, dictionary);
    }
    return dictionary;
}
function $321bc95feeb923dd$export$ec23bf898b1eed85(strings) {
    let { locale: locale } = (0, $18f2051aff69b9bf$export$43bb16f9c6d9e3f7)();
    let dictionary = (0, $eZWU1$useMemo)(()=>$321bc95feeb923dd$var$getCachedDictionary(strings), [
        strings
    ]);
    let formatter = (0, $eZWU1$useMemo)(()=>new (0, $eZWU1$MessageFormatter)(locale, dictionary), [
        locale,
        dictionary
    ]);
    return (0, $eZWU1$useCallback)((key, variables)=>formatter.format(key, variables), [
        formatter
    ]);
}



//# sourceMappingURL=useMessageFormatter.module.js.map
