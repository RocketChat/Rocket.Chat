import type { IMatrixRTCMembership, IUser, IVideoConference } from '@rocket.chat/core-typings';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { MatrixRTCMemberships } from '@rocket.chat/models';

import { getOpenIdTokenSubject } from './openid';
import { joinRTCSession } from './session';
import { getRemoteLiveKitToken } from './tokens';

jest.mock('@rocket.chat/models', () => ({
	MatrixRTCMemberships: {
		findActiveBySession: jest.fn(),
		findOneActiveLocal: jest.fn(),
	},
}));

jest.mock('./session', () => ({
	joinRTCSession: jest.fn(),
}));

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		getConfig: jest.fn(),
	},
}));

const mockFindActiveBySession = jest.mocked(MatrixRTCMemberships.findActiveBySession);
const mockFindOneActiveLocal = jest.mocked(MatrixRTCMemberships.findOneActiveLocal);
const mockJoinRTCSession = jest.mocked(joinRTCSession);
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

	// A client joining a call that already has remote members asks for their SFU before its join is announced.
	it("announces the member's join first when it has not been yet, and names that membership", async () => {
		sessionWith(bobOn({ type: 'livekit', serviceUrl: REMOTE_SERVICE }));
		mockFindOneActiveLocal.mockResolvedValue(null);
		mockJoinRTCSession.mockResolvedValue(alice);
		fetchSpy.mockResolvedValue(serviceAnswer(200, { url: REMOTE_SFU, jwt: 'remote-jwt' }));

		expect(await getRemoteLiveKitToken(call, user, 'rc2', REMOTE_SERVICE)).toEqual({ serverUrl: REMOTE_SFU, token: 'remote-jwt' });
		expect(mockJoinRTCSession).toHaveBeenCalledWith(call, user);
		expect(fetchedBodies()[0][1]).toMatchObject({ member: { id: 'alice-member' } });
	});

	it('does not announce a join that already is', async () => {
		sessionWith(alice, bobOn({ type: 'livekit', serviceUrl: REMOTE_SERVICE }));
		fetchSpy.mockResolvedValue(serviceAnswer(200, { url: REMOTE_SFU, jwt: 'remote-jwt' }));

		await getRemoteLiveKitToken(call, user, 'rc2', REMOTE_SERVICE);
		expect(mockJoinRTCSession).not.toHaveBeenCalled();
	});

	describe('refusals', () => {
		it('refuses an SFU nobody in the call publishes on', async () => {
			sessionWith(alice, bobOn({ type: 'livekit', serviceUrl: REMOTE_SERVICE }));

			await expect(getRemoteLiveKitToken(call, user, 'rc2', 'https://elsewhere/livekit/jwt')).rejects.toThrow('Nobody');
			await expect(getRemoteLiveKitToken(call, user, 'rc3', REMOTE_SERVICE)).rejects.toThrow('Nobody');
		});

		it("never asks for this server's own SFU, even when a local member names it", async () => {
			sessionWith(alice);

			await expect(getRemoteLiveKitToken(call, user, 'rc1', 'https://rc1/matrixrtc/livekit-jwt')).rejects.toThrow('Nobody');
		});

		it('refuses a member whose join cannot be announced', async () => {
			sessionWith(alice, bobOn({ type: 'livekit', serviceUrl: REMOTE_SERVICE }));
			mockFindOneActiveLocal.mockResolvedValue(null);
			mockJoinRTCSession.mockRejectedValue(new Error('LiveKit is not configured'));

			await expect(getRemoteLiveKitToken(call, user, 'rc2', REMOTE_SERVICE)).rejects.toThrow('LiveKit is not configured');
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it('refuses a conference that does not mirror a session', async () => {
			await expect(getRemoteLiveKitToken({ _id: 'call' } as IVideoConference, user, 'rc2', REMOTE_SERVICE)).rejects.toThrow(
				'does not mirror',
			);
		});
	});
});
