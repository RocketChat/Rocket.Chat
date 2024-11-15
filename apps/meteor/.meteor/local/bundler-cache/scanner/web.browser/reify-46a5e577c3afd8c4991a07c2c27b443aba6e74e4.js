let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Button;module.link('@rocket.chat/fuselage',{Button(v){Button=v}},1);let useLoginWithService,useTranslation;module.link('@rocket.chat/ui-contexts',{useLoginWithService(v){useLoginWithService=v},useTranslation(v){useTranslation=v}},2);let useCallback;module.link('react',{useCallback(v){useCallback=v}},3);var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};




const LoginServicesButton = (_a) => {
    var { buttonLabelText, icon, title, service, className, disabled, setError, buttonColor, buttonLabelColor } = _a, props = __rest(_a, ["buttonLabelText", "icon", "title", "service", "className", "disabled", "setError", "buttonColor", "buttonLabelColor"]);
    const t = useTranslation();
    const handler = useLoginWithService(Object.assign({ service, buttonLabelText }, props));
    const handleOnClick = useCallback(() => {
        handler().catch((e) => {
            if (!e.error || typeof e.error !== 'string') {
                return;
            }
            setError === null || setError === void 0 ? void 0 : setError([e.error, e.reason]);
        });
    }, [handler, setError]);
    return (_jsx(Button, { icon: icon, className: className, onClick: handleOnClick, title: buttonLabelText && buttonLabelText !== title ? title : undefined, disabled: disabled, alignItems: 'center', display: 'flex', justifyContent: 'center', color: buttonLabelColor, backgroundColor: buttonColor, children: buttonLabelText || t('Sign_in_with__provider__', { provider: title }) }));
};
module.exportDefault(LoginServicesButton);
//# sourceMappingURL=LoginServicesButton.js.map