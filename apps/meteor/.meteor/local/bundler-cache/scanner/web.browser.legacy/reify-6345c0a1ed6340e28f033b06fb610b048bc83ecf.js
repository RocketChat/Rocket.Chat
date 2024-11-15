"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const fuselage_1 = require("@rocket.chat/fuselage");
const Surface_1 = require("./Surface");
const BannerSurface = ({ children }) => ((0, jsx_runtime_1.jsx)(Surface_1.Surface, { type: 'banner', children: (0, jsx_runtime_1.jsx)(fuselage_1.Margins, { block: 8, children: children }) }));
exports.default = BannerSurface;
//# sourceMappingURL=BannerSurface.js.map