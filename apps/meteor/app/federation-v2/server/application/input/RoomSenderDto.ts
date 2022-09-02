import type { IMessage } from '@rocket.chat/core-typings';

export interface IFederationSenderBaseRoomInputDto {
	internalRoomId: string;
}

export interface IFederationCreateDMAndInviteUserDto extends IFederationSenderBaseRoomInputDto {
	internalInviterId: string;
	rawInviteeId: string;
	normalizedInviteeId: string;
	inviteeUsernameOnly: string;
}

export interface IFederationRoomSendExternalMessageDto extends IFederationSenderBaseRoomInputDto {
	message: IMessage;
	internalSenderId: string;
}

export interface IFederationAfterLeaveRoomDto extends IFederationSenderBaseRoomInputDto {
	internalUserId: string;
}

export interface IFederationAfterRemoveUserFromRoomDto extends IFederationSenderBaseRoomInputDto {
	internalUserId: string;
	actionDoneByInternalId: string;
}

export class FederationSenderBaseRoomInputDto {
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
	constructor({ internalRoomId, internalSenderId, message }: IFederationRoomSendExternalMessageDto) {
		super({ internalRoomId });
		this.internalSenderId = internalSenderId;
		this.message = message;
	}

	internalSenderId: string;

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
