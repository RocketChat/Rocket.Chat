// DEPRECATED

import type { Root } from '@rocket.chat/message-parser';

import type { MessageAttachmentBase } from './MessageAttachmentBase';

type Action = {
	msgId?: string;
	type: 'button';
	text: string;
	md?: Root;
	msg?: string;
	url?: string;
	image_url?: string;
	is_webview?: true;
	msg_in_chat_window?: true;
	msg_processing_type?: 'sendMessage' | 'respondWithMessage' | 'respondWithQuotedMessage';
};

export type MessageAttachmentAction = {
	button_alignment?: 'horizontal' | 'vertical';
	actions: Array<Action>;
} & MessageAttachmentBase;

export const isActionAttachment = (attachment: MessageAttachmentBase): attachment is MessageAttachmentAction => 'actions' in attachment;
