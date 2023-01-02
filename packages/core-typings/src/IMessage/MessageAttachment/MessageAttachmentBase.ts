import type { Root } from '@rocket.chat/message-parser';

export type MessageAttachmentBase = {
	title?: string;

	ts?: Date;
	collapsed?: boolean;
	description?: string;
	text?: string;
	md?: Root;

	title_link?: string;
	title_link_download?: boolean;
};
