export enum MatrixEventType {
	ROOM_CREATED = 'm.room.create',
	ROOM_MEMBERSHIP_CHANGED = 'm.room.member',
	ROOM_MESSAGE_SENT = 'm.room.message',
	ROOM_JOIN_RULES_CHANGED = 'm.room.join_rules',
	ROOM_NAME_CHANGED = 'm.room.name',
	ROOM_TOPIC_CHANGED = 'm.room.topic',
	ROOM_EVENT_REDACTED = 'm.room.redaction',
	MESSAGE_REACTED = 'm.reaction',
	USER_TYPING_STATUS_CHANGED = 'm.typing',
}
