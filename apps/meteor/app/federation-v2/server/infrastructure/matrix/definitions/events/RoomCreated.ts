import type { IBaseEventContent } from '../AbstractMatrixEvent';
import { AbstractMatrixEvent } from '../AbstractMatrixEvent';
import { MatrixEventType } from '../MatrixEventType';

export interface IMatrixEventContentRoomCreated extends IBaseEventContent {
	creator: string;
	room_version: string;
	was_internally_programatically_created?: boolean;
	internalRoomId?: string;
}

export class MatrixEventRoomCreated extends AbstractMatrixEvent {
	public content: IMatrixEventContentRoomCreated;

	public type = MatrixEventType.ROOM_CREATED;
}
