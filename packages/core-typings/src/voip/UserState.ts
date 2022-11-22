// User state is based on whether the User has sent an invite(UAC) or it
// has received an invite (UAS)
export enum UserState {
	IDLE,
	UAC,
	UAS,
}
