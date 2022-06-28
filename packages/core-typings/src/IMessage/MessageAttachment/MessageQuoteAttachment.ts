import type { MessageAttachmentBase } from './MessageAttachmentBase';

export type MessageQuoteAttachment = {
	author_name: string;
	author_link: string;
	author_icon: string;
	message_link?: string;
	text: string;
	attachments?: Array<MessageQuoteAttachment>; // TODO this is cauising issues to define a model, see: apps/meteor/server/models/raw/Messages.ts
} & MessageAttachmentBase;

export const isQuoteAttachment = (attachment: MessageAttachmentBase): attachment is MessageQuoteAttachment => 'message_link' in attachment;
