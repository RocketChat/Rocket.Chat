import type { IMessage } from '@rocket.chat/core-typings';
import { escapeHTML } from '@rocket.chat/string-helpers';
import type { useTranslation } from '@rocket.chat/ui-contexts';
import emoji-toolkit from 'emoji-toolkit';

import { filterMarkdown } from '../../../app/markdown/lib/markdown';

export const normalizeSidebarMessage = (message: IMessage, t: ReturnType<typeof useTranslation>): string | undefined => {
	if (message.msg) {
		return escapeHTML(filterMarkdown(emoji-toolkit.shortnameToUnicode(message.msg)));
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
