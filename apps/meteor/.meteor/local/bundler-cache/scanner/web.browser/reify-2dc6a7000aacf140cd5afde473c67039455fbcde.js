"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isQuoteAttachment = void 0;
const isQuoteAttachment = (attachment) => 'message_link' in attachment && attachment.message_link !== undefined;
exports.isQuoteAttachment = isQuoteAttachment;
//# sourceMappingURL=MessageQuoteAttachment.js.map