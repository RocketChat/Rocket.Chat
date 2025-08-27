import type { IMessage } from '@rocket.chat/core-typings';
import { MessageTypes } from '@rocket.chat/message-types';
import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
	MessageTypes.registerType({
		id: 'room_changed_privacy',
		system: true,
		text: (t, message: IMessage) => t('room_changed_type', { room_type: t(message.msg) }),
	});

	MessageTypes.registerType({
		id: 'room_changed_topic',
		system: true,
		text: (t, message: IMessage) => t('room_changed_topic_to', { room_topic: message.msg || `(${t('None').toLowerCase()})` }),
	});

	MessageTypes.registerType({
		id: 'room_changed_avatar',
		system: true,
		text: (t) => t('room_avatar_changed'),
	});

	MessageTypes.registerType({
		id: 'room_changed_announcement',
		system: true,
		text: (t, message: IMessage) =>
			t('changed_room_announcement_to__room_announcement_', { room_announcement: message.msg || `(${t('None').toLowerCase()})` }),
	});

	MessageTypes.registerType({
		id: 'room_changed_description',
		system: true,
		text: (t, message: IMessage) =>
			t('changed_room_description_to__room_description_', { room_description: message.msg || `(${t('None').toLowerCase()})` }),
	});

	MessageTypes.registerType({
		id: 'message_pinned',
		system: true,
		text: (t) => t('Pinned_a_message'),
	});

	MessageTypes.registerType({
		id: 'message_pinned_e2e',
		system: true,
		text: (t) => t('Pinned_a_message'),
	});
});
