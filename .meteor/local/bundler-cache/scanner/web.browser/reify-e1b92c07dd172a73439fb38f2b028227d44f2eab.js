module.export({createSurfaceRenderer:()=>createSurfaceRenderer});var createSurfaceRenderer = function () {
    return function (surfaceRenderer, conditions) {
        return function (blocks) {
            return surfaceRenderer.render(blocks, conditions);
        };
    };
};
//# sourceMappingURL=createSurfaceRenderer.js.map