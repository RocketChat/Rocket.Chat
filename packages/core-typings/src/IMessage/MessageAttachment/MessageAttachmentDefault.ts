import type { Root } from '@rocket.chat/message-parser';

import type { MessageAttachment } from './MessageAttachment';
import type { MessageAttachmentBase } from './MessageAttachmentBase';

export type MarkdownFields = 'text' | 'pretext' | 'fields';

export type MessageAttachmentDefault = {
	author_icon?: string;
	author_link?: string;
	author_name?: string;

	fields?: {
		short?: boolean;
		title: string;
		value: string;
	}[];

	// footer
	// footer_icon

	image_url?: string;
	image_dimensions?: {
		width: number;
		height: number;
	};

	mrkdwn_in?: Array<MarkdownFields>;
	pretext?: string;
	text?: string;
	md?: Root;

	thumb_url?: string;

	color?: string;

	attachments?: MessageAttachment[];

	/** Encrypted content from e2e messages, preserved in pin attachments */
	content?: object; // TODO: check if MessageAttachmentDefault[content] is a valid type it does not seem to be used anywhere
} & MessageAttachmentBase;
