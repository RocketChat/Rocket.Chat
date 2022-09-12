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
var react_i18next_1 = require("react-i18next");
var FormPageLayout_styles_1 = require("../../common/FormPageLayout.styles");
var TitleCreateFirstMemberPage = function () { return (jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'page.createFirstMember.title' }, { children: ["Create first", jsx_runtime_1.jsx(FormPageLayout_styles_1.TitleHighlight, { children: "workspace member" }, void 0)] }), void 0)); };
exports.default = TitleCreateFirstMemberPage;
//# sourceMappingURL=TitleCreateFirstMemberPage.js.map