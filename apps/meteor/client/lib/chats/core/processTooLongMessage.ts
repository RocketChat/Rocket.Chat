import type { IMessage } from '@rocket.chat/core-typings';

import type { ChatAPI } from '../ChatAPI';

export type TooLongChat = {
	readonly composer?: Pick<NonNullable<ChatAPI['composer']>, 'clear' | 'setText'>;
	readonly currentEditingMessage: Pick<ChatAPI['currentEditingMessage'], 'getMID'>;
	readonly flows: Pick<ChatAPI['flows'], 'uploadFiles'>;
};

export type TooLongDeps = {
	getMaxAllowedSize(): number | undefined;
	isFileUploadEnabled(): boolean | undefined;
	isConvertToAttachmentAllowed(): boolean | undefined;
	notifyTooLong(): void;
	// Absent: the message is never converted, the user is only told it is too long.
	offerAttachment?(msg: string, chat: TooLongChat): Promise<void>;
};

export const processTooLongMessageCore = async (deps: TooLongDeps, chat: TooLongChat, { msg }: Pick<IMessage, 'msg'>): Promise<boolean> => {
	const maxAllowedSize = deps.getMaxAllowedSize();

	if (maxAllowedSize !== undefined && msg.length <= maxAllowedSize) {
		return false;
	}
	const fileUploadsEnabled = deps.isFileUploadEnabled();
	const convertLongMessagesToAttachment = deps.isConvertToAttachmentAllowed();

	if (chat.currentEditingMessage.getMID() || !fileUploadsEnabled || !convertLongMessagesToAttachment || !deps.offerAttachment) {
		deps.notifyTooLong();
		chat.composer?.setText(msg);
		return true;
	}

	await deps.offerAttachment(msg, chat);

	return true;
};
