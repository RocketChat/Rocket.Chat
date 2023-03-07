import type { IBaseEventContent } from '../AbstractMatrixEvent';
import { AbstractMatrixEvent } from '../AbstractMatrixEvent';
import { MatrixEventType } from '../MatrixEventType';

export interface IMatrixEventContentMessageReacted extends IBaseEventContent {
	'm.relates_to': {
		event_id: string;
		key: string;
		rel_type: string;
	};
}

export class MatrixEventMessageReact extends AbstractMatrixEvent {
	public content: IMatrixEventContentMessageReacted;

	public type = MatrixEventType.MESSAGE_REACTED;
}
