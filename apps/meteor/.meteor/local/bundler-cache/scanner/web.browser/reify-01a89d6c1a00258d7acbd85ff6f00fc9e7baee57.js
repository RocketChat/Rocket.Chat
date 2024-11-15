let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},2);


const Item = ({ block: element, surfaceRenderer: parser, index, }) => {
    const renderedElement = parser.renderContextBlockElement(element, index);
    if (!renderedElement) {
        return null;
    }
    switch (element.type) {
        case UiKit.TextObjectType.PLAIN_TEXT:
        case UiKit.TextObjectType.MARKDOWN:
            return (_jsx(Box, { is: 'span', fontScale: 'c1', color: 'hint', margin: 4, children: renderedElement }));
        default:
            return renderedElement;
    }
};
module.exportDefault(Item);
//# sourceMappingURL=ContextBlock.Item.js.map