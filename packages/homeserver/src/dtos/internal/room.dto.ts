import { type Static, t } from 'elysia';
import { RoomIdDto, ServerNameDto, UsernameDto } from '../common/validation.dto';

export const InternalCreateRoomBodyDto = t.Object({
	username: t.String({ 
		minLength: 1,
		description: 'Username for the room creator'
	}),
	sender: UsernameDto,
	name: t.String({ 
		minLength: 1,
		description: 'Room name'
	}),
	canonical_alias: t.Optional(t.String({ 
		description: 'Canonical alias for the room'
	})),
	alias: t.Optional(t.String({ 
		description: 'Room alias'
	})),
});

export const InternalCreateRoomResponseDto = t.Object({
	room_id: RoomIdDto,
	event_id: t.String({ description: 'Creation event ID' }),
});

export const InternalUpdateRoomNameParamsDto = t.Object({
	roomId: RoomIdDto,
});

export const InternalUpdateRoomNameBodyDto = t.Object({
	name: t.String({ 
		minLength: 1,
		description: 'New room name'
	}),
	senderUserId: UsernameDto,
	targetServer: ServerNameDto,
});

export const InternalUpdateUserPowerLevelParamsDto = t.Object({
	roomId: RoomIdDto,
	userId: UsernameDto,
});

export const InternalUpdateUserPowerLevelBodyDto = t.Object({
	senderUserId: UsernameDto,
	powerLevel: t.Number({ 
		description: 'Power level (0-100)',
		minimum: 0,
		maximum: 100
	}),
	targetServers: t.Optional(t.Array(ServerNameDto)),
});

export const InternalLeaveRoomParamsDto = t.Object({
	roomId: RoomIdDto,
});

export const InternalLeaveRoomBodyDto = t.Object({
	senderUserId: UsernameDto,
	targetServers: t.Optional(t.Array(ServerNameDto)),
});

export const InternalKickUserParamsDto = t.Object({
	roomId: RoomIdDto,
	memberId: UsernameDto,
});

export const InternalKickUserBodyDto = t.Object({
	userIdToKick: UsernameDto,
	senderUserId: UsernameDto,
	reason: t.Optional(t.String({ description: 'Reason for kicking' })),
	targetServers: t.Optional(t.Array(ServerNameDto)),
});

export const InternalBanUserParamsDto = t.Object({
	roomId: RoomIdDto,
	userIdToBan: UsernameDto,
});

export const InternalBanUserBodyDto = t.Object({
	userIdToBan: UsernameDto,
	senderUserId: UsernameDto,
	reason: t.Optional(t.String({ description: 'Reason for banning' })),
	targetServers: t.Optional(t.Array(ServerNameDto)),
});

export const InternalTombstoneRoomParamsDto = t.Object({
	roomId: RoomIdDto,
});

export const InternalTombstoneRoomBodyDto = t.Object({
	sender: UsernameDto,
	reason: t.Optional(t.String({ description: 'Reason for tombstoning' })),
	replacementRoomId: t.Optional(RoomIdDto),
});

export const InternalRoomEventResponseDto = t.Object({
	eventId: t.String({ description: 'Event ID of the created event' }),
});

export const InternalTombstoneRoomResponseDto = t.Object({
	event_id: t.String({ description: 'Tombstone event ID' }),
	origin_server_ts: t.Number({ description: 'Server timestamp' }),
	content: t.Object({
		body: t.String(),
		replacement_room: t.Optional(RoomIdDto),
	}),
}); 

export type InternalCreateRoomBody = Static<typeof InternalCreateRoomBodyDto>;
export type InternalCreateRoomResponse = Static<typeof InternalCreateRoomResponseDto>;
export type InternalUpdateRoomNameParams = Static<typeof InternalUpdateRoomNameParamsDto>;
export type InternalUpdateRoomNameBody = Static<typeof InternalUpdateRoomNameBodyDto>;
export type InternalUpdateRoomNameResponse = Static<typeof InternalRoomEventResponseDto>;
export type InternalUpdateUserPowerLevelParams = Static<typeof InternalUpdateUserPowerLevelParamsDto>;
export type InternalUpdateUserPowerLevelBody = Static<typeof InternalUpdateUserPowerLevelBodyDto>;
export type InternalUpdateUserPowerLevelResponse = Static<typeof InternalRoomEventResponseDto>;
export type InternalLeaveRoomParams = Static<typeof InternalLeaveRoomParamsDto>;
export type InternalLeaveRoomBody = Static<typeof InternalLeaveRoomBodyDto>;
export type InternalLeaveRoomResponse = Static<typeof InternalRoomEventResponseDto>;
export type InternalKickUserParams = Static<typeof InternalKickUserParamsDto>;
export type InternalKickUserBody = Static<typeof InternalKickUserBodyDto>;
export type InternalKickUserResponse = Static<typeof InternalRoomEventResponseDto>;
export type InternalBanUserParams = Static<typeof InternalBanUserParamsDto>;
export type InternalBanUserBody = Static<typeof InternalBanUserBodyDto>;
export type InternalBanUserResponse = Static<typeof InternalRoomEventResponseDto>;
export type InternalTombstoneRoomParams = Static<typeof InternalTombstoneRoomParamsDto>;
export type InternalTombstoneRoomBody = Static<typeof InternalTombstoneRoomBodyDto>;
export type InternalTombstoneRoomResponse = Static<typeof InternalTombstoneRoomResponseDto>;