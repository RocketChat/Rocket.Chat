import { MatrixEventTypeEE } from '../MatrixEventType';
import {
	AbstractMatrixEvent,
	IBaseEventContent,
} from '../../../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/AbstractMatrixEvent';

export interface IMatrixEventContentSetRoomName extends IBaseEventContent {
	name: string;
}

export class MatrixEventRoomNameChanged extends AbstractMatrixEvent {
	public content: IMatrixEventContentSetRoomName;

	public type = MatrixEventTypeEE.ROOM_NAME_CHANGED;
}
