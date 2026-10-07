import type { IMatrixRTCMembership, IUser, IVideoConference } from '@rocket.chat/core-typings';
import { FederationRequestError, federationSDK } from '@rocket.chat/federation-sdk';
import { MatrixRTCMemberships } from '@rocket.chat/models';

import { getOpenIdTokenSubject } from './openid';
import { getRemoteLiveKitToken } from './tokens';

jest.mock('@rocket.chat/models', () => ({
	MatrixRTCMemberships: {
		findActiveBySession: jest.fn(),
		findOneActiveLocal: jest.fn(),
	},
}));

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		getConfig: jest.fn(),
		makeSignedRequest: jest.fn(),
	},
	FederationRequestError: class extends Error {
		constructor(
			readonly response: { status: number },
			text: string,
		) {
			super(`Federation request failed: ${response.status} ${text}`);
		}
	},
}));

const mockFindActiveBySession = jest.mocked(MatrixRTCMemberships.findActiveBySession);
const mockFindOneActiveLocal = jest.mocked(MatrixRTCMemberships.findOneActiveLocal);
const mockMakeSignedRequest = jest.mocked(federationSDK.makeSignedRequest);
const mockGetConfig = jest.mocked(federationSDK.getConfig);

const MRID = '!room:rc1';
const SLOT = 'm.call#ROOM';
const REMOTE_SFU = 'wss://livekit.rc2';
const REMOTE_SERVICE = 'https://rc2/matrixrtc/livekit-jwt';

const call = { _id: 'call', federation: { mrid: MRID, slotId: SLOT } } as IVideoConference;
const user = { _id: 'alice-id' } as IUser;

const membership = (fields: Partial<IMatrixRTCMembership>): IMatrixRTCMembership =>
	({ mrid: MRID, slotId: SLOT, callId: 'call', mode: 'matrix_2_0', ...fields }) as IMatrixRTCMembership;

const alice = membership({
	local: true,
	uid: 'alice-id',
	userId: '@alice:rc1',
	serverName: 'rc1',
	deviceId: 'ALICEDEVICE',
	memberId: 'alice-member',
	transport: { type: 'livekit', serviceUrl: 'https://rc1/matrixrtc/livekit-jwt' },
});

const bobOn = (transport: IMatrixRTCMembership['transport']) =>
	membership({ local: false, uid: 'bob-id', userId: '@bob:rc2', serverName: 'rc2', deviceId: 'BOB', memberId: 'bob-member', transport });

const signedAnswer = (body: unknown) => ({ json: async () => body }) as Awaited<ReturnType<typeof federationSDK.makeSignedRequest>>;

const rejection = (status: number, body: unknown) =>
	new FederationRequestError({ status } as ConstructorParameters<typeof FederationRequestError>[0], JSON.stringify(body));

const serviceAnswer = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

describe('getRemoteLiveKitToken', () => {
	let fetchSpy: jest.SpyInstance;

	const sessionWith = (...memberships: IMatrixRTCMembership[]) =>
		mockFindActiveBySession.mockReturnValue({ toArray: async () => memberships } as unknown as ReturnType<
			typeof MatrixRTCMemberships.findActiveBySession
		>);

	const fetchedBodies = () => fetchSpy.mock.calls.map(([url, init]) => [url, JSON.parse(init.body)]);

	beforeEach(() => {
		jest.clearAllMocks();
		fetchSpy = jest.spyOn(global, 'fetch');
		mockGetConfig.mockImplementation(((key: string) => (key === 'serverName' ? 'rc1' : undefined)) as typeof federationSDK.getConfig);
		mockFindOneActiveLocal.mockResolvedValue(alice);
	});

	afterEach(() => fetchSpy.mockRestore());

	describe('from a member announcing their SFU by its address (MSC4195)', () => {
		beforeEach(() => sessionWith(alice, bobOn({ type: 'livekit', url: REMOTE_SFU })));

		it("asks the member's homeserver, naming our member both ways lk-jwt-service reads it", async () => {
			mockMakeSignedRequest.mockResolvedValue(signedAnswer({ jwt: 'remote-jwt' }));

			expect(await getRemoteLiveKitToken(call, user, 'rc2', REMOTE_SFU)).toEqual({ serverUrl: REMOTE_SFU, token: 'remote-jwt' });
			expect(mockMakeSignedRequest).toHaveBeenCalledWith({
				method: 'POST',
				domain: 'rc2',
				uri: '/_matrix/federation/unstable/io.element.msc4195/rtc/livekit/get_token',
				signedBody: {
					url: REMOTE_SFU,
					user_id: '@alice:rc1',
					room_id: MRID,
					slot_id: SLOT,
					member_id: 'alice-member',
					member: { id: 'alice-member', claimed_user_id: '@alice:rc1', claimed_device_id: 'ALICEDEVICE' },
				},
			});
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it('falls back to the stable path on a homeserver that does not know the unstable one', async () => {
			mockMakeSignedRequest
				.mockRejectedValueOnce(rejection(404, { errcode: 'M_UNRECOGNIZED' }))
				.mockResolvedValueOnce(signedAnswer({ jwt: 'remote-jwt' }));

			expect(await getRemoteLiveKitToken(call, user, 'rc2', REMOTE_SFU)).toEqual({ serverUrl: REMOTE_SFU, token: 'remote-jwt' });
			expect(mockMakeSignedRequest).toHaveBeenLastCalledWith(
				expect.objectContaining({ uri: '/_matrix/federation/v1/rtc/livekit/get_token' }),
			);
		});

		it('takes a refusal as final', async () => {
			mockMakeSignedRequest.mockRejectedValue(rejection(403, { errcode: 'M_FORBIDDEN' }));

			await expect(getRemoteLiveKitToken(call, user, 'rc2', REMOTE_SFU)).rejects.toThrow('403');
			expect(mockMakeSignedRequest).toHaveBeenCalledTimes(1);
		});

		it('refuses an answer without a token', async () => {
			mockMakeSignedRequest.mockResolvedValue(signedAnswer({}));

			await expect(getRemoteLiveKitToken(call, user, 'rc2', REMOTE_SFU)).rejects.toThrow('without a token');
		});
	});

	describe('from a member announcing a token service (livekit_service_url)', () => {
		beforeEach(() => sessionWith(alice, bobOn({ type: 'livekit', serviceUrl: REMOTE_SERVICE })));

		it('asks the service as Element Call does, with an OpenID token vouching for our member', async () => {
			fetchSpy.mockResolvedValue(serviceAnswer(200, { url: REMOTE_SFU, jwt: 'remote-jwt' }));

			expect(await getRemoteLiveKitToken(call, user, 'rc2', REMOTE_SERVICE)).toEqual({ serverUrl: REMOTE_SFU, token: 'remote-jwt' });

			const [[url, body]] = fetchedBodies();
			expect(url).toBe(`${REMOTE_SERVICE}/get_token`);
			expect(body).toEqual({
				room_id: MRID,
				slot_id: SLOT,
				openid_token: { access_token: expect.any(String), token_type: 'Bearer', matrix_server_name: 'rc1', expires_in: 3600 },
				member: { id: 'alice-member', claimed_user_id: '@alice:rc1', claimed_device_id: 'ALICEDEVICE' },
			});
			expect(getOpenIdTokenSubject(body.openid_token.access_token)).toBe('@alice:rc1');
			expect(mockMakeSignedRequest).not.toHaveBeenCalled();
		});

		it('falls back to /sfu/get on a service that predates /get_token', async () => {
			fetchSpy
				.mockResolvedValueOnce(serviceAnswer(404, { errcode: 'M_UNRECOGNIZED' }))
				.mockResolvedValueOnce(serviceAnswer(200, { url: REMOTE_SFU, jwt: 'remote-jwt' }));

			expect(await getRemoteLiveKitToken(call, user, 'rc2', REMOTE_SERVICE)).toEqual({ serverUrl: REMOTE_SFU, token: 'remote-jwt' });

			const [, [url, body]] = fetchedBodies();
			expect(url).toBe(`${REMOTE_SERVICE}/sfu/get`);
			expect(body).toEqual({ room: MRID, openid_token: expect.objectContaining({ matrix_server_name: 'rc1' }), device_id: 'ALICEDEVICE' });
		});

		it('takes a refusal as final', async () => {
			fetchSpy.mockResolvedValue(serviceAnswer(403, { errcode: 'M_FORBIDDEN' }));

			await expect(getRemoteLiveKitToken(call, user, 'rc2', REMOTE_SERVICE)).rejects.toThrow('403');
			expect(fetchSpy).toHaveBeenCalledTimes(1);
		});

		it('refuses a token service that is not served over HTTPS, without calling it', async () => {
			sessionWith(alice, bobOn({ type: 'livekit', serviceUrl: 'http://10.0.0.1/internal' }));

			await expect(getRemoteLiveKitToken(call, user, 'rc2', 'http://10.0.0.1/internal')).rejects.toThrow('HTTPS');
			expect(fetchSpy).not.toHaveBeenCalled();
		});
	});

	describe('from a member announcing both', () => {
		const transport = { type: 'livekit' as const, url: REMOTE_SFU, serviceUrl: REMOTE_SERVICE };

		beforeEach(() => sessionWith(alice, bobOn(transport)));

		it('asks the token service first', async () => {
			fetchSpy.mockResolvedValue(serviceAnswer(200, { url: REMOTE_SFU, jwt: 'service-jwt' }));

			expect(await getRemoteLiveKitToken(call, user, 'rc2', REMOTE_SFU)).toEqual({ serverUrl: REMOTE_SFU, token: 'service-jwt' });
			expect(mockMakeSignedRequest).not.toHaveBeenCalled();
		});

		it("asks the member's homeserver when the token service refuses", async () => {
			fetchSpy.mockResolvedValue(serviceAnswer(500, {}));
			mockMakeSignedRequest.mockResolvedValue(signedAnswer({ jwt: 'federation-jwt' }));

			expect(await getRemoteLiveKitToken(call, user, 'rc2', REMOTE_SFU)).toEqual({ serverUrl: REMOTE_SFU, token: 'federation-jwt' });
		});
	});

	describe('refusals', () => {
		it('refuses an SFU nobody in the call publishes on', async () => {
			sessionWith(alice, bobOn({ type: 'livekit', url: REMOTE_SFU }));

			await expect(getRemoteLiveKitToken(call, user, 'rc2', 'wss://livekit.elsewhere')).rejects.toThrow('Nobody');
			await expect(getRemoteLiveKitToken(call, user, 'rc3', REMOTE_SFU)).rejects.toThrow('Nobody');
		});

		it("never asks for this server's own SFU, even when a local member names it", async () => {
			sessionWith(alice);

			await expect(getRemoteLiveKitToken(call, user, 'rc1', 'https://rc1/matrixrtc/livekit-jwt')).rejects.toThrow('Nobody');
		});

		it('refuses a user who has not joined the call', async () => {
			sessionWith(alice, bobOn({ type: 'livekit', url: REMOTE_SFU }));
			mockFindOneActiveLocal.mockResolvedValue(null);

			await expect(getRemoteLiveKitToken(call, user, 'rc2', REMOTE_SFU)).rejects.toThrow('has not joined');
			expect(mockMakeSignedRequest).not.toHaveBeenCalled();
		});

		it('refuses a conference that does not mirror a session', async () => {
			await expect(getRemoteLiveKitToken({ _id: 'call' } as IVideoConference, user, 'rc2', REMOTE_SFU)).rejects.toThrow('does not mirror');
		});
	});
});
