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
var react_i18next_1 = require("react-i18next");
var BackgroundLayer_1 = __importDefault(require("../../common/BackgroundLayer"));
var OnboardingLogo_1 = require("../../common/OnboardingLogo");
var OauthAuthorizationPage = function (_a) {
    var clientName = _a.clientName, onClickAuthorizeOAuth = _a.onClickAuthorizeOAuth, error = _a.error;
    var t = react_i18next_1.useTranslation().t;
    var name = clientName || '...loading...';
    return (jsx_runtime_1.jsx(BackgroundLayer_1.default, { children: jsx_runtime_1.jsxs(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 576, paddingBlock: 32, paddingInline: 16 }, { children: [jsx_runtime_1.jsx(OnboardingLogo_1.OnboardingLogo, {}, void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontWeight: 500, width: '100%', mbs: 'x24', mbe: 'x36', fontSize: 'x57', lineHeight: 'x62', fontFamily: 'sans' }, { children: t('page.oauthAuthorizationPage.title') }), void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ width: 'full', backgroundColor: 'white' }, { children: jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontScale: 'p1', p: 'x40', textAlign: 'start', color: colors_json_1.default.n900 }, { children: error.message ? (jsx_runtime_1.jsxs(jsx_runtime_1.Fragment, { children: [jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontScale: 'h1', mbe: 'x18' }, { children: "Error" }), void 0), error.message, jsx_runtime_1.jsx(fuselage_1.Box, __assign({ mbs: 'x24' }, { children: jsx_runtime_1.jsx(fuselage_1.Button, __assign({ onClick: error.onGoBack, primary: true }, { children: t('page.oauthAuthorizationPage.buttons.goBack') }), void 0) }), void 0)] }, void 0)) : (jsx_runtime_1.jsxs(jsx_runtime_1.Fragment, { children: [jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'page.oauthAuthorizationPage.allowLogin', name: name }, { children: ["Do you wish to allow", jsx_runtime_1.jsx("strong", { children: { name: name } }, void 0), "to login with your Rocket.Chat Cloud Account?"] }), void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ mbs: 'x24' }, { children: jsx_runtime_1.jsx(fuselage_1.Button, __assign({ onClick: onClickAuthorizeOAuth, primary: true }, { children: t('page.oauthAuthorizationPage.buttons.authorize') }), void 0) }), void 0)] }, void 0)) }), void 0) }), void 0)] }), void 0) }, void 0));
};
exports.default = OauthAuthorizationPage;
//# sourceMappingURL=OauthAuthorizationPage.js.map