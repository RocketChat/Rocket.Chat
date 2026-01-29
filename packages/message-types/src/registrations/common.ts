import type { MessageTypes } from '../MessageTypes';

export default (instance: MessageTypes) => {
	instance.registerType({
		id: 'uj',
		system: true,
		text: (t, message) => t('User_joined_the_channel', { user: message.u.username }),
	});

	instance.registerType({
		id: 'ul',
		system: true,
		text: (t) => t('User_left_this_channel'),
	});

	instance.registerType({
		id: 'r',
		system: true,
		text: (t, message) => t('Room_name_changed_to', { room_name: message.msg }),
	});

	instance.registerType({
		id: 'au',
		system: true,
		text: (t, message) => t('User_added_to', { user_added: message.msg }),
	});

	instance.registerType({
		id: 'ui',
		system: true,
		text: (t, message) => t('User_invited_to_room', { user_invited: message.msg }),
	});

	instance.registerType({
		id: 'uir',
		system: true,
		text: (t) => t('User_rejected_invitation_to_room'),
	});

	instance.registerType({
		id: 'added-user-to-team',
		system: true,
		text: (t, message) => t('Added__username__to_this_team', { user_added: message.msg }),
	});

	instance.registerType({
		id: 'ru',
		system: true,
		text: (t, message) => t('User_has_been_removed', { user_removed: message.msg }),
	});

	instance.registerType({
		id: 'removed-user-from-team',
		system: true,
		text: (t, message) => t('Removed__username__from_the_team', { user_removed: message.msg }),
	});

	instance.registerType({
		id: 'ult',
		system: true,
		text: (t) => t('User_left_this_team'),
	});

	instance.registerType({
		id: 'user-converted-to-team',
		system: true,
		text: (t, message) => t('Converted__roomName__to_a_team', { roomName: message.msg }),
	});

	instance.registerType({
		id: 'user-converted-to-channel',
		system: true,
		text: (t, message) => t('Converted__roomName__to_a_channel', { roomName: message.msg }),
	});

	instance.registerType({
		id: 'user-removed-room-from-team',
		system: true,
		text: (t, message) => t('Removed__roomName__from_the_team', { roomName: message.msg }),
	});

	instance.registerType({
		id: 'user-deleted-room-from-team',
		system: true,
		text: (t, message) => t('Deleted__roomName__room', { roomName: message.msg }),
	});

	instance.registerType({
		id: 'user-added-room-to-team',
		system: true,
		text: (t, message) => t('added__roomName__to_this_team', { roomName: message.msg }),
	});

	instance.registerType({
		id: 'ujt',
		system: true,
		text: (t, message) => t('User_joined_the_team', { user: message.u.username }),
	});

	instance.registerType({
		id: 'ut',
		system: true,
		text: (t, message) => t('User_joined_the_conversation', { user: message.u.username }),
	});

	instance.registerType({
		id: 'wm',
		system: true,
		text: (t, message) => t('Welcome', { user: message.u.username }),
	});

	instance.registerType({
		id: 'rm',
		system: true,
		text: (t) => t('Message_is_removed'),
	});

	instance.registerType({
		id: 'user-muted',
		system: true,
		text: (t, message) => t('User_has_been_muted', { user_muted: message.msg }),
	});

	instance.registerType({
		id: 'user-unmuted',
		system: true,
		text: (t, message) => t('User_has_been_unmuted', { user_unmuted: message.msg }),
	});

	instance.registerType({
		id: 'subscription-role-added',
		system: true,
		text: (t, message) => t('set__username__as__role_', { username: message.msg, role: message.role ?? '' }),
	});

	instance.registerType({
		id: 'subscription-role-removed',
		system: true,
		text: (t, message) => t('removed__username__as__role_', { username: message.msg, role: message.role ?? '' }),
	});

	instance.registerType({
		id: 'room-archived',
		system: true,
		text: (t) => t('This_room_has_been_archived'),
	});

	instance.registerType({
		id: 'room-unarchived',
		system: true,
		text: (t) => t('This_room_has_been_unarchived'),
	});

	instance.registerType({
		id: 'room-removed-read-only',
		system: true,
		text: (t) => t('room_removed_read_only_permission'),
	});

	instance.registerType({
		id: 'room-set-read-only',
		system: true,
		text: (t) => t('room_set_read_only_permission'),
	});

	instance.registerType({
		id: 'room-allowed-reacting',
		system: true,
		text: (t) => t('room_allowed_reactions'),
	});

	instance.registerType({
		id: 'room-disallowed-reacting',
		system: true,
		text: (t) => t('room_disallowed_reactions'),
	});

	instance.registerType({
		id: 'room_changed_privacy',
		system: true,
		text: (t, message) => t('room_changed_type', { room_type: t(message.msg) }),
	});

	instance.registerType({
		id: 'room_changed_topic',
		system: true,
		text: (t, message) => t('room_changed_topic_to', { room_topic: message.msg || `(${t('None').toLowerCase()})` }),
	});

	instance.registerType({
		id: 'room_changed_avatar',
		system: true,
		text: (t) => t('room_avatar_changed'),
	});

	instance.registerType({
		id: 'room_changed_announcement',
		system: true,
		text: (t, message) =>
			t('changed_room_announcement_to__room_announcement_', { room_announcement: message.msg || `(${t('None').toLowerCase()})` }),
	});

	instance.registerType({
		id: 'room_changed_description',
		system: true,
		text: (t, message) =>
			t('changed_room_description_to__room_description_', { room_description: message.msg || `(${t('None').toLowerCase()})` }),
	});

	instance.registerType({
		id: 'message_pinned',
		system: true,
		text: (t) => t('Pinned_a_message'),
	});

	instance.registerType({
		id: 'abac-removed-user-from-room',
		system: true,
		text: (t) => t('abac_removed_user_from_the_room'),
	});
};
