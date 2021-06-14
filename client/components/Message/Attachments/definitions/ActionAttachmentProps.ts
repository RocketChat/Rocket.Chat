// DEPRECATED

import { AttachmentProps } from './AttachmentProps';

type Action = {
	msgId?: string;
	type: 'button';
	text: string;
	msg?: string;
	url?: string;
	image_url?: string;
	is_webview?: true;
	msg_in_chat_window?: true;
	msg_processing_type?: 'sendMessage' | 'respondWithMessage' | 'respondWithQuotedMessage';
};

export type ActionAttachmentProps = {
	button_alignment: 'horizontal' | 'vertical';
	actions: Array<Action>;
} & AttachmentProps;

export const isActionAttachment = (
	attachment: AttachmentProps,
): attachment is ActionAttachmentProps => 'actions' in attachment;
