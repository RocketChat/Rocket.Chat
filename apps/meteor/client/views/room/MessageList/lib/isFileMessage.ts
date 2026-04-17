import type { IMessage, MessageAttachmentBase } from '@rocket.chat/core-typings';
import { isFileAttachment, isQuoteAttachment } from '@rocket.chat/core-typings';

export const isFileMessage = (message: IMessage): boolean => {
	const attachments = message.attachments?.filter((a: MessageAttachmentBase) => !isQuoteAttachment(a)) ?? [];

	return attachments.length > 0 && attachments.every((a: MessageAttachmentBase) => isFileAttachment(a));
};
