let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let colors;module.link('@rocket.chat/fuselage-tokens/colors.json',{default(v){colors=v}},1);let useMemo;module.link('react',{useMemo(v){useMemo=v}},2);let renderToStaticMarkup;module.link('react-dom/server',{renderToStaticMarkup(v){renderToStaticMarkup=v}},3);let Wrapper;module.link('./BackgroundLayer.styles',{Wrapper(v){Wrapper=v}},4);let BackgroundImage;module.link('./BackgroundLayer/BackgroundImage',{default(v){BackgroundImage=v}},5);let useDarkMode;module.link('./DarkModeProvider',{useDarkMode(v){useDarkMode=v}},6);var __assign = (this && this.__assign) || function () {
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







var BackgroundLayer = function (_a) {
    var children = _a.children;
    var darkMode = useDarkMode();
    var backgroundColor = darkMode ? colors.n800 : colors.n200;
    var color = darkMode ? colors.white : colors.n800;
    var backgroundImage = useMemo(function () {
        return encodeURIComponent(renderToStaticMarkup(_jsx(BackgroundImage, { backgroundColor: backgroundColor }, void 0)));
    }, [backgroundColor]);
    return (_jsx(Wrapper, __assign({ backgroundColor: backgroundColor, color: color, backgroundImage: backgroundImage }, { children: children }), void 0));
};
module.exportDefault(BackgroundLayer);
//# sourceMappingURL=BackgroundLayer.js.map