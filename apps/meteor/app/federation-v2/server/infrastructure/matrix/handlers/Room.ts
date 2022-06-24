import { FederationRoomServiceReceiver } from '../../../application/RoomServiceReceiver';
import { RocketChatSettingsAdapter } from '../../rocket-chat/adapters/Settings';
import { MatrixRoomReceiverConverter } from '../converters/RoomReceiver';
import { IMatrixEvent } from '../definitions/IMatrixEvent';
import { MatrixEventType } from '../definitions/MatrixEventType';
import { MatrixBaseEventHandler } from './BaseEvent';

export class MatrixRoomCreatedHandler extends MatrixBaseEventHandler<MatrixEventType.ROOM_CREATED> {
	constructor(private roomService: FederationRoomServiceReceiver) {
		super(MatrixEventType.ROOM_CREATED);
	}

	public async handle(externalEvent: IMatrixEvent<MatrixEventType.ROOM_CREATED>): Promise<void> {
		await this.roomService.createRoom(MatrixRoomReceiverConverter.toRoomCreateDto(externalEvent));
	}
}

export class MatrixRoomMembershipChangedHandler extends MatrixBaseEventHandler<MatrixEventType.ROOM_MEMBERSHIP_CHANGED> {
	constructor(private roomService: FederationRoomServiceReceiver, private rocketSettingsAdapter: RocketChatSettingsAdapter) {
		super(MatrixEventType.ROOM_MEMBERSHIP_CHANGED);
	}

	public async handle(externalEvent: IMatrixEvent<MatrixEventType.ROOM_MEMBERSHIP_CHANGED>): Promise<void> {
		await this.roomService.changeRoomMembership(
			MatrixRoomReceiverConverter.toChangeRoomMembershipDto(externalEvent, this.rocketSettingsAdapter.getHomeServerDomain()),
		);
	}
}

export class MatrixRoomMessageSentHandler extends MatrixBaseEventHandler<MatrixEventType.ROOM_MESSAGE_SENT> {
	constructor(private roomService: FederationRoomServiceReceiver) {
		super(MatrixEventType.ROOM_MESSAGE_SENT);
	}

	public async handle(externalEvent: IMatrixEvent<MatrixEventType.ROOM_MESSAGE_SENT>): Promise<void> {
		await this.roomService.receiveExternalMessage(MatrixRoomReceiverConverter.toSendRoomMessageDto(externalEvent));
	}
}
