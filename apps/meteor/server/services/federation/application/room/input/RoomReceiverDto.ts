import type { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import type { EVENT_ORIGIN } from '../../../domain/IFederationBridge';
import type { ROCKET_CHAT_FEDERATION_ROLES } from '../../../infrastructure/rocket-chat/definitions/FederatedRoomInternalRoles';

interface IFederationBaseInputDto {
	externalEventId: string;
}

export interface IFederationReceiverBaseRoomInputDto extends IFederationBaseInputDto {
	externalRoomId: string;
	normalizedRoomId: string;
}

interface IFederationCreateInputDto extends IFederationReceiverBaseRoomInputDto {
	externalInviterId: string;
	normalizedInviterId: string;
	externalRoomName?: string;
	roomType?: RoomType;
	wasInternallyProgramaticallyCreated?: boolean;
	internalRoomId?: string;
}

interface IFederationChangeMembershipInputDto extends IFederationReceiverBaseRoomInputDto {
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
	allInviteesExternalIdsWhenDM?: {
		externalInviteeId: string;
		normalizedInviteeId: string;
		inviteeUsernameOnly: string;
	}[];
}

interface IFederationThread {
	rootEventId: string;
	replyToEventId: string;
}

interface IFederationSendInternalMessageInputDto extends IFederationReceiverBaseRoomInputDto {
	externalSenderId: string;
	normalizedSenderId: string;
	rawMessage: string;
	externalFormattedText: string;
	replyToEventId?: string;
	thread?: IFederationThread;
}

interface IFederationRoomChangeJoinRulesDtoInputDto extends IFederationReceiverBaseRoomInputDto {
	roomType: RoomType;
}

interface IFederationRoomNameChangeInputDto extends IFederationReceiverBaseRoomInputDto {
	normalizedRoomName: string;
	externalSenderId: string;
}

interface IFederationRoomTopicChangeInputDto extends IFederationReceiverBaseRoomInputDto {
	roomTopic: string;
	externalSenderId: string;
}

interface IFederationRoomRedactEventInputDto extends IFederationReceiverBaseRoomInputDto {
	redactsEvent: string;
	externalSenderId: string;
}

interface IFederationRoomChangePowerLevelsInputDto extends IFederationReceiverBaseRoomInputDto {
	roleChangesToApply: IExternalRolesChangesToApplyInputDto;
	externalSenderId: string;
}

interface IFederationSendInternalMessageBaseInputDto extends IFederationReceiverBaseRoomInputDto {
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
		allInviteesExternalIdsWhenDM = [],
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
		this.allInviteesExternalIdsWhenDM = allInviteesExternalIdsWhenDM;
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

	allInviteesExternalIdsWhenDM?: {
		externalInviteeId: string;
		normalizedInviteeId: string;
		inviteeUsernameOnly: string;
	}[];

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
		externalFormattedText,
		rawMessage,
		externalEventId,
		replyToEventId,
		thread,
	}: IFederationSendInternalMessageInputDto) {
		super({ externalRoomId, normalizedRoomId });
		this.externalSenderId = externalSenderId;
		this.normalizedSenderId = normalizedSenderId;
		this.externalFormattedText = externalFormattedText;
		this.rawMessage = rawMessage;
		this.replyToEventId = replyToEventId;
		this.externalEventId = externalEventId;
		this.thread = thread;
	}

	externalSenderId: string;

	normalizedSenderId: string;

	externalFormattedText: string;

	rawMessage: string;

	replyToEventId?: string;

	thread?: {
		rootEventId: string;
		replyToEventId: string;
	};
}

export class FederationRoomEditExternalMessageDto extends ExternalMessageBaseDto {
	constructor({
		externalRoomId,
		normalizedRoomId,
		externalSenderId,
		normalizedSenderId,
		newRawMessage,
		newExternalFormattedText,
		editsEvent,
		externalEventId,
	}: IFederationSendInternalMessageBaseInputDto & {
		newRawMessage: string;
		newExternalFormattedText: string;
		editsEvent: string;
	}) {
		super({ externalRoomId, normalizedRoomId, externalEventId });
		this.externalSenderId = externalSenderId;
		this.normalizedSenderId = normalizedSenderId;
		this.newRawMessage = newRawMessage;
		this.newExternalFormattedText = newExternalFormattedText;
		this.editsEvent = editsEvent;
	}

	externalSenderId: string;

	normalizedSenderId: string;

	newExternalFormattedText: string;

	newRawMessage: string;

	editsEvent: string;
}

interface IFederationFileMessageInputDto {
	filename: string;
	mimetype: string;
	size: number;
	messageText: string;
	url: string;
	replyToEventId?: string;
	thread?: {
		rootEventId: string;
		replyToEventId: string;
	};
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
		thread,
	}: IFederationSendInternalMessageBaseInputDto & IFederationFileMessageInputDto) {
		super({ externalRoomId, normalizedRoomId, externalEventId });
		this.externalSenderId = externalSenderId;
		this.normalizedSenderId = normalizedSenderId;
		this.replyToEventId = replyToEventId;
		this.messageBody = new FederationFileMessageInputDto({ filename, mimetype, size, messageText, url });
		this.thread = thread;
	}

	externalSenderId: string;

	normalizedSenderId: string;

	messageBody: FederationFileMessageInputDto;

	replyToEventId?: string;

	thread?: IFederationThread;
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

export interface IExternalRolesChangesToApplyInputDto {
	[key: string]: { action: string; role: ROCKET_CHAT_FEDERATION_ROLES }[];
}
export class FederationRoomRoomChangePowerLevelsEventDto extends FederationBaseRoomInputDto {
	constructor({
		externalRoomId,
		normalizedRoomId,
		externalEventId,
		roleChangesToApply,
		externalSenderId,
	}: IFederationRoomChangePowerLevelsInputDto) {
		super({ externalRoomId, normalizedRoomId, externalEventId });
		this.roleChangesToApply = roleChangesToApply;
		this.externalSenderId = externalSenderId;
	}

	roleChangesToApply: IExternalRolesChangesToApplyInputDto;

	externalSenderId: string;
}
