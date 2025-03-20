import type { IBaseEventContent } from '../AbstractMatrixEvent';
import { AbstractMatrixEvent } from '../AbstractMatrixEvent';
import { MatrixEventType } from '../MatrixEventType';

interface IMatrixEventContentSetRoomTopic extends IBaseEventContent {
	topic: string;
}

export class MatrixEventRoomTopicChanged extends AbstractMatrixEvent {
	public content: IMatrixEventContentSetRoomTopic;

	public type = MatrixEventType.ROOM_TOPIC_CHANGED;
}
