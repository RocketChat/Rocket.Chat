import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import s from 'underscore.string';

Meteor.startup(function() {
	RocketChat.MessageTypes.registerType({
		id: 'message_snippeted',
		system: true,
		message: 'Snippeted_a_message',
		data(message) {
			const snippetLink = `<a href="/snippet/${ message.snippetId }/${ encodeURIComponent(message.snippetName) }">${ s.escapeHTML(message.snippetName) }</a>`;
			return { snippetLink };
		},
	});
});
