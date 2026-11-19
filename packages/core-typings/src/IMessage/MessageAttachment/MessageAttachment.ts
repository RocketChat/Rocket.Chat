import type { FileAttachmentProps } from './Files/FileAttachmentProps.js';
import type { RemovedFileAttachmentProps } from './Files/RemovedFileAttachmentProps.js';
import type { FileProp } from './Files/index.js';
import type { MessageAttachmentAction } from './MessageAttachmentAction.js';
import type { MessageAttachmentDefault } from './MessageAttachmentDefault.js';
import type { MessageQuoteAttachment } from './MessageQuoteAttachment.js';

export type MessageAttachment =
	MessageAttachmentAction | MessageAttachmentDefault | FileAttachmentProps | MessageQuoteAttachment | RemovedFileAttachmentProps;

export type FilesAndAttachments = {
	files: FileProp[];
	attachments: MessageAttachment[];
};
