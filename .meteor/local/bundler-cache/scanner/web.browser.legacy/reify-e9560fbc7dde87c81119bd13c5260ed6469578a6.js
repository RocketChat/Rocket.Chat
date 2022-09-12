"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderLayoutBlock = void 0;
var BlockContext_1 = require("./BlockContext");
var getLayoutBlockRenderer = function (renderers, type) {
    return renderers[type];
};
var renderLayoutBlock = function (renderers) {
    return function (layoutBlock, index) {
        var renderer = getLayoutBlockRenderer(renderers, layoutBlock.type);
        if (!renderer) {
            return null;
        }
        return renderer.call(renderers, layoutBlock, BlockContext_1.BlockContext.BLOCK, index);
    };
};
exports.renderLayoutBlock = renderLayoutBlock;
//# sourceMappingURL=renderLayoutBlock.js.map