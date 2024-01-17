import type { FileAttachmentProps } from './Files/FileAttachmentProps';
import type { MessageAttachmentAction } from './MessageAttachmentAction';
import type { MessageAttachmentDefault } from './MessageAttachmentDefault';
import type { MessageQuoteAttachment } from './MessageQuoteAttachment';

export type MessageAttachment = MessageAttachmentAction | MessageAttachmentDefault | FileAttachmentProps | MessageQuoteAttachment;
