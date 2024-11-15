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
var jsx_runtime_1 = require("react/jsx-runtime");
var fuselage_1 = require("@rocket.chat/fuselage");
var layout_1 = require("@rocket.chat/layout");
var react_1 = require("react");
var react_i18next_1 = require("react-i18next");
var RedirectPage = function (_a) {
    var title = _a.title, countDownSeconds = _a.countDownSeconds, onRedirect = _a.onRedirect;
    var t = (0, react_i18next_1.useTranslation)().t;
    var _b = (0, react_1.useState)(countDownSeconds), seconds = _b[0], setSeconds = _b[1];
    (0, react_1.useEffect)(function () {
        if (seconds === 0)
            return;
        var timer = setInterval(function () {
            setSeconds(function (prev) { return Math.max(0, prev - 1); });
        }, 1000);
        return function () {
            clearInterval(timer);
        };
    }, []);
    (0, react_1.useEffect)(function () {
        if (seconds === 0)
            onRedirect();
    }, [seconds]);
    return ((0, jsx_runtime_1.jsx)(layout_1.BackgroundLayer, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 768, paddingBlock: 32, paddingInline: 16 }, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.Margins, __assign({ blockEnd: 32 }, { children: [(0, jsx_runtime_1.jsx)(layout_1.LayoutLogo.LayoutLogo, {}), (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ fontScale: 'hero' }, { children: title })), (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ fontScale: 'p1b' }, { children: t('page.redirect.subtitle', { seconds: seconds }) })), (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ fontScale: 'c1' }, { children: (0, jsx_runtime_1.jsxs)(react_i18next_1.Trans, __assign({ i18nKey: 'page.redirect.redirectNotWorking' }, { children: ["Redirect not working?", (0, jsx_runtime_1.jsx)(layout_1.ActionLink, __assign({ onClick: onRedirect }, { children: "Open workspace" }))] })) }))] })) })) }));
};
exports.default = RedirectPage;
//# sourceMappingURL=RedirectPage.js.map