import { FederationRoomServiceReceiver } from '../../../application/RoomServiceReceiver';
import { RocketChatSettingsAdapter } from '../../rocket-chat/adapters/Settings';
import { MatrixRoomReceiverConverter } from '../converters/RoomReceiver';
import { MatrixBaseEventHandler } from './BaseEvent';
import { MatrixEventRoomCreated } from '../definitions/events/RoomCreated';
import { MatrixEventRoomMembershipChanged } from '../definitions/events/RoomMembershipChanged';
import { MatrixEventRoomJoinRulesChanged } from '../definitions/events/RoomJoinRulesChanged';
import { MatrixEventRoomNameChanged } from '../definitions/events/RoomNameChanged';
import { MatrixEventRoomMessageSent } from '../definitions/events/RoomMessageSent';
import { MatrixEventRoomTopicChanged } from '../definitions/events/RoomTopicChanged';
import { MatrixEventType } from '../definitions/MatrixEventType';

export class MatrixRoomCreatedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_CREATED;

	constructor(private roomService: FederationRoomServiceReceiver) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomCreated): Promise<void> {
		await this.roomService.createRoom(MatrixRoomReceiverConverter.toRoomCreateDto(externalEvent));
	}
}

export class MatrixRoomMembershipChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_MEMBERSHIP_CHANGED;

	constructor(private roomService: FederationRoomServiceReceiver, private rocketSettingsAdapter: RocketChatSettingsAdapter) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomMembershipChanged): Promise<void> {
		await this.roomService.changeRoomMembership(
			MatrixRoomReceiverConverter.toChangeRoomMembershipDto(externalEvent, this.rocketSettingsAdapter.getHomeServerDomain()),
		);
	}
}

export class MatrixRoomMessageSentHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_MESSAGE_SENT;

	constructor(private roomService: FederationRoomServiceReceiver) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomMessageSent): Promise<void> {
		await this.roomService.receiveExternalMessage(MatrixRoomReceiverConverter.toSendRoomMessageDto(externalEvent));
	}
}

export class MatrixRoomJoinRulesChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_JOIN_RULES_CHANGED;

	constructor(private roomService: FederationRoomServiceReceiver) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomJoinRulesChanged): Promise<void> {
		await this.roomService.changeJoinRules(MatrixRoomReceiverConverter.toRoomChangeJoinRulesDto(externalEvent));
	}
}

export class MatrixRoomNameChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_NAME_CHANGED;

	constructor(private roomService: FederationRoomServiceReceiver) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomNameChanged): Promise<void> {
		await this.roomService.changeRoomName(MatrixRoomReceiverConverter.toRoomChangeNameDto(externalEvent));
	}
}

export class MatrixRoomTopicChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_TOPIC_CHANGED;

	constructor(private roomService: FederationRoomServiceReceiver) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomTopicChanged): Promise<void> {
		await this.roomService.changeRoomTopic(MatrixRoomReceiverConverter.toRoomChangeTopicDto(externalEvent));
	}
}
