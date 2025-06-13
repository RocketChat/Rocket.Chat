import { t } from 'elysia';
import { DepthDto, RoomIdDto, TimestampDto, UsernameDto } from './validation.dto';

export const EventHashDto = t.Object({
	sha256: t.String({ description: 'SHA256 hash of the event' }),
});

export const EventSignatureDto = t.Record(
	t.String(),
	t.Record(t.String(), t.String()),
	{ description: 'Event signatures by server and key ID' }
);

export const EventBaseDto = t.Object({
	type: t.String({ description: 'Event type' }),
	content: t.Record(t.String(), t.Any(), { description: 'Event content' }),
	sender: UsernameDto,
	room_id: RoomIdDto,
	origin_server_ts: TimestampDto,
	depth: DepthDto,
	prev_events: t.Array(
		t.Union([
			t.String(),
			t.Tuple([t.String(), t.String()])
		]),
		{ description: 'Previous events in the room' }
	),
	auth_events: t.Array(
		t.Union([
			t.String(),
			t.Tuple([t.String(), t.String()])
		]),
		{ description: 'Authorization events' }
	),
	origin: t.Optional(t.String({ description: 'Origin server' })),
	hashes: t.Optional(EventHashDto),
	signatures: t.Optional(EventSignatureDto),
	unsigned: t.Optional(t.Record(t.String(), t.Any(), { description: 'Unsigned data' })),
});

export const MembershipEventContentDto = t.Object({
	membership: t.Union([
		t.Literal('join'),
		t.Literal('leave'),
		t.Literal('invite'),
		t.Literal('ban'),
		t.Literal('knock')
	], { description: 'Membership state' }),
	displayname: t.Optional(t.Union([t.String(), t.Null()])),
	avatar_url: t.Optional(t.Union([t.String(), t.Null()])),
	join_authorised_via_users_server: t.Optional(t.Union([t.String(), t.Null()])),
	is_direct: t.Optional(t.Union([t.Boolean(), t.Null()])),
	reason: t.Optional(t.String({ description: 'Reason for membership change' })),
});

export const RoomMemberEventDto = t.Intersect([
	EventBaseDto,
	t.Object({
		type: t.Literal('m.room.member'),
		content: MembershipEventContentDto,
		state_key: UsernameDto,
	})
]);