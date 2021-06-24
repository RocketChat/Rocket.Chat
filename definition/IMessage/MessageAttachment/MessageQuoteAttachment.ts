import { MessageAttachmentBase } from './MessageAttachmentBase';

export type MessageQuoteAttachment = {
	author_name: string;
	author_link: string;
	author_icon: string;
	message_link?: string;
	text: string;
	attachments?: Array<MessageQuoteAttachment>;
} & MessageAttachmentBase;

export const isQuoteAttachment = (
	attachment: MessageAttachmentBase,
): attachment is MessageQuoteAttachment =>
	'message_link' in attachment;
