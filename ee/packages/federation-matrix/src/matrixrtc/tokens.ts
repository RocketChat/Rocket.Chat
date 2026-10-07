import type { IMatrixRTCMembership, IUser, IVideoConference } from '@rocket.chat/core-typings';
import { getMatrixRTCTransportKey } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { MatrixRTCMemberships } from '@rocket.chat/models';

import { requestFederationToken } from './tokens/federation';
import { requestServiceToken } from './tokens/service';

const logger = new Logger('MatrixRTCTokens');

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
	const [publisher, member] = await Promise.all([
		findRemotePublisher(call.federation, serverName, transport, now),
		MatrixRTCMemberships.findOneActiveLocal(call._id, user._id, now),
	]);
	if (!publisher) {
		throw new Error(`Nobody in conference ${call._id} publishes on ${serverName}'s SFU ${transport}`);
	}
	if (!member) {
		throw new Error(`User ${user._id} has not joined conference ${call._id}`);
	}

	const { url, serviceUrl } = publisher.transport;

	// Deployed Matrix clients only know token services, so a service is asked first whenever one is announced.
	if (serviceUrl) {
		try {
			return await requestServiceToken(serviceUrl, member);
		} catch (err) {
			if (!url) {
				throw err;
			}
			logger.warn({ msg: 'The token service of a remote SFU refused a token; asking its homeserver', serverName, serviceUrl, err });
		}
	}

	if (!url) {
		throw new Error(`The membership of ${publisher.userId} names no SFU`);
	}

	return requestFederationToken(publisher.serverName, url, member);
}
