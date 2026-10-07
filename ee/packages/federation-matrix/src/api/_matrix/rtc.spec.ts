import { federationSDK } from '@rocket.chat/federation-sdk';

import { getMatrixRTCRoutes } from './rtc';
import { legacyLiveKitIdentityFor, liveKitIdentityFor, liveKitRoomAliasFor } from '../../matrixrtc/derive';
import type { IMatrixRTCLiveKitIssuer } from '../../matrixrtc/issuer';
import { setMatrixRTCLiveKitIssuer } from '../../matrixrtc/issuer';

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		verifyRequestSignature: jest.fn(),
		getConfig: jest.fn(),
		isUserJoined: jest.fn(),
		getJoinedServers: jest.fn(),
	},
	errCodes: {
		M_UNAUTHORIZED: { errcode: 'M_UNAUTHORIZED', error: 'Unauthorized', status: 401 },
		M_UNKNOWN: { errcode: 'M_UNKNOWN', error: 'Unknown error' },
	},
}));

const mockVerifyRequestSignature = jest.mocked(federationSDK.verifyRequestSignature);
const mockGetConfig = jest.mocked(federationSDK.getConfig);
const mockIsUserJoined = jest.mocked(federationSDK.isUserJoined);
const mockGetJoinedServers = jest.mocked(federationSDK.getJoinedServers);

const OWN_SFU = 'wss://livekit.rc1';
const ROOM_ID = '!room:rc2';

const issuer = {
	getOwnTransport: jest.fn(() => ({ url: OWN_SFU, serviceUrl: 'https://rc1/matrixrtc/livekit-jwt' })),
	mintToken: jest.fn(async () => 'jwt'),
} satisfies IMatrixRTCLiveKitIssuer;

/** The room as this server sees it: who is joined, by Matrix user id. */
const joined = (...userIds: string[]) => {
	mockIsUserJoined.mockImplementation(async (_roomId, userId) => userIds.includes(userId));
	mockGetJoinedServers.mockImplementation(async () => [...new Set(userIds.map((userId) => userId.split(':')[1]))]);
};

const validRequest = { url: OWN_SFU, user_id: '@bob:rc2', room_id: ROOM_ID, slot_id: 'm.call#ROOM', member_id: 'member1' };

const getToken = (body: unknown, { path = '/unstable/io.element.msc4195/rtc/livekit/get_token', signed = true } = {}) =>
	getMatrixRTCRoutes()
		.getHonoRouter()
		.request(path, {
			method: 'POST',
			headers: {
				...(signed && { Authorization: 'X-Matrix origin="rc2",key="ed25519:1",sig="sig"' }),
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});

describe('POST /_matrix/federation/{unstable/io.element.msc4195,v1}/rtc/livekit/get_token', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setMatrixRTCLiveKitIssuer(issuer);
		mockVerifyRequestSignature.mockResolvedValue('rc2');
		mockGetConfig.mockImplementation(((key: string) => (key === 'serverName' ? 'rc1' : undefined)) as typeof federationSDK.getConfig);
		joined('@alice:rc1', '@bob:rc2');
	});

	afterAll(() => setMatrixRTCLiveKitIssuer(undefined));

	it('mints a subscribe-only token for the room and the identity MSC4195 derives', async () => {
		const response = await getToken(validRequest);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ jwt: 'jwt' });
		expect(issuer.mintToken).toHaveBeenCalledWith({
			roomName: liveKitRoomAliasFor(ROOM_ID, 'm.call#ROOM'),
			identity: liveKitIdentityFor('@bob:rc2', 'member1'),
			canPublish: false,
		});
	});

	it('answers on the stable path as on the unstable one', async () => {
		const response = await getToken(validRequest, { path: '/v1/rtc/livekit/get_token' });

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ jwt: 'jwt' });
	});

	it('takes the member as lk-jwt-service v0.7.0 names it, with the identity that version derives', async () => {
		const { member_id: _memberId, ...withoutMemberId } = validRequest;

		const response = await getToken({ ...withoutMemberId, member: { id: 'member1', claimed_device_id: 'DEVICE' } });

		expect(response.status).toBe(200);
		expect(issuer.mintToken).toHaveBeenCalledWith(
			expect.objectContaining({ identity: legacyLiveKitIdentityFor('@bob:rc2', 'DEVICE', 'member1') }),
		);
	});

	it('prefers the MSC member id when a request names the member both ways', async () => {
		await getToken({ ...validRequest, member: { id: 'member1', claimed_device_id: 'DEVICE' } });

		expect(issuer.mintToken).toHaveBeenCalledWith(expect.objectContaining({ identity: liveKitIdentityFor('@bob:rc2', 'member1') }));
	});

	it('refuses a request that no homeserver signed', async () => {
		const response = await getToken(validRequest, { signed: false });

		expect(response.status).toBe(401);
		expect(issuer.mintToken).not.toHaveBeenCalled();
	});

	it.each(['url', 'user_id', 'room_id', 'slot_id', 'member_id'])('refuses a request without %s', async (field) => {
		const response = await getToken({ ...validRequest, [field]: '' });

		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ errcode: 'M_BAD_JSON' });
	});

	it('refuses a v0.7.0 member without a device', async () => {
		const response = await getToken({ ...validRequest, member_id: undefined, member: { id: 'member1' } });

		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ errcode: 'M_BAD_JSON' });
	});

	it('refuses a malformed user id', async () => {
		const response = await getToken({ ...validRequest, user_id: 'bob' });

		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ errcode: 'M_INVALID_PARAM' });
	});

	it('refuses a homeserver asking for a user of another homeserver', async () => {
		const response = await getToken({ ...validRequest, user_id: '@carol:rc3' });

		expect(response.status).toBe(403);
		expect(await response.json()).toMatchObject({ errcode: 'M_FORBIDDEN' });
		expect(issuer.mintToken).not.toHaveBeenCalled();
	});

	it('refuses a room this server is not joined to', async () => {
		joined('@bob:rc2');

		const response = await getToken(validRequest);

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ errcode: 'M_FORBIDDEN', error: 'This server is not joined to the room' });
	});

	it('refuses a user who is not joined to the room', async () => {
		joined('@alice:rc1', '@dave:rc2');

		const response = await getToken(validRequest);

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ errcode: 'M_FORBIDDEN', error: 'The requesting user is not a member of the room' });
	});

	it('reports a room whose members could not be checked', async () => {
		mockGetJoinedServers.mockRejectedValue(new Error('database unavailable'));

		const response = await getToken(validRequest);

		expect(response.status).toBe(502);
		expect(await response.json()).toMatchObject({ errcode: 'M_UNKNOWN' });
	});

	it('refuses a token for an SFU this server does not host', async () => {
		const response = await getToken({ ...validRequest, url: 'wss://livekit.elsewhere' });

		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ errcode: 'M_INVALID_PARAM' });
		expect(issuer.mintToken).not.toHaveBeenCalled();
	});

	it('refuses every SFU while LiveKit is not configured here', async () => {
		setMatrixRTCLiveKitIssuer(undefined);

		const response = await getToken(validRequest);

		expect(response.status).toBe(400);
		expect(await response.json()).toMatchObject({ errcode: 'M_INVALID_PARAM' });
	});

	it('reports a token that could not be minted', async () => {
		issuer.mintToken.mockRejectedValueOnce(new Error('LiveKit API credentials are not configured'));

		const response = await getToken(validRequest);

		expect(response.status).toBe(500);
		expect(await response.json()).toMatchObject({ errcode: 'M_UNKNOWN' });
	});
});
