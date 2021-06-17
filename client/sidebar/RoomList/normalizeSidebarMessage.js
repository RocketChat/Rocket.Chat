import { escapeHTML } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { MessageTypes } from '../../../app/ui-utils/lib/MessageTypes';
import { filterMarkdown } from '../../../common/markdown/markdown';

export const normalizeSidebarMessage = (message, t) => {
	const messageType = MessageTypes.getType(message);
	if (message.t && messageType) {
		const data = (typeof messageType.data === 'function' && messageType.data(message)) || {};
		const language = Meteor._localStorage.getItem('userLanguage');
		return TAPi18n.__(messageType.message, data, language);
	}

	if (message.msg) {
		return escapeHTML(filterMarkdown(message.msg));
	}

	if (message.attachments) {
		const attachment = message.attachments.find(
			(attachment) => attachment.title || attachment.description,
		);

		if (attachment && attachment.description) {
			return escapeHTML(attachment.description);
		}

		if (attachment && attachment.title) {
			return escapeHTML(attachment.title);
		}

		return t('Sent_an_attachment');
	}
};
