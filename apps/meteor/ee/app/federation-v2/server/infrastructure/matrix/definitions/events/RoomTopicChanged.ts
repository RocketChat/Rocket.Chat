import { MatrixEventTypeEE } from '../MatrixEventType';
import {
	AbstractMatrixEvent,
	IBaseEventContent,
} from '../../../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/AbstractMatrixEvent';

export interface IMatrixEventContentSetRoomTopic extends IBaseEventContent {
	topic: string;
}

export class MatrixEventRoomTopicChanged extends AbstractMatrixEvent {
	public content: IMatrixEventContentSetRoomTopic;

	public type = MatrixEventTypeEE.ROOM_TOPIC_CHANGED;
}
