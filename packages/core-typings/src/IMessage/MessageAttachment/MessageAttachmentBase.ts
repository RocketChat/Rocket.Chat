import type { Root } from '@rocket.chat/message-parser';

export type MessageAttachmentBase = {
	id?: string;
	title?: string;
	ts?: Date;
	collapsed?: boolean;
	/** description isn't being used on client for non-image attachments, we're keeping it for backward compatibility */
	description?: string;
	text?: string;
	md?: Root;
	size?: number;
	format?: string;
	title_link?: string;
	title_link_download?: boolean;
	encryption?: {
		iv: string;
		key: JsonWebKey;
	};
	hashes?: {
		sha256: string;
	};
};

export type EncryptedMessageAttachment = MessageAttachmentBase & {
	encryption: Required<MessageAttachmentBase>['encryption'];
};

export const isEncryptedMessageAttachment = (attachment: MessageAttachmentBase): attachment is EncryptedMessageAttachment => {
	return attachment?.encryption !== undefined && typeof attachment.encryption === 'object';
};
