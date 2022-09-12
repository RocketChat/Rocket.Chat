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
var TitleCreateCloudPage = function () { return (jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'page.createCloudWorkspace.title' }, { children: ["Launch new workspace and", jsx_runtime_1.jsx(FormPageLayout_styles_1.TitleHighlight, { children: "30-day trial" }, void 0)] }), void 0)); };
exports.default = TitleCreateCloudPage;
//# sourceMappingURL=TitleCreateCloudPage.js.map