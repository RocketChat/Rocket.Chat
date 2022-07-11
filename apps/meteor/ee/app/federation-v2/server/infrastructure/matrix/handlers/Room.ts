import { FederationRoomServiceReceiverEE } from '../../../application/RoomServiceReceiver';
import { MatrixRoomReceiverConverterEE } from '../converters/RoomReceiver';
import { MatrixEventTypeEE } from '../definitions/MatrixEventType';
import { MatrixBaseEventHandler } from '../../../../../../../app/federation-v2/server/infrastructure/matrix/handlers/BaseEvent';
import { MatrixEventRoomJoinRulesChanged } from '../definitions/events/RoomJoinRulesChanged';
import { MatrixEventRoomNameChanged } from '../definitions/events/RoomNameChanged';
import { MatrixEventRoomTopicChanged } from '../definitions/events/RoomTopicChanged';

export class MatrixRoomJoinRulesChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventTypeEE.ROOM_JOIN_RULES_CHANGED;

	constructor(private roomService: FederationRoomServiceReceiverEE) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomJoinRulesChanged): Promise<void> {
		await this.roomService.changeJoinRules(MatrixRoomReceiverConverterEE.toRoomChangeJoinRulesDto(externalEvent));
	}
}

export class MatrixRoomNameChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventTypeEE.ROOM_NAME_CHANGED;

	constructor(private roomService: FederationRoomServiceReceiverEE) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomNameChanged): Promise<void> {
		await this.roomService.changeRoomName(MatrixRoomReceiverConverterEE.toRoomChangeNameDto(externalEvent));
	}
}

export class MatrixRoomTopicChangedHandler extends MatrixBaseEventHandler {
	public eventType: string = MatrixEventTypeEE.ROOM_TOPIC_CHANGED;

	constructor(private roomService: FederationRoomServiceReceiverEE) {
		super();
	}

	public async handle(externalEvent: MatrixEventRoomTopicChanged): Promise<void> {
		await this.roomService.changeRoomTopic(MatrixRoomReceiverConverterEE.toRoomChangeTopicDto(externalEvent));
	}
}
