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
var react_1 = require("react");
var ActionLink = function (_a) {
    var children = _a.children, _b = _a.href, href = _b === void 0 ? '#' : _b, onClick = _a.onClick, _c = _a.fontScale, fontScale = _c === void 0 ? 'c2' : _c, fontWeight = _a.fontWeight;
    var handleClick = react_1.useCallback(function (event) {
        event.preventDefault();
        onClick === null || onClick === void 0 ? void 0 : onClick();
    }, [onClick]);
    return (jsx_runtime_1.jsx(fuselage_1.Box, __assign({ is: 'a', fontScale: fontScale, fontWeight: fontWeight, href: href, color: 'primary-500', mi: 'x4', textDecorationLine: 'none', onClick: handleClick }, { children: children }), void 0));
};
exports.default = ActionLink;
//# sourceMappingURL=ActionLink.js.map