import type { MessageAttachmentDefault } from './MessageAttachmentDefault';
import type { FileAttachmentProps } from './Files/FileAttachmentProps';
import type { MessageQuoteAttachment } from './MessageQuoteAttachment';
import type { MessageAttachmentAction } from './MessageAttachmentAction';
import type { FileProp } from './Files';

export type MessageAttachment = MessageAttachmentAction | MessageAttachmentDefault | FileAttachmentProps | MessageQuoteAttachment;

export type FilesAndAttachments = {
	files: FileProp[];
	attachments: MessageAttachment[];
};
