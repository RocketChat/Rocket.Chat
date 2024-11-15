"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var layout_1 = require("@rocket.chat/layout");
var react_i18next_1 = require("react-i18next");
var EmailConfirmedPage = function () {
    var t = (0, react_i18next_1.useTranslation)().t;
    return ((0, jsx_runtime_1.jsxs)(layout_1.HeroLayout, { children: [(0, jsx_runtime_1.jsx)(layout_1.HeroLayoutTitle, { children: t('page.emailConfirmed.title') }), (0, jsx_runtime_1.jsx)(layout_1.HeroLayoutSubtitle, { children: t('page.emailConfirmed.subtitle') })] }));
};
exports.default = EmailConfirmedPage;
//# sourceMappingURL=EmailConfirmedPage.js.map