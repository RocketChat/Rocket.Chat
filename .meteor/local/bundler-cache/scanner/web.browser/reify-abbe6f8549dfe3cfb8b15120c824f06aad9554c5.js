let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Icon;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Icon(v){Icon=v}},1);let colors;module.link('@rocket.chat/fuselage-tokens/colors.json',{default(v){colors=v}},2);let useMemo;module.link('react',{useMemo(v){useMemo=v}},3);let renderToStaticMarkup;module.link('react-dom/server',{renderToStaticMarkup(v){renderToStaticMarkup=v}},4);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},5);let useDarkMode;module.link('../../common/DarkModeProvider',{useDarkMode(v){useDarkMode=v}},6);let List;module.link('../../common/List',{default(v){List=v}},7);let PlanFeatureIcon;module.link('../../common/PlanFeatureIcon',{default(v){PlanFeatureIcon=v}},8);var __assign = (this && this.__assign) || function () {
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
    var featuresList = [
        t('page.createCloudWorkspace.auditing'),
        t('page.createCloudWorkspace.numberOfIntegrations'),
        t('page.createCloudWorkspace.ldap'),
        t('page.createCloudWorkspace.omnichannel'),
        t('page.createCloudWorkspace.sla'),
        t('page.createCloudWorkspace.push'),
        t('page.createCloudWorkspace.engagement'),
    ];
    var icon = useMemo(function () {
        return encodeURIComponent(renderToStaticMarkup(_jsx(PlanFeatureIcon, { color: color }, void 0)));
    }, [color]);
    var listItem = function (text, id) { return (_jsxs(List.Item, __assign({ fontScale: 'p1' }, { children: [_jsx(Icon, { name: 'check', size: 'x24', mie: 'x12' }, void 0), text] }), id)); };
    return (_jsx(Box, { children: _jsx(Box, { children: _jsx(List, __assign({ color: color, spacing: 'x16', icon: icon }, { children: featuresList.map(function (text, id) { return listItem(text, id); }) }), void 0) }, void 0) }, void 0));
};
module.exportDefault(Description);
//# sourceMappingURL=Description.js.map