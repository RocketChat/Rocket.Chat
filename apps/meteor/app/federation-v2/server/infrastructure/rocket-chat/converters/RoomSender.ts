import { IMessage } from '@rocket.chat/core-typings';

import { FederationRoomInviteUserDto, FederationRoomSendExternalMessageDto } from '../../../application/input/RoomSenderDto';

export class FederationRoomSenderConverter {
	public static toRoomInviteUserDto(
		internalInviterId: string,
		internalRoomId: string,
		externalInviteeId: string,
	): FederationRoomInviteUserDto {
		const normalizedInviteeId = externalInviteeId.replace('@', '');
		const inviteeUsernameOnly = externalInviteeId.split(':')[0]?.replace('@', '');

		return Object.assign(new FederationRoomInviteUserDto(), {
			internalInviterId,
			internalRoomId,
			rawInviteeId: externalInviteeId,
			normalizedInviteeId,
			inviteeUsernameOnly,
		});
	}

	public static toSendExternalMessageDto(
		internalSenderId: string,
		internalRoomId: string,
		message: IMessage,
	): FederationRoomSendExternalMessageDto {
		return Object.assign(new FederationRoomSendExternalMessageDto(), {
			internalRoomId,
			internalSenderId,
			message,
		});
	}
}
