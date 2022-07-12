import { RoomJoinRules } from '../../../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/IMatrixEventContent/IMatrixEventContentSetRoomJoinRules';

export interface IMatrixEventContentSetRoomJoinRules {
	join_rule: RoomJoinRules;
}
