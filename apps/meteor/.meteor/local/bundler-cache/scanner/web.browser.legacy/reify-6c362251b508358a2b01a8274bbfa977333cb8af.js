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
var layout_1 = require("@rocket.chat/layout");
var react_1 = require("react");
var LoaderPage = function (_a) {
    var title = _a.title, subtitles = _a.subtitles, _b = _a.isReady, isReady = _b === void 0 ? false : _b, _c = _a.loadingSeconds, loadingSeconds = _c === void 0 ? 90 : _c;
    var timeFraction = 100 / subtitles.length;
    var _d = (0, react_1.useState)(function () { return (isReady ? 100 : 0); }), percentage = _d[0], setPercentage = _d[1];
    (0, react_1.useEffect)(function () {
        if (isReady) {
            setPercentage(100);
            return;
        }
        var interval = (loadingSeconds * 1000) / 100;
        var timer = setInterval(function () {
            setPercentage(function (prev) { return (prev === 99 ? 99 : prev + 1); });
        }, interval);
        return function () {
            clearInterval(timer);
        };
    }, [isReady]);
    var subtitleIndex = Math.floor(percentage / timeFraction);
    return ((0, jsx_runtime_1.jsx)(layout_1.BackgroundLayer, { children: (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 768, paddingBlock: 32, paddingInline: 16 }, { children: (0, jsx_runtime_1.jsxs)(fuselage_1.Margins, __assign({ blockEnd: 32 }, { children: [(0, jsx_runtime_1.jsx)(layout_1.LayoutLogo.LayoutLogo, {}), (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ fontScale: 'hero' }, { children: title })), (0, jsx_runtime_1.jsx)(fuselage_1.Box, __assign({ fontScale: 'p1b' }, { children: subtitles[subtitleIndex] })), (0, jsx_runtime_1.jsx)(fuselage_1.ProgressBar, { percentage: percentage })] })) })) }));
};
exports.default = LoaderPage;
//# sourceMappingURL=LoaderPage.js.map