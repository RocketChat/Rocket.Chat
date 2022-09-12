"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mono = exports.sans = void 0;
var typography_json_1 = __importDefault(require("@rocket.chat/fuselage-tokens/dist/typography.json"));
var getTokenFontFamily = function (name) {
    return typography_json_1.default.fontFamilies[name]
        .map(function (fontFace) { return (fontFace.includes(' ') ? "'" + fontFace + "'" : fontFace); })
        .join(', ');
};
exports.sans = getTokenFontFamily('sans');
exports.mono = getTokenFontFamily('mono');
//# sourceMappingURL=tokenFontFamilies.js.map