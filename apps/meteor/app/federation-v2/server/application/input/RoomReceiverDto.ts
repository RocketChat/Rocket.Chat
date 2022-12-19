import type { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import type { EVENT_ORIGIN } from '../../domain/IFederationBridge';

interface IFederationBaseInputDto {
	externalEventId: string;
}

export interface IFederationReceiverBaseRoomInputDto extends IFederationBaseInputDto {
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
	userProfile?: {
		avatarUrl?: string;
		displayName?: string;
	};
}

export interface IFederationSendInternalMessageInputDto extends IFederationReceiverBaseRoomInputDto {
	externalSenderId: string;
	normalizedSenderId: string;
	messageText: string;
	replyToEventId?: string;
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

export interface IFederationRoomRedactEventInputDto extends IFederationReceiverBaseRoomInputDto {
	redactsEvent: string;
	externalSenderId: string;
}

export interface IFederationSendInternalMessageBaseInputDto extends IFederationReceiverBaseRoomInputDto {
	externalSenderId: string;
	normalizedSenderId: string;
}

abstract class FederationBaseDto {
	constructor({ externalEventId }: { externalEventId: string }) {
		this.externalEventId = externalEventId;
	}

	externalEventId: string;
}

export class FederationBaseRoomInputDto extends FederationBaseDto {
	constructor({ externalRoomId, normalizedRoomId, externalEventId }: IFederationReceiverBaseRoomInputDto) {
		super({ externalEventId });
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
		externalEventId,
	}: IFederationCreateInputDto) {
		super({ externalRoomId, normalizedRoomId, externalEventId });
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
		externalEventId,
		userProfile,
	}: IFederationChangeMembershipInputDto) {
		super({ externalRoomId, normalizedRoomId, externalEventId });
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
		this.userProfile = userProfile;
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

	userProfile?: { avatarUrl?: string; displayName?: string };
}

class ExternalMessageBaseDto extends FederationBaseRoomInputDto {
	constructor({ externalRoomId, normalizedRoomId, externalSenderId, normalizedSenderId, externalEventId }: Record<string, any>) {
		super({ externalRoomId, normalizedRoomId, externalEventId });
		this.externalSenderId = externalSenderId;
		this.normalizedSenderId = normalizedSenderId;
	}

	externalSenderId: string;

	normalizedSenderId: string;
}

export class FederationRoomReceiveExternalMessageDto extends ExternalMessageBaseDto {
	constructor({
		externalRoomId,
		normalizedRoomId,
		externalSenderId,
		normalizedSenderId,
		messageText,
		externalEventId,
		replyToEventId,
	}: IFederationSendInternalMessageInputDto) {
		super({ externalRoomId, normalizedRoomId });
		this.externalSenderId = externalSenderId;
		this.normalizedSenderId = normalizedSenderId;
		this.messageText = messageText;
		this.replyToEventId = replyToEventId;
		this.externalEventId = externalEventId;
	}

	externalSenderId: string;

	normalizedSenderId: string;

	messageText: string;

	replyToEventId?: string;
}

export class FederationRoomEditExternalMessageDto extends ExternalMessageBaseDto {
	constructor({
		externalRoomId,
		normalizedRoomId,
		externalSenderId,
		normalizedSenderId,
		newMessageText,
		editsEvent,
		externalEventId,
	}: IFederationSendInternalMessageBaseInputDto & { newMessageText: string; editsEvent: string }) {
		super({ externalRoomId, normalizedRoomId, externalEventId });
		this.externalSenderId = externalSenderId;
		this.normalizedSenderId = normalizedSenderId;
		this.newMessageText = newMessageText;
		this.editsEvent = editsEvent;
	}

	externalSenderId: string;

	normalizedSenderId: string;

	newMessageText: string;

	editsEvent: string;
}

export interface IFederationFileMessageInputDto {
	filename: string;
	mimetype: string;
	size: number;
	messageText: string;
	url: string;
	replyToEventId?: string;
}

class FederationFileMessageInputDto {
	constructor({ filename, mimetype, size, messageText, url }: IFederationFileMessageInputDto) {
		this.filename = filename;
		this.mimetype = mimetype;
		this.size = size;
		this.messageText = messageText;
		this.url = url;
	}

	filename: string;

	mimetype: string;

	size: number;

	messageText: string;

	url: string;
}

export class FederationRoomReceiveExternalFileMessageDto extends ExternalMessageBaseDto {
	constructor({
		externalRoomId,
		normalizedRoomId,
		externalSenderId,
		normalizedSenderId,
		filename,
		mimetype,
		size,
		messageText,
		url,
		externalEventId,
		replyToEventId,
	}: IFederationSendInternalMessageBaseInputDto & IFederationFileMessageInputDto) {
		super({ externalRoomId, normalizedRoomId, externalEventId });
		this.externalSenderId = externalSenderId;
		this.normalizedSenderId = normalizedSenderId;
		this.replyToEventId = replyToEventId;
		this.messageBody = new FederationFileMessageInputDto({ filename, mimetype, size, messageText, url });
	}

	externalSenderId: string;

	normalizedSenderId: string;

	messageBody: FederationFileMessageInputDto;

	replyToEventId?: string;
}

export class FederationRoomChangeJoinRulesDto extends FederationBaseRoomInputDto {
	constructor({ externalRoomId, normalizedRoomId, roomType, externalEventId }: IFederationRoomChangeJoinRulesDtoInputDto) {
		super({ externalRoomId, normalizedRoomId, externalEventId });
		this.roomType = roomType;
	}

	roomType: RoomType;
}

export class FederationRoomChangeNameDto extends FederationBaseRoomInputDto {
	constructor({
		externalRoomId,
		normalizedRoomId,
		normalizedRoomName,
		externalSenderId,
		externalEventId,
	}: IFederationRoomNameChangeInputDto) {
		super({ externalRoomId, normalizedRoomId, externalEventId });
		this.normalizedRoomName = normalizedRoomName;
		this.externalSenderId = externalSenderId;
	}

	normalizedRoomName: string;

	externalSenderId: string;
}

export class FederationRoomChangeTopicDto extends FederationBaseRoomInputDto {
	constructor({ externalRoomId, normalizedRoomId, roomTopic, externalSenderId, externalEventId }: IFederationRoomTopicChangeInputDto) {
		super({ externalRoomId, normalizedRoomId, externalEventId });
		this.roomTopic = roomTopic;
		this.externalSenderId = externalSenderId;
	}

	roomTopic: string;

	externalSenderId: string;
}

export class FederationRoomRedactEventDto extends FederationBaseRoomInputDto {
	constructor({ externalRoomId, normalizedRoomId, externalEventId, redactsEvent, externalSenderId }: IFederationRoomRedactEventInputDto) {
		super({ externalRoomId, normalizedRoomId, externalEventId });
		this.redactsEvent = redactsEvent;
		this.externalSenderId = externalSenderId;
	}

	redactsEvent: string;

	externalSenderId: string;
}
