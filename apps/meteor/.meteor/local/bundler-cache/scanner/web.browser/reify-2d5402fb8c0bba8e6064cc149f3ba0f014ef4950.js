module.export({useDateFormatter:()=>$896ba0a80a8f4d36$export$85fd5fdf27bacc79});let $18f2051aff69b9bf$export$43bb16f9c6d9e3f7;module.link("./context.module.js",{useLocale(v){$18f2051aff69b9bf$export$43bb16f9c6d9e3f7=v}},0);let $6wxND$DateFormatter;module.link("@internationalized/date",{DateFormatter(v){$6wxND$DateFormatter=v}},1);let $6wxND$useDeepMemo;module.link("@react-aria/utils",{useDeepMemo(v){$6wxND$useDeepMemo=v}},2);let $6wxND$useMemo;module.link("react",{useMemo(v){$6wxND$useMemo=v}},3);




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



function $896ba0a80a8f4d36$export$85fd5fdf27bacc79(options) {
    // Reuse last options object if it is shallowly equal, which allows the useMemo result to also be reused.
    options = (0, $6wxND$useDeepMemo)(options !== null && options !== void 0 ? options : {}, $896ba0a80a8f4d36$var$isEqual);
    let { locale: locale } = (0, $18f2051aff69b9bf$export$43bb16f9c6d9e3f7)();
    return (0, $6wxND$useMemo)(()=>new (0, $6wxND$DateFormatter)(locale, options), [
        locale,
        options
    ]);
}
function $896ba0a80a8f4d36$var$isEqual(a, b) {
    if (a === b) return true;
    let aKeys = Object.keys(a);
    let bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (let key of aKeys){
        if (b[key] !== a[key]) return false;
    }
    return true;
}



//# sourceMappingURL=useDateFormatter.module.js.map
