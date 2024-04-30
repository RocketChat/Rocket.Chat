import { Meteor } from 'meteor/meteor';

import { MessageTypes } from '../../ui-utils/lib/MessageTypes';
// import { callbacks } from '../../../lib/callbacks';
export { MessageTypesValues } from './MessageTypesValues';

Meteor.startup(() => {
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
		message: 'set__username__as__role_',
		data(message) {
			return {
				username: message.msg,
				role: message.role || '',
			};
		},
	});
	MessageTypes.registerType({
		id: 'subscription-role-removed',
		system: true,
		message: 'removed__username__as__role_',
		data(message) {
			return {
				username: message.msg,
				role: message.role || '',
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
	MessageTypes.registerType({
		id: 'videoconf',
		system: false,
		message: 'Video_Conference',
	});
});
