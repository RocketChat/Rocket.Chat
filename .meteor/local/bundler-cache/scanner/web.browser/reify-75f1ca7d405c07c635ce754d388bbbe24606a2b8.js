module.export({fromTextObjectToString:()=>fromTextObjectToString});let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},0);let renderToStaticMarkup;module.link('react-dom/server',{renderToStaticMarkup(v){renderToStaticMarkup=v}},1);

var fromTextObjectToString = function (surfaceRenderer, textObject, index) {
    var element = surfaceRenderer.renderTextObject(textObject, index, UiKit.BlockContext.NONE);
    if (!element) {
        return undefined;
    }
    return renderToStaticMarkup(element);
};
//# sourceMappingURL=fromTextObjectToString.js.map