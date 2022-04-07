let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},0);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},1);let React;module.link('react',{default(v){React=v}},2);


var Item = function (_a) {
    var element = _a.block, parser = _a.surfaceRenderer, index = _a.index;
    var renderedElement = parser.renderContextBlockElement(element, index);
    if (!renderedElement) {
        return null;
    }
    switch (element.type) {
        case UiKit.TextObjectType.PLAIN_TEXT:
        case UiKit.TextObjectType.MARKDOWN:
            return (React.createElement(Box, { is: 'span', fontScale: 'c1', color: 'info', margin: 4 }, renderedElement));
        default:
            return renderedElement;
    }
};
module.exportDefault(Item);
//# sourceMappingURL=ContextBlock.Item.js.map