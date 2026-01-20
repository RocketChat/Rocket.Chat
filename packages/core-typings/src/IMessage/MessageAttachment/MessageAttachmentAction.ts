// DEPRECATED

import type { Root } from '@rocket.chat/message-parser';
import * as z from 'zod';

import { MessageAttachmentBaseSchema, type MessageAttachmentBase } from './MessageAttachmentBase';

const ActionSchema = z.object({
	msgId: z.string().optional(),
	type: z.literal('button'),
	text: z.string(),
	md: z.custom<Root>().optional(),
	msg: z.string().optional(),
	url: z.string().optional(),
	image_url: z.string().optional(),
	is_webview: z.literal(true).optional(),
	msg_in_chat_window: z.literal(true).optional(),
	msg_processing_type: z.enum(['sendMessage', 'respondWithMessage', 'respondWithQuotedMessage']).optional(),
});

export const MessageAttachmentActionSchema = z
	.object({
		button_alignment: z.enum(['horizontal', 'vertical']).optional(),
		actions: z.array(ActionSchema),
	})
	.and(MessageAttachmentBaseSchema);

export type MessageAttachmentAction = z.infer<typeof MessageAttachmentActionSchema>;

export const isActionAttachment = (attachment: MessageAttachmentBase): attachment is MessageAttachmentAction => 'actions' in attachment;
