import type { IBaseEventContent } from '../AbstractMatrixEvent';
import { AbstractMatrixEvent } from '../AbstractMatrixEvent';
import { MatrixEventType } from '../MatrixEventType';
import type { MatrixRoomJoinRules } from '../MatrixRoomJoinRules';

export interface IMatrixEventContentSetRoomJoinRules extends IBaseEventContent {
	join_rule: MatrixRoomJoinRules;
}

export class MatrixEventRoomJoinRulesChanged extends AbstractMatrixEvent {
	public content: IMatrixEventContentSetRoomJoinRules;

	public type = MatrixEventType.ROOM_JOIN_RULES_CHANGED;
}
