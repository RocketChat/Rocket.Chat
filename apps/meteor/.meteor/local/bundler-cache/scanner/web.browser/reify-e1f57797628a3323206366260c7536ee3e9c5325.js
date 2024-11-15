module.export({MessageFormatter:()=>$972eb555d604f491$export$526ebc05ff964723});let $9UXlH$intlmessageformat;module.link("intl-messageformat",{default(v){$9UXlH$intlmessageformat=v}},0);

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
class $972eb555d604f491$export$526ebc05ff964723 {
    format(key, variables) {
        let message = this.cache[key];
        if (!message) {
            let msg = this.messages.getStringForLocale(key, this.locale);
            if (!msg) throw new Error(`Could not find intl message ${key} in ${this.locale} locale`);
            message = new (0, $9UXlH$intlmessageformat)(msg, this.locale);
            this.cache[key] = message;
        }
        let varCopy;
        if (variables) varCopy = Object.keys(variables).reduce((acc, key)=>{
            acc[key] = variables[key] == null ? false : variables[key];
            return acc;
        }, {});
        return message.format(varCopy);
    }
    constructor(locale, messages){
        this.locale = locale;
        this.messages = messages;
        this.cache = {};
    }
}



//# sourceMappingURL=MessageFormatter.module.js.map
