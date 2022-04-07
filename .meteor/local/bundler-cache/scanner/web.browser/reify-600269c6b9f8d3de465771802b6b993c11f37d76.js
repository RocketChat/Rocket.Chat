module.export({renderBlockElement:()=>renderBlockElement});var getBlockElementRenderer = function (renderers, type) {
    var renderer = renderers[type];
    if (renderer) {
        return renderer;
    }
    switch (type) {
        case 'datepicker':
            return renderers.datePicker;
        case 'static_select':
            return renderers.staticSelect;
        case 'multi_static_select':
            return renderers.multiStaticSelect;
        case 'plain_text_input':
            return renderers.plainInput;
        case 'linear_scale':
            return renderers.linearScale;
    }
};
var renderBlockElement = function (renderers, context) {
    return function (blockElement, index) {
        var renderer = getBlockElementRenderer(renderers, blockElement.type);
        if (!renderer) {
            return null;
        }
        return renderer.call(renderers, blockElement, context, index);
    };
};
//# sourceMappingURL=renderBlockElement.js.map