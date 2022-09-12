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
var react_i18next_1 = require("react-i18next");
var FormSteps = function (_a) {
    var currentStep = _a.currentStep, stepCount = _a.stepCount;
    var t = react_i18next_1.useTranslation().t;
    return (jsx_runtime_1.jsx(fuselage_1.Box, __assign({ mbe: 'x8', fontScale: 'c2', color: 'neutral-600' }, { children: t('component.form.steps', { currentStep: currentStep, stepCount: stepCount }) }), void 0));
};
exports.default = FormSteps;
//# sourceMappingURL=FormSteps.js.map