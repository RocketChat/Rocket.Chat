let MessageGenericPreview,MessageGenericPreviewContent,MessageGenericPreviewDescription,MessageGenericPreviewImage,MessageGenericPreviewTitle,MessageGenericPreviewFooter,MessageGenericPreviewThumb,Box;module.link('@rocket.chat/fuselage',{MessageGenericPreview(v){MessageGenericPreview=v},MessageGenericPreviewContent(v){MessageGenericPreviewContent=v},MessageGenericPreviewDescription(v){MessageGenericPreviewDescription=v},MessageGenericPreviewImage(v){MessageGenericPreviewImage=v},MessageGenericPreviewTitle(v){MessageGenericPreviewTitle=v},MessageGenericPreviewFooter(v){MessageGenericPreviewFooter=v},MessageGenericPreviewThumb(v){MessageGenericPreviewThumb=v},Box(v){Box=v}},0);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},1);let isPreviewBlockWithThumb,isPreviewBlockWithPreview;module.link('@rocket.chat/ui-kit',{isPreviewBlockWithThumb(v){isPreviewBlockWithThumb=v},isPreviewBlockWithPreview(v){isPreviewBlockWithPreview=v}},2);let React,memo;module.link('react',{default(v){React=v},memo(v){memo=v}},3);let ContextBlock;module.link('./ContextBlock',{default(v){ContextBlock=v}},4);




var PreviewBlock = function (_a) {
    var _b;
    var block = _a.block, surfaceRenderer = _a.surfaceRenderer;
    return (React.createElement(Box, null,
        React.createElement(MessageGenericPreview, null,
            isPreviewBlockWithPreview(block) && ((_b = block.preview) === null || _b === void 0 ? void 0 : _b.dimensions) && (React.createElement(MessageGenericPreviewImage, { width: block.preview.dimensions.width, height: block.preview.dimensions.height, url: block.preview.url })),
            React.createElement(MessageGenericPreviewContent, { thumb: isPreviewBlockWithThumb(block) ? (React.createElement(MessageGenericPreviewThumb, null,
                    React.createElement(MessageGenericPreviewImage, { height: 192, width: 368, url: block.thumb.url }))) : undefined },
                Array.isArray(block.title) ? (React.createElement(MessageGenericPreviewTitle, { externalUrl: isPreviewBlockWithPreview(block) ? block.externalUrl : undefined }, block.title.map(function (title) {
                    return surfaceRenderer.renderTextObject(title, 0, UiKit.BlockContext.NONE);
                }))) : null,
                Array.isArray(block.description) ? (React.createElement(MessageGenericPreviewDescription, { clamp: true }, block.description.map(function (description) {
                    return surfaceRenderer.renderTextObject(description, 0, UiKit.BlockContext.NONE);
                }))) : null,
                block.footer && (React.createElement(MessageGenericPreviewFooter, null,
                    React.createElement(ContextBlock, { block: block.footer, surfaceRenderer: surfaceRenderer, context: UiKit.BlockContext.BLOCK, index: 0 })))))));
};
module.exportDefault(memo(PreviewBlock));
//# sourceMappingURL=PreviewBlock.js.map