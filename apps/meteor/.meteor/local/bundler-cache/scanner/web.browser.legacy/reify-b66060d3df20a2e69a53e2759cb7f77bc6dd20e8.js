"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSurfaceRenderer = void 0;
var createSurfaceRenderer = function () {
    return function (surfaceRenderer, conditions) {
        return function (blocks) {
            return surfaceRenderer.render(blocks, conditions);
        };
    };
};
exports.createSurfaceRenderer = createSurfaceRenderer;
//# sourceMappingURL=createSurfaceRenderer.js.map