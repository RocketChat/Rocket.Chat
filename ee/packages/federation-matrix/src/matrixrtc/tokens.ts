import type { IMatrixRTCMembership, IUser, IVideoConference } from '@rocket.chat/core-typings';
import { getMatrixRTCTransportKey } from '@rocket.chat/core-typings';
import { MatrixRTCMemberships } from '@rocket.chat/models';

import { joinRTCSession } from './session';
import { requestServiceToken } from './tokens/service';

/** A remote member publishing on the SFU that `serverName` and `transport` name, if anyone still is. */
async function findRemotePublisher(
	{ mrid, slotId }: NonNullable<IVideoConference['federation']>,
	serverName: string,
	transport: string,
	now: Date,
): Promise<IMatrixRTCMembership | undefined> {
	const memberships = await MatrixRTCMemberships.findActiveBySession(mrid, slotId, now).toArray();

	return memberships.find(
		(membership) =>
			!membership.local && membership.serverName === serverName && getMatrixRTCTransportKey(membership.transport) === transport,
	);
}

/**
 * A token for one of this server's users to watch, on another homeserver's SFU, the members that homeserver hosts
 * in a federated conference.
 */
export async function getRemoteLiveKitToken(
	call: IVideoConference,
	user: IUser,
	serverName: string,
	transport: string,
): Promise<{ serverUrl: string; token: string }> {
	if (!call.federation) {
		throw new Error(`Conference ${call._id} does not mirror a MatrixRTC session`);
	}

	const now = new Date();
	const publisher = await findRemotePublisher(call.federation, serverName, transport, now);
	if (!publisher) {
		throw new Error(`Nobody in conference ${call._id} publishes on ${serverName}'s SFU ${transport}`);
	}

	// A client joining a call that already has remote members asks for their SFU straight away, which can be before
	// its join has announced the membership the token request names.
	const member = (await MatrixRTCMemberships.findOneActiveLocal(call._id, user._id, now)) ?? (await joinRTCSession(call, user));

	return requestServiceToken(publisher.transport.serviceUrl, member);
}
