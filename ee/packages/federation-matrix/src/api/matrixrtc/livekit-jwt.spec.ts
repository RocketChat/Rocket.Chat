import { Settings } from '@rocket.chat/core-services';
import { federationSDK } from '@rocket.chat/federation-sdk';

import { getMatrixRTCTokenServiceRoutes } from './livekit-jwt';
import { legacyLiveKitIdentityFor, liveKitRoomAliasFor, sfuGetLiveKitIdentityFor } from '../../matrixrtc/derive';
import type { IMatrixRTCLiveKitIssuer } from '../../matrixrtc/issuer';
import { setMatrixRTCLiveKitIssuer } from '../../matrixrtc/issuer';
import { issueOpenIdToken } from '../../matrixrtc/openid';

jest.mock('@rocket.chat/core-services', () => ({
	Settings: { get: jest.fn() },
	License: { hasModule: jest.fn(async () => true) },
}));

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		getConfig: jest.fn(),
		isUserJoined: jest.fn(),
		makeSignedRequest: jest.fn(),
	},
}));

const mockSettingsGet = jest.mocked(Settings.get);
const mockGetConfig = jest.mocked(federationSDK.getConfig);
const mockIsUserJoined = jest.mocked(federationSDK.isUserJoined);
const mockMakeSignedRequest = jest.mocked(federationSDK.makeSignedRequest);

const OWN_SFU = 'wss://livekit.rc1';
const ROOM_ID = '!room:hs1';

const issuer = {
	getOwnTransport: jest.fn(() => ({ url: OWN_SFU, serviceUrl: 'https://rc1/matrixrtc/livekit-jwt' })),
	mintToken: jest.fn(async () => 'jwt'),
} satisfies IMatrixRTCLiveKitIssuer;

/** The room as this server sees it: who is joined, by Matrix user id. */
const joined = (...userIds: string[]) => mockIsUserJoined.mockImplementation(async (_roomId, userId) => userIds.includes(userId));

const userInfoAnswer = (body: unknown) => ({ json: async () => body }) as Awaited<ReturnType<typeof federationSDK.makeSignedRequest>>;

const openidToken = { access_token: 'opaque', token_type: 'Bearer', matrix_server_name: 'hs1', expires_in: 3600 };

const getTokenRequest = {
	room_id: ROOM_ID,
	slot_id: 'm.call#ROOM',
	openid_token: openidToken,
	member: { id: 'member1', claimed_user_id: '@carol:hs1', claimed_device_id: 'DEVICE' },
};

const sfuGetRequest = { room: ROOM_ID, openid_token: openidToken, device_id: 'DEVICE' };

const request = (path: string, init: RequestInit = {}) =>
	getMatrixRTCTokenServiceRoutes()
		.getHonoRouter()
		.request(path, { ...init, headers: { Origin: 'https://element', ...init.headers } });

const post = (path: string, body: unknown) =>
	request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

describe('lk-jwt-service compatible token service (/matrixrtc/livekit-jwt)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		setMatrixRTCLiveKitIssuer(issuer);
		mockSettingsGet.mockResolvedValue(true);
		mockGetConfig.mockImplementation(((key: string) => (key === 'serverName' ? 'rc1' : undefined)) as typeof federationSDK.getConfig);
		joined('@alice:rc1', '@carol:hs1');
		mockMakeSignedRequest.mockResolvedValue(userInfoAnswer({ sub: '@carol:hs1' }));
	});

	afterAll(() => setMatrixRTCLiveKitIssuer(undefined));

	describe('CORS', () => {
		it('answers the browser preflight for any origin', async () => {
			const response = await request('/get_token', {
				method: 'OPTIONS',
				headers: { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
			});

			expect(response.status).toBe(204);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
			expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
			expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
		});

		it('lets the browser read a token', async () => {
			const response = await post('/get_token', getTokenRequest);

			expect(response.status).toBe(200);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
		});

		it('lets the browser read a refusal', async () => {
			const response = await post('/get_token', {});

			expect(response.status).toBe(400);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
		});

		it('lets the browser read that federation is off', async () => {
			mockSettingsGet.mockResolvedValue(false);

			const response = await post('/get_token', getTokenRequest);

			expect(response.status).toBe(403);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
		});
	});

	describe('POST /get_token', () => {
		it('mints a subscribe-only token for the member the OpenID token stands for, with this SFU', async () => {
			const response = await post('/get_token', getTokenRequest);

			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ url: OWN_SFU, jwt: 'jwt' });
			expect(issuer.mintToken).toHaveBeenCalledWith({
				roomName: liveKitRoomAliasFor(ROOM_ID, 'm.call#ROOM'),
				identity: legacyLiveKitIdentityFor('@carol:hs1', 'DEVICE', 'member1'),
				canPublish: false,
			});
		});

		it("checks the OpenID token with its homeserver's userinfo endpoint", async () => {
			await post('/get_token', getTokenRequest);

			expect(mockMakeSignedRequest).toHaveBeenCalledWith({
				method: 'GET',
				domain: 'hs1',
				uri: '/_matrix/federation/v1/openid/userinfo',
				queryString: 'access_token=opaque',
			});
		});

		it('checks an OpenID token this server issued without asking anyone', async () => {
			joined('@alice:rc1');
			const ownToken = issueOpenIdToken('@alice:rc1', 'rc1');

			const response = await post('/get_token', {
				...getTokenRequest,
				openid_token: ownToken,
				member: { id: 'member1', claimed_user_id: '@alice:rc1', claimed_device_id: 'DEVICE' },
			});

			expect(response.status).toBe(200);
			expect(mockMakeSignedRequest).not.toHaveBeenCalled();
		});

		it('refuses a body that is not JSON', async () => {
			const response = await request('/get_token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });

			expect(response.status).toBe(400);
			expect(await response.json()).toMatchObject({ errcode: 'M_NOT_JSON' });
		});

		it.each([
			['room_id', { room_id: '' }],
			['slot_id', { slot_id: undefined }],
			['member.id', { member: { ...getTokenRequest.member, id: '' } }],
			['member.claimed_user_id', { member: { ...getTokenRequest.member, claimed_user_id: undefined } }],
			['member.claimed_device_id', { member: { ...getTokenRequest.member, claimed_device_id: '' } }],
			['openid_token.access_token', { openid_token: { ...openidToken, access_token: '' } }],
			['openid_token.matrix_server_name', { openid_token: { ...openidToken, matrix_server_name: undefined } }],
			['delay_timeout, with delay_id', { delay_id: 'delay' }],
			['delay_id, with delay_timeout', { delay_timeout: 1000 }],
		])('refuses a request without %s', async (_field, change) => {
			const response = await post('/get_token', { ...getTokenRequest, ...change });

			expect(response.status).toBe(400);
			expect(await response.json()).toMatchObject({ errcode: 'M_BAD_JSON' });
			expect(issuer.mintToken).not.toHaveBeenCalled();
		});

		it('refuses to take over the leave of a member of another homeserver', async () => {
			const response = await post('/get_token', { ...getTokenRequest, delay_id: 'delay', delay_timeout: 1000 });

			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({
				errcode: 'M_BAD_JSON',
				error: 'Delegation of delayed events is only supported for full access users',
			});
		});

		it('refuses an OpenID token its homeserver does not vouch for', async () => {
			mockMakeSignedRequest.mockRejectedValue(new Error('Federation request failed: 401'));

			const response = await post('/get_token', getTokenRequest);

			expect(response.status).toBe(401);
			expect(await response.json()).toMatchObject({ errcode: 'M_UNAUTHORIZED' });
		});

		it('refuses a homeserver vouching for a user of another homeserver', async () => {
			mockMakeSignedRequest.mockResolvedValue(userInfoAnswer({ sub: '@carol:rc1' }));

			const response = await post('/get_token', {
				...getTokenRequest,
				member: { ...getTokenRequest.member, claimed_user_id: '@carol:rc1' },
			});

			expect(response.status).toBe(401);
			expect(await response.json()).toMatchObject({ errcode: 'M_UNAUTHORIZED' });
		});

		it('refuses a member claiming to be someone the OpenID token does not stand for', async () => {
			const response = await post('/get_token', {
				...getTokenRequest,
				member: { ...getTokenRequest.member, claimed_user_id: '@mallory:hs1' },
			});

			expect(response.status).toBe(401);
			expect(await response.json()).toMatchObject({ errcode: 'M_UNAUTHORIZED' });
			expect(issuer.mintToken).not.toHaveBeenCalled();
		});

		it('refuses a user who is not joined to the room', async () => {
			joined('@alice:rc1');

			const response = await post('/get_token', getTokenRequest);

			expect(response.status).toBe(403);
			expect(await response.json()).toMatchObject({ errcode: 'M_FORBIDDEN' });
			expect(issuer.mintToken).not.toHaveBeenCalled();
		});

		it('is not here while LiveKit is not configured', async () => {
			setMatrixRTCLiveKitIssuer(undefined);

			const response = await post('/get_token', getTokenRequest);

			expect(response.status).toBe(404);
			expect(await response.json()).toMatchObject({ errcode: 'M_UNRECOGNIZED' });
			expect(mockMakeSignedRequest).not.toHaveBeenCalled();
		});
	});

	describe('POST /sfu/get', () => {
		it('mints a subscribe-only token for the room-wide call, named after the device', async () => {
			const response = await post('/sfu/get', sfuGetRequest);

			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ url: OWN_SFU, jwt: 'jwt' });
			expect(issuer.mintToken).toHaveBeenCalledWith({
				roomName: liveKitRoomAliasFor(ROOM_ID, 'm.call#ROOM'),
				identity: sfuGetLiveKitIdentityFor('@carol:hs1', 'DEVICE'),
				canPublish: false,
			});
		});

		it.each([
			['room', { room: '' }],
			['openid_token.access_token', { openid_token: { ...openidToken, access_token: undefined } }],
			['openid_token.matrix_server_name', { openid_token: { ...openidToken, matrix_server_name: '' } }],
		])('refuses a request without %s', async (_field, change) => {
			const response = await post('/sfu/get', { ...sfuGetRequest, ...change });

			expect(response.status).toBe(400);
			expect(await response.json()).toMatchObject({ errcode: 'M_BAD_JSON' });
		});

		it('refuses an OpenID token its homeserver does not vouch for', async () => {
			mockMakeSignedRequest.mockResolvedValue(userInfoAnswer({ errcode: 'M_UNKNOWN_TOKEN' }));

			const response = await post('/sfu/get', sfuGetRequest);

			expect(response.status).toBe(401);
		});

		it('refuses a user who is not joined to the room', async () => {
			joined('@alice:rc1');

			const response = await post('/sfu/get', sfuGetRequest);

			expect(response.status).toBe(403);
		});
	});

	describe('GET /healthz', () => {
		it('answers while the service is up', async () => {
			const response = await request('/healthz');

			expect(response.status).toBe(200);
		});
	});
});
