import { escapeHTML } from '@rocket.chat/string-helpers';

import { filterMarkdown } from '../../../app/markdown/lib/markdown';
import emojione from 'emojione';

export const normalizeSidebarMessage = (message, t) => {
	if (message.msg) {
		let msg = message.msg;
		msg = emojione.shortnameToUnicode(msg);
		return escapeHTML(filterMarkdown(msg));
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		if (attachment && attachment.description) {
			return escapeHTML(attachment.description);
		}

		if (attachment && attachment.title) {
			return escapeHTML(attachment.title);
		}

		return t('Sent_an_attachment');
	}
};
