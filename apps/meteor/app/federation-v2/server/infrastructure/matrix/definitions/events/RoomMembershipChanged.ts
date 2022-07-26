import { AbstractMatrixEvent, IBaseEventContent } from '../AbstractMatrixEvent';
import { MatrixEventType } from '../MatrixEventType';

export enum RoomMembershipChangedEventType {
	JOIN = 'join',
	INVITE = 'invite',
	LEAVE = 'leave',
}

export interface IMatrixEventContentRoomMembershipChanged extends IBaseEventContent {
	displayname: string;
	membership: RoomMembershipChangedEventType;
	is_direct?: boolean;
}

export class MatrixEventRoomMembershipChanged extends AbstractMatrixEvent {
	public content: IMatrixEventContentRoomMembershipChanged;

	public type = MatrixEventType.ROOM_MEMBERSHIP_CHANGED;
}
