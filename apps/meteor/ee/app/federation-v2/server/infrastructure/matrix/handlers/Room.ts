import { FederationRoomServiceReceiverEE } from '../../../application/RoomServiceReceiver';
import { MatrixRoomReceiverConverterEE } from '../converters/RoomReceiver';
import { IMatrixEventEE } from '../definitions/IMatrixEvent';
import { MatrixEventTypeEE } from '../definitions/MatrixEventType';
import { MatrixBaseEventHandlerEE } from './BaseEvent';

export class MatrixRoomJoinRulesChangedHandler extends MatrixBaseEventHandlerEE<MatrixEventTypeEE.ROOM_JOIN_RULES_CHANGED> {
	constructor(private roomService: FederationRoomServiceReceiverEE) {
		super(MatrixEventTypeEE.ROOM_JOIN_RULES_CHANGED);
	}

	public async handle(externalEvent: IMatrixEventEE<MatrixEventTypeEE.ROOM_JOIN_RULES_CHANGED>): Promise<void> {
		await this.roomService.changeJoinRules(MatrixRoomReceiverConverterEE.toRoomChangeJoinRulesDto(externalEvent));
	}
}

export class MatrixRoomNameChangedHandler extends MatrixBaseEventHandlerEE<MatrixEventTypeEE.ROOM_NAME_CHANGED> {
	constructor(private roomService: FederationRoomServiceReceiverEE) {
		super(MatrixEventTypeEE.ROOM_NAME_CHANGED);
	}

	public async handle(externalEvent: IMatrixEventEE<MatrixEventTypeEE.ROOM_NAME_CHANGED>): Promise<void> {
		await this.roomService.changeRoomName(MatrixRoomReceiverConverterEE.toRoomChangeNameDto(externalEvent));
	}
}

export class MatrixRoomTopicChangedHandler extends MatrixBaseEventHandlerEE<MatrixEventTypeEE.ROOM_TOPIC_CHANGED> {
	constructor(private roomService: FederationRoomServiceReceiverEE) {
		super(MatrixEventTypeEE.ROOM_TOPIC_CHANGED);
	}

	public async handle(externalEvent: IMatrixEventEE<MatrixEventTypeEE.ROOM_TOPIC_CHANGED>): Promise<void> {
		await this.roomService.changeRoomTopic(MatrixRoomReceiverConverterEE.toRoomChangeTopicDto(externalEvent));
	}
}
