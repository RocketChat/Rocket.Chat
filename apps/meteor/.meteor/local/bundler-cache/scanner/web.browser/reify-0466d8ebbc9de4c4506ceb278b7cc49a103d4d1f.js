let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},2);


const Action = ({ element, parser, index, }) => {
    const renderedElement = parser.renderActionsBlockElement(element, index);
    if (!renderedElement) {
        return null;
    }
    return (_jsx(Box, { display: 'flex', margin: 4, flexGrow: element.type !== UiKit.BlockElementType.BUTTON ? 1 : undefined, flexBasis: element.type !== UiKit.BlockElementType.BUTTON ? '45%' : undefined, children: renderedElement }));
};
module.exportDefault(Action);
//# sourceMappingURL=ActionsBlock.Action.js.map