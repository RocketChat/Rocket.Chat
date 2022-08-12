import type { IMessage } from '@rocket.chat/core-typings';

export class FederationCreateDMAndInviteUserDto {
	internalInviterId: string;

	internalRoomId: string;

	rawInviteeId: string;

	normalizedInviteeId: string;

	inviteeUsernameOnly: string;
}

export class FederationRoomSendExternalMessageDto {
	internalRoomId: string;

	internalSenderId: string;

	message: IMessage;
}

export class FederationAfterLeaveRoomDto {
	internalRoomId: string;

	internalUserId: string;

	whoRemovedInternalId?: string;
}
