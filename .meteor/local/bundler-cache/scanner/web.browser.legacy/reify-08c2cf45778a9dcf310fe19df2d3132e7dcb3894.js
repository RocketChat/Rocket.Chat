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
var react_i18next_1 = require("react-i18next");
var BackgroundLayer_1 = __importDefault(require("../../common/BackgroundLayer"));
var FormPageLayout_1 = __importDefault(require("../../common/FormPageLayout"));
var FormPageLayout_styles_1 = require("../../common/FormPageLayout.styles");
var RegisteredServerForm_1 = __importDefault(require("../../forms/RegisteredServerForm"));
var pageLayoutStyleProps = {
    justifyContent: 'center',
};
var RegisteredServerPage = function (props) { return (jsx_runtime_1.jsx(BackgroundLayer_1.default, { children: jsx_runtime_1.jsx(FormPageLayout_1.default, __assign({ title: jsx_runtime_1.jsx(FormPageLayout_styles_1.Title, { children: jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'page.form.title' }, { children: ["Let's", jsx_runtime_1.jsx(FormPageLayout_styles_1.TitleHighlight, { children: "Launch" }, void 0), "Your Workspace"] }), void 0) }, void 0), styleProps: pageLayoutStyleProps }, { children: jsx_runtime_1.jsx(RegisteredServerForm_1.default, __assign({}, props), void 0) }), void 0) }, void 0)); };
exports.default = RegisteredServerPage;
//# sourceMappingURL=RegisteredServerPage.js.map