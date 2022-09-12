module.export({useDarkMode:()=>useDarkMode});let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let useDarkModeFuselage;module.link('@rocket.chat/fuselage-hooks',{useDarkMode(v){useDarkModeFuselage=v}},1);let createContext,useContext;module.link('react',{createContext(v){createContext=v},useContext(v){useContext=v}},2);


var DarkModeContext = createContext(true);
var DarkModeProvider = function (_a) {
    var children = _a.children, forcedDarkMode = _a.forcedDarkMode;
    var value = useDarkModeFuselage(forcedDarkMode);
    return _jsx(DarkModeContext.Provider, { children: children, value: value }, void 0);
};
module.exportDefault(DarkModeProvider);
var useDarkMode = function () { return useContext(DarkModeContext); };
//# sourceMappingURL=DarkModeProvider.js.map