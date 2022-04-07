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
var List_styles_1 = require("./List.styles");
var ListItem_1 = __importDefault(require("./ListItem"));
var List = function (_a) {
    var children = _a.children, listStyleType = _a.listStyleType, icon = _a.icon, _b = _a.spacing, spacing = _b === void 0 ? 'x6' : _b, _c = _a.color, color = _c === void 0 ? colors_json_1.default.n900 : _c;
    return (jsx_runtime_1.jsx(List_styles_1.ListComponent, __assign({ icon: icon, listStyleType: listStyleType, color: color }, { children: jsx_runtime_1.jsx(fuselage_1.Margins, __assign({ block: spacing }, { children: children }), void 0) }), void 0));
};
List.Item = ListItem_1.default;
exports.default = List;
//# sourceMappingURL=List.js.map