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
var layout_1 = require("@rocket.chat/layout");
var react_i18next_1 = require("react-i18next");
var FormPageLayout_1 = __importDefault(require("../../common/FormPageLayout"));
var RequestTrialForm_1 = __importDefault(require("../../forms/RequestTrialForm"));
var Description_1 = __importDefault(require("./Description"));
var RequestTrialPage = function (props) {
    var t = (0, react_i18next_1.useTranslation)().t;
    return ((0, jsx_runtime_1.jsx)(layout_1.BackgroundLayer, { children: (0, jsx_runtime_1.jsx)(FormPageLayout_1.default, __assign({ description: (0, jsx_runtime_1.jsx)(Description_1.default, {}), title: (0, jsx_runtime_1.jsxs)(react_i18next_1.Trans, __assign({ i18nKey: 'page.requestTrial.title' }, { children: ["Request a", (0, jsx_runtime_1.jsx)(layout_1.FormPageLayout.TitleHighlight, { children: "30-day Trial" })] })), subtitle: t('page.requestTrial.subtitle') }, { children: (0, jsx_runtime_1.jsx)(RequestTrialForm_1.default, __assign({}, props)) })) }));
};
exports.default = RequestTrialPage;
//# sourceMappingURL=RequestTrialPage.js.map