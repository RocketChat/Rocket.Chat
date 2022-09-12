let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Margins,ProgressBar;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Margins(v){Margins=v},ProgressBar(v){ProgressBar=v}},1);let useEffect,useState;module.link('react',{useEffect(v){useEffect=v},useState(v){useState=v}},2);let BackgroundLayer;module.link('../../common/BackgroundLayer',{default(v){BackgroundLayer=v}},3);let OnboardingLogo;module.link('../../common/OnboardingLogo',{OnboardingLogo(v){OnboardingLogo=v}},4);var __assign = (this && this.__assign) || function () {
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





var LoaderPage = function (_a) {
    var title = _a.title, subtitles = _a.subtitles, _b = _a.isReady, isReady = _b === void 0 ? false : _b, _c = _a.loadingSeconds, loadingSeconds = _c === void 0 ? 90 : _c;
    var timeFraction = 100 / subtitles.length;
    var _d = useState(0), percentage = _d[0], setPercentage = _d[1];
    var _e = useState(0), subtitleIndex = _e[0], setSubtitleIndex = _e[1];
    var progressHandler = function () {
        var interval = (loadingSeconds * 1000) / 100;
        setInterval(function () {
            setPercentage(function (prev) { return (prev === 99 ? 99 : prev + 1); });
        }, interval);
    };
    useEffect(function () {
        if (isReady)
            setPercentage(100);
        else
            progressHandler();
    }, [isReady]);
    useEffect(function () {
        // Change subtitle according to percentage
        var index = Math.floor(percentage / timeFraction);
        if (index !== subtitleIndex)
            setSubtitleIndex(index);
    }, [percentage]);
    return (_jsx(BackgroundLayer, { children: _jsx(Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 768, paddingBlock: 32, paddingInline: 16 }, { children: _jsxs(Margins, __assign({ blockEnd: 32 }, { children: [_jsx(OnboardingLogo, {}, void 0), _jsx(Box, __assign({ fontScale: 'hero' }, { children: title }), void 0), _jsx(Box, __assign({ fontScale: 'p1b' }, { children: subtitles[subtitleIndex] }), void 0), _jsx(ProgressBar, { barColor: '#1D74F5', percentage: percentage }, void 0)] }), void 0) }), void 0) }, void 0));
};
module.exportDefault(LoaderPage);
//# sourceMappingURL=LoaderPage.js.map