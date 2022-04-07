"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPreviewBlockWithPreview = exports.isPreviewBlockWithThumb = void 0;
var isPreviewBlockWithThumb = function (previewBlock) { return 'thumb' in previewBlock; };
exports.isPreviewBlockWithThumb = isPreviewBlockWithThumb;
var isPreviewBlockWithPreview = function (previewBlock) {
    return 'externalUrl' in previewBlock || 'oembedUrl' in previewBlock;
};
exports.isPreviewBlockWithPreview = isPreviewBlockWithPreview;
//# sourceMappingURL=PreviewBlock.js.map