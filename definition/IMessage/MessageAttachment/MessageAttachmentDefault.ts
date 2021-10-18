import { FieldProps } from './FieldProps';
import { Dimensions } from './Files/Dimensions';
import { MessageAttachmentBase } from './MessageAttachmentBase';

export type MarkdownFields = 'text' | 'pretext' | 'fields';

export type MessageAttachmentDefault = {

	author_icon?: string;
	author_link?: string;
	author_name?: string;

	fields?: FieldProps[];

	// footer
	// footer_icon

	image_url?: string;
	image_dimensions?: Dimensions;

	mrkdwn_in?: Array<MarkdownFields>;
	pretext?: string;
	text?: string;

	thumb_url?: string;

	color?: string;
} & MessageAttachmentBase;
