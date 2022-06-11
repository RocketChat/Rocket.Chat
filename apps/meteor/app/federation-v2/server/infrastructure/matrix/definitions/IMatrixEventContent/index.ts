import { MatrixEventType } from '../MatrixEventType';
import { IMatrixEventContentCreateRoom } from './IMatrixEventContentCreateRoom';
import { IMatrixEventContentAddMemberToRoom } from './IMatrixEventContentAddMemberToRoom';
import { IMatrixEventContentSendMessage } from './IMatrixEventContentSendMessage';

export type EventContent = {
	[MatrixEventType.ROOM_CREATED]: IMatrixEventContentCreateRoom;
	[MatrixEventType.ROOM_MEMBERSHIP_CHANGED]: IMatrixEventContentAddMemberToRoom;
	[MatrixEventType.ROOM_MESSAGE_SENT]: IMatrixEventContentSendMessage;
};
