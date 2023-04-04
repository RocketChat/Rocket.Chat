import type { Root } from '@rocket.chat/message-parser';

export type MessageAttachmentBase = {
	title?: string;

	ts?: Date;
	collapsed?: boolean;
	description?: string;
	descriptionMd?: Root;
	text?: string;
	md?: Root;

	size?: number;
	format?: string;

	title_link?: string;
	title_link_download?: boolean;
};
