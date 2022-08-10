import type { MatrixEventType } from '../MatrixEventType';
import type { IMatrixEventContentCreateRoom } from './IMatrixEventContentCreateRoom';
import type { IMatrixEventContentAddMemberToRoom } from './IMatrixEventContentAddMemberToRoom';
import type { IMatrixEventContentSendMessage } from './IMatrixEventContentSendMessage';
import type { IMatrixEventContentSetRoomJoinRules } from './IMatrixEventContentSetRoomJoinRules';
import type { IMatrixEventContentSetRoomName } from './IMatrixEventContentSetRoomName';
import type { IMatrixEventContentSetRoomTopic } from './IMatrixEventContentSetRoomTopic';

export type EventContent = {
	[MatrixEventType.ROOM_CREATED]: IMatrixEventContentCreateRoom;
	[MatrixEventType.ROOM_MEMBERSHIP_CHANGED]: IMatrixEventContentAddMemberToRoom;
	[MatrixEventType.ROOM_MESSAGE_SENT]: IMatrixEventContentSendMessage;
	[MatrixEventType.ROOM_JOIN_RULES_CHANGED]: IMatrixEventContentSetRoomJoinRules;
	[MatrixEventType.ROOM_NAME_CHANGED]: IMatrixEventContentSetRoomName;
	[MatrixEventType.ROOM_TOPIC_CHANGED]: IMatrixEventContentSetRoomTopic;
};
