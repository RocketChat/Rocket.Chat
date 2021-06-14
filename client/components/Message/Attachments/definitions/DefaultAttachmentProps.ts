import { Dimensions } from '../Files/definitions/Dimensions';
import { FieldProps } from './FieldProps';

export type MarkdownFields = 'text' | 'pretext' | 'fields';

export type DefaultAttachmentProps = {
	collapsed?: true;

	author_icon?: string;
	author_link?: string;
	author_name?: string;

	fields: FieldProps;

	// footer
	// footer_icon

	image_url?: string;
	image_dimensions?: Dimensions;

	mrkdwn_in?: Array<MarkdownFields>;
	pretext?: string;
	text?: string;

	thumb_url?: string;

	title?: string;
	title_link?: string;

	ts?: Date;

	color?: string;
};
