import { Meteor } from 'meteor/meteor';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { MessageTypes } from '../../ui-utils';

Meteor.startup(function () {
	MessageTypes.registerType({
		id: 'message_snippeted',
		system: true,
		message: 'Snippeted_a_message',
		data(message) {
			const snippetLink = `<a href="/snippet/${message.snippetId}/${encodeURIComponent(message.snippetName)}">${escapeHTML(
				message.snippetName,
			)}</a>`;
			return { snippetLink };
		},
	});
});
