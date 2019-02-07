import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { t } from 'meteor/rocketchat:utils';
import s from 'underscore.string';

Meteor.startup(function() {
	RocketChat.MessageTypes.registerType({
		id: 'room_changed_privacy',
		system: true,
		message: 'room_changed_privacy',
		data(message) {
			return {
				user_by: message.u && message.u.username,
				room_type: t(message.msg),
			};
		},
	});

	RocketChat.MessageTypes.registerType({
		id: 'room_changed_topic',
		system: true,
		message: 'room_changed_topic',
		data(message) {
			return {
				user_by: message.u && message.u.username,
				room_topic: s.escapeHTML(message.msg || `(${ t('None').toLowerCase() })`),
			};
		},
	});

	RocketChat.MessageTypes.registerType({
		id: 'room_changed_announcement',
		system: true,
		message: 'room_changed_announcement',
		data(message) {
			return {
				user_by: message.u && message.u.username,
				room_announcement: s.escapeHTML(message.msg || `(${ t('None').toLowerCase() })`),
			};
		},
	});

	RocketChat.MessageTypes.registerType({
		id: 'room_changed_description',
		system: true,
		message: 'room_changed_description',
		data(message) {
			return {
				user_by: message.u && message.u.username,
				room_description: s.escapeHTML(message.msg || `(${ t('None').toLowerCase() })`),
			};
		},
	});
});
