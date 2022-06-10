import { IMessage } from '@rocket.chat/core-typings';

export class FederationRoomInviteUserDto {
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
