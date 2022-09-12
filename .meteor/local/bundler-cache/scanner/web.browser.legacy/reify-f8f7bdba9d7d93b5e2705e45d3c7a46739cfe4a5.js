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
var RequestTrialForm_1 = __importDefault(require("../../forms/RequestTrialForm"));
var Description_1 = __importDefault(require("./Description"));
var RequestTrialPage = function (props) {
    var t = react_i18next_1.useTranslation().t;
    return (jsx_runtime_1.jsx(BackgroundLayer_1.default, { children: jsx_runtime_1.jsx(FormPageLayout_1.default, __assign({ description: jsx_runtime_1.jsx(Description_1.default, {}, void 0), title: jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'page.requestTrial.title' }, { children: ["Request a ", jsx_runtime_1.jsx(FormPageLayout_styles_1.TitleHighlight, { children: "30-day Trial" }, void 0)] }), void 0), subtitle: t('page.requestTrial.subtitle') }, { children: jsx_runtime_1.jsx(RequestTrialForm_1.default, __assign({}, props), void 0) }), void 0) }, void 0));
};
exports.default = RequestTrialPage;
//# sourceMappingURL=RequestTrialPage.js.map