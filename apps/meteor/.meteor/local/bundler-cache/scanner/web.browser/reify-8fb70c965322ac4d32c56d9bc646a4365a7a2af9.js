module.export({Provider:()=>Provider,useDarkMode:()=>useDarkMode});let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let useDarkModeFuselage;module.link('@rocket.chat/fuselage-hooks',{useDarkMode(v){useDarkModeFuselage=v}},1);let createContext,useContext;module.link('react',{createContext(v){createContext=v},useContext(v){useContext=v}},2);


var DarkModeContext = createContext(true);
var Provider = function (_a) {
    var children = _a.children, forcedDarkMode = _a.forcedDarkMode;
    var value = useDarkModeFuselage(forcedDarkMode);
    return _jsx(DarkModeContext.Provider, { children: children, value: value });
};
var useDarkMode = function () { return useContext(DarkModeContext); };
// TODO: remove
module.exportDefault(Provider);
//# sourceMappingURL=DarkModeProvider.js.map