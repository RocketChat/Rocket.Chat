let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Margins;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Margins(v){Margins=v}},1);let BackgroundLayer,LayoutLogo;module.link('@rocket.chat/layout',{BackgroundLayer(v){BackgroundLayer=v},LayoutLogo(v){LayoutLogo=v}},2);let useTranslation;module.link('react-i18next',{useTranslation(v){useTranslation=v}},3);var __assign = (this && this.__assign) || function () {
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




var ResetPasswordConfirmationPage = function () {
    var t = useTranslation().t;
    return (_jsx(BackgroundLayer, { children: _jsx(Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 576, paddingBlock: 32, paddingInline: 16 }, { children: _jsxs(Margins, __assign({ blockEnd: 32 }, { children: [_jsx(LayoutLogo.LayoutLogo, {}), _jsx(Box, __assign({ fontScale: 'hero' }, { children: t('page.resetPasswordPage.emailSent.title') })), _jsx(Box, __assign({ fontScale: 'p1' }, { children: t('page.resetPasswordPage.emailSent.subtitle') }))] })) })) }));
};
module.exportDefault(ResetPasswordConfirmationPage);
//# sourceMappingURL=ResetPasswordConfirmationPage.js.map