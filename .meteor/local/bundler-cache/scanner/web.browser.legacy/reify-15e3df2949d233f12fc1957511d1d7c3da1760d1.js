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
var react_1 = require("react");
var react_i18next_1 = require("react-i18next");
var ActionLink_1 = __importDefault(require("../../common/ActionLink"));
var BackgroundLayer_1 = __importDefault(require("../../common/BackgroundLayer"));
var OnboardingLogo_1 = require("../../common/OnboardingLogo");
var RedirectPage = function (_a) {
    var title = _a.title, countDownSeconds = _a.countDownSeconds, onRedirect = _a.onRedirect;
    var t = react_i18next_1.useTranslation().t;
    var _b = react_1.useState(countDownSeconds), seconds = _b[0], setSeconds = _b[1];
    var countDown = function () {
        setInterval(function () {
            setSeconds(function (prev) { return (prev === 0 ? 0 : prev - 1); });
        }, 1000);
    };
    react_1.useEffect(function () {
        countDown();
    }, []);
    react_1.useEffect(function () {
        if (seconds === 0)
            onRedirect();
    }, [seconds]);
    return (jsx_runtime_1.jsx(BackgroundLayer_1.default, { children: jsx_runtime_1.jsx(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 768, paddingBlock: 32, paddingInline: 16 }, { children: jsx_runtime_1.jsxs(fuselage_1.Margins, __assign({ blockEnd: 32 }, { children: [jsx_runtime_1.jsx(OnboardingLogo_1.OnboardingLogo, {}, void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontScale: 'hero' }, { children: title }), void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontScale: 'p1b' }, { children: t('page.redirect.subtitle', { seconds: seconds }) }), void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontScale: 'c1' }, { children: jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'page.redirect.redirectNotWorking' }, { children: ["Redirect not working?", jsx_runtime_1.jsx(ActionLink_1.default, __assign({ onClick: onRedirect }, { children: "Open workspace" }), void 0)] }), void 0) }), void 0)] }), void 0) }), void 0) }, void 0));
};
exports.default = RedirectPage;
//# sourceMappingURL=RedirectPage.js.map