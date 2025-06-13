import { type Static, t } from 'elysia';
import { RoomIdDto, ServerNameDto, TimestampDto, UsernameDto } from '../common/validation.dto';

export const QueryProfileQueryDto = t.Object({
	user_id: UsernameDto,
});

export const QueryProfileResponseDto = t.Object({
	displayname: t.Optional(t.Union([t.String(), t.Null()])),
	avatar_url: t.Optional(t.Union([t.String(), t.Null()])),
});


export const QueryKeysBodyDto = t.Object({
	device_keys: t.Record(t.String(), t.String(), {
		description: 'Device keys to query'
	}),
});

export const QueryKeysResponseDto = t.Object({
	device_keys: t.Record(t.String(), t.Any(), {
		description: 'Device keys for the requested users'
	}),
});

export const GetDevicesParamsDto = t.Object({
	userId: UsernameDto,
});

export const GetDevicesResponseDto = t.Object({
	user_id: UsernameDto,
	stream_id: t.Number({ description: 'Device list stream ID' }),
	devices: t.Array(
		t.Object({
			device_id: t.String({ description: 'Device ID' }),
			display_name: t.Optional(t.String({ description: 'Device display name' })),
			last_seen_ip: t.Optional(t.String({ description: 'Last seen IP address' })),
			last_seen_ts: t.Optional(TimestampDto),
		}),
		{ description: 'List of devices for the user' }
	),
});

export const MakeJoinParamsDto = t.Object({
	roomId: RoomIdDto,
	userId: UsernameDto,
});

export const MakeJoinQueryDto = t.Object({
	ver: t.Optional(t.Array(t.String(), { description: 'Supported room versions' })),
});

export const MakeJoinResponseDto = t.Object({
	room_version: t.String({ description: 'Room version' }),
	event: t.Object({
		content: t.Object({
			membership: t.Literal('join'),
			join_authorised_via_users_server: t.Optional(t.String()),
		}),
		room_id: RoomIdDto,
		sender: UsernameDto,
		state_key: UsernameDto,
		type: t.Literal('m.room.member'),
		origin_server_ts: TimestampDto,
		origin: ServerNameDto,
	}),
});

export const GetMissingEventsParamsDto = t.Object({
	roomId: RoomIdDto,
});

export const GetMissingEventsBodyDto = t.Object({
	earliest_events: t.Array(t.String(), { description: 'Earliest events' }),
	latest_events: t.Array(t.String(), { description: 'Latest events' }),
	limit: t.Number({ minimum: 1, maximum: 100, description: 'Maximum number of events to return' }),
});

export const GetMissingEventsResponseDto = t.Object({
	events: t.Array(
		t.Record(t.String(), t.Any()),
		{ description: 'Missing events' }
	),
});

export const EventAuthParamsDto = t.Object({
	roomId: RoomIdDto,
	eventId: t.String({ description: 'Event ID' }),
});

export const EventAuthResponseDto = t.Object({
	auth_chain: t.Array(
		t.Record(t.String(), t.Any()),
		{ description: 'Authorization chain for the event' }
	),
});

export type QueryKeysBody = Static<typeof QueryKeysBodyDto>;
export type QueryKeysResponse = Static<typeof QueryKeysResponseDto>;
export type GetDevicesParams = Static<typeof GetDevicesParamsDto>;
export type GetDevicesResponse = Static<typeof GetDevicesResponseDto>;
export type QueryProfileResponse = Static<typeof QueryProfileResponseDto>;
export type EventAuthResponse = Static<typeof EventAuthResponseDto>;
export type EventAuthParams = Static<typeof EventAuthParamsDto>;
export type GetMissingEventsResponse = Static<typeof GetMissingEventsResponseDto>;
export type GetMissingEventsBody = Static<typeof GetMissingEventsBodyDto>;
export type GetMissingEventsParams = Static<typeof GetMissingEventsParamsDto>;
export type MakeJoinResponse = Static<typeof MakeJoinResponseDto>;
export type MakeJoinQuery = Static<typeof MakeJoinQueryDto>;
export type MakeJoinParams = Static<typeof MakeJoinParamsDto>;
export type QueryProfileQuery = Static<typeof QueryProfileQueryDto>;
