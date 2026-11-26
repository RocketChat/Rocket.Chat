import type { IMessage } from '@rocket.chat/core-typings';
import { escapeHTML } from '@rocket.chat/tools';
import type { TFunction } from 'i18next';

import { shortnameToUnicode } from '../../../../lib/emoji-native/shortnameToUnicode';
import { filterMarkdown } from '../../../../lib/markdown/parser/filtered/filtered';
import { emoji } from '../../emoji/lib';

// Resolves against the client emoji registry so a custom emoji keeps precedence over a native one with the same shortname
const transformCustomEmoji = (key: string): string | undefined => {
	if (emoji.list[key]?.emojiPackage === 'emojiCustom') {
		return key;
	}
};

/**
 * Warning: Messages are unfiltered user input, and may contain dangerous HTML markup
 * use the output of this function as plain react text, **NEVER** use it as `dangerouslySetInnerHTML`
 */
export const getMessagePreviewText = (message: IMessage, t: TFunction): string | undefined => {
	if (message.msg) {
		return filterMarkdown(shortnameToUnicode(message.msg, transformCustomEmoji));
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		return attachment?.description || attachment?.title || t('Sent_an_attachment');
	}
};

/**
 * @deprecated Prefer getMessagePreviewText used as plain text
 * This function is to be used exclusively when its output is used as `dangerouslySetInnerHtml`
 * TODO: convert message preview to plain text
 */
export const getEscapedMessagePreviewText = (message: IMessage, t: TFunction): string | undefined => {
	const text = getMessagePreviewText(message, t);

	return text && escapeHTML(text);
};
