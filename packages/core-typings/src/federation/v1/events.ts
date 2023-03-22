export const eventTypes = {
	// Global
	GENESIS: 'genesis',
	PING: 'ping',

	// Room
	ROOM_DELETE: 'room_delete',
	ROOM_ADD_USER: 'room_add_user',
	ROOM_REMOVE_USER: 'room_remove_user',
	ROOM_USER_LEFT: 'room_user_left',
	ROOM_MESSAGE: 'room_message',
	ROOM_EDIT_MESSAGE: 'room_edit_message',
	ROOM_DELETE_MESSAGE: 'room_delete_message',
	ROOM_SET_MESSAGE_REACTION: 'room_set_message_reaction',
	ROOM_UNSET_MESSAGE_REACTION: 'room_unset_message_reaction',
	ROOM_MUTE_USER: 'room_mute_user',
	ROOM_UNMUTE_USER: 'room_unmute_user',
};
