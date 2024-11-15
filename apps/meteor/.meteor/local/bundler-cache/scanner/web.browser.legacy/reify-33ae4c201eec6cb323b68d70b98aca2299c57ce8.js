"use strict";
var __assign = (this && this.__assign) || function () {
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = require("react");
var ToastBarContext_1 = require("./ToastBarContext");
var ToastBarPortal_1 = __importDefault(require("./ToastBarPortal"));
var ToastBarTimed_1 = __importDefault(require("./ToastBarTimed"));
var ToastBarZone_1 = __importDefault(require("./ToastBarZone"));
var ToastBarProvider = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)([]), toasts = _b[0], setToasts = _b[1];
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
    return ((0, jsx_runtime_1.jsxs)(ToastBarContext_1.ToastBarContext.Provider, { value: contextValue, children: [children, (0, jsx_runtime_1.jsx)(ToastBarPortal_1.default, { children: Object.entries(toasts === null || toasts === void 0 ? void 0 : toasts.reduce(function (zones, toast) {
                    zones[toast.position || 'top-end'] =
                        zones[toast.position || 'top-end'] || [];
                    zones[toast.position || 'top-end'].push(toast);
                    return zones;
                }, {})).map(function (_a) {
                    var zone = _a[0], toasts = _a[1];
                    return ((0, jsx_runtime_1.jsx)(ToastBarZone_1.default, { position: zone, children: toasts.map(function (toast) { return ((0, jsx_runtime_1.jsx)(ToastBarTimed_1.default, __assign({}, toast), toast.id)); }) }, zone));
                }) })] }));
};
exports.default = (0, react_1.memo)(ToastBarProvider);
//# sourceMappingURL=ToastBarProvider.js.map