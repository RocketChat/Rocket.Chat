import type { IMessage } from '@rocket.chat/core-typings';

import {
	FederationAfterLeaveRoomDto,
	FederationCreateDMAndInviteUserDto,
	FederationRoomSendExternalMessageDto,
} from '../../../application/input/RoomSenderDto';

export class FederationRoomSenderConverter {
	public static toCreateDirectMessageRoomDto(
		internalInviterId: string,
		internalRoomId: string,
		externalInviteeId: string,
	): FederationCreateDMAndInviteUserDto {
		const normalizedInviteeId = externalInviteeId.replace('@', '');
		const inviteeUsernameOnly = externalInviteeId.split(':')[0]?.replace('@', '');

		return Object.assign(new FederationCreateDMAndInviteUserDto(), {
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

	public static toAfterLeaveRoom(
		internalUserId: string,
		internalRoomId: string,
		whoRemovedInternalId?: string,
	): FederationAfterLeaveRoomDto {
		return Object.assign(new FederationAfterLeaveRoomDto(), {
			internalRoomId,
			internalUserId,
			whoRemovedInternalId,
		});
	}
}
