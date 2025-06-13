import { type Static, t } from 'elysia';
import { EventBaseDto, MembershipEventContentDto } from '../common/event.dto';
import { RoomIdDto, ServerNameDto, UsernameDto } from '../common/validation.dto';

export const SendJoinParamsDto = t.Object({
	roomId: RoomIdDto,
	stateKey: UsernameDto,
});

export const SendJoinEventDto = t.Intersect([
	EventBaseDto,
	t.Object({
		type: t.Literal('m.room.member'),
		content: t.Intersect([
			MembershipEventContentDto,
			t.Object({
				membership: t.Literal('join'),
			})
		]),
		state_key: UsernameDto,
	})
]);

export const SendJoinResponseDto = t.Object({
	event: t.Record(t.String(), t.Any(), { description: 'The processed join event' }),
	state: t.Array(
		t.Record(t.String(), t.Any()),
		{ description: 'Current state events in the room' }
	),
	auth_chain: t.Array(
		t.Record(t.String(), t.Any()),
		{ description: 'Authorization chain for the event' }
	),
	members_omitted: t.Boolean({ description: 'Whether member events were omitted' }),
	origin: ServerNameDto,
}); 

export type SendJoinParams = Static<typeof SendJoinParamsDto>;
export type SendJoinEvent = Static<typeof SendJoinEventDto>;
export type SendJoinResponse = Static<typeof SendJoinResponseDto>;