export enum SetRoomJoinRules {
	JOIN = 'public',
	INVITE = 'invite',
}

export interface IMatrixEventContentSetRoomJoinRules {
	join_rule: SetRoomJoinRules;
}
