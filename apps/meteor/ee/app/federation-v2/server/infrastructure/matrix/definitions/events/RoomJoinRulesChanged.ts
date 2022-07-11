import { MatrixEventTypeEE } from '../MatrixEventType';
import { RoomJoinRules } from '../../../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/RoomJoinRules';
import { AbstractMatrixEvent } from '../../../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/AbstractMatrixEvent';

export interface IMatrixEventContentSetRoomJoinRules {
	join_rule: RoomJoinRules;
}

export class MatrixEventRoomJoinRulesChanged extends AbstractMatrixEvent {
	public content: IMatrixEventContentSetRoomJoinRules;

	public type = MatrixEventTypeEE.ROOM_JOIN_RULES_CHANGED;
}
