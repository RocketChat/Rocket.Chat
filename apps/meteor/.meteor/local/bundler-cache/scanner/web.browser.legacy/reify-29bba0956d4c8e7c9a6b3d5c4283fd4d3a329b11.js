var _Fragment,_jsx,_jsxs;module.link("react/jsx-runtime",{Fragment:function(v){_Fragment=v},jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var Button;module.link('@rocket.chat/fuselage',{Button:function(v){Button=v}},1);var useLocalStorage;module.link('@rocket.chat/fuselage-hooks',{useLocalStorage:function(v){useLocalStorage=v}},2);var HorizontalWizardLayoutCaption;module.link('@rocket.chat/layout',{HorizontalWizardLayoutCaption:function(v){HorizontalWizardLayoutCaption=v}},3);var normalizeLanguage;module.link('@rocket.chat/tools',{normalizeLanguage:function(v){normalizeLanguage=v}},4);var useSetting,useLoadLanguage,useLanguage,useLanguages;module.link('@rocket.chat/ui-contexts',{useSetting:function(v){useSetting=v},useLoadLanguage:function(v){useLoadLanguage=v},useLanguage:function(v){useLanguage=v},useLanguages:function(v){useLanguages=v}},5);var useMemo,useEffect;module.link('react',{useMemo:function(v){useMemo=v},useEffect:function(v){useEffect=v}},6);var Trans,useTranslation;module.link('react-i18next',{Trans:function(v){Trans=v},useTranslation:function(v){useTranslation=v}},7);var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};








const useSuggestedLanguages = (_a) => {
    var _b;
    var { browserLanguage = normalizeLanguage((_b = window.navigator.language) !== null && _b !== void 0 ? _b : 'en'), } = _a;
    const availableLanguages = useLanguages();
    const currentLanguage = useLanguage();
    const serverLanguage = normalizeLanguage(useSetting('Language') || 'en');
    const suggestions = useMemo(() => {
        const potentialLanguages = new Set([serverLanguage, browserLanguage, 'en'].map(normalizeLanguage));
        const potentialSuggestions = Array.from(potentialLanguages).map((potentialLanguageKey) => availableLanguages.find((language) => language.key === potentialLanguageKey));
        return potentialSuggestions.filter((language) => {
            return !!language && language.key !== currentLanguage;
        });
    }, [serverLanguage, browserLanguage, availableLanguages, currentLanguage]);
    const { i18n } = useTranslation();
    useEffect(() => {
        i18n.loadLanguages(suggestions.map((suggestion) => suggestion.key));
    }, [i18n, suggestions]);
    return { suggestions };
};
const LoginSwitchLanguageFooter = (_a) => {
    var _b;
    var { browserLanguage = normalizeLanguage((_b = window.navigator.language) !== null && _b !== void 0 ? _b : 'en'), } = _a;
    const loadLanguage = useLoadLanguage();
    const { suggestions } = useSuggestedLanguages({ browserLanguage });
    const [, setPreferedLanguage] = useLocalStorage('preferedLanguage', '');
    const handleSwitchLanguageClick = (language) => (event) => __awaiter(void 0, void 0, void 0, function* () {
        event.preventDefault();
        yield loadLanguage(language.key);
        setPreferedLanguage(language.key);
    });
    if (!suggestions.length) {
        return null;
    }
    return (_jsx(HorizontalWizardLayoutCaption, { children: suggestions.map((suggestion) => (_jsx(Button, { secondary: true, small: true, mie: 8, onClick: handleSwitchLanguageClick(suggestion), children: _jsxs(Trans, { i18nKey: 'registration.component.switchLanguage', tOptions: { lng: suggestion.key }, children: ["Change to", ' ', _jsx("strong", { children: _jsx(_Fragment, { children: { name: suggestion.ogName } }) })] }) }, suggestion.key))) }));
};
module.exportDefault(LoginSwitchLanguageFooter);
//# sourceMappingURL=LoginSwitchLanguageFooter.js.map