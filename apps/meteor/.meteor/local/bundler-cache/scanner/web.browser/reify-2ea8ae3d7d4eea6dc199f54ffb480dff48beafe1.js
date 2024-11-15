module.export({LayoutLogo:()=>LayoutLogo});let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let RocketChatLogo;module.link('@rocket.chat/logo',{RocketChatLogo(v){RocketChatLogo=v}},2);let useDarkMode;module.link('./DarkModeProvider',{useDarkMode(v){useDarkMode=v}},3);let useLayoutContext;module.link('./contexts/LayoutContext',{useLayoutContext(v){useLayoutContext=v}},4);var __assign = (this && this.__assign) || function () {
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





var LayoutLogo = function () {
    var _a = useLayoutContext(), logo = _a.logo, _b = _a.logoDark, logoDark = _b === void 0 ? logo : _b;
    var isDark = useDarkMode();
    return (_jsx(Box, __assign({ width: '100%', maxWidth: 224 }, { children: (isDark ? logoDark : logo) || _jsx(RocketChatLogo, {}) })));
};
//# sourceMappingURL=LayoutLogo.js.map