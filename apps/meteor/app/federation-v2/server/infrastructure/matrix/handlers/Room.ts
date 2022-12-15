import type { FederationRoomServiceListener } from '../../../application/RoomServiceListener';
import type { RocketChatSettingsAdapter } from '../../rocket-chat/adapters/Settings';
import { MatrixRoomReceiverConverter } from '../converters/RoomReceiver';
import { MatrixBaseEventHandler } from './BaseEvent';
import type { MatrixEventRoomCreated } from '../definitions/events/RoomCreated';
import type { MatrixEventRoomMembershipChanged } from '../definitions/events/RoomMembershipChanged';
import type { MatrixEventRoomJoinRulesChanged } from '../definitions/events/RoomJoinRulesChanged';
import type { MatrixEventRoomNameChanged } from '../definitions/events/RoomNameChanged';
import type { IMatrixEventContentRoomMessageSent, MatrixEventRoomMessageSent } from '../definitions/events/RoomMessageSent';
import { MatrixEnumRelatesToRelType, MatrixEnumSendMessageType } from '../definitions/events/RoomMessageSent';
import type { MatrixEventRoomTopicChanged } from '../definitions/events/RoomTopicChanged';
import { MatrixEventType } from '../definitions/MatrixEventType';
import type { MatrixEventRoomRedacted } from '../definitions/events/RoomEventRedacted';

export class MatrixRoomCreatedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_CREATED;

	constructor(private roomService: FederationRoomServiceListener) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomCreated): Promise<void> {
		await this.roomService.onCreateRoom(MatrixRoomReceiverConverter.toRoomCreateDto(externalEvent));
	}
}

export class MatrixRoomMembershipChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_MEMBERSHIP_CHANGED;

	constructor(private roomService: FederationRoomServiceListener, private rocketSettingsAdapter: RocketChatSettingsAdapter) {
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

	constructor(private roomService: FederationRoomServiceListener, private rocketSettingsAdapter: RocketChatSettingsAdapter) {
		super();
	}

	private executeTextMessageHandler(eventContent: IMatrixEventContentRoomMessageSent, externalEvent: MatrixEventRoomMessageSent): any {
		const isAnEditionEvent =
			eventContent['m.new_content'] &&
			eventContent['m.relates_to'] &&
			eventContent['m.relates_to'].rel_type === MatrixEnumRelatesToRelType.REPLACE;
		return isAnEditionEvent
			? this.roomService.onExternalMessageEditedReceived(
					MatrixRoomReceiverConverter.toEditRoomMessageDto(externalEvent, this.rocketSettingsAdapter.getHomeServerDomain()),
			  )
			: this.roomService.onExternalMessageReceived(
					MatrixRoomReceiverConverter.toSendRoomMessageDto(externalEvent, this.rocketSettingsAdapter.getHomeServerDomain()),
			  );
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
				this.roomService.onExternalMessageReceived(
					MatrixRoomReceiverConverter.toSendRoomMessageDto(externalEvent, this.rocketSettingsAdapter.getHomeServerDomain()),
				),
			[MatrixEnumSendMessageType.VIDEO]: () =>
				this.roomService.onExternalFileMessageReceived(MatrixRoomReceiverConverter.toSendRoomFileMessageDto(externalEvent)),
			[MatrixEnumSendMessageType.EMOTE]: () =>
				this.roomService.onExternalMessageReceived(
					MatrixRoomReceiverConverter.toSendRoomMessageDto(externalEvent, this.rocketSettingsAdapter.getHomeServerDomain()),
				),
			[MatrixEnumSendMessageType.LOCATION]: () => {
				throw new Error('Location events are not supported yet');
			},
		};
		const defaultHandler = () =>
			this.roomService.onExternalMessageReceived(
				MatrixRoomReceiverConverter.toSendRoomMessageDto(externalEvent, this.rocketSettingsAdapter.getHomeServerDomain()),
			);

		await (handlers[externalEvent.content.msgtype as MatrixEnumSendMessageType] || defaultHandler)();
	}
}

export class MatrixRoomJoinRulesChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_JOIN_RULES_CHANGED;

	constructor(private roomService: FederationRoomServiceListener) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomJoinRulesChanged): Promise<void> {
		await this.roomService.onChangeJoinRules(MatrixRoomReceiverConverter.toRoomChangeJoinRulesDto(externalEvent));
	}
}

export class MatrixRoomNameChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_NAME_CHANGED;

	constructor(private roomService: FederationRoomServiceListener) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomNameChanged): Promise<void> {
		await this.roomService.onChangeRoomName(MatrixRoomReceiverConverter.toRoomChangeNameDto(externalEvent));
	}
}

export class MatrixRoomTopicChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_TOPIC_CHANGED;

	constructor(private roomService: FederationRoomServiceListener) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomTopicChanged): Promise<void> {
		await this.roomService.onChangeRoomTopic(MatrixRoomReceiverConverter.toRoomChangeTopicDto(externalEvent));
	}
}

export class MatrixRoomEventRedactedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventType.ROOM_EVENT_REDACTED;

	constructor(private roomService: FederationRoomServiceListener) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomRedacted): Promise<void> {
		await this.roomService.onRedactEvent(MatrixRoomReceiverConverter.toRoomRedactEventDto(externalEvent));
	}
}
