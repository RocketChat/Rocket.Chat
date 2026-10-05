import { isQuoteAttachment } from '@rocket.chat/core-typings';
import type { IMessage, MessageAttachment, AtLeast } from '@rocket.chat/core-typings';

// Observation:
// Currently, if the limit is 0, one quote is still allowed.
// This behavior is defined in the server side, so to keep things consistent, we'll keep it that way.
// See @createAttachmentForMessageURLs in @BeforeSaveJumpToMessage.ts
export const limitQuoteChain = <TMessage extends AtLeast<IMessage, 'attachments'>>(message: TMessage, limit = 2): TMessage => {
	if (!Array.isArray(message.attachments) || message.attachments.length === 0) {
		return message;
	}

	return {
		...message,
		attachments: traverseMessageQuoteChain(message.attachments, limit),
	};
};

const traverseMessageQuoteChain = (attachments: MessageAttachment[], limit: number, currentLevel = 1): MessageAttachment[] => {
	// read observation above.
	if (limit < 2 || currentLevel >= limit) {
		return attachments.filter((attachment) => !isQuoteAttachment(attachment));
	}

	return attachments.map((attachment) => {
		if (isQuoteAttachment(attachment)) {
			if (!attachment.attachments) {
				return attachment;
			}
			return {
				...attachment,
				attachments: traverseMessageQuoteChain(attachment.attachments, limit, currentLevel + 1),
			};
		}

		return attachment;
	});
};
