import type { Root } from '@rocket.chat/message-parser';

import type { MessageAttachmentBase } from './MessageAttachmentBase';

export type MessageQuoteAttachment = {
	author_name: string;
	author_link: string;
	author_icon: string;
	message_link?: string;
	text: string;
	md: Root;
	attachments?: Array<MessageQuoteAttachment>; // TODO this is cauising issues to define a model, see @ts-expect-error at apps/meteor/app/api/server/v1/channels.ts:274
} & MessageAttachmentBase;

export const isQuoteAttachment = (attachment: MessageAttachmentBase): attachment is MessageQuoteAttachment => 'message_link' in attachment;
