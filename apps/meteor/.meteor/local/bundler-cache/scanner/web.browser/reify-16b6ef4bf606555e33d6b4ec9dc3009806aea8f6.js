let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let colors;module.link('@rocket.chat/fuselage-tokens/colors.json',{default(v){colors=v}},1);let useMemo;module.link('react',{useMemo(v){useMemo=v}},2);let renderToStaticMarkup;module.link('react-dom/server',{renderToStaticMarkup(v){renderToStaticMarkup=v}},3);let useDarkMode;module.link('../DarkModeProvider',{useDarkMode(v){useDarkMode=v}},4);let useLayoutContext;module.link('../contexts/LayoutContext',{useLayoutContext(v){useLayoutContext=v}},5);let BackgroundImage;module.link('./BackgroundImage',{default(v){BackgroundImage=v}},6);let Wrapper;module.link('./BackgroundLayer.styles',{Wrapper(v){Wrapper=v}},7);var __assign = (this && this.__assign) || function () {
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
    var _b = useLayoutContext(), background = _b.background, _c = _b.backgroundDark, backgroundDark = _c === void 0 ? background : _c;
    var darkMode = useDarkMode();
    var backgroundColor = darkMode ? colors.n800 : colors.n200;
    var color = darkMode ? colors.white : colors.n800;
    var backgroundImage = useMemo(function () {
        return (darkMode ? backgroundDark : background) ||
            "data:image/svg+xml,".concat(encodeURIComponent(renderToStaticMarkup(_jsx(BackgroundImage, { backgroundColor: backgroundColor }))));
    }, [backgroundColor]);
    return (_jsx(Wrapper, __assign({ color: color, backgroundImage: backgroundImage, backgroundColor: backgroundColor }, { children: children })));
};
module.exportDefault(BackgroundLayer);
//# sourceMappingURL=BackgroundLayer.js.map