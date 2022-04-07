let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},2);var __assign = (this && this.__assign) || function () {
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



var FormSteps = function (_a) {
    var currentStep = _a.currentStep, stepCount = _a.stepCount;
    var t = useTranslation().t;
    return (_jsx(Box, __assign({ mbe: 'x8', fontScale: 'c2', color: 'neutral-600' }, { children: t('component.form.steps', { currentStep: currentStep, stepCount: stepCount }) }), void 0));
};
module.exportDefault(FormSteps);
//# sourceMappingURL=FormSteps.js.map