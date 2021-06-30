import { Meteor } from 'meteor/meteor';

import { MessageTypes } from '../../ui-utils';
import { callbacks } from '../../callbacks';

Meteor.startup(function() {
	MessageTypes.registerType({
		id: 'r',
		system: true,
		message: 'Room_name_changed',
		data(message) {
			return {
				room_name: message.msg,
				user_by: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'au',
		system: true,
		message: 'User_added_by',
		data(message) {
			return {
				user_added: message.msg,
				user_by: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'ru',
		system: true,
		message: 'User_removed_by',
		data(message) {
			return {
				user_removed: message.msg,
				user_by: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'ul',
		system: true,
		message: 'User_left',
		data(message) {
			return {
				user_left: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'ult',
		system: true,
		message: 'User_left_team',
		data(message) {
			return {
				user_left: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'uj',
		system: true,
		message: 'User_joined_channel',
		data(message) {
			return {
				user: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'ujt',
		system: true,
		message: 'User_joined_team',
		data(message) {
			return {
				user: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'ut',
		system: true,
		message: 'User_joined_conversation',
		data(message) {
			return {
				user: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'wm',
		system: true,
		message: 'Welcome',
		data(message) {
			return {
				user: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'rm',
		system: true,
		message: 'Message_removed',
		data(message) {
			return {
				user: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'rtc',
		render(message) {
			return callbacks.run('renderRtcMessage', message);
		},
	});
	MessageTypes.registerType({
		id: 'user-muted',
		system: true,
		message: 'User_muted_by',
		data(message) {
			return {
				user_muted: message.msg,
				user_by: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'user-unmuted',
		system: true,
		message: 'User_unmuted_by',
		data(message) {
			return {
				user_unmuted: message.msg,
				user_by: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'subscription-role-added',
		system: true,
		message: '__username__was_set__role__by__user_by_',
		data(message) {
			return {
				username: message.msg,
				role: message.role,
				user_by: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'subscription-role-removed',
		system: true,
		message: '__username__is_no_longer__role__defined_by__user_by_',
		data(message) {
			return {
				username: message.msg,
				role: message.role,
				user_by: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'room-archived',
		system: true,
		message: 'This_room_has_been_archived_by__username_',
		data(message) {
			return {
				username: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'room-unarchived',
		system: true,
		message: 'This_room_has_been_unarchived_by__username_',
		data(message) {
			return {
				username: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'room_e2e_enabled',
		system: true,
		message: 'This_room_encryption_has_been_enabled_by__username_',
		data(message) {
			return {
				username: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'room_e2e_disabled',
		system: true,
		message: 'This_room_encryption_has_been_disabled_by__username_',
		data(message) {
			return {
				username: message.u.username,
			};
		},
	});
});

export const MessageTypesValues = [
	{
		key: 'uj',
		i18nLabel: 'Message_HideType_uj',
	}, {
		key: 'ul',
		i18nLabel: 'Message_HideType_ul',
	}, {
		key: 'ru',
		i18nLabel: 'Message_HideType_ru',
	}, {
		key: 'au',
		i18nLabel: 'Message_HideType_au',
	}, {
		key: 'mute_unmute',
		i18nLabel: 'Message_HideType_mute_unmute',
	}, {
		key: 'r',
		i18nLabel: 'Message_HideType_r',
	}, {
		key: 'ut',
		i18nLabel: 'Message_HideType_ut',
	}, {
		key: 'wm',
		i18nLabel: 'Message_HideType_wm',
	}, {
		key: 'rm',
		i18nLabel: 'Message_HideType_rm',
	}, {
		key: 'subscription-role-added',
		i18nLabel: 'Message_HideType_subscription_role_added',
	}, {
		key: 'subscription-role-removed',
		i18nLabel: 'Message_HideType_subscription_role_removed',
	}, {
		key: 'room_archived',
		i18nLabel: 'Message_HideType_room_archived',
	}, {
		key: 'room_unarchived',
		i18nLabel: 'Message_HideType_room_unarchived',
	},
	{
		key: 'room_changed_privacy',
		i18nLabel: 'Message_HideType_room_changed_privacy',
	},
	{
		key: 'room_changed_avatar',
		i18nLabel: 'Message_HideType_room_changed_avatar',
	},
	{
		key: 'room_changed_topic',
		i18nLabel: 'Message_HideType_room_changed_topic',
	},
	{
		key: 'room_e2e_enabled',
		i18nLabel: 'Message_HideType_room_enabled_encryption',
	},
	{
		key: 'room_e2e_disabled',
		i18nLabel: 'Message_HideType_room_disabled_encryption',
	},
];
