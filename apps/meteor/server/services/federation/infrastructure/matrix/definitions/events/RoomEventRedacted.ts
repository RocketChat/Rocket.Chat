import type { IBaseEventContent } from '../AbstractMatrixEvent';
import { AbstractMatrixEvent } from '../AbstractMatrixEvent';
import { MatrixEventType } from '../MatrixEventType';

export type IMatrixEventContentRoomRedacted = IBaseEventContent;

export class MatrixEventRoomRedacted extends AbstractMatrixEvent {
	public content: IMatrixEventContentRoomRedacted;

	public type = MatrixEventType.ROOM_EVENT_REDACTED;
}
