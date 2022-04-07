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
var FormPageLayout_styles_1 = require("./FormPageLayout.styles");
var OnboardingLogo_1 = require("./OnboardingLogo");
var FormPageLayout = function (_a) {
    var _b, _c;
    var logo = _a.logo, title = _a.title, subtitle = _a.subtitle, description = _a.description, styleProps = _a.styleProps, children = _a.children;
    react_i18next_1.useTranslation();
    return (jsx_runtime_1.jsxs(FormPageLayout_styles_1.Wrapper, { children: [jsx_runtime_1.jsxs(FormPageLayout_styles_1.Aside, __assign({ justifyContent: styleProps === null || styleProps === void 0 ? void 0 : styleProps.justifyContent }, { children: [jsx_runtime_1.jsx(FormPageLayout_styles_1.Logo, { children: logo !== null && logo !== void 0 ? logo : jsx_runtime_1.jsx(OnboardingLogo_1.OnboardingLogo, {}, void 0) }, void 0), jsx_runtime_1.jsx(FormPageLayout_styles_1.Title, { children: title || (jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'page.form.title' }, { children: ["Let's", jsx_runtime_1.jsx(FormPageLayout_styles_1.TitleHighlight, { children: "Launch" }, void 0), "Your Workspace"] }), void 0)) }, void 0), subtitle && (jsx_runtime_1.jsx(FormPageLayout_styles_1.Subtitle, __assign({ fontWeight: (_b = styleProps === null || styleProps === void 0 ? void 0 : styleProps.subTitleProps) === null || _b === void 0 ? void 0 : _b.fontWeight, fontColor: (_c = styleProps === null || styleProps === void 0 ? void 0 : styleProps.subTitleProps) === null || _c === void 0 ? void 0 : _c.color }, { children: subtitle }), void 0)), jsx_runtime_1.jsx(FormPageLayout_styles_1.Description, { children: description }, void 0)] }), void 0), jsx_runtime_1.jsx(FormPageLayout_styles_1.Content, { children: children }, void 0)] }, void 0));
};
exports.default = FormPageLayout;
//# sourceMappingURL=FormPageLayout.js.map