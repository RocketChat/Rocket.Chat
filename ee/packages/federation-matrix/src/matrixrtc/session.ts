import type { IMatrixRTCMembership, IUser, IVideoConference } from '@rocket.chat/core-typings';

/**
 * Announces in the room that one of this server's users is in a federated conference, or confirms the announcement
 * still stands, and returns the membership. Safe to repeat on every join and every token request.
 */
export async function joinRTCSession(_call: IVideoConference, _user: IUser): Promise<IMatrixRTCMembership> {
	throw new Error('not implemented');
}

/** Announces in the room that one of this server's users left a federated conference. */
export async function leaveRTCSession(_call: IVideoConference, _uid: IUser['_id']): Promise<void> {
	throw new Error('not implemented');
}

/** Rings, or tells about the call, the members of other servers through the room. */
export async function notifyRTCSession(
	_call: IVideoConference,
	_caller: IUser,
	_targets: IUser[],
	_kind: 'ring' | 'notification',
): Promise<void> {
	throw new Error('not implemented');
}

/** Turns down, for one of this server's users, a ring that came from another server. */
export async function declineRTCSession(_call: IVideoConference, _user: IUser): Promise<void> {
	throw new Error('not implemented');
}
