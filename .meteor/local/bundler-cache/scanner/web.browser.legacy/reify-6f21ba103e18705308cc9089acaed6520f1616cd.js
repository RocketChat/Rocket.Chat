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
var jsx_runtime_1 = require("react/jsx-runtime");
var colors_json_1 = __importDefault(require("@rocket.chat/fuselage-tokens/colors.json"));
var RocketChatLogo_1 = __importDefault(require("../RocketChatLogo"));
var TaggedRocketChatLogo_styles_1 = require("./TaggedRocketChatLogo.styles");
var TaggedRocketChatLogo = function (_a) {
    var tagTitle = _a.tagTitle, _b = _a.tagBackground, tagBackground = _b === void 0 ? colors_json_1.default.d400 : _b, _c = _a.color, color = _c === void 0 ? colors_json_1.default.white : _c, props = __rest(_a, ["tagTitle", "tagBackground", "color"]);
    return (jsx_runtime_1.jsxs(TaggedRocketChatLogo_styles_1.LogoContainer, __assign({}, props, { children: [jsx_runtime_1.jsx(RocketChatLogo_1.default, {}, void 0), tagTitle && (jsx_runtime_1.jsx(TaggedRocketChatLogo_styles_1.LogoTag, __assign({ backgroundColor: tagBackground, color: color }, { children: tagTitle }), void 0))] }), void 0));
};
exports.default = TaggedRocketChatLogo;
//# sourceMappingURL=TaggedRocketChatLogo.js.map