export type MessageAttachmentBase = {
	title?: string;

	ts?: Date;
	collapsed?: boolean;
	description?: string;

	title_link?: string;
	title_link_download?: boolean;
};
