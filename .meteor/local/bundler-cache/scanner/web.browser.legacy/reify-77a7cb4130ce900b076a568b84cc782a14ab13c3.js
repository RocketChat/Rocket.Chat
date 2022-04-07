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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var fuselage_1 = require("@rocket.chat/fuselage");
var colors_json_1 = __importDefault(require("@rocket.chat/fuselage-tokens/colors.json"));
var Form = function (_a) {
    var onSubmit = _a.onSubmit, children = _a.children;
    return (jsx_runtime_1.jsx(fuselage_1.Box, __assign({ is: 'form', backgroundColor: colors_json_1.default.white, color: colors_json_1.default.n800, padding: 40, width: 'full', maxWidth: 576, borderRadius: 4, textAlign: 'left', onSubmit: onSubmit }, { children: children }), void 0));
};
exports.default = Form;
//# sourceMappingURL=Form.js.map