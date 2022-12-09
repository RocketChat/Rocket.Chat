import type { IMessage, MessageAttachment, MessageQuoteAttachment } from '@rocket.chat/core-typings';
import { isE2EEMessage, isOTRMessage, isQuoteAttachment, isTranslatedMessage } from '@rocket.chat/core-typings';
import type { Options, Root } from '@rocket.chat/message-parser';
import { parse } from '@rocket.chat/message-parser';

import { isParsedMessage } from './isParsedMessage';

type WithRequiredProperty<Type, Key extends keyof Type> = Omit<Type, Key> & {
	[Property in Key]-?: Type[Property];
};

export type MessageWithMdEnforced = WithRequiredProperty<IMessage, 'md'>;
/*
 * Removes null values for known properties values.
 * Adds a property `md` to the message with the parsed message if is not provided.
 * if has `attachments` property, but attachment is missing `md` property, it will be added.
 * if translation is enabled and message contains `translations` property, it will be replaced by the parsed message.
 * @param message The message to be parsed.
 * @param parseOptions The options to be used in the parser.
 * @param autoTranslateLanguage The language to be used in the parser.
 * @param showTranslatedMessage function that evaluates if message should be translated.
 * @returns message normalized.
 */

export const parseMessageTextToAstMarkdown = (
	message: IMessage,
	parseOptions: Options,
	autoTranslateLanguage?: string,
	showTranslated?: ({ message }: { message: IMessage }) => boolean,
): MessageWithMdEnforced => {
	const msg = removePossibleNullMessageValues(message);
	const translations = autoTranslateLanguage && showTranslated && isTranslatedMessage(msg) && msg.translations;
	const translated = autoTranslateLanguage && showTranslated?.({ message });

	const text = (translated && translations && translations[autoTranslateLanguage]) || msg.msg;

	return {
		...msg,
		md:
			isE2EEMessage(message) || isOTRMessage(message)
				? textToMessageToken(text, parseOptions)
				: msg.md ?? textToMessageToken(text, parseOptions),
		...(msg.attachments && { attachments: parseMessageAttachments(msg.attachments, parseOptions) }),
	};
};

const parseMessageQuoteAttachment = <T extends MessageQuoteAttachment>(quote: T, parseOptions: Options): T => {
	if (quote.attachments && quote.attachments?.length > 0) {
		quote.attachments = quote.attachments.map((attachment) => parseMessageQuoteAttachment(attachment, parseOptions));
	}

	return { ...quote, md: quote.md ?? textToMessageToken(quote.text, parseOptions) };
};

const parseMessageAttachments = <T extends MessageAttachment>(attachments: T[], parseOptions: Options): T[] => {
	if (attachments.length === 0) {
		return attachments;
	}

	return attachments.map((attachment) => {
		if (isQuoteAttachment(attachment) && attachment.attachments) {
			attachment.attachments = attachment.attachments.map((quoteAttachment) => parseMessageQuoteAttachment(quoteAttachment, parseOptions));
		}

		if (!attachment.text) {
			return attachment;
		}

		return {
			...attachment,
			md: attachment.md ?? textToMessageToken(attachment.text, parseOptions),
		};
	});
};

const isNotNullOrUndefined = (value: unknown): boolean => value !== null && value !== undefined;

// In a previous version of the app, some values were being set to null.
// This is a workaround to remove those null values.
// A migration script should be created to remove this code.
export const removePossibleNullMessageValues = ({
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

const textToMessageToken = (textOrRoot: string | Root, parseOptions: Options): Root => {
	if (!textOrRoot) {
		return [];
	}

	if (isParsedMessage(textOrRoot)) {
		return textOrRoot;
	}

	return parse(textOrRoot, parseOptions);
};
