import type { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import type { EVENT_ORIGIN } from '../../domain/IFederationBridge';

export interface IFederationReceiverBaseRoomInputDto {
	externalRoomId: string;
	normalizedRoomId: string;
}

export interface IFederationCreateInputDto extends IFederationReceiverBaseRoomInputDto {
	externalInviterId: string;
	normalizedInviterId: string;
	externalRoomName?: string;
	roomType?: RoomType;
	wasInternallyProgramaticallyCreated?: boolean;
	internalRoomId?: string;
}

export interface IFederationChangeMembershipInputDto extends IFederationReceiverBaseRoomInputDto {
	externalInviterId: string;
	normalizedInviterId: string;
	externalInviteeId: string;
	normalizedInviteeId: string;
	inviteeUsernameOnly: string;
	inviterUsernameOnly: string;
	eventOrigin: EVENT_ORIGIN;
	leave?: boolean;
	roomType?: RoomType;
	externalRoomName?: string;
}

export interface IFederationSendInternalMessageInputDto extends IFederationReceiverBaseRoomInputDto {
	externalSenderId: string;
	normalizedSenderId: string;
	messageText: string;
}

export interface IFederationRoomChangeJoinRulesDtoInputDto extends IFederationReceiverBaseRoomInputDto {
	roomType: RoomType;
}

export interface IFederationRoomNameChangeInputDto extends IFederationReceiverBaseRoomInputDto {
	normalizedRoomName: string;

	externalSenderId: string;
}

export interface IFederationRoomTopicChangeInputDto extends IFederationReceiverBaseRoomInputDto {
	roomTopic: string;

	externalSenderId: string;
}

export class FederationBaseRoomInputDto {
	constructor({ externalRoomId, normalizedRoomId }: IFederationReceiverBaseRoomInputDto) {
		this.externalRoomId = externalRoomId;
		this.normalizedRoomId = normalizedRoomId;
	}

	externalRoomId: string;

	normalizedRoomId: string;
}

export class FederationRoomCreateInputDto extends FederationBaseRoomInputDto {
	constructor({
		externalRoomId,
		normalizedRoomId,
		externalInviterId,
		normalizedInviterId,
		wasInternallyProgramaticallyCreated,
		roomType,
		externalRoomName,
		internalRoomId,
	}: IFederationCreateInputDto) {
		super({ externalRoomId, normalizedRoomId });
		this.externalInviterId = externalInviterId;
		this.normalizedInviterId = normalizedInviterId;
		this.wasInternallyProgramaticallyCreated = wasInternallyProgramaticallyCreated;
		this.roomType = roomType;
		this.externalRoomName = externalRoomName;
		this.internalRoomId = internalRoomId;
	}

	externalInviterId: string;

	normalizedInviterId: string;

	wasInternallyProgramaticallyCreated?: boolean;

	internalRoomId?: string;

	externalRoomName?: string;

	roomType?: RoomType;
}

export class FederationRoomChangeMembershipDto extends FederationBaseRoomInputDto {
	constructor({
		externalRoomId,
		normalizedRoomId,
		externalInviterId,
		normalizedInviterId,
		externalInviteeId,
		normalizedInviteeId,
		inviteeUsernameOnly,
		inviterUsernameOnly,
		eventOrigin,
		leave,
		roomType,
		externalRoomName,
	}: IFederationChangeMembershipInputDto) {
		super({ externalRoomId, normalizedRoomId });
		this.externalInviterId = externalInviterId;
		this.normalizedInviterId = normalizedInviterId;
		this.externalInviteeId = externalInviteeId;
		this.normalizedInviteeId = normalizedInviteeId;
		this.inviteeUsernameOnly = inviteeUsernameOnly;
		this.inviterUsernameOnly = inviterUsernameOnly;
		this.eventOrigin = eventOrigin;
		this.leave = leave;
		this.roomType = roomType;
		this.externalRoomName = externalRoomName;
	}

	externalInviterId: string;

	normalizedInviterId: string;

	inviterUsernameOnly: string;

	externalInviteeId: string;

	normalizedInviteeId: string;

	inviteeUsernameOnly: string;

	eventOrigin: EVENT_ORIGIN;

	roomType?: RoomType;

	leave?: boolean;

	externalRoomName?: string;
}

export class FederationRoomReceiveExternalMessageDto extends FederationBaseRoomInputDto {
	constructor({
		externalRoomId,
		normalizedRoomId,
		externalSenderId,
		normalizedSenderId,
		messageText,
	}: IFederationSendInternalMessageInputDto) {
		super({ externalRoomId, normalizedRoomId });
		this.externalSenderId = externalSenderId;
		this.normalizedSenderId = normalizedSenderId;
		this.messageText = messageText;
	}

	externalSenderId: string;

	normalizedSenderId: string;

	messageText: string;
}

export class FederationRoomChangeJoinRulesDto extends FederationBaseRoomInputDto {
	constructor({ externalRoomId, normalizedRoomId, roomType }: IFederationRoomChangeJoinRulesDtoInputDto) {
		super({ externalRoomId, normalizedRoomId });
		this.roomType = roomType;
	}

	roomType: RoomType;
}

export class FederationRoomChangeNameDto extends FederationBaseRoomInputDto {
	constructor({ externalRoomId, normalizedRoomId, normalizedRoomName, externalSenderId }: IFederationRoomNameChangeInputDto) {
		super({ externalRoomId, normalizedRoomId });
		this.normalizedRoomName = normalizedRoomName;
		this.externalSenderId = externalSenderId;
	}

	normalizedRoomName: string;

	externalSenderId: string;
}

export class FederationRoomChangeTopicDto extends FederationBaseRoomInputDto {
	constructor({ externalRoomId, normalizedRoomId, roomTopic, externalSenderId }: IFederationRoomTopicChangeInputDto) {
		super({ externalRoomId, normalizedRoomId });
		this.roomTopic = roomTopic;
		this.externalSenderId = externalSenderId;
	}

	roomTopic: string;

	externalSenderId: string;
}
