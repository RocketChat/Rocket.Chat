module.export({HorizontalWizardLayout:()=>HorizontalWizardLayout,HorizontalWizardLayoutAside:()=>HorizontalWizardLayoutAside,HorizontalWizardLayoutTitle:()=>HorizontalWizardLayoutTitle,HorizontalWizardLayoutSubtitle:()=>HorizontalWizardLayoutSubtitle,HorizontalWizardLayoutDescription:()=>HorizontalWizardLayoutDescription,HorizontalWizardTextHighlight:()=>HorizontalWizardTextHighlight,HorizontalWizardLayoutContent:()=>HorizontalWizardLayoutContent,HorizontalWizardLayoutCaption:()=>HorizontalWizardLayoutCaption,HorizontalWizardLayoutFooter:()=>HorizontalWizardLayoutFooter});let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let BackgroundLayer;module.link('../BackgroundLayer',{default(v){BackgroundLayer=v}},2);let DarkModeProvider,useDarkMode;module.link('../DarkModeProvider',{default(v){DarkModeProvider=v},useDarkMode(v){useDarkMode=v}},3);let FormPageLayout;module.link('../FormPageLayout/FormPageLayout.styles',{"*"(v){FormPageLayout=v}},4);let LayoutLogo;module.link('../LayoutLogo',{LayoutLogo(v){LayoutLogo=v}},5);let LayoutContext;module.link('../contexts/LayoutContext',{LayoutContext(v){LayoutContext=v}},6);var __assign = (this && this.__assign) || function () {
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
var __rest = (this && this.__rest) || function (s, e) {
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







var HorizontalWizardLayout = function (_a) {
    var children = _a.children, forceDarkMode = _a.forceDarkMode, rest = __rest(_a, ["children", "forceDarkMode"]);
    return (_jsx(DarkModeProvider, __assign({ forcedDarkMode: forceDarkMode }, { children: _jsx(LayoutContext.Provider, __assign({ value: __assign({}, rest) }, { children: _jsx(BackgroundLayer, { children: _jsx(FormPageLayout.Wrapper, { children: children }) }) })) })));
};
var HorizontalWizardLayoutAside = function (_a) {
    var children = _a.children;
    return (_jsxs(FormPageLayout.Aside, { children: [_jsx(FormPageLayout.Logo, { children: _jsx(LayoutLogo, {}) }), children] }));
};
var HorizontalWizardLayoutTitle = function (props) { return _jsx(FormPageLayout.Title, __assign({}, props)); };
var HorizontalWizardLayoutSubtitle = function (props) { return _jsx(FormPageLayout.Subtitle, __assign({}, props)); };
var HorizontalWizardLayoutDescription = function (props) { return _jsx(FormPageLayout.Description, __assign({}, props)); };
var HorizontalWizardTextHighlight = function (props) {
    var isDark = useDarkMode();
    return _jsx(FormPageLayout.TitleHighlight, __assign({}, props, { isDark: isDark }));
};
var HorizontalWizardLayoutContent = function (_a) {
    var children = _a.children;
    return _jsx(FormPageLayout.Content, { children: children });
};
var HorizontalWizardLayoutCaption = function (_a) {
    var children = _a.children;
    var isDark = useDarkMode();
    return (_jsx(Box, __assign({ display: 'inline-block', flexDirection: 'row', fontScale: 'c1', color: isDark ? 'white' : 'secondary-info', mb: 16, alignItems: 'center' }, { children: children })));
};
var HorizontalWizardLayoutFooter = function (_a) {
    var children = _a.children;
    return (_jsx(Box, __assign({ display: 'flex', fontScale: 'h4', flexDirection: 'column', alignItems: 'center' }, { children: children })));
};
//# sourceMappingURL=HorizontalWizardLayout.js.map