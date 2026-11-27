import type { FileProp } from './Files';
import type { FileAttachmentProps } from './Files/FileAttachmentProps';
import type { RemovedFileAttachmentProps } from './Files/RemovedFileAttachmentProps';
import type { MessageAttachmentAction } from './MessageAttachmentAction';
import type { MessageAttachmentDefault } from './MessageAttachmentDefault';
import type { MessageQuoteAttachment } from './MessageQuoteAttachment';

export type MessageAttachment =
	| MessageAttachmentAction
	| MessageAttachmentDefault
	| FileAttachmentProps
	| MessageQuoteAttachment
	| RemovedFileAttachmentProps;

export type FilesAndAttachments = {
	files: FileProp[];
	attachments: MessageAttachment[];
};
