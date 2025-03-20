import type { IBaseEventContent } from '../AbstractMatrixEvent';
import { AbstractMatrixEvent } from '../AbstractMatrixEvent';
import { MatrixEventType } from '../MatrixEventType';

export enum RoomMembershipChangedEventType {
	JOIN = 'join',
	INVITE = 'invite',
	LEAVE = 'leave',
}

interface IMatrixEventContentRoomMembershipChanged extends IBaseEventContent {
	displayname: string;
	membership: RoomMembershipChangedEventType;
	is_direct?: boolean;
	avatar_url?: string;
}

export class MatrixEventRoomMembershipChanged extends AbstractMatrixEvent {
	public content: IMatrixEventContentRoomMembershipChanged;

	public type = MatrixEventType.ROOM_MEMBERSHIP_CHANGED;
}
