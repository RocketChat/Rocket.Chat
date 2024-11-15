module.export({useNumberFormatter:()=>$a916eb452884faea$export$b7a616150fdb9f44});let $18f2051aff69b9bf$export$43bb16f9c6d9e3f7;module.link("./context.module.js",{useLocale(v){$18f2051aff69b9bf$export$43bb16f9c6d9e3f7=v}},0);let $JFEdn$NumberFormatter;module.link("@internationalized/number",{NumberFormatter(v){$JFEdn$NumberFormatter=v}},1);let $JFEdn$useMemo;module.link("react",{useMemo(v){$JFEdn$useMemo=v}},2);



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


function $a916eb452884faea$export$b7a616150fdb9f44(options = {}) {
    let { locale: locale } = (0, $18f2051aff69b9bf$export$43bb16f9c6d9e3f7)();
    return (0, $JFEdn$useMemo)(()=>new (0, $JFEdn$NumberFormatter)(locale, options), [
        locale,
        options
    ]);
}



//# sourceMappingURL=useNumberFormatter.module.js.map
