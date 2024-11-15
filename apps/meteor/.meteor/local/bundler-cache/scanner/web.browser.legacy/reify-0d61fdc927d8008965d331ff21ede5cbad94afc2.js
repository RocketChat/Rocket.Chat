"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToastBarContainer = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var styled_1 = __importDefault(require("@rocket.chat/styled"));
var positionProps = {
    'top-start': {
        ltr: 'top: 0; left: 0; right: unset; bottom: unset;',
        rtl: 'top: 0; right: 0; left: unset; bottom: unset;',
    },
    'top-end': {
        ltr: 'top: 0; right: 0; left: unset; bottom: unset;',
        rtl: 'top: 0; left: 0; right: unset; bottom: unset;',
    },
    'bottom-start': {
        ltr: 'bottom: 0; left: 0; right: unset; top: unset;',
        rtl: 'bottom: 0; right: 0; left: unset; top: unset;',
    },
    'bottom-end': {
        ltr: 'bottom: 0; right: 0; left: unset; top: unset;',
        rtl: 'bottom: 0; left: 0; right: unset; top: unset;',
    },
};
exports.ToastBarContainer = (0, styled_1.default)('div', function (_a) {
    var _position = _a.position, props = __rest(_a, ["position"]);
    return props;
})(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  position: fixed;\n  gap: 1rem;\n  display: flex;\n  flex-direction: column;\n  margin: 1rem;\n  ", "\n  [dir='rtl'] & {\n    ", "\n  }\n"], ["\n  position: fixed;\n  gap: 1rem;\n  display: flex;\n  flex-direction: column;\n  margin: 1rem;\n  ", "\n  [dir='rtl'] & {\n    ", "\n  }\n"])), function (p) { return (p.position ? positionProps[p.position].ltr : ''); }, function (p) { return (p.position ? positionProps[p.position].rtl : ''); });
var ToastBarZone = function (_a) {
    var children = _a.children, _b = _a.position, position = _b === void 0 ? 'top-end' : _b;
    return ((0, jsx_runtime_1.jsx)(exports.ToastBarContainer, { position: position, children: children }));
};
exports.default = ToastBarZone;
var templateObject_1;
//# sourceMappingURL=ToastBarZone.js.map