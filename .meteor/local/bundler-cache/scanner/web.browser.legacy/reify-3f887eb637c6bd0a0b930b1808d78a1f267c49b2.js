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
var react_i18next_1 = require("react-i18next");
var BackgroundLayer_1 = __importDefault(require("../../common/BackgroundLayer"));
var FormPageLayout_1 = __importDefault(require("../../common/FormPageLayout"));
var CreateCloudWorkspaceForm_1 = __importDefault(require("../../forms/CreateCloudWorkspaceForm"));
var Description_1 = __importDefault(require("./Description"));
var TitleCreateCloudPage_1 = __importDefault(require("./TitleCreateCloudPage"));
var CreateCloudWorkspacePage = function (props) {
    var t = react_i18next_1.useTranslation().t;
    return (jsx_runtime_1.jsx(BackgroundLayer_1.default, { children: jsx_runtime_1.jsxs(FormPageLayout_1.default, __assign({ title: jsx_runtime_1.jsx(TitleCreateCloudPage_1.default, {}, void 0), description: jsx_runtime_1.jsx(Description_1.default, {}, void 0), subtitle: t('page.createCloudWorkspace.tryGold') }, { children: [jsx_runtime_1.jsx(CreateCloudWorkspaceForm_1.default, __assign({}, props), void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ mbs: 'x28', display: 'inline', textAlign: 'center' }, { children: jsx_runtime_1.jsxs(react_i18next_1.Trans, __assign({ i18nKey: 'page.alreadyHaveAccount' }, { children: ["Already have an account?", jsx_runtime_1.jsx(fuselage_1.Box, __assign({ is: 'a', color: 'primary-400', textDecorationLine: 'none', href: 'https://cloud.rocket.chat/login', target: '_blank', rel: 'noopener noreferrer' }, { children: "Manage your workspaces." }), void 0)] }), void 0) }), void 0)] }), void 0) }, void 0));
};
exports.default = CreateCloudWorkspacePage;
//# sourceMappingURL=CreateCloudWorkspacePage.js.map