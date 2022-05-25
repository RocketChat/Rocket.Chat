export enum AddMemberToRoomMembership {
	JOIN = 'join',
	INVITE = 'invite',
	LEAVE = 'leave',
}

export interface IMatrixEventContentAddMemberToRoom {
	displayname: string;
	membership: AddMemberToRoomMembership;
	is_direct?: boolean;
}
