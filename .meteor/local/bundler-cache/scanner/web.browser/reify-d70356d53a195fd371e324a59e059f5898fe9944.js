let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Trans,useTranslation;module.link('react-i18next',{Trans(v){Trans=v},useTranslation(v){useTranslation=v}},1);let Aside,Description,Content,Logo,Subtitle,Title,Wrapper,TitleHighlight;module.link('./FormPageLayout.styles',{Aside(v){Aside=v},Description(v){Description=v},Content(v){Content=v},Logo(v){Logo=v},Subtitle(v){Subtitle=v},Title(v){Title=v},Wrapper(v){Wrapper=v},TitleHighlight(v){TitleHighlight=v}},2);let OnboardingLogo;module.link('./OnboardingLogo',{OnboardingLogo(v){OnboardingLogo=v}},3);var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};




var FormPageLayout = function (_a) {
    var _b, _c;
    var logo = _a.logo, title = _a.title, subtitle = _a.subtitle, description = _a.description, styleProps = _a.styleProps, children = _a.children;
    useTranslation();
    return (_jsxs(Wrapper, { children: [_jsxs(Aside, __assign({ justifyContent: styleProps === null || styleProps === void 0 ? void 0 : styleProps.justifyContent }, { children: [_jsx(Logo, { children: logo !== null && logo !== void 0 ? logo : _jsx(OnboardingLogo, {}, void 0) }, void 0), _jsx(Title, { children: title || (_jsxs(Trans, __assign({ i18nKey: 'page.form.title' }, { children: ["Let's", _jsx(TitleHighlight, { children: "Launch" }, void 0), "Your Workspace"] }), void 0)) }, void 0), subtitle && (_jsx(Subtitle, __assign({ fontWeight: (_b = styleProps === null || styleProps === void 0 ? void 0 : styleProps.subTitleProps) === null || _b === void 0 ? void 0 : _b.fontWeight, fontColor: (_c = styleProps === null || styleProps === void 0 ? void 0 : styleProps.subTitleProps) === null || _c === void 0 ? void 0 : _c.color }, { children: subtitle }), void 0)), _jsx(Description, { children: description }, void 0)] }), void 0), _jsx(Content, { children: children }, void 0)] }, void 0));
};
module.exportDefault(FormPageLayout);
//# sourceMappingURL=FormPageLayout.js.map