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
var colors_json_1 = __importDefault(require("@rocket.chat/fuselage-tokens/colors.json"));
var react_1 = require("react");
var server_1 = require("react-dom/server");
var BackgroundLayer_styles_1 = require("./BackgroundLayer.styles");
var BackgroundImage_1 = __importDefault(require("./BackgroundLayer/BackgroundImage"));
var DarkModeProvider_1 = require("./DarkModeProvider");
var BackgroundLayer = function (_a) {
    var children = _a.children;
    var darkMode = DarkModeProvider_1.useDarkMode();
    var backgroundColor = darkMode ? colors_json_1.default.n800 : colors_json_1.default.n200;
    var color = darkMode ? colors_json_1.default.white : colors_json_1.default.n800;
    var backgroundImage = react_1.useMemo(function () {
        return encodeURIComponent(server_1.renderToStaticMarkup(jsx_runtime_1.jsx(BackgroundImage_1.default, { backgroundColor: backgroundColor }, void 0)));
    }, [backgroundColor]);
    return (jsx_runtime_1.jsx(BackgroundLayer_styles_1.Wrapper, __assign({ backgroundColor: backgroundColor, color: color, backgroundImage: backgroundImage }, { children: children }), void 0));
};
exports.default = BackgroundLayer;
//# sourceMappingURL=BackgroundLayer.js.map