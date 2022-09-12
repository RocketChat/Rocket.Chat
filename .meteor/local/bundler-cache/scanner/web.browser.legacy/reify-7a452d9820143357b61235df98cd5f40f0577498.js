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
var TooltipWrapper_1 = __importDefault(require("./TooltipWrapper"));
var InformationTooltipTrigger = function (_a) {
    var text = _a.text;
    return (jsx_runtime_1.jsx(TooltipWrapper_1.default, __assign({ text: text }, { children: jsx_runtime_1.jsx(fuselage_1.Icon, { name: 'info' }, void 0) }), void 0));
};
exports.default = InformationTooltipTrigger;
//# sourceMappingURL=InformationTooltipTrigger.js.map