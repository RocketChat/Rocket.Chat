module.export({ToastBarContext:()=>ToastBarContext,useToastBarDispatch:()=>useToastBarDispatch,useToastBarDismiss:()=>useToastBarDismiss});let createContext,useContext;module.link('react',{createContext(v){createContext=v},useContext(v){useContext=v}},0);
var ToastBarContext = createContext({
    dispatch: function () { return undefined; },
    dismiss: function () { return undefined; },
});
var useToastBarDispatch = function () {
    return useContext(ToastBarContext).dispatch;
};
var useToastBarDismiss = function () {
    return useContext(ToastBarContext).dismiss;
};
//# sourceMappingURL=ToastBarContext.js.map