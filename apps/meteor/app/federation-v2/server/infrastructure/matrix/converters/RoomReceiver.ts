import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import {
	FederationRoomChangeJoinRulesDto,
	FederationRoomChangeMembershipDto,
	FederationRoomChangeNameDto,
	FederationRoomChangeTopicDto,
	FederationRoomCreateInputDto,
	FederationRoomSendInternalMessageDto,
	IFederationReceiverBaseRoomInputDto,
} from '../../../application/input/RoomReceiverDto';
import { EVENT_ORIGIN } from '../../../domain/IFederationBridge';
import { AddMemberToRoomMembership, MatrixEventRoomMembershipChanged } from '../definitions/events/RoomMembershipChanged';
import { RoomJoinRules } from '../definitions/RoomJoinRules';
import { MatrixEventType } from '../definitions/MatrixEventType';
import { MatrixEventRoomCreated } from '../definitions/events/RoomCreated';
import { MatrixEventRoomMessageSent } from '../definitions/events/RoomMessageSent';
import { MatrixEventRoomJoinRulesChanged } from '../definitions/events/RoomJoinRulesChanged';
import { MatrixEventRoomNameChanged } from '../definitions/events/RoomNameChanged';
import { MatrixEventRoomTopicChanged } from '../definitions/events/RoomTopicChanged';

export class MatrixRoomReceiverConverter {
	public static toRoomCreateDto(externalEvent: MatrixEventRoomCreated): FederationRoomCreateInputDto {
		return new FederationRoomCreateInputDto({
			...MatrixRoomReceiverConverter.getBasicRoomsFields(externalEvent.room_id),
			...MatrixRoomReceiverConverter.tryToGetExternalInfoFromTheRoomState(
				externalEvent.invite_room_state || externalEvent.unsigned?.invite_room_state,
			),
			externalInviterId: externalEvent.sender,
			normalizedInviterId: MatrixRoomReceiverConverter.removeMatrixSpecificChars(externalEvent.sender),
			wasInternallyProgramaticallyCreated: externalEvent.content?.was_internally_programatically_created || false,
		});
	}

	public static toChangeRoomMembershipDto(
		externalEvent: MatrixEventRoomMembershipChanged,
		homeServerDomain: string,
	): FederationRoomChangeMembershipDto {
		return new FederationRoomChangeMembershipDto({
			...MatrixRoomReceiverConverter.getBasicRoomsFields(externalEvent.room_id),
			...MatrixRoomReceiverConverter.tryToGetExternalInfoFromTheRoomState(
				externalEvent.invite_room_state || externalEvent.unsigned?.invite_room_state,
				externalEvent.content?.is_direct,
			),
			externalInviterId: externalEvent.sender,
			normalizedInviterId: MatrixRoomReceiverConverter.removeMatrixSpecificChars(externalEvent.sender),
			externalInviteeId: externalEvent.state_key,
			normalizedInviteeId: MatrixRoomReceiverConverter.removeMatrixSpecificChars(externalEvent.state_key),
			inviteeUsernameOnly: MatrixRoomReceiverConverter.formatMatrixUserIdToRCUsernameFormat(externalEvent.state_key),
			inviterUsernameOnly: MatrixRoomReceiverConverter.formatMatrixUserIdToRCUsernameFormat(externalEvent.sender),
			eventOrigin: MatrixRoomReceiverConverter.getEventOrigin(externalEvent.sender, homeServerDomain),
			leave: externalEvent.content?.membership === AddMemberToRoomMembership.LEAVE,
		});
	}

	public static toSendRoomMessageDto(externalEvent: MatrixEventRoomMessageSent): FederationRoomSendInternalMessageDto {
		return new FederationRoomSendInternalMessageDto({
			...MatrixRoomReceiverConverter.getBasicRoomsFields(externalEvent.room_id),
			externalSenderId: externalEvent.sender,
			normalizedSenderId: MatrixRoomReceiverConverter.removeMatrixSpecificChars(externalEvent.sender),
			text: externalEvent.content?.body,
		});
	}

	protected static removeMatrixSpecificChars(matrixProp = ''): string {
		return matrixProp.replace('@', '').replace('!', '');
	}

	public static toRoomChangeJoinRulesDto(
		externalEvent: MatrixEventRoomJoinRulesChanged,
	): FederationRoomChangeJoinRulesDto {
		return new FederationRoomChangeJoinRulesDto({
			...MatrixRoomReceiverConverter.getBasicRoomsFields(externalEvent.room_id),
			roomType: MatrixRoomReceiverConverter.convertMatrixJoinRuleToRCRoomType(externalEvent.content?.join_rule),
		});
	}

	public static toRoomChangeNameDto(externalEvent: MatrixEventRoomNameChanged): FederationRoomChangeNameDto {
		return new FederationRoomChangeNameDto({
			...MatrixRoomReceiverConverter.getBasicRoomsFields(externalEvent.room_id),
			externalSenderId: externalEvent.sender,
			normalizedRoomName: MatrixRoomReceiverConverter.normalizeRoomNameToRCFormat(externalEvent.content?.name),
		});
	}

	public static toRoomChangeTopicDto(externalEvent: MatrixEventRoomTopicChanged): FederationRoomChangeTopicDto {
		return new FederationRoomChangeTopicDto({
			...MatrixRoomReceiverConverter.getBasicRoomsFields(externalEvent.room_id),
			externalSenderId: externalEvent.sender,
			roomTopic: externalEvent.content?.topic,
		});
	}

	private static normalizeRoomNameToRCFormat(matrixRoomName = ''): string {
		return matrixRoomName.replace('@', '');
	}

	protected static convertMatrixUserIdFormatToRCFormat(matrixUserId = ''): string {
		return matrixUserId.replace('@', '');
	}

	protected static convertMatrixRoomIdFormatToRCFormat(matrixRoomId = ''): string {
		const prefixedRoomIdOnly = matrixRoomId.split(':')[0];
		const prefix = '!';

		return prefixedRoomIdOnly?.replace(prefix, '');
	}

	protected static formatMatrixUserIdToRCUsernameFormat(matrixUserId = ''): string {
		return matrixUserId.split(':')[0]?.replace('@', '');
	}

	protected static getEventOrigin(inviterId = '', homeServerDomain: string): EVENT_ORIGIN {
		const fromADifferentServer = MatrixRoomReceiverConverter.extractServerNameFromMatrixUserId(inviterId) !== homeServerDomain;

		return fromADifferentServer ? EVENT_ORIGIN.REMOTE : EVENT_ORIGIN.LOCAL;
	}

	protected static extractServerNameFromMatrixUserId(matrixUserId = ''): string {
		const splitted = matrixUserId.split(':');

		return splitted.length > 1 ? splitted[1] : '';
	}

	protected static getBasicRoomsFields(externalRoomId: string): IFederationReceiverBaseRoomInputDto {
		return {
			externalRoomId,
			normalizedRoomId: MatrixRoomReceiverConverter.convertMatrixRoomIdFormatToRCFormat(externalRoomId),
		};
	}

	protected static convertMatrixJoinRuleToRCRoomType(matrixJoinRule: RoomJoinRules, matrixRoomIsDirect = false): RoomType {
		if (matrixRoomIsDirect) {
			return RoomType.DIRECT_MESSAGE;
		}
		const mapping: Record<string, RoomType> = {
			[RoomJoinRules.JOIN]: RoomType.CHANNEL,
			[RoomJoinRules.INVITE]: RoomType.PRIVATE_GROUP,
		};

		return mapping[matrixJoinRule] || RoomType.CHANNEL;
	}

	protected static tryToGetExternalInfoFromTheRoomState(
		roomState: Record<string, any>[] = [],
		matrixRoomIsDirect = false,
	): Record<string, string> {
		if (roomState.length === 0) {
			return {};
		}
		const externalRoomName = roomState.find((stateEvent: Record<string, any>) => stateEvent.type === MatrixEventType.ROOM_NAME_CHANGED)
			?.content?.name;
		const externalRoomJoinRule = roomState.find(
			(stateEvent: Record<string, any>) => stateEvent.type === MatrixEventType.ROOM_JOIN_RULES_CHANGED,
		)?.content?.join_rule;

		return {
			...(externalRoomName ? { externalRoomName } : {}),
			...(externalRoomJoinRule
				? { roomType: MatrixRoomReceiverConverter.convertMatrixJoinRuleToRCRoomType(externalRoomJoinRule, matrixRoomIsDirect) }
				: {}),
		};
	}
}
