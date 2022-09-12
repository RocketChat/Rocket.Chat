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
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var fuselage_1 = require("@rocket.chat/fuselage");
var ListItem = function (_a) {
    var children = _a.children, icon = _a.icon, _b = _a.iconColor, iconColor = _b === void 0 ? 'success' : _b, _c = _a.fontScale, fontScale = _c === void 0 ? 'c1' : _c;
    return (jsx_runtime_1.jsxs(fuselage_1.Box, __assign({ display: 'flex', is: 'li', fontScale: fontScale, color: 'inherit' }, { children: [icon && jsx_runtime_1.jsx(fuselage_1.Icon, { name: icon, color: iconColor, size: 'x16', mie: 'x4' }, void 0), children] }), void 0));
};
exports.default = ListItem;
//# sourceMappingURL=ListItem.js.map