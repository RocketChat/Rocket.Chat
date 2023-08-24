import type { FederationRoomServiceReceiver } from '../../../application/room/receiver/RoomServiceReceiver';
import type { RocketChatSettingsAdapter } from '../../rocket-chat/adapters/Settings';
import { MatrixRoomReceiverConverter } from '../converters/room/RoomReceiver';
import { MatrixEventType } from '../definitions/MatrixEventType';
import type { MatrixEventRoomCreated } from '../definitions/events/RoomCreated';
import type { MatrixEventRoomRedacted } from '../definitions/events/RoomEventRedacted';
import type { MatrixEventRoomJoinRulesChanged } from '../definitions/events/RoomJoinRulesChanged';
import type { MatrixEventRoomMembershipChanged } from '../definitions/events/RoomMembershipChanged';
import type { IMatrixEventContentRoomMessageSent, MatrixEventRoomMessageSent } from '../definitions/events/RoomMessageSent';
import { MatrixEnumRelatesToRelType, MatrixEnumSendMessageType } from '../definitions/events/RoomMessageSent';
import type { MatrixEventRoomNameChanged } from '../definitions/events/RoomNameChanged';
import type { MatrixEventRoomRoomPowerLevelsChanged } from '../definitions/events/RoomPowerLevelsChanged';
import type { MatrixEventRoomTopicChanged } from '../definitions/events/RoomTopicChanged';
import { MatrixBaseEventHandler } from './BaseEvent';

export class MatrixRoomCreatedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_CREATED;

	constructor(private roomService: FederationRoomServiceReceiver) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomCreated): Promise<void> {
		await this.roomService.onCreateRoom(MatrixRoomReceiverConverter.toRoomCreateDto(externalEvent));
	}
}

export class MatrixRoomMembershipChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_MEMBERSHIP_CHANGED;

	constructor(private roomService: FederationRoomServiceReceiver, private rocketSettingsAdapter: RocketChatSettingsAdapter) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomMembershipChanged): Promise<void> {
		await this.roomService.onChangeRoomMembership(
			MatrixRoomReceiverConverter.toChangeRoomMembershipDto(externalEvent, this.rocketSettingsAdapter.getHomeServerDomain()),
		);
	}
}

export class MatrixRoomMessageSentHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_MESSAGE_SENT;

	constructor(private roomService: FederationRoomServiceReceiver) {
		super();
	}

	private executeTextMessageHandler(eventContent: IMatrixEventContentRoomMessageSent, externalEvent: MatrixEventRoomMessageSent): any {
		const isAnEditionEvent =
			eventContent['m.new_content'] &&
			eventContent['m.relates_to'] &&
			eventContent['m.relates_to'].rel_type === MatrixEnumRelatesToRelType.REPLACE;
		return isAnEditionEvent
			? this.roomService.onExternalMessageEditedReceived(MatrixRoomReceiverConverter.toEditRoomMessageDto(externalEvent))
			: this.roomService.onExternalMessageReceived(MatrixRoomReceiverConverter.toSendRoomMessageDto(externalEvent));
	}

	private executeThreadedTextMessageHandler(
		eventContent: IMatrixEventContentRoomMessageSent,
		externalEvent: MatrixEventRoomMessageSent,
	): any {
		const isAnEditionEvent =
			eventContent['m.new_content'] &&
			eventContent['m.relates_to'] &&
			eventContent['m.relates_to'].rel_type === MatrixEnumRelatesToRelType.REPLACE;
		return isAnEditionEvent
			? this.roomService.onExternalMessageEditedReceived(MatrixRoomReceiverConverter.toEditRoomMessageDto(externalEvent))
			: this.roomService.onExternalThreadedMessageReceived(MatrixRoomReceiverConverter.toSendRoomMessageDto(externalEvent));
	}

	public async handle(externalEvent: MatrixEventRoomMessageSent): Promise<void> {
		const handlers = {
			[MatrixEnumSendMessageType.TEXT]: () => this.executeTextMessageHandler(externalEvent.content, externalEvent),
			[MatrixEnumSendMessageType.AUDIO]: () =>
				this.roomService.onExternalFileMessageReceived(MatrixRoomReceiverConverter.toSendRoomFileMessageDto(externalEvent)),
			[MatrixEnumSendMessageType.FILE]: () =>
				this.roomService.onExternalFileMessageReceived(MatrixRoomReceiverConverter.toSendRoomFileMessageDto(externalEvent)),
			[MatrixEnumSendMessageType.IMAGE]: () =>
				this.roomService.onExternalFileMessageReceived(MatrixRoomReceiverConverter.toSendRoomFileMessageDto(externalEvent)),
			[MatrixEnumSendMessageType.NOTICE]: () =>
				this.roomService.onExternalMessageReceived(MatrixRoomReceiverConverter.toSendRoomMessageDto(externalEvent)),
			[MatrixEnumSendMessageType.VIDEO]: () =>
				this.roomService.onExternalFileMessageReceived(MatrixRoomReceiverConverter.toSendRoomFileMessageDto(externalEvent)),
			[MatrixEnumSendMessageType.EMOTE]: () =>
				this.roomService.onExternalMessageReceived(MatrixRoomReceiverConverter.toSendRoomMessageDto(externalEvent)),
			[MatrixEnumSendMessageType.LOCATION]: () => {
				throw new Error('Location events are not supported yet');
			},
		};

		const threadHandlers = {
			[MatrixEnumSendMessageType.TEXT]: () => this.executeThreadedTextMessageHandler(externalEvent.content, externalEvent),
			[MatrixEnumSendMessageType.AUDIO]: () =>
				this.roomService.onExternalThreadedFileMessageReceived(MatrixRoomReceiverConverter.toSendRoomFileMessageDto(externalEvent)),
			[MatrixEnumSendMessageType.FILE]: () =>
				this.roomService.onExternalThreadedFileMessageReceived(MatrixRoomReceiverConverter.toSendRoomFileMessageDto(externalEvent)),
			[MatrixEnumSendMessageType.IMAGE]: () =>
				this.roomService.onExternalThreadedFileMessageReceived(MatrixRoomReceiverConverter.toSendRoomFileMessageDto(externalEvent)),
			[MatrixEnumSendMessageType.NOTICE]: () =>
				this.roomService.onExternalThreadedMessageReceived(MatrixRoomReceiverConverter.toSendRoomMessageDto(externalEvent)),
			[MatrixEnumSendMessageType.VIDEO]: () =>
				this.roomService.onExternalThreadedFileMessageReceived(MatrixRoomReceiverConverter.toSendRoomFileMessageDto(externalEvent)),
			[MatrixEnumSendMessageType.EMOTE]: () =>
				this.roomService.onExternalThreadedMessageReceived(MatrixRoomReceiverConverter.toSendRoomMessageDto(externalEvent)),
			[MatrixEnumSendMessageType.LOCATION]: () => {
				throw new Error('Location events are not supported yet');
			},
		};

		const defaultHandler = () =>
			this.roomService.onExternalThreadedMessageReceived(MatrixRoomReceiverConverter.toSendRoomMessageDto(externalEvent));
		const threadedDefaultHandler = () =>
			this.roomService.onExternalThreadedMessageReceived(MatrixRoomReceiverConverter.toSendRoomMessageDto(externalEvent));

		const isThreadedMessage = Boolean(externalEvent.content?.['m.relates_to']?.rel_type === MatrixEventType.MESSAGE_ON_THREAD);
		if (isThreadedMessage) {
			return (threadHandlers[externalEvent.content.msgtype as MatrixEnumSendMessageType] || threadedDefaultHandler)();
		}
		await (handlers[externalEvent.content.msgtype as MatrixEnumSendMessageType] || defaultHandler)();
	}
}

export class MatrixRoomJoinRulesChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_JOIN_RULES_CHANGED;

	constructor(private roomService: FederationRoomServiceReceiver) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomJoinRulesChanged): Promise<void> {
		await this.roomService.onChangeJoinRules(MatrixRoomReceiverConverter.toRoomChangeJoinRulesDto(externalEvent));
	}
}

export class MatrixRoomNameChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_NAME_CHANGED;

	constructor(private roomService: FederationRoomServiceReceiver) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomNameChanged): Promise<void> {
		await this.roomService.onChangeRoomName(MatrixRoomReceiverConverter.toRoomChangeNameDto(externalEvent));
	}
}

export class MatrixRoomTopicChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_TOPIC_CHANGED;

	constructor(private roomService: FederationRoomServiceReceiver) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomTopicChanged): Promise<void> {
		await this.roomService.onChangeRoomTopic(MatrixRoomReceiverConverter.toRoomChangeTopicDto(externalEvent));
	}
}

export class MatrixRoomEventRedactedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_EVENT_REDACTED;

	constructor(private roomService: FederationRoomServiceReceiver) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomRedacted): Promise<void> {
		await this.roomService.onRedactEvent(MatrixRoomReceiverConverter.toRoomRedactEventDto(externalEvent));
	}
}

export class MatrixRoomPowerLevelsChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_POWER_LEVELS_CHANGED;

	constructor(private roomService: FederationRoomServiceReceiver) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomRoomPowerLevelsChanged): Promise<void> {
		await this.roomService.onChangeRoomPowerLevels(MatrixRoomReceiverConverter.toRoomChangePowerLevelsEventDto(externalEvent));
	}
}
