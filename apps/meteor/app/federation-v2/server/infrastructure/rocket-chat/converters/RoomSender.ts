import { IMessage } from '@rocket.chat/core-typings';

import {
	FederationAfterLeaveRoomDto,
	FederationCreateDMAndInviteUserDto,
	FederationRoomSendExternalMessageDto,
} from '../../../application/input/RoomSenderDto';
import {
	formatExternalUserIdToInternalUsernameFormat,
	removeExternalSpecificCharsFromExternalIdentifier,
} from '../../matrix/converters/RoomReceiver';

export class FederationRoomSenderConverter {
	public static toCreateDirectMessageRoomDto(
		internalInviterId: string,
		internalRoomId: string,
		externalInviteeId: string,
	): FederationCreateDMAndInviteUserDto {
		const normalizedInviteeId = removeExternalSpecificCharsFromExternalIdentifier(externalInviteeId);
		const inviteeUsernameOnly = formatExternalUserIdToInternalUsernameFormat(externalInviteeId);

		return new FederationCreateDMAndInviteUserDto({
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
		return new FederationRoomSendExternalMessageDto({
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
		return new FederationAfterLeaveRoomDto({
			internalRoomId,
			internalUserId,
			whoRemovedInternalId,
		});
	}
}
