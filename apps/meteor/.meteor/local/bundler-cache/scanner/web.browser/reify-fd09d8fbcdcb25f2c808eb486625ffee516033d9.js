"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTranslatedMessageAttachment = exports.isTranslatedAttachment = void 0;
const isTranslatedAttachment = (attachment) => 'translations' in attachment;
exports.isTranslatedAttachment = isTranslatedAttachment;
const isTranslatedMessageAttachment = (attachments) => attachments?.some(exports.isTranslatedAttachment);
exports.isTranslatedMessageAttachment = isTranslatedMessageAttachment;
//# sourceMappingURL=TranslatedMessageAttachment.js.map