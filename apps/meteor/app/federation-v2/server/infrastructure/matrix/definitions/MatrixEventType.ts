export enum MatrixEventType {
	ROOM_CREATED = 'm.room.create',
	ROOM_MEMBERSHIP_CHANGED = 'm.room.member',
	ROOM_MESSAGE_SENT = 'm.room.message',
	ROOM_JOIN_RULES_CHANGED = 'm.room.join_rules',
	ROOM_NAME_CHANGED = 'm.room.name',
	// SET_ROOM_POWER_LEVELS = 'm.room.power_levels',
	// SET_ROOM_CANONICAL_ALIAS = 'm.room.canonical_alias',
	// SET_ROOM_HISTORY_VISIBILITY = 'm.room.history_visibility',
	// SET_ROOM_GUEST_ACCESS = 'm.room.guest_access',
	ROOM_TOPIC_CHANGED = 'm.room.topic',
}
