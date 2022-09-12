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
var react_i18next_1 = require("react-i18next");
var BackgroundLayer_1 = __importDefault(require("../../common/BackgroundLayer"));
var OnboardingLogo_1 = require("../../common/OnboardingLogo");
var SomethingWentWrongPage = function (_a) {
    var _b = _a.requestId, requestId = _b === void 0 ? undefined : _b;
    var t = react_i18next_1.useTranslation().t;
    return (jsx_runtime_1.jsx(BackgroundLayer_1.default, { children: jsx_runtime_1.jsx(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 624, paddingBlock: 32, paddingInline: 16 }, { children: jsx_runtime_1.jsxs(fuselage_1.Margins, __assign({ blockEnd: 32 }, { children: [jsx_runtime_1.jsx(OnboardingLogo_1.OnboardingLogo, {}, void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontScale: 'hero' }, { children: t('page.somethingWentWrongPage.title') }), void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontScale: 'p1' }, { children: t('page.somethingWentWrongPage.subtitle') }), void 0), requestId && (jsx_runtime_1.jsx(fuselage_1.Box, { children: t('page.somethingWentWrongPage.requestId', { requestId: requestId }) }, void 0))] }), void 0) }), void 0) }, void 0));
};
exports.default = SomethingWentWrongPage;
//# sourceMappingURL=SomethingWentWrongPage.js.map