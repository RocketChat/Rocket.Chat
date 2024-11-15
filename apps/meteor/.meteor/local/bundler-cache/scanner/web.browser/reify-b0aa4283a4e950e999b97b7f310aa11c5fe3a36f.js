module.export({mod:()=>$2b4dce13dd5a17fa$export$842a2cf37af977e1,copy:()=>$2b4dce13dd5a17fa$export$784d13d8ee351f07,copyDateTime:()=>$2b4dce13dd5a17fa$export$27fa0172ae2644b3});let $35ea8db9cb2ccb90$export$99faa760c7908e4f,$35ea8db9cb2ccb90$export$ca871e8dbb80966f;module.link("./CalendarDate.module.js",{CalendarDate(v){$35ea8db9cb2ccb90$export$99faa760c7908e4f=v},CalendarDateTime(v){$35ea8db9cb2ccb90$export$ca871e8dbb80966f=v}},0);

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
function $2b4dce13dd5a17fa$export$842a2cf37af977e1(amount, numerator) {
    return amount - numerator * Math.floor(amount / numerator);
}
function $2b4dce13dd5a17fa$export$784d13d8ee351f07(date) {
    if (date.era) return new (0, $35ea8db9cb2ccb90$export$99faa760c7908e4f)(date.calendar, date.era, date.year, date.month, date.day);
    else return new (0, $35ea8db9cb2ccb90$export$99faa760c7908e4f)(date.calendar, date.year, date.month, date.day);
}
function $2b4dce13dd5a17fa$export$27fa0172ae2644b3(date) {
    if (date.era) return new (0, $35ea8db9cb2ccb90$export$ca871e8dbb80966f)(date.calendar, date.era, date.year, date.month, date.day, date.hour, date.minute, date.second, date.millisecond);
    else return new (0, $35ea8db9cb2ccb90$export$ca871e8dbb80966f)(date.calendar, date.year, date.month, date.day, date.hour, date.minute, date.second);
}



//# sourceMappingURL=utils.module.js.map
