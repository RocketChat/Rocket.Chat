import type { Root } from '@rocket.chat/message-parser';
import * as z from 'zod';

import { MessageAttachmentBaseSchema } from './MessageAttachmentBase';

export const MarkdownFieldsSchema = z.enum(['text', 'pretext', 'fields']);

export const MessageAttachmentDefaultSchema = z
	.object({
		author_icon: z.string().optional(),
		author_link: z.string().optional(),
		author_name: z.string().optional(),
		fields: z
			.array(
				z.object({
					short: z.boolean().optional(),
					title: z.string(),
					value: z.string(),
				}),
			)
			.optional(),
		image_url: z.string().optional(),
		image_dimensions: z
			.object({
				width: z.number(),
				height: z.number(),
			})
			.optional(),
		mrkdwn_in: z.array(MarkdownFieldsSchema).optional(),
		pretext: z.string().optional(),
		text: z.string().optional(),
		md: z.custom<Root>().optional(),
		thumb_url: z.string().optional(),
		color: z.string().optional(),
	})
	.and(MessageAttachmentBaseSchema);

export type MarkdownFields = z.infer<typeof MarkdownFieldsSchema>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface MessageAttachmentDefault extends z.infer<typeof MessageAttachmentDefaultSchema> {}
