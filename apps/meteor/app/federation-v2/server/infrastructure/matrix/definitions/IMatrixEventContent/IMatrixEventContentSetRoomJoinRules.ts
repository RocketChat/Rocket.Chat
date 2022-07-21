export enum RoomJoinRules {
	JOIN = 'public',
	INVITE = 'invite',
}

export interface IMatrixEventContentSetRoomJoinRules {
	join_rule: RoomJoinRules;
}
