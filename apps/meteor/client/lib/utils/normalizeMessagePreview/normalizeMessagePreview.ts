import type { IMessage } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';
import { escapeHTML } from '@rocket.chat/string-helpers';
import type { TFunction } from 'i18next';

import { shortnameToUnicode } from '../../../../app/emoji-native/lib/shortnameToUnicode';
import { filterMarkdown } from '../../../../app/markdown/lib/markdown';

export const normalizeMessagePreview = (message: IMessage, t: TFunction): string | undefined => {
	const messageType = MessageTypes.getType(message);
	if (messageType?.system) {
		return escapeHTML(messageType.text(t, message));
	}

	if (message.msg) {
		return escapeHTML(filterMarkdown(shortnameToUnicode(message.msg)));
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
