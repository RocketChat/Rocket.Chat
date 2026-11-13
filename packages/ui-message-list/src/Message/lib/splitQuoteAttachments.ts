import type { MessageAttachment } from '@rocket.chat/core-typings';
import { isQuoteAttachment } from '@rocket.chat/core-typings';

/** Separates the quotes of a message, shown above its body, from the rest of its attachments, shown below it. */
export const splitQuoteAttachments = (attachments: MessageAttachment[] = []) => ({
	quotes: attachments.filter(isQuoteAttachment),
	attachments: attachments.filter((attachment) => !isQuoteAttachment(attachment)),
});
