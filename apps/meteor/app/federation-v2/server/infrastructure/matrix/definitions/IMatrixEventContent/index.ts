import { MatrixEventType } from '../MatrixEventType';
import { IMatrixEventContentCreateRoom } from './IMatrixEventContentCreateRoom';
import { IMatrixEventContentAddMemberToRoom } from './IMatrixEventContentAddMemberToRoom';
import { IMatrixEventContentSendMessage } from './IMatrixEventContentSendMessage';
import { IMatrixEventContentSetRoomJoinRules } from './IMatrixEventContentSetRoomJoinRules';
import { IMatrixEventContentSetRoomName } from './IMatrixEventContentSetRoomName';

export type EventContent = {
	[MatrixEventType.ROOM_CREATED]: IMatrixEventContentCreateRoom;
	[MatrixEventType.ROOM_MEMBERSHIP_CHANGED]: IMatrixEventContentAddMemberToRoom;
	[MatrixEventType.ROOM_MESSAGE_SENT]: IMatrixEventContentSendMessage;
	[MatrixEventType.ROOM_JOIN_RULES_CHANGED]: IMatrixEventContentSetRoomJoinRules;
	[MatrixEventType.ROOM_NAME_CHANGED]: IMatrixEventContentSetRoomName;
};
