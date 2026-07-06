import type { IMessage } from '@rocket.chat/core-typings';
import { escapeHTML } from '@rocket.chat/string-helpers';
import type { TFunction } from 'i18next';

import { emojiParser } from '../../../../app/emoji/client/emojiParser';
import { filterMarkdown } from '../../../../app/markdown/lib/markdown';

export const normalizeMessagePreview = (message: IMessage, t: TFunction): string | undefined => {
	if (message.msg) {
		return emojiParser(filterMarkdown(escapeHTML(message.msg)));
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
