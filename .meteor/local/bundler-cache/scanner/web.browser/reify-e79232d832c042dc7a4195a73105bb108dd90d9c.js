module.export({isPreviewBlockWithThumb:()=>isPreviewBlockWithThumb,isPreviewBlockWithPreview:()=>isPreviewBlockWithPreview});var isPreviewBlockWithThumb = function (previewBlock) { return 'thumb' in previewBlock; };
var isPreviewBlockWithPreview = function (previewBlock) {
    return 'externalUrl' in previewBlock || 'oembedUrl' in previewBlock;
};
//# sourceMappingURL=PreviewBlock.js.map