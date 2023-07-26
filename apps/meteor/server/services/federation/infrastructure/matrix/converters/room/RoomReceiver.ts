import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import {
	FederationRoomChangeJoinRulesDto,
	FederationRoomChangeMembershipDto,
	FederationRoomChangeNameDto,
	FederationRoomChangeTopicDto,
	FederationRoomCreateInputDto,
	FederationRoomEditExternalMessageDto,
	FederationRoomReceiveExternalFileMessageDto,
	FederationRoomReceiveExternalMessageDto,
	FederationRoomRedactEventDto,
	FederationRoomRoomChangePowerLevelsEventDto,
} from '../../../../application/room/input/RoomReceiverDto';
import type { IExternalRolesChangesToApplyInputDto } from '../../../../application/room/input/RoomReceiverDto';
import { EVENT_ORIGIN } from '../../../../domain/IFederationBridge';
import { ROCKET_CHAT_FEDERATION_ROLES } from '../../../rocket-chat/definitions/FederatedRoomInternalRoles';
import type { AbstractMatrixEvent } from '../../definitions/AbstractMatrixEvent';
import { MatrixEventType } from '../../definitions/MatrixEventType';
import { MATRIX_POWER_LEVELS } from '../../definitions/MatrixPowerLevels';
import { MatrixRoomJoinRules } from '../../definitions/MatrixRoomJoinRules';
import type { MatrixEventRoomCreated } from '../../definitions/events/RoomCreated';
import type { MatrixEventRoomRedacted } from '../../definitions/events/RoomEventRedacted';
import type { MatrixEventRoomJoinRulesChanged } from '../../definitions/events/RoomJoinRulesChanged';
import type { MatrixEventRoomMembershipChanged } from '../../definitions/events/RoomMembershipChanged';
import { RoomMembershipChangedEventType } from '../../definitions/events/RoomMembershipChanged';
import type { MatrixEventRoomMessageSent } from '../../definitions/events/RoomMessageSent';
import type { MatrixEventRoomNameChanged } from '../../definitions/events/RoomNameChanged';
import type {
	IMatrixEventContentRoomPowerLevelsChanged,
	MatrixEventRoomRoomPowerLevelsChanged,
} from '../../definitions/events/RoomPowerLevelsChanged';
import type { MatrixEventRoomTopicChanged } from '../../definitions/events/RoomTopicChanged';

/** @deprecated export from {@link ../../helpers/MatrixIdStringTools} instead */
export const removeExternalSpecificCharsFromExternalIdentifier = (matrixIdentifier = ''): string => {
	return matrixIdentifier.replace('@', '').replace('!', '').replace('#', '');
};

/** @deprecated export from {@link ../../helpers/MatrixIdStringTools} instead */
export const formatExternalUserIdToInternalUsernameFormat = (matrixUserId = ''): string => {
	return matrixUserId.split(':')[0]?.replace('@', '');
};

export const isAnExternalIdentifierFormat = (identifier: string): boolean => identifier.includes(':');

/** @deprecated export from {@link ../../helpers/MatrixIdStringTools} instead */
export const isAnExternalUserIdFormat = (userId: string): boolean => isAnExternalIdentifierFormat(userId) && userId.includes('@');

/** @deprecated export from {@link ../../helpers/MatrixIdStringTools} instead */
export const extractServerNameFromExternalIdentifier = (identifier = ''): string => {
	const splitted = identifier.split(':');

	return splitted.length > 1 ? splitted[1] : '';
};

export const convertExternalRoomIdToInternalRoomIdFormat = (matrixRoomId = ''): string => {
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
		...(externalRoomName ? { externalRoomName: removeExternalSpecificCharsFromExternalIdentifier(externalRoomName) } : {}),
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

const convertNumericalPowerLevelToInternalRole = (powerLevel: number): ROCKET_CHAT_FEDERATION_ROLES | undefined => {
	const mapping: Record<number, ROCKET_CHAT_FEDERATION_ROLES | undefined> = {
		[MATRIX_POWER_LEVELS.USER]: undefined,
		[MATRIX_POWER_LEVELS.MODERATOR]: ROCKET_CHAT_FEDERATION_ROLES.MODERATOR,
		[MATRIX_POWER_LEVELS.ADMIN]: ROCKET_CHAT_FEDERATION_ROLES.OWNER,
	};

	if (mapping[powerLevel]) {
		return mapping[powerLevel];
	}

	if (powerLevel <= MATRIX_POWER_LEVELS.USER) {
		return;
	}
	if (powerLevel > MATRIX_POWER_LEVELS.USER && powerLevel <= MATRIX_POWER_LEVELS.MODERATOR) {
		return ROCKET_CHAT_FEDERATION_ROLES.MODERATOR;
	}
	return ROCKET_CHAT_FEDERATION_ROLES.OWNER;
};

const onlyRolesAddedToDefaultUsers = (previousRolesState: { [key: string]: number }, externalUserId: string): boolean =>
	!previousRolesState[externalUserId];

const verifyIfNewRolesWereAddedForDefaultUsers = (
	currentRolesState: { [key: string]: number },
	previousRolesState: { [key: string]: number },
	changesAlreadyMadeToRoles: IExternalRolesChangesToApplyInputDto,
): IExternalRolesChangesToApplyInputDto =>
	Object.keys(currentRolesState)
		.filter((externalUserId) => onlyRolesAddedToDefaultUsers(previousRolesState, externalUserId))
		.reduce((externalRolesChangesForDefaultUsers, externalUserId) => {
			const isCurrentRoleAnOwner =
				convertNumericalPowerLevelToInternalRole(currentRolesState[externalUserId]) === ROCKET_CHAT_FEDERATION_ROLES.OWNER;
			externalRolesChangesForDefaultUsers[externalUserId] = isCurrentRoleAnOwner
				? [{ action: 'add', role: ROCKET_CHAT_FEDERATION_ROLES.OWNER }]
				: [{ action: 'add', role: ROCKET_CHAT_FEDERATION_ROLES.MODERATOR }];
			return externalRolesChangesForDefaultUsers;
		}, changesAlreadyMadeToRoles);

const createExternalRolesChangesActions = (
	currentRolesState: { [key: string]: number } = {},
	previousRolesState: { [key: string]: number } = {},
): IExternalRolesChangesToApplyInputDto => {
	const changesInRolesBasedOnPreviousState = Object.keys(previousRolesState).reduce((externalRolesChangesByUser, externalUserId) => {
		const currentPowerLevel = currentRolesState[externalUserId];
		const previousPowerLevel = previousRolesState[externalUserId];
		const convertedPreviousExternalRole = convertNumericalPowerLevelToInternalRole(previousPowerLevel);
		const convertedCurrentExternalRole = convertNumericalPowerLevelToInternalRole(currentPowerLevel);
		const wasPreviousRoleAnOwner = convertedPreviousExternalRole === ROCKET_CHAT_FEDERATION_ROLES.OWNER;
		const isCurrentRoleAnOwner = convertedCurrentExternalRole === ROCKET_CHAT_FEDERATION_ROLES.OWNER;
		const isCurrentRoleADefault = currentPowerLevel === undefined;
		const isStillTheSameRole = currentPowerLevel === previousPowerLevel;
		const isDowngradingTheRole = currentPowerLevel < previousPowerLevel;
		if (isCurrentRoleADefault) {
			externalRolesChangesByUser[externalUserId] = wasPreviousRoleAnOwner
				? [{ action: 'remove', role: ROCKET_CHAT_FEDERATION_ROLES.OWNER }]
				: [{ action: 'remove', role: ROCKET_CHAT_FEDERATION_ROLES.MODERATOR }];
			return externalRolesChangesByUser;
		}
		if (isStillTheSameRole) {
			return externalRolesChangesByUser;
		}
		if (isDowngradingTheRole) {
			externalRolesChangesByUser[externalUserId] = [
				...(convertedPreviousExternalRole ? [{ action: 'remove', role: convertedPreviousExternalRole }] : []),
				...(convertedCurrentExternalRole ? [{ action: 'add', role: convertedCurrentExternalRole }] : []),
			];
			return externalRolesChangesByUser;
		}
		externalRolesChangesByUser[externalUserId] = isCurrentRoleAnOwner
			? [
					{ action: 'add', role: ROCKET_CHAT_FEDERATION_ROLES.OWNER },
					{ action: 'remove', role: ROCKET_CHAT_FEDERATION_ROLES.MODERATOR },
			  ]
			: [
					{ action: 'add', role: ROCKET_CHAT_FEDERATION_ROLES.MODERATOR },
					{ action: 'remove', role: ROCKET_CHAT_FEDERATION_ROLES.OWNER },
			  ];

		return externalRolesChangesByUser;
	}, {} as IExternalRolesChangesToApplyInputDto);

	return verifyIfNewRolesWereAddedForDefaultUsers(currentRolesState, previousRolesState, changesInRolesBasedOnPreviousState);
};

const getInviteesFromRoomState = (
	roomState: AbstractMatrixEvent[] = [],
): {
	externalInviteeId: string;
	normalizedInviteeId: string;
	inviteeUsernameOnly: string;
}[] => {
	const inviteesFromRoomState = (
		roomState?.find((stateEvent) => stateEvent.type === MatrixEventType.ROOM_CREATED) as MatrixEventRoomCreated
	)?.content.inviteesExternalIds;
	if (inviteesFromRoomState) {
		return inviteesFromRoomState.map((inviteeExternalId) => ({
			externalInviteeId: inviteeExternalId,
			normalizedInviteeId: removeExternalSpecificCharsFromExternalIdentifier(inviteeExternalId),
			inviteeUsernameOnly: formatExternalUserIdToInternalUsernameFormat(inviteeExternalId),
		}));
	}
	return [];
};

const extractAllInviteeIdsWhenDM = (
	externalEvent: MatrixEventRoomMembershipChanged,
): {
	externalInviteeId: string;
	normalizedInviteeId: string;
	inviteeUsernameOnly: string;
}[] => {
	if (!externalEvent.invite_room_state && !externalEvent.unsigned?.invite_room_state) {
		return [];
	}

	return getInviteesFromRoomState(externalEvent.invite_room_state || externalEvent.unsigned?.invite_room_state || []);
};

export class MatrixRoomReceiverConverter {
	public static toRoomCreateDto(externalEvent: MatrixEventRoomCreated): FederationRoomCreateInputDto {
		return new FederationRoomCreateInputDto({
			externalEventId: externalEvent.event_id,
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
			externalEventId: externalEvent.event_id,
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
			userProfile: {
				avatarUrl: externalEvent.content?.avatar_url,
				displayName: externalEvent.content?.displayname,
			},
			...(externalEvent.content?.is_direct ? { allInviteesExternalIdsWhenDM: extractAllInviteeIdsWhenDM(externalEvent) } : {}),
		});
	}

	public static toSendRoomMessageDto(externalEvent: MatrixEventRoomMessageSent): FederationRoomReceiveExternalMessageDto {
		return new FederationRoomReceiveExternalMessageDto({
			externalEventId: externalEvent.event_id,
			externalRoomId: externalEvent.room_id,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
			externalSenderId: externalEvent.sender,
			normalizedSenderId: removeExternalSpecificCharsFromExternalIdentifier(externalEvent.sender),
			externalFormattedText: externalEvent.content.formatted_body || '',
			rawMessage: externalEvent.content.body,
			replyToEventId: externalEvent.content?.['m.relates_to']?.['m.in_reply_to']?.event_id,
		});
	}

	public static toEditRoomMessageDto(externalEvent: MatrixEventRoomMessageSent): FederationRoomEditExternalMessageDto {
		return new FederationRoomEditExternalMessageDto({
			externalEventId: externalEvent.event_id,
			externalRoomId: externalEvent.room_id,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
			externalSenderId: externalEvent.sender,
			normalizedSenderId: removeExternalSpecificCharsFromExternalIdentifier(externalEvent.sender),
			newExternalFormattedText: externalEvent.content['m.new_content']?.formatted_body || '',
			newRawMessage: externalEvent.content['m.new_content']?.body as string,
			editsEvent: externalEvent.content['m.relates_to']?.event_id as string,
		});
	}

	public static toSendRoomFileMessageDto(externalEvent: MatrixEventRoomMessageSent): FederationRoomReceiveExternalFileMessageDto {
		if (!externalEvent.content.url) {
			throw new Error('Missing url in the file message');
		}
		if (!externalEvent.content.info?.mimetype) {
			throw new Error('Missing mimetype in the file message info');
		}
		if (!externalEvent.content.info?.size) {
			throw new Error('Missing size in the file message info');
		}
		return new FederationRoomReceiveExternalFileMessageDto({
			externalEventId: externalEvent.event_id,
			externalRoomId: externalEvent.room_id,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
			externalSenderId: externalEvent.sender,
			normalizedSenderId: removeExternalSpecificCharsFromExternalIdentifier(externalEvent.sender),
			filename: externalEvent.content.body,
			url: externalEvent.content.url,
			mimetype: externalEvent.content.info.mimetype,
			size: externalEvent.content.info.size,
			messageText: externalEvent.content.body,
			replyToEventId: externalEvent.content?.['m.relates_to']?.['m.in_reply_to']?.event_id,
		});
	}

	public static toRoomChangeJoinRulesDto(externalEvent: MatrixEventRoomJoinRulesChanged): FederationRoomChangeJoinRulesDto {
		return new FederationRoomChangeJoinRulesDto({
			externalEventId: externalEvent.event_id,
			externalRoomId: externalEvent.room_id,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
			roomType: convertExternalJoinRuleToInternalRoomType(externalEvent.content?.join_rule),
		});
	}

	public static toRoomChangeNameDto(externalEvent: MatrixEventRoomNameChanged): FederationRoomChangeNameDto {
		return new FederationRoomChangeNameDto({
			externalEventId: externalEvent.event_id,
			externalRoomId: externalEvent.room_id,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
			externalSenderId: externalEvent.sender,
			normalizedRoomName: removeExternalSpecificCharsFromExternalIdentifier(externalEvent.content?.name),
		});
	}

	public static toRoomChangeTopicDto(externalEvent: MatrixEventRoomTopicChanged): FederationRoomChangeTopicDto {
		return new FederationRoomChangeTopicDto({
			externalEventId: externalEvent.event_id,
			externalRoomId: externalEvent.room_id,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
			externalSenderId: externalEvent.sender,
			roomTopic: externalEvent.content?.topic,
		});
	}

	public static toRoomRedactEventDto(externalEvent: MatrixEventRoomRedacted): FederationRoomRedactEventDto {
		return new FederationRoomRedactEventDto({
			externalEventId: externalEvent.event_id,
			externalRoomId: externalEvent.room_id,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
			externalSenderId: externalEvent.sender,
			redactsEvent: externalEvent.redacts as string,
		});
	}

	public static toRoomChangePowerLevelsEventDto(
		externalEvent: MatrixEventRoomRoomPowerLevelsChanged,
	): FederationRoomRoomChangePowerLevelsEventDto {
		return new FederationRoomRoomChangePowerLevelsEventDto({
			externalEventId: externalEvent.event_id,
			externalRoomId: externalEvent.room_id,
			normalizedRoomId: convertExternalRoomIdToInternalRoomIdFormat(externalEvent.room_id),
			externalSenderId: externalEvent.sender,
			roleChangesToApply: createExternalRolesChangesActions(
				externalEvent.content?.users,
				(externalEvent.prev_content as IMatrixEventContentRoomPowerLevelsChanged)?.users || {},
			),
		});
	}
}
