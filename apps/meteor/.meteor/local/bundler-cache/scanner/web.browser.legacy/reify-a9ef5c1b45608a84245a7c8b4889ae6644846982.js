"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSurfaceRenderer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const createSurfaceRenderer = (
// eslint-disable-next-line @typescript-eslint/naming-convention
SurfaceComponent, surfaceRenderer) => function Surface(blocks, conditions = {}) {
    return ((0, jsx_runtime_1.jsx)(SurfaceComponent, { children: surfaceRenderer.render(blocks, Object.assign({ engine: 'rocket.chat' }, conditions)) }));
};
exports.createSurfaceRenderer = createSurfaceRenderer;
//# sourceMappingURL=createSurfaceRenderer.js.map