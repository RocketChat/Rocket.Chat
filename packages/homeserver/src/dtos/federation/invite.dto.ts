import { type Static, t } from 'elysia';
import { RoomMemberEventDto } from '../common/event.dto';
import { EventIdDto, RoomIdDto } from '../common/validation.dto';

export const ProcessInviteParamsDto = t.Object({
	roomId: RoomIdDto,
	eventId: EventIdDto,
});

export const ProcessInviteBodyDto = RoomMemberEventDto;

export const ProcessInviteResponseDto = t.Object({
	event: ProcessInviteBodyDto,
});

export type ProcessInviteBody = Static<typeof ProcessInviteBodyDto>;
export type ProcessInviteResponse = Static<typeof ProcessInviteResponseDto>;