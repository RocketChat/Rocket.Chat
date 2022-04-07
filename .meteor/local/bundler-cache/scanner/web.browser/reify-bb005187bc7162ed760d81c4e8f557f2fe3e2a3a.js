let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},0);let React;module.link('react',{default(v){React=v}},1);let Element;module.link('./ImageElement.styles',{Element(v){Element=v}},2);


var ImageElement = function (_a) {
    var block = _a.block, context = _a.context;
    var size = (context === UiKit.BlockContext.SECTION && 88) ||
        (context === UiKit.BlockContext.CONTEXT && 20) ||
        undefined;
    if (!size) {
        return null;
    }
    return React.createElement(Element, { imageUrl: block.imageUrl, size: size });
};
module.exportDefault(ImageElement);
//# sourceMappingURL=ImageElement.js.map