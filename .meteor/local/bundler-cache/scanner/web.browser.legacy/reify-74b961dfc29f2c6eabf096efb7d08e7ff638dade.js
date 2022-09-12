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
exports.OnboardingLogoCloud = exports.OnboardingLogo = void 0;
var jsx_runtime_1 = require("react/jsx-runtime");
var fuselage_1 = require("@rocket.chat/fuselage");
var logo_1 = require("@rocket.chat/logo");
var OnboardingLogo = function () { return (jsx_runtime_1.jsx(fuselage_1.Box, __assign({ width: '100%', maxWidth: 224 }, { children: jsx_runtime_1.jsx(logo_1.RocketChatLogo, {}, void 0) }), void 0)); };
exports.OnboardingLogo = OnboardingLogo;
var OnboardingLogoCloud = function () { return (jsx_runtime_1.jsx(fuselage_1.Box, __assign({ width: '100%', maxWidth: 224 }, { children: jsx_runtime_1.jsx(logo_1.TaggedRocketChatLogo, { tagTitle: 'CLOUD' }, void 0) }), void 0)); };
exports.OnboardingLogoCloud = OnboardingLogoCloud;
//# sourceMappingURL=OnboardingLogo.js.map