import type { Root } from '@rocket.chat/message-parser';
import * as z from 'zod';

import { MessageAttachmentSchema, type MessageAttachment } from './MessageAttachment';
import { MessageAttachmentBaseSchema } from './MessageAttachmentBase';

export const MessageQuoteAttachmentSchema = z
	.object({
		author_name: z.string(),
		author_link: z.string(),
		author_icon: z.string(),
		message_link: z.string().optional(),
		text: z.string(),
		md: z.custom<Root>().optional(),
		get attachments() {
			return z.array(MessageAttachmentSchema).optional();
		},
	})
	.and(MessageAttachmentBaseSchema);

export type MessageQuoteAttachment = z.infer<typeof MessageQuoteAttachmentSchema>;

export const isQuoteAttachment = (attachment: MessageAttachment): attachment is MessageQuoteAttachment =>
	'message_link' in attachment && attachment.message_link !== undefined;
