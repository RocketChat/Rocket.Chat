let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},0);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},1);let React;module.link('react',{default(v){React=v}},2);


var Action = function (_a) {
    var element = _a.element, parser = _a.parser, index = _a.index;
    var renderedElement = parser.renderActionsBlockElement(element, index);
    if (!renderedElement) {
        return null;
    }
    return (React.createElement(Box, { display: 'flex', margin: 4, flexGrow: element.type !== UiKit.BlockElementType.BUTTON ? 1 : undefined, flexBasis: element.type !== UiKit.BlockElementType.BUTTON ? '45%' : undefined }, renderedElement));
};
module.exportDefault(Action);
//# sourceMappingURL=ActionsBlock.Action.js.map