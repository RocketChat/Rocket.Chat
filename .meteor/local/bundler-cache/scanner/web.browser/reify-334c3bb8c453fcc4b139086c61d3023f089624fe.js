let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Margins;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Margins(v){Margins=v}},1);let useEffect,useState;module.link('react',{useEffect(v){useEffect=v},useState(v){useState=v}},2);let useTranslation,Trans;module.link('react-i18next',{useTranslation(v){useTranslation=v},Trans(v){Trans=v}},3);let ActionLink;module.link('../../common/ActionLink',{default(v){ActionLink=v}},4);let BackgroundLayer;module.link('../../common/BackgroundLayer',{default(v){BackgroundLayer=v}},5);let OnboardingLogo;module.link('../../common/OnboardingLogo',{OnboardingLogo(v){OnboardingLogo=v}},6);var __assign = (this && this.__assign) || function () {
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







var RedirectPage = function (_a) {
    var title = _a.title, countDownSeconds = _a.countDownSeconds, onRedirect = _a.onRedirect;
    var t = useTranslation().t;
    var _b = useState(countDownSeconds), seconds = _b[0], setSeconds = _b[1];
    var countDown = function () {
        setInterval(function () {
            setSeconds(function (prev) { return (prev === 0 ? 0 : prev - 1); });
        }, 1000);
    };
    useEffect(function () {
        countDown();
    }, []);
    useEffect(function () {
        if (seconds === 0)
            onRedirect();
    }, [seconds]);
    return (_jsx(BackgroundLayer, { children: _jsx(Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 768, paddingBlock: 32, paddingInline: 16 }, { children: _jsxs(Margins, __assign({ blockEnd: 32 }, { children: [_jsx(OnboardingLogo, {}, void 0), _jsx(Box, __assign({ fontScale: 'hero' }, { children: title }), void 0), _jsx(Box, __assign({ fontScale: 'p1b' }, { children: t('page.redirect.subtitle', { seconds: seconds }) }), void 0), _jsx(Box, __assign({ fontScale: 'c1' }, { children: _jsxs(Trans, __assign({ i18nKey: 'page.redirect.redirectNotWorking' }, { children: ["Redirect not working?", _jsx(ActionLink, __assign({ onClick: onRedirect }, { children: "Open workspace" }), void 0)] }), void 0) }), void 0)] }), void 0) }), void 0) }, void 0));
};
module.exportDefault(RedirectPage);
//# sourceMappingURL=RedirectPage.js.map