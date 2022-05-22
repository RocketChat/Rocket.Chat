export type MessageAttachmentBase = {
	title?: string;

	ts?: Date;
	collapsed?: boolean;
	description?: string;
	text?: string;

	title_link?: string;
	title_link_download?: boolean;
};
