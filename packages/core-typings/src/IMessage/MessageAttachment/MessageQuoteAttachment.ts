import type { Root } from '@rocket.chat/message-parser';

import type { MessageAttachment } from './MessageAttachment';
import type { MessageAttachmentBase } from './MessageAttachmentBase';

export type MessageQuoteAttachment = {
	author_name: string;
	author_link?: string;
	author_icon: string;
	message_link: string;
	text: string;
	md?: Root;
	attachments?: Array<MessageAttachment>; // TODO this is causing issues to define a model, see @ts-expect-error at apps/meteor/app/api/server/v1/channels.ts:274
	/**
	 * Room the quoted message lives in. A quote may point at a different room than the one it is
	 * rendered in, so this is not necessarily the room of the message carrying the attachment.
	 * Absent on quotes stored before this field was introduced.
	 */
	rid?: string;
	/** Whether the quoted message is pinned. Absent on quotes stored before this field was introduced. */
	pinned?: boolean;
	/** Discussion room id of the quoted message, when it belongs to one. */
	drid?: string;
} & MessageAttachmentBase;

export const isQuoteAttachment = (attachment: MessageAttachment): attachment is MessageQuoteAttachment =>
	'message_link' in attachment && attachment.message_link !== undefined;
