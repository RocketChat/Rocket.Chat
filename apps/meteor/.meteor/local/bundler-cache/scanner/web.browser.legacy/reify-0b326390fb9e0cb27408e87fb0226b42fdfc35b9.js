"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var layout_1 = require("@rocket.chat/layout");
var InformationPage = function (_a) {
    var title = _a.title, description = _a.description;
    return ((0, jsx_runtime_1.jsxs)(layout_1.HeroLayout, { children: [(0, jsx_runtime_1.jsx)(layout_1.HeroLayoutTitle, { children: title }), description && (0, jsx_runtime_1.jsx)(layout_1.HeroLayoutSubtitle, { children: description })] }));
};
exports.default = InformationPage;
//# sourceMappingURL=InformationPage.js.map