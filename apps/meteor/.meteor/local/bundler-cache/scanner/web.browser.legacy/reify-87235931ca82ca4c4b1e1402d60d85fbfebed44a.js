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
var FormPageLayout_1 = __importDefault(require("../../common/FormPageLayout"));
var CreateFirstMemberForm_1 = __importDefault(require("../../forms/CreateFirstMemberForm"));
var TitleCreateFirstMemberPage_1 = __importDefault(require("./TitleCreateFirstMemberPage"));
var CreateFirstMemberPage = function (props) {
    var pageLayoutStyleProps = {
        justifyContent: 'center',
    };
    return ((0, jsx_runtime_1.jsx)(layout_1.BackgroundLayer, { children: (0, jsx_runtime_1.jsx)(FormPageLayout_1.default, __assign({ title: (0, jsx_runtime_1.jsx)(TitleCreateFirstMemberPage_1.default, {}), styleProps: pageLayoutStyleProps }, { children: (0, jsx_runtime_1.jsx)(CreateFirstMemberForm_1.default, __assign({}, props)) })) }));
};
exports.default = CreateFirstMemberPage;
//# sourceMappingURL=CreateFirstMemberPage.js.map