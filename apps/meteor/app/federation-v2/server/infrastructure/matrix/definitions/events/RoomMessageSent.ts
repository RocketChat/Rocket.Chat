import type { IBaseEventContent } from '../AbstractMatrixEvent';
import { AbstractMatrixEvent } from '../AbstractMatrixEvent';
import { MatrixEventType } from '../MatrixEventType';

export enum MatrixSendMessageType {
	'm.text',
}

export interface IMatrixEventContentRoomMessageSent extends IBaseEventContent {
	body: string;
	msgtype: MatrixSendMessageType;
}

export class MatrixEventRoomMessageSent extends AbstractMatrixEvent {
	public content: IMatrixEventContentRoomMessageSent;

	public type = MatrixEventType.ROOM_MESSAGE_SENT;
}
