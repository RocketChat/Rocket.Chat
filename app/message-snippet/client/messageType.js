import { Meteor } from 'meteor/meteor';
import { MessageTypes } from '/app/ui-utils';
import s from 'underscore.string';

Meteor.startup(function() {
	MessageTypes.registerType({
		id: 'message_snippeted',
		system: true,
		message: 'Snippeted_a_message',
		data(message) {
			const snippetLink = `<a href="/snippet/${ message.snippetId }/${ encodeURIComponent(message.snippetName) }">${ s.escapeHTML(message.snippetName) }</a>`;
			return { snippetLink };
		},
	});
});
