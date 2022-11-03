import { Meteor } from 'meteor/meteor';

import { MessageTypes } from '../../ui-utils/lib/MessageTypes';
// import { callbacks } from '../../../lib/callbacks';

Meteor.startup(function () {
	MessageTypes.registerType({
		id: 'r',
		system: true,
		message: 'Room_name_changed_to',
		data(message) {
			return {
				room_name: message.msg,
			};
		},
	});
	MessageTypes.registerType({
		id: 'au',
		system: true,
		message: 'User_added_to',
		data(message) {
			return {
				user_added: message.msg,
			};
		},
	});
	MessageTypes.registerType({
		id: 'added-user-to-team',
		system: true,
		message: 'Added__username__to_this_team',
		data(message) {
			return {
				user_added: message.msg,
			};
		},
	});
	MessageTypes.registerType({
		id: 'ru',
		system: true,
		message: 'User_has_been_removed',
		data(message) {
			return {
				user_removed: message.msg,
			};
		},
	});
	MessageTypes.registerType({
		id: 'removed-user-from-team',
		system: true,
		message: 'Removed__username__from_the_team',
		data(message) {
			return {
				user_removed: message.msg,
			};
		},
	});
	MessageTypes.registerType({
		id: 'ul',
		system: true,
		message: 'User_left_this_channel',
	});
	MessageTypes.registerType({
		id: 'ult',
		system: true,
		message: 'User_left_this_team',
	});
	MessageTypes.registerType({
		id: 'user-converted-to-team',
		system: true,
		message: 'Converted__roomName__to_a_team',
		data(message) {
			return {
				roomName: message.msg,
			};
		},
	});
	MessageTypes.registerType({
		id: 'user-converted-to-channel',
		system: true,
		message: 'Converted__roomName__to_a_channel',
		data(message) {
			return {
				roomName: message.msg,
			};
		},
	});
	MessageTypes.registerType({
		id: 'user-removed-room-from-team',
		system: true,
		message: 'Removed__roomName__from_the_team',
		data(message) {
			return {
				roomName: message.msg,
			};
		},
	});
	MessageTypes.registerType({
		id: 'user-deleted-room-from-team',
		system: true,
		message: 'Deleted__roomName__room',
		data(message) {
			return {
				roomName: message.msg,
			};
		},
	});
	MessageTypes.registerType({
		id: 'user-added-room-to-team',
		system: true,
		message: 'added__roomName__to_this_team',
		data(message) {
			return {
				roomName: message.msg,
			};
		},
	});
	MessageTypes.registerType({
		id: 'uj',
		system: true,
		message: 'User_joined_the_channel',
		data(message) {
			return {
				user: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'ujt',
		system: true,
		message: 'User_joined_the_team',
		data(message) {
			return {
				user: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'ut',
		system: true,
		message: 'User_joined_the_conversation',
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
		message: 'Message_is_removed',
	});
	// MessageTypes.registerType({
	// 	id: 'rtc',
	// 	render(message) {
	// 		return callbacks.run('renderRtcMessage', message);
	// 	},
	// });
	MessageTypes.registerType({
		id: 'user-muted',
		system: true,
		message: 'User_has_been_muted',
		data(message) {
			return {
				user_muted: message.msg,
			};
		},
	});
	MessageTypes.registerType({
		id: 'user-unmuted',
		system: true,
		message: 'User_has_been_unmuted',
		data(message) {
			return {
				user_unmuted: message.msg,
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
				role: message.role || '',
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
				role: message.role || '',
				user_by: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'room-archived',
		system: true,
		message: 'This_room_has_been_archived',
	});
	MessageTypes.registerType({
		id: 'room-unarchived',
		system: true,
		message: 'This_room_has_been_unarchived',
	});
	MessageTypes.registerType({
		id: 'room-removed-read-only',
		system: true,
		message: 'room_removed_read_only_permission',
	});
	MessageTypes.registerType({
		id: 'room-set-read-only',
		system: true,
		message: 'room_set_read_only_permission',
	});
	MessageTypes.registerType({
		id: 'room-allowed-reacting',
		system: true,
		message: 'room_allowed_reactions',
	});
	MessageTypes.registerType({
		id: 'room-disallowed-reacting',
		system: true,
		message: 'room_disallowed_reactions',
	});
	MessageTypes.registerType({
		id: 'room_e2e_enabled',
		system: true,
		message: 'Enabled_E2E_Encryption_for_this_room',
		data(message) {
			return {
				username: message.u.username,
			};
		},
	});
	MessageTypes.registerType({
		id: 'room_e2e_disabled',
		system: true,
		message: 'Disabled_E2E_Encryption_for_this_room',
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
	},
	{
		key: 'ujt',
		i18nLabel: 'Message_HideType_ujt',
	},
	{
		key: 'ul',
		i18nLabel: 'Message_HideType_ul',
	},
	{
		key: 'ult',
		i18nLabel: 'Message_HideType_ult',
	},
	{
		key: 'ru',
		i18nLabel: 'Message_HideType_ru',
	},
	{
		key: 'removed-user-from-team',
		i18nLabel: 'Message_HideType_removed_user_from_team',
	},
	{
		key: 'au',
		i18nLabel: 'Message_HideType_au',
	},
	{
		key: 'added-user-to-team',
		i18nLabel: 'Message_HideType_added_user_to_team',
	},
	{
		key: 'mute_unmute',
		i18nLabel: 'Message_HideType_mute_unmute',
	},
	{
		key: 'r',
		i18nLabel: 'Message_HideType_r',
	},
	{
		key: 'ut',
		i18nLabel: 'Message_HideType_ut',
	},
	{
		key: 'wm',
		i18nLabel: 'Message_HideType_wm',
	},
	{
		key: 'rm',
		i18nLabel: 'Message_HideType_rm',
	},
	{
		key: 'subscription-role-added',
		i18nLabel: 'Message_HideType_subscription_role_added',
	},
	{
		key: 'subscription-role-removed',
		i18nLabel: 'Message_HideType_subscription_role_removed',
	},
	{
		key: 'room-archived',
		i18nLabel: 'Message_HideType_room_archived',
	},
	{
		key: 'room-unarchived',
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
	{
		key: 'room-removed-read-only',
		i18nLabel: 'Message_HideType_room_removed_read_only',
	},
	{
		key: 'room-set-read-only',
		i18nLabel: 'Message_HideType_room_set_read_only',
	},
	{
		key: 'room-disallowed-reacting',
		i18nLabel: 'Message_HideType_room_disallowed_reacting',
	},
	{
		key: 'room-allowed-reacting',
		i18nLabel: 'Message_HideType_room_allowed_reacting',
	},
	{
		key: 'user-added-room-to-team',
		i18nLabel: 'Message_HideType_user_added_room_to_team',
	},
	{
		key: 'user-converted-to-channel',
		i18nLabel: 'Message_HideType_user_converted_to_channel',
	},
	{
		key: 'user-converted-to-team',
		i18nLabel: 'Message_HideType_user_converted_to_team',
	},
	{
		key: 'user-deleted-room-from-team',
		i18nLabel: 'Message_HideType_user_deleted_room_from_team',
	},
	{
		key: 'user-removed-room-from-team',
		i18nLabel: 'Message_HideType_user_removed_room_from_team',
	},
];
