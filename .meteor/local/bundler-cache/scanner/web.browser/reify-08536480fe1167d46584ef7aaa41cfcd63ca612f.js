module.export({renderLayoutBlock:()=>renderLayoutBlock});let BlockContext;module.link('./BlockContext',{BlockContext(v){BlockContext=v}},0);
var getLayoutBlockRenderer = function (renderers, type) {
    return renderers[type];
};
var renderLayoutBlock = function (renderers) {
    return function (layoutBlock, index) {
        var renderer = getLayoutBlockRenderer(renderers, layoutBlock.type);
        if (!renderer) {
            return null;
        }
        return renderer.call(renderers, layoutBlock, BlockContext.BLOCK, index);
    };
};
//# sourceMappingURL=renderLayoutBlock.js.map