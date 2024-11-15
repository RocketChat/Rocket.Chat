let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let useState,memo;module.link('react',{useState(v){useState=v},memo(v){memo=v}},1);let ToastBarContext;module.link('./ToastBarContext',{ToastBarContext(v){ToastBarContext=v}},2);let ToastBarPortal;module.link('./ToastBarPortal',{default(v){ToastBarPortal=v}},3);let ToastBarTimed;module.link('./ToastBarTimed',{default(v){ToastBarTimed=v}},4);let ToastBarZone;module.link('./ToastBarZone',{default(v){ToastBarZone=v}},5);var __assign = (this && this.__assign) || function () {
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};






var ToastBarProvider = function (_a) {
    var children = _a.children;
    var _b = useState([]), toasts = _b[0], setToasts = _b[1];
    var contextValue = {
        dispatch: function (option) {
            return setToasts(function (toasts) { return __spreadArray(__spreadArray([], toasts, true), [
                __assign(__assign({}, option), { time: option.time || 5, id: Math.random().toString() }),
            ], false); });
        },
        dismiss: function (id) {
            return setToasts(function (prevState) { return prevState.filter(function (toast) { return toast.id !== id; }); });
        },
    };
    return (_jsxs(ToastBarContext.Provider, { value: contextValue, children: [children, _jsx(ToastBarPortal, { children: Object.entries(toasts === null || toasts === void 0 ? void 0 : toasts.reduce(function (zones, toast) {
                    zones[toast.position || 'top-end'] =
                        zones[toast.position || 'top-end'] || [];
                    zones[toast.position || 'top-end'].push(toast);
                    return zones;
                }, {})).map(function (_a) {
                    var zone = _a[0], toasts = _a[1];
                    return (_jsx(ToastBarZone, { position: zone, children: toasts.map(function (toast) { return (_jsx(ToastBarTimed, __assign({}, toast), toast.id)); }) }, zone));
                }) })] }));
};
module.exportDefault(memo(ToastBarProvider));
//# sourceMappingURL=ToastBarProvider.js.map