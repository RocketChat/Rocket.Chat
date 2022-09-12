let _jsx,_jsxs,_Fragment;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v},Fragment(v){_Fragment=v}},0);let colors;module.link('@rocket.chat/fuselage-tokens/colors.json',{default(v){colors=v}},1);let useMemo;module.link('react',{useMemo(v){useMemo=v}},2);let renderToStaticMarkup;module.link('react-dom/server',{renderToStaticMarkup(v){renderToStaticMarkup=v}},3);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},4);let useDarkMode;module.link('../../common/DarkModeProvider',{useDarkMode(v){useDarkMode=v}},5);let List;module.link('../../common/List',{default(v){List=v}},6);let PlanFeatureIcon;module.link('../../common/PlanFeatureIcon',{default(v){PlanFeatureIcon=v}},7);var __assign = (this && this.__assign) || function () {
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








var Description = function () {
    var isDarkMode = useDarkMode();
    var color = isDarkMode ? colors.white : colors.n900;
    var t = useTranslation().t;
    var icon = useMemo(function () {
        return encodeURIComponent(renderToStaticMarkup(_jsx(PlanFeatureIcon, { color: color }, void 0)));
    }, [color]);
    return (_jsx(_Fragment, { children: _jsxs(List, __assign({ color: color, spacing: 'x16', icon: icon }, { children: [_jsx(List.Item, __assign({ fontScale: 'h4' }, { children: t('page.cloudDescription.availability') }), void 0), _jsx(List.Item, __assign({ fontScale: 'h4' }, { children: t('page.cloudDescription.auditing') }), void 0), _jsx(List.Item, __assign({ fontScale: 'h4' }, { children: t('page.cloudDescription.numberOfIntegrations') }), void 0), _jsx(List.Item, __assign({ fontScale: 'h4' }, { children: t('page.cloudDescription.ldap') }), void 0), _jsx(List.Item, __assign({ fontScale: 'h4' }, { children: t('page.cloudDescription.omnichannel') }), void 0), _jsx(List.Item, __assign({ fontScale: 'h4' }, { children: t('page.cloudDescription.push') }), void 0)] }), void 0) }, void 0));
};
module.exportDefault(Description);
//# sourceMappingURL=Description.js.map