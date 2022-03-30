import type { MessageAttachmentDefault } from './MessageAttachmentDefault';
import type { FileAttachmentProps } from './Files/FileAttachmentProps';
import type { MessageQuoteAttachment } from './MessageQuoteAttachment';
import type { MessageAttachmentAction } from './MessageAttachmentAction';

export type MessageAttachment = MessageAttachmentAction | MessageAttachmentDefault | FileAttachmentProps | MessageQuoteAttachment;
