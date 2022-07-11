import { AbstractMatrixEvent, IBaseEventContent } from '../AbstractMatrixEvent';
import { MatrixEventType } from './MatrixEventType';

export enum AddMemberToRoomMembership {
	JOIN = 'join',
	INVITE = 'invite',
	LEAVE = 'leave',
}

export interface IMatrixEventContentRoomMembershipChanged extends IBaseEventContent {
	displayname: string;
	membership: AddMemberToRoomMembership;
	is_direct?: boolean;
}

export class MatrixEventRoomMembershipChanged extends AbstractMatrixEvent {
	public content: IMatrixEventContentRoomMembershipChanged;

	public type = MatrixEventType.ROOM_MEMBERSHIP_CHANGED;
}
