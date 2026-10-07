import type { IMatrixRTCMembership } from '@rocket.chat/core-typings';
import { FederationRequestError, federationSDK } from '@rocket.chat/federation-sdk';

import { fieldsOf, hasText } from './body';
import { MatrixRTCTokenError } from './errors';
import { isServerJoined, isUserJoined } from './roomMembership';
import { getOwnSFU, mintRemoteMemberToken, serverNameOfUserId } from './sfu';
import { legacyLiveKitIdentityFor, liveKitIdentityFor, liveKitRoomAliasFor } from '../derive';

/**
 * MSC4195's server-server `get_token` body: which SFU, and which member of which session asks to watch it. The member
 * is `member_id` in the MSC and lk-jwt-service `main`, `member` in lk-jwt-service v0.7.0.
 */
export type FederationTokenRequest = {
	url: string;
	user_id: string;
	room_id: string;
	slot_id: string;
	member_id?: string;
	member?: { id: string; claimed_device_id: string };
};

const parseFederationTokenRequest = (body: unknown): FederationTokenRequest => {
	const fields = fieldsOf(body);
	const namesMember = hasText(fields, 'member_id') || hasText(fieldsOf(fields.member), 'id', 'claimed_device_id');
	if (!hasText(fields, 'url', 'user_id', 'room_id', 'slot_id') || !namesMember) {
		throw new MatrixRTCTokenError(400, 'M_BAD_JSON', 'The request body is missing `url`, `user_id`, `room_id`, `slot_id` or `member_id`');
	}

	return fields as FederationTokenRequest;
};

/** The identity each generation of the endpoint mints for the member it names. */
const identityOf = ({ user_id: userId, member_id: memberId, member }: FederationTokenRequest): string =>
	memberId ? liveKitIdentityFor(userId, memberId) : legacyLiveKitIdentityFor(userId, member?.claimed_device_id ?? '', member?.id ?? '');

/**
 * A token for this server's SFU, asked by the homeserver `origin` (already authenticated) for one of its users, who
 * must be joined to the room this server is in.
 */
export async function grantFederationToken(origin: string, body: unknown): Promise<{ jwt: string }> {
	const request = parseFederationTokenRequest(body);

	const userServerName = serverNameOfUserId(request.user_id);
	if (!userServerName) {
		throw new MatrixRTCTokenError(400, 'M_INVALID_PARAM', 'Malformed user identifier');
	}
	if (userServerName !== origin) {
		throw new MatrixRTCTokenError(403, 'M_FORBIDDEN', 'The user_id does not belong to the origin server');
	}

	if (!(await isServerJoined(request.room_id, federationSDK.getConfig('serverName')))) {
		throw new MatrixRTCTokenError(403, 'M_FORBIDDEN', 'This server is not joined to the room');
	}
	if (!(await isUserJoined(request.room_id, request.user_id))) {
		throw new MatrixRTCTokenError(403, 'M_FORBIDDEN', 'The requesting user is not a member of the room');
	}

	const sfu = getOwnSFU();
	if (sfu?.transport.url !== request.url) {
		throw new MatrixRTCTokenError(400, 'M_INVALID_PARAM', "The request `url` does not match this service's LiveKit URL");
	}

	const jwt = await mintRemoteMemberToken(sfu.issuer, liveKitRoomAliasFor(request.room_id, request.slot_id), identityOf(request));

	return { jwt };
}

const FEDERATION_TOKEN_PATH = '/_matrix/federation/unstable/io.element.msc4195/rtc/livekit/get_token';
const STABLE_FEDERATION_TOKEN_PATH = '/_matrix/federation/v1/rtc/livekit/get_token';

const isUnrecognizedEndpoint = (err: unknown): boolean =>
	err instanceof FederationRequestError && (err.response.status === 404 || err.message.includes('M_UNRECOGNIZED'));

/**
 * A token for the SFU at `url`, which the homeserver `destination` hosts, for one of this server's members to watch
 * it. The member is named both ways lk-jwt-service has read it, so either generation answers.
 */
export async function requestFederationToken(
	destination: string,
	url: string,
	member: Pick<IMatrixRTCMembership, 'userId' | 'mrid' | 'slotId' | 'memberId' | 'deviceId'>,
): Promise<{ serverUrl: string; token: string }> {
	const body = {
		url,
		user_id: member.userId,
		room_id: member.mrid,
		slot_id: member.slotId,
		member_id: member.memberId,
		member: { id: member.memberId, claimed_user_id: member.userId, claimed_device_id: member.deviceId },
	};

	const requestAt = async (uri: string) => {
		// Sent as it is: a body passed unsigned would get event hashes and signatures added to it.
		const response = await federationSDK.makeSignedRequest({ method: 'POST', domain: destination, uri, signedBody: body });
		const { jwt } = fieldsOf(await response.json());
		if (typeof jwt !== 'string' || !jwt) {
			throw new Error(`${destination} answered get_token without a token`);
		}

		return { serverUrl: url, token: jwt };
	};

	try {
		return await requestAt(FEDERATION_TOKEN_PATH);
	} catch (err) {
		if (!isUnrecognizedEndpoint(err)) {
			throw err;
		}
	}

	return requestAt(STABLE_FEDERATION_TOKEN_PATH);
}
