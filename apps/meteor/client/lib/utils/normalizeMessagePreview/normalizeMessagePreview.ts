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

export const normalizeMessagePreview = (message: IMessage, t: TFunction): string | undefined => {
	if (message.msg) {
		return escapeHTML(filterMarkdown(shortnameToUnicode(message.msg, transformCustomEmoji)));
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		if (attachment?.description) {
			return escapeHTML(attachment.description);
		}

		if (attachment?.title) {
			return escapeHTML(attachment.title);
		}

		return t('Sent_an_attachment');
	}
};
