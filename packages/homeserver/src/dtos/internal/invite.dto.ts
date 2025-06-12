import { type Static, t } from 'elysia';
import { RoomIdDto, UsernameDto } from '../common/validation.dto';

export const InternalInviteUserBodyDto = t.Object({
	username: t.String({ 
		minLength: 1,
		description: 'Username to invite'
	}),
	roomId: t.Optional(RoomIdDto),
	sender: t.Optional(UsernameDto),
	name: t.String({ 
		minLength: 1,
		description: 'Room or user name'
	}),
});

export const InternalInviteUserResponseDto = t.Object({
	event_id: t.String({ description: 'Invite event ID' }),
	room_id: RoomIdDto,
}); 

export type InternalInviteUserBody = Static<typeof InternalInviteUserBodyDto>;
export type InternalInviteUserResponse = Static<typeof InternalInviteUserResponseDto>;