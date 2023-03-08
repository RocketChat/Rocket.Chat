import type { IBaseEventContent } from '../AbstractMatrixEvent';
import { AbstractMatrixEvent } from '../AbstractMatrixEvent';
import { MatrixEventType } from '../MatrixEventType';

export interface IMatrixEventContentSetRoomName extends IBaseEventContent {
	name: string;
}

export class MatrixEventRoomNameChanged extends AbstractMatrixEvent {
	public content: IMatrixEventContentSetRoomName;

	public type = MatrixEventType.ROOM_NAME_CHANGED;
}
