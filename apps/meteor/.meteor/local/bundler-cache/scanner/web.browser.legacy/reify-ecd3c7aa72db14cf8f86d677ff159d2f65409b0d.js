"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFileAttachment = void 0;
const isFileAttachment = (attachment) => 'type' in attachment && attachment.type === 'file';
exports.isFileAttachment = isFileAttachment;
//# sourceMappingURL=FileAttachmentProps.js.map