import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import {
	FederationRoomChangeJoinRulesDto,
	FederationRoomChangeMembershipDto,
	FederationRoomChangeNameDto,
	FederationRoomChangeTopicDto,
	FederationRoomCreateInputDto,
	FederationRoomReceiveExternalMessageDto,
} from '../../../application/input/RoomReceiverDto';
import { EVENT_ORIGIN } from '../../../domain/IFederationBridge';
import type { MatrixEventRoomMembershipChanged } from '../definitions/events/RoomMembershipChanged';
import { RoomMembershipChangedEventType } from '../definitions/events/RoomMembershipChanged';
import { MatrixRoomJoinRules } from '../definitions/MatrixRoomJoinRules';
import { MatrixEventType } from '../definitions/MatrixEventType';
import type { MatrixEventRoomCreated } from '../definitions/events/RoomCreated';
import type { MatrixEventRoomMessageSent } from '../definitions/events/RoomMessageSent';
import type { MatrixEventRoomJoinRulesChanged } from '../definitions/events/RoomJoinRulesChanged';
import type { MatrixEventRoomNameChanged } from '../definitions/events/RoomNameChanged';
import type { MatrixEventRoomTopicChanged } from '../definitions/events/RoomTopicChanged';
import type { AbstractMatrixEvent } from '../definitions/AbstractMatrixEvent';

export const removeExternalSpecificCharsFromExternalIdentifier = (matrixIdentifier = ''): string => {
	return matrixIdentifier.replace('@', '').replace('!', '');
};

export const formatExternalUserIdToInternalUsernameFormat = (matrixUserId = ''): string => {
	return matrixUserId.split(':')[0]?.replace('@', '');
};

export const isAnExternalIdentifierFormat = (identifier: string): boolean => identifier.includes(':');

export const isAnExternalUserIdFormat = (userId: string): boolean => isAnExternalIdentifierFormat(userId) && userId.includes('@');

export const extractServerNameFromExternalIdentifier = (identifier = ''): string => {
	const splitted = identifier.split(':');

	return splitted.length > 1 ? splitted[1] : '';
};

const convertExternalRoomIdToInternalRoomIdFormat = (matrixRoomId = ''): string => {
	const prefixedRoomIdOnly = matrixRoomId.split(':')[0];
	const prefix = '!';

	return prefixedRoomIdOnly?.replace(prefix, '');
};

const getEventOrigin = (inviterId = '', homeServerDomain: string): EVENT_ORIGIN => {
	const fromADifferentServer = extractServerNameFromExternalIdentifier(inviterId) !== homeServerDomain;

	return fromADifferentServer ? EVENT_ORIGIN.REMOTE : EVENT_ORIGIN.LOCAL;
};

const convertExternalJoinRuleToInternalRoomType = (matrixJoinRule: MatrixRoomJoinRules, matrixRoomIsDirect = false): RoomType => {
	if (matrixRoomIsDirect) {
		return RoomType.DIRECT_MESSAGE;
	}
	const mapping: Record<string, RoomType> = {
		[MatrixRoomJoinRules.JOIN]: RoomType.CHANNEL,
		[MatrixRoomJoinRules.INVITE]: RoomType.PRIVATE_GROUP,
	};

	return mapping[matrixJoinRule] || RoomType.CHANNEL;
};

const tryToExtractExternalRoomNameFromTheRoomState = (roomState: AbstractMatrixEvent[] = []): { externalRoomName?: string } => {
	if (roomState.length === 0) {
		return {};
	}
	const externalRoomName = (
		roomState.find((stateEvent) => stateEvent.type === MatrixEventType.ROOM_NAME_CHANGED) as MatrixEventRoomNameChanged
	)?.content?.name;

	return {
		...(externalRoomName ? { externalRoomName } : {}),
	};
};

const tryToExtractAndConvertRoomTypeFromTheRoomState = (
	roomState: AbstractMatrixEvent[] = [],
	matrixRoomIsDirect = false,
): { roomType?: RoomType } => {
	if (roomState.length === 0) {
		return {};
	}
	const externalRoomJoinRule = (
		roomState.find((stateEvent) => stateEvent.type === MatrixEventType.ROOM_JOIN_RULES_CHANGED) as MatrixEventRoomJoinRulesChanged
	)?.content?.join_rule;

	return {
		...(externalRoomJoinRule ? { roomType: convertExternalJoinRuleToInternalRoomType(externalRoomJoinRule, matrixRoomIsDirect) } : {}),
	};
};

export class MatrixRoomReceiverConverter {
	public static toRoomCreateDto(externalEvent: MatrixEventRoomCreated): FederationRoomCreateInputDto {
		return new FederationRoomCreateInputDto({
			externalRoomId: externalEvent.room_id,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
			...tryToExtractExternalRoomNameFromTheRoomState(externalEvent.invite_room_state || externalEvent.unsigned?.invite_room_state),
			...tryToExtractAndConvertRoomTypeFromTheRoomState(externalEvent.invite_room_state || externalEvent.unsigned?.invite_room_state),
			externalInviterId: externalEvent.sender,
			normalizedInviterId: removeExternalSpecificCharsFromExternalIdentifier(externalEvent.sender),
			wasInternallyProgramaticallyCreated: externalEvent.content?.was_internally_programatically_created || false,
			internalRoomId: externalEvent.content?.internalRoomId,
		});
	}

	public static toChangeRoomMembershipDto(
		externalEvent: MatrixEventRoomMembershipChanged,
		homeServerDomain: string,
	): FederationRoomChangeMembershipDto {
		return new FederationRoomChangeMembershipDto({
			externalRoomId: externalEvent.room_id,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
			...tryToExtractExternalRoomNameFromTheRoomState(externalEvent.invite_room_state || externalEvent.unsigned?.invite_room_state),
			...tryToExtractAndConvertRoomTypeFromTheRoomState(
				externalEvent.invite_room_state || externalEvent.unsigned?.invite_room_state,
				externalEvent.content?.is_direct,
			),
			externalInviterId: externalEvent.sender,
			normalizedInviterId: removeExternalSpecificCharsFromExternalIdentifier(externalEvent.sender),
			externalInviteeId: externalEvent.state_key,
			normalizedInviteeId: removeExternalSpecificCharsFromExternalIdentifier(externalEvent.state_key),
			inviteeUsernameOnly: formatExternalUserIdToInternalUsernameFormat(externalEvent.state_key),
			inviterUsernameOnly: formatExternalUserIdToInternalUsernameFormat(externalEvent.sender),
			eventOrigin: getEventOrigin(externalEvent.sender, homeServerDomain),
			leave: externalEvent.content?.membership === RoomMembershipChangedEventType.LEAVE,
		});
	}

	public static toSendRoomMessageDto(externalEvent: MatrixEventRoomMessageSent): FederationRoomReceiveExternalMessageDto {
		return new FederationRoomReceiveExternalMessageDto({
			externalRoomId: externalEvent.room_id,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
			externalSenderId: externalEvent.sender,
			normalizedSenderId: removeExternalSpecificCharsFromExternalIdentifier(externalEvent.sender),
			messageText: externalEvent.content?.body,
		});
	}

	public static toRoomChangeJoinRulesDto(externalEvent: MatrixEventRoomJoinRulesChanged): FederationRoomChangeJoinRulesDto {
		return new FederationRoomChangeJoinRulesDto({
			externalRoomId: externalEvent.room_id,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
			roomType: convertExternalJoinRuleToInternalRoomType(externalEvent.content?.join_rule),
		});
	}

	public static toRoomChangeNameDto(externalEvent: MatrixEventRoomNameChanged): FederationRoomChangeNameDto {
		return new FederationRoomChangeNameDto({
			externalRoomId: externalEvent.room_id,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
			externalSenderId: externalEvent.sender,
			normalizedRoomName: removeExternalSpecificCharsFromExternalIdentifier(externalEvent.content?.name),
		});
	}

	public static toRoomChangeTopicDto(externalEvent: MatrixEventRoomTopicChanged): FederationRoomChangeTopicDto {
		return new FederationRoomChangeTopicDto({
			externalRoomId: externalEvent.room_id,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
			externalSenderId: externalEvent.sender,
			roomTopic: externalEvent.content?.topic,
		});
	}
}
