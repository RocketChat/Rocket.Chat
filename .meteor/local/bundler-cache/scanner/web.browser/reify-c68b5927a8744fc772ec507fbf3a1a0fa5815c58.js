module.export({defaultContext:()=>defaultContext,kitContext:()=>kitContext,useUiKitContext:()=>useUiKitContext,useUiKitStateValue:()=>useUiKitStateValue});let createContext,useContext;module.link('react',{createContext(v){createContext=v},useContext(v){useContext=v}},0);
var defaultContext = {
    action: console.log,
    state: console.log,
    appId: 'core',
    errors: {},
    values: {},
};
var kitContext = createContext(defaultContext);
var useUiKitContext = function () { return useContext(kitContext); };
var useUiKitStateValue = function (actionId, initialValue) {
    var _a, _b;
    var _c = useUiKitContext(), values = _c.values, errors = _c.errors;
    return {
        value: (_b = (values && ((_a = values[actionId]) === null || _a === void 0 ? void 0 : _a.value))) !== null && _b !== void 0 ? _b : initialValue,
        error: errors && errors[actionId],
    };
};
//# sourceMappingURL=kitContext.js.map