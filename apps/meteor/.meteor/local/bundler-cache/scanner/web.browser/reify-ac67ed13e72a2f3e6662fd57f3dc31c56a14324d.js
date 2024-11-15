module.export({UiKitContext:()=>UiKitContext},true);let createContext;module.link('react',{createContext(v){createContext=v}},0);
const UiKitContext = createContext({
    action: () => undefined,
    updateState: () => undefined,
    appId: 'core',
    values: {},
});
Object.assign(UiKitContext.Provider, { displayName: 'UiKitContext.Provider' });
//# sourceMappingURL=UiKitContext.js.map