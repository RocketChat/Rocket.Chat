"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOEmbedUrlWithMetadata = exports.isOEmbedUrlContentResult = void 0;
const isOEmbedUrlContentResult = (value) => 'attachments' in value;
exports.isOEmbedUrlContentResult = isOEmbedUrlContentResult;
const isOEmbedUrlWithMetadata = (value) => 'meta' in value;
exports.isOEmbedUrlWithMetadata = isOEmbedUrlWithMetadata;
//# sourceMappingURL=IOembed.js.map