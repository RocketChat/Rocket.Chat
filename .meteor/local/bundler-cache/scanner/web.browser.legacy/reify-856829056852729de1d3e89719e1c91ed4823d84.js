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
var react_1 = require("react");
var BackgroundLayer_1 = __importDefault(require("../../common/BackgroundLayer"));
var OnboardingLogo_1 = require("../../common/OnboardingLogo");
var LoaderPage = function (_a) {
    var title = _a.title, subtitles = _a.subtitles, _b = _a.isReady, isReady = _b === void 0 ? false : _b, _c = _a.loadingSeconds, loadingSeconds = _c === void 0 ? 90 : _c;
    var timeFraction = 100 / subtitles.length;
    var _d = react_1.useState(0), percentage = _d[0], setPercentage = _d[1];
    var _e = react_1.useState(0), subtitleIndex = _e[0], setSubtitleIndex = _e[1];
    var progressHandler = function () {
        var interval = (loadingSeconds * 1000) / 100;
        setInterval(function () {
            setPercentage(function (prev) { return (prev === 99 ? 99 : prev + 1); });
        }, interval);
    };
    react_1.useEffect(function () {
        if (isReady)
            setPercentage(100);
        else
            progressHandler();
    }, [isReady]);
    react_1.useEffect(function () {
        // Change subtitle according to percentage
        var index = Math.floor(percentage / timeFraction);
        if (index !== subtitleIndex)
            setSubtitleIndex(index);
    }, [percentage]);
    return (jsx_runtime_1.jsx(BackgroundLayer_1.default, { children: jsx_runtime_1.jsx(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 768, paddingBlock: 32, paddingInline: 16 }, { children: jsx_runtime_1.jsxs(fuselage_1.Margins, __assign({ blockEnd: 32 }, { children: [jsx_runtime_1.jsx(OnboardingLogo_1.OnboardingLogo, {}, void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontScale: 'hero' }, { children: title }), void 0), jsx_runtime_1.jsx(fuselage_1.Box, __assign({ fontScale: 'p1b' }, { children: subtitles[subtitleIndex] }), void 0), jsx_runtime_1.jsx(fuselage_1.ProgressBar, { barColor: '#1D74F5', percentage: percentage }, void 0)] }), void 0) }), void 0) }, void 0));
};
exports.default = LoaderPage;
//# sourceMappingURL=LoaderPage.js.map