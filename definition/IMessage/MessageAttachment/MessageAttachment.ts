import { MessageAttachmentDefault } from './MessageAttachmentDefault';
import { FileAttachmentProps } from './Files/FileAttachmentProps';
import { MessageQuoteAttachment } from './MessageQuoteAttachment';
import { MessageAttachmentAction } from './MessageAttachmentAction';

export type MessageAttachment = MessageAttachmentAction | MessageAttachmentDefault | FileAttachmentProps | MessageQuoteAttachment;
