import { VideoConf } from '@rocket.chat/core-services';
import type { IMatrixRTCMembership, IUser, IVideoConference } from '@rocket.chat/core-typings';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { MatrixRTCMemberships } from '@rocket.chat/models';

import { configureMatrixRTC } from './config';
import { setMatrixRTCLiveKitIssuer } from './issuer';
import { MEMBERSHIP_REFRESH_HEADROOM_MS, declineRTCSession, joinRTCSession, leaveRTCSession, notifyRTCSession } from './session';

jest.mock('@rocket.chat/core-services', () => ({
	VideoConf: { setMemberFederation: jest.fn() },
}));

jest.mock('@rocket.chat/models', () => ({
	MatrixRTCMemberships: {
		findOneActiveLocal: jest.fn(),
		insertOne: jest.fn(),
		updateAnnouncementById: jest.fn(),
		findLocalByCallIdAndUid: jest.fn(),
		removeByIds: jest.fn(),
		setNotificationById: jest.fn(),
		findOneRemoteRinging: jest.fn(),
	},
}));

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		getConfig: jest.fn(),
		getLatestRoomState2: jest.fn(),
		getEventById: jest.fn(),
		sendStateEvent: jest.fn(),
		sendStickyEvent: jest.fn(),
	},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({ error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() })),
}));

const memberships = jest.mocked(MatrixRTCMemberships);
const sdk = jest.mocked(federationSDK);
const setMemberFederation = jest.mocked(VideoConf.setMemberFederation);

const HOUR = 3_600_000;
const SENT_AT = 1_791_374_400_000;
const SERVICE_URL = 'https://rc.example.com/matrixrtc/livekit-jwt';

const call = {
	_id: 'call1',
	rid: 'room1',
	federation: { mrid: '!abc:rc.example.com', slotId: 'm.call#ROOM' },
} as IVideoConference;

const alice = { _id: 'alice-id', username: 'alice' } as IUser;

const storedMembership = (overrides: Partial<IMatrixRTCMembership> = {}): IMatrixRTCMembership => ({
	_id: 'membership1',
	_updatedAt: new Date(SENT_AT),
	rid: 'room1',
	mrid: '!abc:rc.example.com',
	slotId: 'm.call#ROOM',
	callId: 'call1',
	mode: 'compatibility',
	userId: '@alice:rc.example.com',
	uid: 'alice-id',
	local: true,
	deviceId: 'ABCDEFGHIJ',
	memberId: '@alice:rc.example.com:ABCDEFGHIJ',
	stateKey: '_@alice:rc.example.com_ABCDEFGHIJ_m.call',
	eventId: '$join',
	transport: { type: 'livekit', serviceUrl: SERVICE_URL },
	serverName: 'rc.example.com',
	livekitIdentity: '@alice:rc.example.com:ABCDEFGHIJ',
	callIntent: 'video',
	joinedAt: new Date(SENT_AT),
	expiresAt: new Date(SENT_AT + 4 * HOUR),
	...overrides,
});

const cursorOf = <T>(items: T[]) => ({ toArray: jest.fn().mockResolvedValue(items) }) as any;

describe('joinRTCSession', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers({ now: SENT_AT, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });

		configureMatrixRTC({ enabled: true, profile: 'compatibility' });
		setMatrixRTCLiveKitIssuer({
			getOwnTransport: () => ({ url: 'wss://sfu.rc.example.com', serviceUrl: SERVICE_URL }),
			mintToken: jest.fn(),
		});

		sdk.getConfig.mockReturnValue('rc.example.com' as any);
		sdk.getLatestRoomState2.mockResolvedValue({ version: '10' } as any);
		sdk.getEventById.mockResolvedValue({ event: { origin_server_ts: SENT_AT } } as any);
		sdk.sendStateEvent.mockResolvedValue({ eventId: '$join' } as any);
		memberships.findOneActiveLocal.mockResolvedValue(null);
		memberships.insertOne.mockResolvedValue({ insertedId: 'membership1' } as any);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('announces a new member as Element Call does by default, under a state key of their own device', async () => {
		await joinRTCSession(call, alice);

		expect(sdk.sendStateEvent).toHaveBeenCalledTimes(1);
		const [roomId, type, stateKey, content, sender] = sdk.sendStateEvent.mock.calls[0];
		const deviceId = content.device_id as string;

		expect(deviceId).toMatch(/^[A-Z]{10}$/);
		expect([roomId, type, stateKey, sender]).toEqual([
			'!abc:rc.example.com',
			'org.matrix.msc3401.call.member',
			`_@alice:rc.example.com_${deviceId}_m.call`,
			'@alice:rc.example.com',
		]);
		expect(content).toEqual({
			'application': 'm.call',
			'call_id': '',
			'scope': 'm.room',
			'device_id': deviceId,
			'membershipID': `@alice:rc.example.com:${deviceId}`,
			'expires': 4 * HOUR,
			'm.call.intent': 'video',
			'focus_active': { type: 'livekit', focus_selection: 'multi_sfu' },
			'foci_preferred': [{ type: 'livekit', livekit_service_url: SERVICE_URL }],
		});
	});

	it('records the membership as this server announced it, with the identity /sfu/get readers expect', async () => {
		const membership = await joinRTCSession(call, alice);
		const { deviceId } = membership;

		expect(membership).toMatchObject({
			_id: 'membership1',
			rid: 'room1',
			mrid: '!abc:rc.example.com',
			slotId: 'm.call#ROOM',
			callId: 'call1',
			mode: 'compatibility',
			userId: '@alice:rc.example.com',
			uid: 'alice-id',
			local: true,
			memberId: `@alice:rc.example.com:${deviceId}`,
			stateKey: `_@alice:rc.example.com_${deviceId}_m.call`,
			eventId: '$join',
			transport: { type: 'livekit', serviceUrl: SERVICE_URL },
			serverName: 'rc.example.com',
			livekitIdentity: `@alice:rc.example.com:${deviceId}`,
			joinedAt: new Date(SENT_AT),
			expiresAt: new Date(SENT_AT + 4 * HOUR),
		});
		expect(memberships.insertOne).toHaveBeenCalledWith(expect.objectContaining({ uid: 'alice-id', local: true }));
	});

	it('puts the membership on the member roster entry', async () => {
		const { deviceId } = await joinRTCSession(call, alice);

		expect(setMemberFederation).toHaveBeenCalledWith('call1', 'alice-id', {
			serverName: 'rc.example.com',
			transport: SERVICE_URL,
			livekitIdentity: `@alice:rc.example.com:${deviceId}`,
			local: true,
		});
	});

	it('drops the state key prefix in rooms whose version lets users own their key', async () => {
		sdk.getLatestRoomState2.mockResolvedValue({ version: 'org.matrix.msc3757.11' } as any);
		const otherRoomCall = { ...call, _id: 'call2', federation: { mrid: '!def:rc.example.com', slotId: 'm.call#ROOM' } } as IVideoConference;

		const { deviceId } = await joinRTCSession(otherRoomCall, alice);

		expect(sdk.sendStateEvent.mock.calls[0][2]).toBe(`@alice:rc.example.com_${deviceId}_m.call`);
	});

	it('returns the membership that still counts instead of announcing another', async () => {
		memberships.findOneActiveLocal.mockResolvedValue(storedMembership());

		await expect(joinRTCSession(call, alice)).resolves.toMatchObject({ _id: 'membership1', eventId: '$join' });

		expect(sdk.sendStateEvent).not.toHaveBeenCalled();
		expect(memberships.insertOne).not.toHaveBeenCalled();
		expect(setMemberFederation).toHaveBeenCalledWith(
			'call1',
			'alice-id',
			expect.objectContaining({ livekitIdentity: '@alice:rc.example.com:ABCDEFGHIJ' }),
		);
	});

	it('announces once for joins that arrive together, as a join and a token request do', async () => {
		let stored: IMatrixRTCMembership | null = null;
		memberships.findOneActiveLocal.mockImplementation(async () => stored);
		memberships.insertOne.mockImplementation(async (doc) => {
			stored = { ...(doc as IMatrixRTCMembership), _id: 'membership1' };
			return { insertedId: 'membership1' } as any;
		});

		const [first, second] = await Promise.all([joinRTCSession(call, alice), joinRTCSession(call, alice)]);

		expect(sdk.sendStateEvent).toHaveBeenCalledTimes(1);
		expect(second.livekitIdentity).toBe(first.livekitIdentity);
	});

	it('fails clearly, announcing nothing, while LiveKit is not configured', async () => {
		setMatrixRTCLiveKitIssuer(undefined);

		await expect(joinRTCSession(call, alice)).rejects.toThrow(/LiveKit is not configured/);
		expect(sdk.sendStateEvent).not.toHaveBeenCalled();
	});

	it('refuses a conference that is not in a federated room', async () => {
		await expect(joinRTCSession({ ...call, federation: undefined } as IVideoConference, alice)).rejects.toThrow(/not in a federated room/);
		expect(memberships.findOneActiveLocal).not.toHaveBeenCalled();
	});

	describe('refreshing', () => {
		it('leaves a membership alone while it counts for longer than the headroom', async () => {
			jest.setSystemTime(SENT_AT + 4 * HOUR - MEMBERSHIP_REFRESH_HEADROOM_MS - 1);
			memberships.findOneActiveLocal.mockResolvedValue(storedMembership());

			await joinRTCSession(call, alice);

			expect(sdk.sendStateEvent).not.toHaveBeenCalled();
		});

		it('announces it again before it runs out, from its first announcement and for longer', async () => {
			jest.setSystemTime(SENT_AT + 4 * HOUR - MEMBERSHIP_REFRESH_HEADROOM_MS);
			memberships.findOneActiveLocal.mockResolvedValue(storedMembership());
			sdk.sendStateEvent.mockResolvedValue({ eventId: '$refresh' } as any);

			const membership = await joinRTCSession(call, alice);

			const [, , stateKey, content] = sdk.sendStateEvent.mock.calls[0];
			expect(stateKey).toBe('_@alice:rc.example.com_ABCDEFGHIJ_m.call');
			expect(content).toMatchObject({ device_id: 'ABCDEFGHIJ', created_ts: SENT_AT, expires: 8 * HOUR });
			expect(membership).toMatchObject({ eventId: '$refresh', expiresAt: new Date(SENT_AT + 8 * HOUR) });
			expect(memberships.updateAnnouncementById).toHaveBeenCalledWith('membership1', {
				eventId: '$refresh',
				expiresAt: new Date(SENT_AT + 8 * HOUR),
			});
		});

		it('grows the expiry again on the next refresh, so the content always changes', async () => {
			jest.setSystemTime(SENT_AT + 8 * HOUR - 1000);
			memberships.findOneActiveLocal.mockResolvedValue(storedMembership({ expiresAt: new Date(SENT_AT + 8 * HOUR) }));

			await joinRTCSession(call, alice);

			expect(sdk.sendStateEvent.mock.calls[0][3]).toMatchObject({ created_ts: SENT_AT, expires: 12 * HOUR });
		});

		it('keeps the membership that still counts when the refresh fails', async () => {
			jest.setSystemTime(SENT_AT + 4 * HOUR - 1000);
			memberships.findOneActiveLocal.mockResolvedValue(storedMembership());
			sdk.sendStateEvent.mockRejectedValue(new Error('rejected'));

			await expect(joinRTCSession(call, alice)).resolves.toMatchObject({ eventId: '$join' });
			expect(memberships.updateAnnouncementById).not.toHaveBeenCalled();
		});
	});
});

describe('leaveRTCSession', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		sdk.sendStateEvent.mockResolvedValue({ eventId: '$leave' } as any);
	});

	it('withdraws every device this server announced for the member, with the empty state Element leaves with', async () => {
		memberships.findLocalByCallIdAndUid.mockReturnValue(
			cursorOf([
				storedMembership(),
				storedMembership({ _id: 'membership2', userId: '@alice:rc.example.com', stateKey: '_@alice:rc.example.com_KLMNOPQRST_m.call' }),
			]),
		);

		await leaveRTCSession(call, 'alice-id');

		expect(memberships.findLocalByCallIdAndUid).toHaveBeenCalledWith('call1', 'alice-id');
		expect(sdk.sendStateEvent.mock.calls).toEqual([
			['!abc:rc.example.com', 'org.matrix.msc3401.call.member', '_@alice:rc.example.com_ABCDEFGHIJ_m.call', {}, '@alice:rc.example.com'],
			['!abc:rc.example.com', 'org.matrix.msc3401.call.member', '_@alice:rc.example.com_KLMNOPQRST_m.call', {}, '@alice:rc.example.com'],
		]);
		expect(memberships.removeByIds).toHaveBeenCalledWith(['membership1', 'membership2']);
	});

	it('forgets the membership even when the leave cannot be sent: it runs out anyway', async () => {
		memberships.findLocalByCallIdAndUid.mockReturnValue(cursorOf([storedMembership()]));
		sdk.sendStateEvent.mockRejectedValue(new Error('unreachable'));

		await expect(leaveRTCSession(call, 'alice-id')).resolves.toBeUndefined();
		expect(memberships.removeByIds).toHaveBeenCalledWith(['membership1']);
	});

	it('does nothing for a member this server never announced', async () => {
		memberships.findLocalByCallIdAndUid.mockReturnValue(cursorOf([]));

		await leaveRTCSession(call, 'alice-id');

		expect(sdk.sendStateEvent).not.toHaveBeenCalled();
		expect(memberships.removeByIds).not.toHaveBeenCalled();
	});
});

describe('notifyRTCSession', () => {
	const bob = {
		_id: 'bob-id',
		username: '@bob:remote.example.org',
		federated: true,
		federation: { version: 1, mui: '@bob:remote.example.org', origin: 'remote.example.org' },
	} as unknown as IUser;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers({ now: SENT_AT, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
		sdk.getConfig.mockReturnValue('rc.example.com' as any);
		sdk.sendStickyEvent.mockResolvedValue({ eventId: '$ring' } as any);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('rings the callee as Element Call does, mentioning them and relating to the caller membership', async () => {
		memberships.findOneActiveLocal.mockResolvedValue(storedMembership());

		await notifyRTCSession(call, alice, [bob], 'ring');

		expect(sdk.sendStickyEvent).toHaveBeenCalledWith(
			'!abc:rc.example.com',
			'org.matrix.msc4075.rtc.notification',
			{
				'slot_id': 'm.call#ROOM',
				'm.mentions': { user_ids: ['@bob:remote.example.org'] },
				'notification_type': 'ring',
				'm.relates_to': { rel_type: 'm.reference', event_id: '$join' },
				'sender_ts': SENT_AT,
				'lifetime': 90_000,
				'msc4354_sticky_key': 'm.call#ROOM',
				'm.call.intent': 'video',
			},
			'@alice:rc.example.com',
			110_000,
		);
	});

	it('remembers the ring, which a decline relates to', async () => {
		memberships.findOneActiveLocal.mockResolvedValue(storedMembership());

		await notifyRTCSession(call, alice, [bob], 'ring');

		expect(memberships.setNotificationById).toHaveBeenCalledWith('membership1', { eventId: '$ring', userIds: ['@bob:remote.example.org'] });
	});

	it('cannot ring for a caller who is not announced: the ring would relate to nothing', async () => {
		memberships.findOneActiveLocal.mockResolvedValue(null);

		await expect(notifyRTCSession(call, alice, [bob], 'ring')).rejects.toThrow(/no membership/);
		expect(sdk.sendStickyEvent).not.toHaveBeenCalled();
	});
});

describe('declineRTCSession', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		sdk.getConfig.mockReturnValue('rc.example.com' as any);
		sdk.sendStickyEvent.mockResolvedValue({ eventId: '$decline' } as any);
	});

	it('turns down the ring that rang the user, as js-sdk does', async () => {
		memberships.findOneRemoteRinging.mockResolvedValue(
			storedMembership({ local: false, notification: { eventId: '$ring', userIds: ['@alice:rc.example.com'] } }),
		);

		await declineRTCSession(call, alice);

		expect(memberships.findOneRemoteRinging).toHaveBeenCalledWith('call1', '@alice:rc.example.com');
		expect(sdk.sendStickyEvent).toHaveBeenCalledWith(
			'!abc:rc.example.com',
			'org.matrix.msc4310.rtc.decline',
			{ 'm.relates_to': { rel_type: 'm.reference', event_id: '$ring' }, 'msc4354_sticky_key': '$ring' },
			'@alice:rc.example.com',
			120_000,
		);
	});

	it('sends nothing when no other server rang the user', async () => {
		memberships.findOneRemoteRinging.mockResolvedValue(null);

		await declineRTCSession(call, alice);

		expect(sdk.sendStickyEvent).not.toHaveBeenCalled();
	});
});
