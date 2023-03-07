import type { IBaseEventContent } from '../AbstractMatrixEvent';
import { AbstractMatrixEvent } from '../AbstractMatrixEvent';
import { MatrixEventType } from '../MatrixEventType';

export interface IMatrixEventContentUserTypingStatusChanged extends IBaseEventContent {
	user_ids: string[];
}

export class MatrixEventUserTypingStatusChanged extends AbstractMatrixEvent {
	public content: IMatrixEventContentUserTypingStatusChanged;

	public type = MatrixEventType.USER_TYPING_STATUS_CHANGED;
}
