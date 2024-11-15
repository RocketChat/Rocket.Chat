let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},1);let Element;module.link('./ImageElement.styles',{Element(v){Element=v}},2);


const ImageElement = ({ block, context, }) => {
    const size = (context === UiKit.BlockContext.SECTION && 88) ||
        (context === UiKit.BlockContext.CONTEXT && 20) ||
        undefined;
    if (!size) {
        return null;
    }
    return _jsx(Element, { imageUrl: block.imageUrl, size: size });
};
module.exportDefault(ImageElement);
//# sourceMappingURL=ImageElement.js.map