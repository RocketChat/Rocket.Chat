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
var layout_1 = require("@rocket.chat/layout");
var react_i18next_1 = require("react-i18next");
var OauthAuthorizationPage = function (_a) {
    var clientName = _a.clientName, onClickAuthorizeOAuth = _a.onClickAuthorizeOAuth, error = _a.error;
    var t = (0, react_i18next_1.useTranslation)().t;
    return ((0, jsx_runtime_1.jsxs)(layout_1.VerticalWizardLayout, { children: [(0, jsx_runtime_1.jsx)(layout_1.VerticalWizardLayoutTitle, { children: t('page.oauthAuthorizationPage.title') }), (0, jsx_runtime_1.jsx)(layout_1.VerticalWizardLayoutForm, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ fontScale: 'p1', p: 40, textAlign: 'start', color: colors_json_1.default.n900 }, { children: !clientName || error.message ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ fontScale: 'h1', mbe: 18 }, { children: "Error" })), error.message, (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ mbs: 24 }, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ onClick: error.onGoBack, primary: true }, { children: t('page.oauthAuthorizationPage.buttons.goBack') })) }))] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(react_i18next_1.Trans, __assign({ i18nKey: 'page.oauthAuthorizationPage.allowLogin', name: clientName }, { children: ["Do you wish to allow", (0, jsx_runtime_1.jsx)("strong", { children: { clientName: clientName } }), "to login with your Rocket.Chat Cloud Account?"] })), (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ mbs: 24 }, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Button, __assign({ onClick: onClickAuthorizeOAuth, primary: true }, { children: t('page.oauthAuthorizationPage.buttons.authorize') })) }))] })) })) })] }));
};
exports.default = OauthAuthorizationPage;
//# sourceMappingURL=OauthAuthorizationPage.js.map