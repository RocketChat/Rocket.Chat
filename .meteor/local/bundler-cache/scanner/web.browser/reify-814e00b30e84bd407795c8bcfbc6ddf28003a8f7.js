let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Margins;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Margins(v){Margins=v}},1);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},2);let BackgroundLayer;module.link('../../common/BackgroundLayer',{default(v){BackgroundLayer=v}},3);let OnboardingLogo;module.link('../../common/OnboardingLogo',{OnboardingLogo(v){OnboardingLogo=v}},4);var __assign = (this && this.__assign) || function () {
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





var SomethingWentWrongPage = function (_a) {
    var _b = _a.requestId, requestId = _b === void 0 ? undefined : _b;
    var t = useTranslation().t;
    return (_jsx(BackgroundLayer, { children: _jsx(Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 624, paddingBlock: 32, paddingInline: 16 }, { children: _jsxs(Margins, __assign({ blockEnd: 32 }, { children: [_jsx(OnboardingLogo, {}, void 0), _jsx(Box, __assign({ fontScale: 'hero' }, { children: t('page.somethingWentWrongPage.title') }), void 0), _jsx(Box, __assign({ fontScale: 'p1' }, { children: t('page.somethingWentWrongPage.subtitle') }), void 0), requestId && (_jsx(Box, { children: t('page.somethingWentWrongPage.requestId', { requestId: requestId }) }, void 0))] }), void 0) }), void 0) }, void 0));
};
module.exportDefault(SomethingWentWrongPage);
//# sourceMappingURL=SomethingWentWrongPage.js.map