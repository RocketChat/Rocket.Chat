"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Surface = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const SurfaceContext_1 = require("../contexts/SurfaceContext");
const Surface = ({ children, type }) => ((0, jsx_runtime_1.jsx)(SurfaceContext_1.SurfaceContext.Provider, { value: type, children: children }));
exports.Surface = Surface;
//# sourceMappingURL=Surface.js.map