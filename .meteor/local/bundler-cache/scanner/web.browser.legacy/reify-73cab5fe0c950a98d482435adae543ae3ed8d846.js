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
var WorkspaceUrlInput = react_1.forwardRef(function TextInput(props, ref) {
    var domain = props.domain;
    return (jsx_runtime_1.jsx(fuselage_1.InputBox, __assign({ type: 'text', ref: ref }, props, { addon: jsx_runtime_1.jsx(fuselage_1.Box, __assign({ borderInlineStart: '2px solid', mb: 'neg-x8', pb: 'x8', borderColor: 'neutral-500', color: 'info', pis: 'x12' }, { children: domain }), void 0) }), void 0));
});
exports.default = WorkspaceUrlInput;
//# sourceMappingURL=WorkspaceUrlInput.js.map