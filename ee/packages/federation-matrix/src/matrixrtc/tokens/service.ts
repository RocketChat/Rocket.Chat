import type { IMatrixRTCMembership } from '@rocket.chat/core-typings';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Logger } from '@rocket.chat/logger';

import type { Fields } from './body';
import { fieldsOf, hasText } from './body';
import { MatrixRTCTokenError } from './errors';
import { isUserJoined } from './roomMembership';
import { getOwnSFU, mintRemoteMemberToken, serverNameOfUserId } from './sfu';
import { MATRIXRTC_ROOM_CALL_SLOT_ID, legacyLiveKitIdentityFor, liveKitRoomAliasFor, sfuGetLiveKitIdentityFor } from '../derive';
import { getOpenIdTokenSubject, issueOpenIdToken } from '../openid';

const logger = new Logger('MatrixRTCTokens');

/** Where this server serves the lk-jwt-service contract: the `livekit_service_url` its memberships announce. */
export const MATRIXRTC_TOKEN_SERVICE_PATH = '/matrixrtc/livekit-jwt';

type OpenIdToken = { access_token: string; matrix_server_name: string };

/** The `/get_token` body: an OpenID token, and the member of which session it is for. */
export type ServiceTokenRequest = {
	room_id: string;
	slot_id: string;
	openid_token: OpenIdToken;
	member: { id: string; claimed_user_id: string; claimed_device_id: string };
};

/** The `/sfu/get` body, from before sessions had slots and members had ids. */
export type SfuGetRequest = {
	room: string;
	openid_token: OpenIdToken;
	device_id: string;
};

const badJson = (message: string) => new MatrixRTCTokenError(400, 'M_BAD_JSON', message);

/** Delegating the leave to this service is only for its own homeserver's users, which members of others never are. */
const refuseDelayedEventDelegation = (fields: Fields): void => {
	const hasDelayId = hasText(fields, 'delay_id');
	const hasDelayTimeout = typeof fields.delay_timeout === 'number' && fields.delay_timeout > 0;
	if (hasDelayId !== hasDelayTimeout) {
		throw badJson('The request body is missing `delay_id` or `delay_timeout`');
	}
	if (hasDelayId) {
		throw badJson('Delegation of delayed events is only supported for full access users');
	}
};

const parseServiceTokenRequest = (body: unknown): ServiceTokenRequest => {
	const fields = fieldsOf(body);
	if (!hasText(fields, 'room_id', 'slot_id')) {
		throw badJson('The request body is missing `room_id` or `slot_id`');
	}
	if (!hasText(fieldsOf(fields.member), 'id', 'claimed_user_id', 'claimed_device_id')) {
		throw badJson('The request body `member` is missing a `id`, `claimed_user_id` or `claimed_device_id`');
	}
	if (!hasText(fieldsOf(fields.openid_token), 'access_token', 'matrix_server_name')) {
		throw badJson('The request body `openid_token` is missing a `access_token` or `matrix_server_name`');
	}
	refuseDelayedEventDelegation(fields);

	return fields as ServiceTokenRequest;
};

const parseSfuGetRequest = (body: unknown): SfuGetRequest => {
	const fields = fieldsOf(body);
	if (!hasText(fields, 'room')) {
		throw badJson('Missing room parameter');
	}
	if (!hasText(fieldsOf(fields.openid_token), 'access_token', 'matrix_server_name')) {
		throw badJson('Missing OpenID token parameters');
	}
	refuseDelayedEventDelegation(fields);

	return { ...fields, device_id: typeof fields.device_id === 'string' ? fields.device_id : '' } as SfuGetRequest;
};

/** Who the token's homeserver says its bearer is. */
async function lookUpOpenIdSubject({
	access_token: accessToken,
	matrix_server_name: serverName,
}: OpenIdToken): Promise<string | undefined> {
	if (serverName === federationSDK.getConfig('serverName')) {
		return getOpenIdTokenSubject(accessToken);
	}

	try {
		// Userinfo needs no signature; the signed request is what reaches a homeserver through the SDK's discovery.
		const response = await federationSDK.makeSignedRequest({
			method: 'GET',
			domain: serverName,
			uri: '/_matrix/federation/v1/openid/userinfo',
			queryString: new URLSearchParams({ access_token: accessToken }).toString(),
		});
		const { sub } = fieldsOf(await response.json());

		return typeof sub === 'string' ? sub : undefined;
	} catch (err) {
		logger.warn({ msg: 'Could not check an OpenID token with its homeserver', serverName, err });
		return undefined;
	}
}

/** The Matrix user an OpenID token stands for, if its homeserver vouches for them and they are who they claim. */
async function verifyOpenIdToken(token: OpenIdToken, claimedUserId?: string): Promise<string> {
	const sub = await lookUpOpenIdSubject(token);
	if (!sub || serverNameOfUserId(sub) !== token.matrix_server_name || (claimedUserId !== undefined && claimedUserId !== sub)) {
		throw new MatrixRTCTokenError(401, 'M_UNAUTHORIZED', 'The request could not be authorised.');
	}

	return sub;
}

/** The SFU this service hands tokens for; while LiveKit is not configured, there is no service here. */
const requireOwnSFU = () => {
	const sfu = getOwnSFU();
	if (!sfu) {
		throw new MatrixRTCTokenError(404, 'M_UNRECOGNIZED', 'This server hosts no SFU');
	}

	return sfu;
};

async function grantToJoinedUser(
	sfu: ReturnType<typeof requireOwnSFU>,
	{ userId, roomId, slotId, identity }: { userId: string; roomId: string; slotId: string; identity: string },
): Promise<{ url: string; jwt: string }> {
	if (!(await isUserJoined(roomId, userId))) {
		throw new MatrixRTCTokenError(403, 'M_FORBIDDEN', 'The requesting user is not a member of the room');
	}

	const jwt = await mintRemoteMemberToken(sfu.issuer, liveKitRoomAliasFor(roomId, slotId), identity);

	return { url: sfu.transport.url, jwt };
}

/** lk-jwt-service's `/get_token`: a token for this server's SFU, for the bearer of an OpenID token of another homeserver. */
export async function grantServiceToken(body: unknown): Promise<{ url: string; jwt: string }> {
	const request = parseServiceTokenRequest(body);
	const sfu = requireOwnSFU();
	const userId = await verifyOpenIdToken(request.openid_token, request.member.claimed_user_id);

	return grantToJoinedUser(sfu, {
		userId,
		roomId: request.room_id,
		slotId: request.slot_id,
		identity: legacyLiveKitIdentityFor(userId, request.member.claimed_device_id, request.member.id),
	});
}

/** lk-jwt-service's `/sfu/get`, which clients that predate `/get_token` still call, for the room-wide call. */
export async function grantSfuGetToken(body: unknown): Promise<{ url: string; jwt: string }> {
	const request = parseSfuGetRequest(body);
	const sfu = requireOwnSFU();
	const userId = await verifyOpenIdToken(request.openid_token);

	return grantToJoinedUser(sfu, {
		userId,
		roomId: request.room,
		slotId: MATRIXRTC_ROOM_CALL_SLOT_ID,
		identity: sfuGetLiveKitIdentityFor(userId, request.device_id),
	});
}

/** Element Call gives up on a token service after the same time. */
const SERVICE_REQUEST_TIMEOUT_MS = 30_000;

class TokenServiceError extends Error {
	constructor(
		readonly status: number,
		url: string,
	) {
		super(`The token service at ${url} answered ${status}`);
		this.name = 'TokenServiceError';
	}
}

async function postToTokenService(url: string, body: Record<string, unknown>): Promise<{ serverUrl: string; token: string }> {
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(SERVICE_REQUEST_TIMEOUT_MS),
	});
	if (!response.ok) {
		throw new TokenServiceError(response.status, url);
	}

	const { url: serverUrl, jwt } = fieldsOf(await response.json());
	if (typeof serverUrl !== 'string' || !serverUrl || typeof jwt !== 'string' || !jwt) {
		throw new Error(`The token service at ${url} answered without an SFU or a token`);
	}

	return { serverUrl, token: jwt };
}

/**
 * A token for the SFU behind another homeserver's token service (a `livekit_service_url`), for one of this server's
 * members to watch it: asked as Element Call asks, with an OpenID token this server issues for the member.
 */
export async function requestServiceToken(
	serviceUrl: string,
	member: Pick<IMatrixRTCMembership, 'userId' | 'mrid' | 'slotId' | 'memberId' | 'deviceId'>,
): Promise<{ serverUrl: string; token: string }> {
	// The address comes from another server's announcement, and this server is the one calling it.
	if (new URL(serviceUrl).protocol !== 'https:') {
		throw new Error(`Refusing a token service that is not served over HTTPS: ${serviceUrl}`);
	}

	const base = serviceUrl.replace(/\/+$/, '');
	const openidToken = issueOpenIdToken(member.userId, federationSDK.getConfig('serverName'));

	try {
		return await postToTokenService(`${base}/get_token`, {
			room_id: member.mrid,
			slot_id: member.slotId,
			openid_token: openidToken,
			member: { id: member.memberId, claimed_user_id: member.userId, claimed_device_id: member.deviceId },
		});
	} catch (err) {
		// A service that predates `/get_token` answers `/sfu/get`, which only knows the room-wide call.
		if (!(err instanceof TokenServiceError && err.status === 404) || member.slotId !== MATRIXRTC_ROOM_CALL_SLOT_ID) {
			throw err;
		}
	}

	return postToTokenService(`${base}/sfu/get`, { room: member.mrid, openid_token: openidToken, device_id: member.deviceId });
}
