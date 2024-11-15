"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var fuselage_1 = require("@rocket.chat/fuselage");
var layout_1 = require("@rocket.chat/layout");
var react_i18next_1 = require("react-i18next");
var ConfirmationProcessPage = function () {
    var t = (0, react_i18next_1.useTranslation)().t;
    return ((0, jsx_runtime_1.jsxs)(layout_1.HeroLayout, { children: [(0, jsx_runtime_1.jsx)(layout_1.HeroLayoutTitle, { children: t('page.confirmationProcess.title') }), (0, jsx_runtime_1.jsx)(fuselage_1.Throbber, { size: 'x16', inheritColor: true })] }));
};
exports.default = ConfirmationProcessPage;
//# sourceMappingURL=ConfirmationProcessPage.js.map