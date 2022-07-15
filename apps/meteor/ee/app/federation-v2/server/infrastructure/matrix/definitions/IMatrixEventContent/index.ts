import { IMatrixEventContentAddMemberToRoom } from '../../../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/IMatrixEventContent/IMatrixEventContentAddMemberToRoom';
import { IMatrixEventContentCreateRoom } from '../../../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/IMatrixEventContent/IMatrixEventContentCreateRoom';
import { IMatrixEventContentSendMessage } from '../../../../../../../../app/federation-v2/server/infrastructure/matrix/definitions/IMatrixEventContent/IMatrixEventContentSendMessage';
import { MatrixEventTypeEE } from '../MatrixEventType';
import { IMatrixEventContentSetRoomJoinRules } from './IMatrixEventContentSetRoomJoinRules';
import { IMatrixEventContentSetRoomName } from './IMatrixEventContentSetRoomName';
import { IMatrixEventContentSetRoomTopic } from './IMatrixEventContentSetRoomTopic';

export type EventContentEE = {
	[MatrixEventTypeEE.ROOM_JOIN_RULES_CHANGED]: IMatrixEventContentSetRoomJoinRules;
	[MatrixEventTypeEE.ROOM_NAME_CHANGED]: IMatrixEventContentSetRoomName;
	[MatrixEventTypeEE.ROOM_TOPIC_CHANGED]: IMatrixEventContentSetRoomTopic;
	[MatrixEventTypeEE.ROOM_CREATED]: IMatrixEventContentCreateRoom;
	[MatrixEventTypeEE.ROOM_MEMBERSHIP_CHANGED]: IMatrixEventContentAddMemberToRoom;
	[MatrixEventTypeEE.ROOM_MESSAGE_SENT]: IMatrixEventContentSendMessage;
};
