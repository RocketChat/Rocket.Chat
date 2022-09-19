import { IMessage, isQuoteAttachment, isTranslatedMessage, MessageAttachment, MessageQuoteAttachment } from '@rocket.chat/core-typings';
import { Options, parse, Root } from '@rocket.chat/message-parser';

import { isParsedMessage } from './isParsedMessage';

export const parseMessage = (
	message: IMessage,
	parseOptions: Options,
	autoTranslateLanguage?: string,
	showTranslated?: ({ message }: { message: IMessage }) => boolean,
): IMessage => {
	const msg = removePossibleNullValues(message);
	let translations = undefined;
	let translated = false;

	if (showTranslated) {
		translations = isTranslatedMessage(msg) && msg.translations;
		translated = showTranslated({ message });
	}

	if (!msg.attachments && !translations && msg.md && msg.md.length > 0 && isParsedMessage(msg.md)) {
		return msg;
	}

	const text = (translated && autoTranslateLanguage && translations && translations[autoTranslateLanguage]) || msg.msg;

	if (msg.attachments) {
		msg.attachments = parseAttachmentMessages(msg.attachments, parseOptions);
	}

	return { ...msg, md: textToMessageToken(text, parseOptions) };
};

const parseQuoteAttachmentMessage = (quote: MessageQuoteAttachment, parseOptions: Options): MessageQuoteAttachment => {
	if (quote.attachments && quote.attachments?.length > 0) {
		quote.attachments = quote.attachments.map((attachment) => parseQuoteAttachmentMessage(attachment, parseOptions));
	}

	return { ...quote, md: textToMessageToken(quote.text, parseOptions) };
};

const parseAttachmentMessages = (attachments: MessageAttachment[], parseOptions: Options): MessageAttachment[] => {
	if (attachments?.length === 0) {
		return attachments;
	}

	const parsedAttachments = attachments.map((attachment) => {
		if (isQuoteAttachment(attachment) && attachment.attachments) {
			attachment.attachments = attachment.attachments.map((quoteAttachment) => parseQuoteAttachmentMessage(quoteAttachment, parseOptions));
		}

		if (!attachment.text) {
			return attachment;
		}

		return {
			...attachment,
			md: textToMessageToken(attachment.text, parseOptions),
		};
	});

	return parsedAttachments;
};

const isNotNullOrUndefined = (value: unknown): boolean => value !== null && value !== undefined;

// In a previous version of the app, some values were being set to null.
// This is a workaround to remove those null values.
// A migration script should be created to remove this code.
const removePossibleNullValues = ({
	editedBy,
	editedAt,
	emoji,
	avatar,
	alias,
	customFields,
	groupable,
	attachments,
	reactions,
	...message
}: any): IMessage => ({
	...message,
	...(isNotNullOrUndefined(editedBy) && { editedBy }),
	...(isNotNullOrUndefined(editedAt) && { editedAt }),
	...(isNotNullOrUndefined(emoji) && { emoji }),
	...(isNotNullOrUndefined(avatar) && { avatar }),
	...(isNotNullOrUndefined(alias) && { alias }),
	...(isNotNullOrUndefined(customFields) && { customFields }),
	...(isNotNullOrUndefined(groupable) && { groupable }),
	...(isNotNullOrUndefined(attachments) && { attachments }),
	...(isNotNullOrUndefined(reactions) && { reactions }),
});

export const textToMessageToken = (textOrRoot: string | Root, parseOptions: Options): Root => {
	if (!textOrRoot) {
		return [];
	}

	if (isParsedMessage(textOrRoot)) {
		return textOrRoot;
	}

	return parse(textOrRoot, parseOptions);
};
