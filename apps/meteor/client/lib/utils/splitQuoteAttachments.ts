import type { MessageAttachment } from '@rocket.chat/core-typings';
import { isQuoteAttachment } from '@rocket.chat/core-typings';

export const splitQuoteAttachments = (attachments: MessageAttachment[] = []) => ({
	quotes: attachments.filter(isQuoteAttachment),
	attachments: attachments.filter((attachment) => !isQuoteAttachment(attachment)),
});
