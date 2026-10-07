import type { IUser, IVideoConference } from '@rocket.chat/core-typings';

/**
 * A token for one of this server's users to watch, on another homeserver's SFU, the members that homeserver hosts
 * in a federated conference.
 */
export async function getRemoteLiveKitToken(
	_call: IVideoConference,
	_user: IUser,
	_serverName: string,
	_transport: string,
): Promise<{ serverUrl: string; token: string }> {
	throw new Error('not implemented');
}
