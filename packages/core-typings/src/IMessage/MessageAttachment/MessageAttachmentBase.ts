import type { Root } from '@rocket.chat/message-parser';
import * as z from 'zod';

import { serializableDate } from '../../utils';

export const MessageAttachmentBaseSchema = z.object({
	id: z.string().optional(),
	title: z.string().optional(),
	ts: serializableDate.optional(),
	collapsed: z.boolean().optional(),
	description: z.string().optional(),
	descriptionMd: z.custom<Root>().optional(),
	text: z.string().optional(),
	md: z.custom<Root>().optional(),
	size: z.number().optional(),
	format: z.string().optional(),
	title_link: z.string().optional(),
	title_link_download: z.boolean().optional(),
	encryption: z
		.object({
			iv: z.string(),
			key: z.custom<JsonWebKey>(),
		})
		.optional(),
	hashes: z
		.object({
			sha256: z.string(),
		})
		.optional(),
});

export type MessageAttachmentBase = z.infer<typeof MessageAttachmentBaseSchema>;

export type EncryptedMessageAttachment = MessageAttachmentBase & {
	encryption: Required<MessageAttachmentBase>['encryption'];
};

export const isEncryptedMessageAttachment = (attachment: MessageAttachmentBase): attachment is EncryptedMessageAttachment => {
	return attachment?.encryption !== undefined && typeof attachment.encryption === 'object';
};
