import * as z from 'zod';

import { FileAttachmentPropsSchema, FilePropSchema } from './Files';
import { MessageAttachmentActionSchema } from './MessageAttachmentAction';
import { MessageAttachmentDefaultSchema } from './MessageAttachmentDefault';
import { MessageQuoteAttachmentSchema } from './MessageQuoteAttachment';

export const MessageAttachmentSchema = z.union([
	FileAttachmentPropsSchema,
	MessageAttachmentActionSchema,
	MessageAttachmentDefaultSchema,
	MessageQuoteAttachmentSchema,
]);

export const FilesAndAttachmentsSchema = z.object({
	files: z.array(FilePropSchema),
	attachments: z.array(MessageAttachmentSchema),
});

export type MessageAttachment = z.infer<typeof MessageAttachmentSchema>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface FilesAndAttachments extends z.infer<typeof FilesAndAttachmentsSchema> {}
