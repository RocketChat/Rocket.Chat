module.export({HeroLayoutTitle:()=>HeroLayoutTitle,HeroLayoutSubtitle:()=>HeroLayoutSubtitle,HeroLayout:()=>HeroLayout});let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Margins;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Margins(v){Margins=v}},1);let BackgroundLayer;module.link('../BackgroundLayer',{default(v){BackgroundLayer=v}},2);let DarkModeProvider;module.link('../DarkModeProvider',{default(v){DarkModeProvider=v}},3);let LayoutLogo;module.link('../LayoutLogo',{LayoutLogo(v){LayoutLogo=v}},4);let LayoutContext;module.link('../contexts/LayoutContext',{LayoutContext(v){LayoutContext=v}},5);var __assign = (this && this.__assign) || function () {
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






var HeroLayoutTitle = function (_a) {
    var children = _a.children;
    return _jsx(Box, __assign({ fontScale: 'hero' }, { children: children }));
};
var HeroLayoutSubtitle = function (_a) {
    var children = _a.children;
    return _jsx(Box, __assign({ fontScale: 'p1' }, { children: children }));
};
var HeroLayout = function (_a) {
    var children = _a.children, forceDarkMode = _a.forceDarkMode, rest = __rest(_a, ["children", "forceDarkMode"]);
    return (_jsx(DarkModeProvider, __assign({ forcedDarkMode: forceDarkMode }, { children: _jsx(LayoutContext.Provider, __assign({ value: __assign({}, rest) }, { children: _jsx(BackgroundLayer, { children: _jsx(Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 576, paddingBlock: 32, paddingInline: 16 }, { children: _jsxs(Margins, __assign({ blockEnd: 32 }, { children: [_jsx(LayoutLogo, {}), children] })) })) }) })) })));
};
//# sourceMappingURL=HeroLayout.js.map