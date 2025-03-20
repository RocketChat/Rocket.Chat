import type { IMessage } from '@rocket.chat/core-typings';

interface IFederationSenderBaseRoomInputDto {
	internalRoomId: string;
}

interface IFederationCreateDMAndInviteUserDto extends IFederationSenderBaseRoomInputDto {
	internalInviterId: string;
	rawInviteeId: string;
	normalizedInviteeId: string;
	inviteeUsernameOnly: string;
}

interface IFederationRoomSendExternalMessageDto extends IFederationSenderBaseRoomInputDto {
	message: IMessage;
	internalSenderId: string;
	isThreadedMessage: boolean;
}

interface IFederationAfterLeaveRoomDto extends IFederationSenderBaseRoomInputDto {
	internalUserId: string;
}

interface IFederationAfterRemoveUserFromRoomDto extends IFederationSenderBaseRoomInputDto {
	internalUserId: string;
	actionDoneByInternalId: string;
}

class FederationSenderBaseRoomInputDto {
	constructor({ internalRoomId }: IFederationSenderBaseRoomInputDto) {
		this.internalRoomId = internalRoomId;
	}

	internalRoomId: string;
}

export class FederationCreateDMAndInviteUserDto extends FederationSenderBaseRoomInputDto {
	constructor({
		internalRoomId,
		internalInviterId,
		rawInviteeId,
		normalizedInviteeId,
		inviteeUsernameOnly,
	}: IFederationCreateDMAndInviteUserDto) {
		super({ internalRoomId });
		this.internalInviterId = internalInviterId;
		this.rawInviteeId = rawInviteeId;
		this.normalizedInviteeId = normalizedInviteeId;
		this.inviteeUsernameOnly = inviteeUsernameOnly;
	}

	internalInviterId: string;

	rawInviteeId: string;

	normalizedInviteeId: string;

	inviteeUsernameOnly: string;
}

export class FederationRoomSendExternalMessageDto extends FederationSenderBaseRoomInputDto {
	constructor({ internalRoomId, internalSenderId, message, isThreadedMessage }: IFederationRoomSendExternalMessageDto) {
		super({ internalRoomId });
		this.internalSenderId = internalSenderId;
		this.message = message;
		this.isThreadedMessage = isThreadedMessage;
	}

	internalSenderId: string;

	isThreadedMessage: boolean;

	message: IMessage;
}

export class FederationAfterLeaveRoomDto extends FederationSenderBaseRoomInputDto {
	constructor({ internalRoomId, internalUserId }: IFederationAfterLeaveRoomDto) {
		super({ internalRoomId });
		this.internalUserId = internalUserId;
	}

	internalUserId: string;
}

export class FederationAfterRemoveUserFromRoomDto extends FederationSenderBaseRoomInputDto {
	constructor({ internalRoomId, internalUserId, actionDoneByInternalId }: IFederationAfterRemoveUserFromRoomDto) {
		super({ internalRoomId });
		this.internalUserId = internalUserId;
		this.actionDoneByInternalId = actionDoneByInternalId;
	}

	internalUserId: string;

	actionDoneByInternalId: string;
}
