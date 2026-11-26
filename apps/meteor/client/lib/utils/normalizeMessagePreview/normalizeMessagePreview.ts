import type { IMessage } from '@rocket.chat/core-typings';
import type { TFunction } from 'i18next';

import { shortnameToUnicode } from '../../../../lib/emoji-native/shortnameToUnicode';
import { filterMarkdown } from '../../../../lib/markdown/parser/filtered/filtered';
import { emoji } from '../../emoji/lib';

const transformCustomEmoji = (key: string): string | undefined => {
	if (emoji.list[key]?.emojiPackage === 'emojiCustom') {
		return key;
	}
};

export const normalizeMessagePreview = (message: IMessage, t: TFunction): string | undefined => {
	if (message.msg) {
		return filterMarkdown(shortnameToUnicode(message.msg, transformCustomEmoji));
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		if (attachment?.description) {
			return attachment.description;
		}

		if (attachment?.title) {
			return attachment.title;
		}

		return t('Sent_an_attachment');
	}
};
