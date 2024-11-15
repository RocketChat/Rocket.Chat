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
var FormSubtitle = (0, react_1.forwardRef)(function (props, ref) { return ((0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ fontScale: 'p2', color: 'neutral-900' }, props, { ref: ref }))); });
exports.default = FormSubtitle;
//# sourceMappingURL=FormSubtitle.js.map