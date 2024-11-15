module.export({AppIdProvider:()=>AppIdProvider,useAppId:()=>useAppId},true);let _Fragment,_jsx;module.link("react/jsx-runtime",{Fragment(v){_Fragment=v},jsx(v){_jsx=v}},0);let createContext,useContext,useDebugValue;module.link('react',{createContext(v){createContext=v},useContext(v){useContext=v},useDebugValue(v){useDebugValue=v}},1);let UiKitContext;module.link('./UiKitContext',{UiKitContext(v){UiKitContext=v}},2);


const AppIdContext = createContext(undefined);
const AppIdProvider = ({ children, appId }) => {
    if (!appId) {
        return _jsx(_Fragment, { children: children });
    }
    return (_jsx(AppIdContext.Provider, { value: appId, children: children }));
};
const useAppId = () => {
    var _a, _b;
    const outerAppId = (_a = useContext(UiKitContext).appId) !== null && _a !== void 0 ? _a : 'core';
    const appId = (_b = useContext(AppIdContext)) !== null && _b !== void 0 ? _b : outerAppId;
    useDebugValue(appId);
    return appId;
};
//# sourceMappingURL=AppIdContext.js.map