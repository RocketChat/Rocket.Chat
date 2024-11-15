module.export({I18nProvider:()=>$18f2051aff69b9bf$export$a54013f0d02a8f82,useLocale:()=>$18f2051aff69b9bf$export$43bb16f9c6d9e3f7});let $148a7a147e38ea7f$export$702d680b21cbd764;module.link("./utils.module.js",{isRTL(v){$148a7a147e38ea7f$export$702d680b21cbd764=v}},0);let $1e5a04cdaf7d1af8$export$188ec29ebc2bdc3a;module.link("./useDefaultLocale.module.js",{useDefaultLocale(v){$1e5a04cdaf7d1af8$export$188ec29ebc2bdc3a=v}},1);let $h9FiU$react,$h9FiU$useContext;module.link("react",{default(v){$h9FiU$react=v},useContext(v){$h9FiU$useContext=v}},2);



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


const $18f2051aff69b9bf$var$I18nContext = /*#__PURE__*/ (0, $h9FiU$react).createContext(null);
function $18f2051aff69b9bf$export$a54013f0d02a8f82(props) {
    let { locale: locale, children: children } = props;
    let defaultLocale = (0, $1e5a04cdaf7d1af8$export$188ec29ebc2bdc3a)();
    let value = (0, $h9FiU$react).useMemo(()=>{
        if (!locale) return defaultLocale;
        return {
            locale: locale,
            direction: (0, $148a7a147e38ea7f$export$702d680b21cbd764)(locale) ? 'rtl' : 'ltr'
        };
    }, [
        defaultLocale,
        locale
    ]);
    return /*#__PURE__*/ (0, $h9FiU$react).createElement($18f2051aff69b9bf$var$I18nContext.Provider, {
        value: value
    }, children);
}
function $18f2051aff69b9bf$export$43bb16f9c6d9e3f7() {
    let defaultLocale = (0, $1e5a04cdaf7d1af8$export$188ec29ebc2bdc3a)();
    let context = (0, $h9FiU$useContext)($18f2051aff69b9bf$var$I18nContext);
    return context || defaultLocale;
}



//# sourceMappingURL=context.module.js.map
