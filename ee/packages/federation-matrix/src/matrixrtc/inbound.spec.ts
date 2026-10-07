import { VideoConf } from '@rocket.chat/core-services';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { MatrixRTCMemberships, Rooms, Users } from '@rocket.chat/models';

import { configureMatrixRTC } from './config';
import { handleMatrixRTCEvent } from './inbound';
import { getOrCreateFederatedUser } from '../helpers/getOrCreateFederatedUser';

jest.mock('@rocket.chat/core-services', () => ({
	VideoConf: { syncFederatedSession: jest.fn(), ringFromFederation: jest.fn(), declineCall: jest.fn() },
}));

jest.mock('@rocket.chat/models', () => ({
	MatrixRTCMemberships: {
		findRemoteByRoom: jest.fn(),
		findOne: jest.fn(),
		upsertRemote: jest.fn(),
		removeByIds: jest.fn(),
		setNotificationById: jest.fn(),
		findOneByNotificationEventId: jest.fn(),
	},
	Rooms: { findOneFederatedByMrid: jest.fn() },
	Users: { find: jest.fn() },
	VideoConference: { find: jest.fn() },
}));

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		getConfig: jest.fn(),
		getLatestRoomState: jest.fn(),
		getActiveStickyEvents: jest.fn(),
	},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({ error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() })),
}));

jest.mock('../helpers/getOrCreateFederatedUser', () => ({
	getOrCreateFederatedUser: jest.fn(),
}));

const sdk = jest.mocked(federationSDK);
const memberships = jest.mocked(MatrixRTCMemberships);
const rooms = jest.mocked(Rooms);
const syncFederatedSession = jest.mocked(VideoConf.syncFederatedSession);

const NOW = 1_791_374_400_000;
const HOUR = 3_600_000;
const MRID = '!abc:remote.example.org';
const SERVICE_URL = 'https://remote.example.org/livekit/jwt';

const room = { _id: 'room1', federated: true, federation: { version: 1, mrid: MRID, origin: 'remote.example.org' } };

const pdu = (event: Record<string, unknown>) => ({
	type: event.type,
	stateKey: event.state_key,
	eventId: event.event_id,
	event,
});

const joined = (userId: string) =>
	pdu({ type: 'm.room.member', state_key: userId, sender: userId, content: { membership: 'join' }, event_id: `$join_${userId}` });

const compatMember = (userId: string, deviceId: string, content: Record<string, unknown> = {}) =>
	pdu({
		type: 'org.matrix.msc3401.call.member',
		state_key: `_${userId}_${deviceId}_m.call`,
		sender: userId,
		origin_server_ts: NOW - 1000,
		event_id: `$member_${deviceId}`,
		content: {
			'application': 'm.call',
			'call_id': '',
			'scope': 'm.room',
			'device_id': deviceId,
			'membershipID': `${userId}:${deviceId}`,
			'expires': 4 * HOUR,
			'm.call.intent': 'video',
			'focus_active': { type: 'livekit', focus_selection: 'multi_sfu' },
			'foci_preferred': [{ type: 'livekit', livekit_service_url: SERVICE_URL }],
			...content,
		},
	});

const stateOf = (...events: ReturnType<typeof pdu>[]) => new Map(events.map((event) => [`${event.type}:${event.stateKey}`, event]));

const stickyMember = ({
	userId = '@bob:remote.example.org',
	memberId = 'member-1',
	eventId,
	expiresAt,
	content,
}: {
	userId?: string;
	memberId?: string;
	eventId: string;
	expiresAt: number;
	content?: Record<string, unknown>;
}) => ({
	event_id: eventId,
	expiresAt,
	event: {
		type: 'org.matrix.msc4143.rtc.member',
		sender: userId,
		room_id: MRID,
		origin_server_ts: NOW - 1000,
		msc4354_sticky: { duration_ms: HOUR },
		content: content ?? {
			slot_id: 'm.call#ROOM',
			application: { type: 'm.call' },
			transports: { published: [{ type: 'livekit', url: 'wss://sfu.remote.example.org' }], can_subscribe: ['livekit'] },
			member: { user_id: userId, device_id: 'DEVICEB', id: memberId },
			versions: [],
			msc4354_sticky_key: memberId,
		},
	},
});

const event = (overrides: Record<string, unknown> = {}) =>
	({
		event_id: '$event',
		event: {
			type: 'org.matrix.msc3401.call.member',
			room_id: MRID,
			sender: '@bob:remote.example.org',
			state_key: '_@bob:remote.example.org_DEVICEB_m.call',
			content: {},
			...overrides,
		},
	}) as any;

const cursorOf = <T>(items: T[]) => ({ toArray: jest.fn().mockResolvedValue(items) }) as any;

describe('handleMatrixRTCEvent', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });

		configureMatrixRTC({ enabled: true, profile: 'compatibility' });
		sdk.getConfig.mockReturnValue('rc.example.com' as any);
		sdk.getLatestRoomState.mockResolvedValue(stateOf() as any);
		sdk.getActiveStickyEvents.mockResolvedValue([]);
		rooms.findOneFederatedByMrid.mockResolvedValue(room as any);
		memberships.findRemoteByRoom.mockReturnValue(cursorOf([]));
		jest
			.mocked(getOrCreateFederatedUser)
			.mockImplementation(async (userId: string) => ({ _id: `uid-of-${userId}`, username: userId }) as any);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('records the member another server announces, with every identity it may publish as, and lets the conference follow', async () => {
		sdk.getLatestRoomState.mockResolvedValue(
			stateOf(joined('@bob:remote.example.org'), compatMember('@bob:remote.example.org', 'DEVICEB')) as any,
		);

		await handleMatrixRTCEvent(event());

		expect(memberships.upsertRemote).toHaveBeenCalledTimes(1);
		expect(memberships.upsertRemote).toHaveBeenCalledWith({
			rid: 'room1',
			mrid: MRID,
			slotId: 'm.call#ROOM',
			mode: 'compatibility',
			userId: '@bob:remote.example.org',
			uid: 'uid-of-@bob:remote.example.org',
			deviceId: 'DEVICEB',
			memberId: '@bob:remote.example.org:DEVICEB',
			stateKey: '_@bob:remote.example.org_DEVICEB_m.call',
			eventId: '$member_DEVICEB',
			transport: { type: 'livekit', serviceUrl: SERVICE_URL },
			serverName: 'remote.example.org',
			livekitIdentity: '@bob:remote.example.org:DEVICEB',
			livekitIdentityAliases: [],
			callIntent: 'video',
			joinedAt: new Date(NOW - 1000),
			expiresAt: new Date(NOW - 1000 + 4 * HOUR),
		});
		expect(syncFederatedSession).toHaveBeenCalledWith('room1', { mrid: MRID, slotId: 'm.call#ROOM' });
	});

	it('forgets the members the room no longer announces, whatever event brought the news', async () => {
		memberships.findRemoteByRoom.mockReturnValue(
			cursorOf([
				{ _id: 'gone', mode: 'compatibility', userId: '@bob:remote.example.org', stateKey: '_@bob:remote.example.org_DEVICEB_m.call' },
				{ _id: 'gone-sticky', mode: 'matrix_2_0', userId: '@carol:remote.example.org', memberId: 'member-9' },
			]),
		);

		await handleMatrixRTCEvent(event({ content: {} }));

		expect(memberships.upsertRemote).not.toHaveBeenCalled();
		expect(memberships.removeByIds).toHaveBeenCalledWith(['gone', 'gone-sticky']);
		expect(syncFederatedSession).toHaveBeenCalledTimes(1);
	});

	it.each([
		['whose membership expired', compatMember('@bob:remote.example.org', 'DEVICEB', { expires: 500 }), true],
		['who is not joined to the room', compatMember('@bob:remote.example.org', 'DEVICEB'), false],
		['in another slot', compatMember('@bob:remote.example.org', 'DEVICEB', { call_id: 'other' }), true],
	])('does not count a member %s', async (_, member, isJoined) => {
		sdk.getLatestRoomState.mockResolvedValue(stateOf(member, ...(isJoined ? [joined('@bob:remote.example.org')] : [])) as any);

		await handleMatrixRTCEvent(event());

		expect(memberships.upsertRemote).not.toHaveBeenCalled();
	});

	it('leaves this server own announcements to this server', async () => {
		sdk.getLatestRoomState.mockResolvedValue(
			stateOf(joined('@alice:rc.example.com'), compatMember('@alice:rc.example.com', 'DEVICEA'), joined('@bob:remote.example.org')) as any,
		);

		await handleMatrixRTCEvent(event());

		expect(memberships.upsertRemote).not.toHaveBeenCalled();
	});

	it('ignores events this server sent', async () => {
		await handleMatrixRTCEvent(event({ sender: '@alice:rc.example.com' }));

		expect(sdk.getLatestRoomState).not.toHaveBeenCalled();
		expect(syncFederatedSession).not.toHaveBeenCalled();
	});

	it('ignores everything while federated calls are off', async () => {
		configureMatrixRTC({ enabled: false, profile: 'compatibility' });

		await handleMatrixRTCEvent(event());

		expect(rooms.findOneFederatedByMrid).not.toHaveBeenCalled();
	});

	it('ignores events about other things', async () => {
		await handleMatrixRTCEvent(event({ type: 'm.room.message', content: { body: 'hi' } }));

		expect(rooms.findOneFederatedByMrid).not.toHaveBeenCalled();
	});

	it('ignores rooms this server does not know', async () => {
		rooms.findOneFederatedByMrid.mockResolvedValue(null);

		await handleMatrixRTCEvent(event());

		expect(sdk.getLatestRoomState).not.toHaveBeenCalled();
	});

	describe('sticky memberships', () => {
		beforeEach(() => {
			sdk.getLatestRoomState.mockResolvedValue(stateOf(joined('@bob:remote.example.org')) as any);
		});

		it('records the member with the expiry the server gives and the identities MSC4195 readers derive', async () => {
			sdk.getActiveStickyEvents.mockImplementation(async (_roomId, options) =>
				options?.type === 'org.matrix.msc4143.rtc.member' ? [stickyMember({ eventId: '$a', expiresAt: NOW + HOUR - 1000 })] : [],
			);

			await handleMatrixRTCEvent(event({ type: 'org.matrix.msc4143.rtc.member', state_key: undefined }));

			expect(sdk.getActiveStickyEvents).toHaveBeenCalledWith(MRID, { type: 'org.matrix.msc4143.rtc.member', now: NOW });
			expect(sdk.getActiveStickyEvents).toHaveBeenCalledWith(MRID, { type: 'm.rtc.member', now: NOW });
			expect(memberships.upsertRemote).toHaveBeenCalledWith(
				expect.objectContaining({
					mode: 'matrix_2_0',
					memberId: 'member-1',
					eventId: '$a',
					transport: { type: 'livekit', url: 'wss://sfu.remote.example.org' },
					livekitIdentity: expect.any(String),
					livekitIdentityAliases: [],
					expiresAt: new Date(NOW + HOUR - 1000),
				}),
			);
			expect(memberships.upsertRemote.mock.calls[0][0]).not.toHaveProperty('stateKey');
		});

		it('takes a leave that outlasts the join as the member leaving', async () => {
			sdk.getActiveStickyEvents.mockImplementation(async (_roomId, options) =>
				options?.type === 'org.matrix.msc4143.rtc.member'
					? [
							stickyMember({ eventId: '$join', expiresAt: NOW + HOUR - 5000 }),
							stickyMember({
								eventId: '$leave',
								expiresAt: NOW + HOUR,
								content: { slot_id: 'm.call#ROOM', msc4354_sticky_key: 'member-1' },
							}),
						]
					: [],
			);

			await handleMatrixRTCEvent(event({ type: 'org.matrix.msc4143.rtc.member', state_key: undefined }));

			expect(memberships.upsertRemote).not.toHaveBeenCalled();
		});

		it('takes the join that outlasts an older leave', async () => {
			sdk.getActiveStickyEvents.mockImplementation(async (_roomId, options) =>
				options?.type === 'org.matrix.msc4143.rtc.member'
					? [
							stickyMember({
								eventId: '$leave',
								expiresAt: NOW + 1000,
								content: { slot_id: 'm.call#ROOM', msc4354_sticky_key: 'member-1' },
							}),
							stickyMember({ eventId: '$join', expiresAt: NOW + HOUR }),
						]
					: [],
			);

			await handleMatrixRTCEvent(event({ type: 'org.matrix.msc4143.rtc.member', state_key: undefined }));

			expect(memberships.upsertRemote).toHaveBeenCalledWith(expect.objectContaining({ eventId: '$join' }));
		});
	});

	describe('someone leaving the room', () => {
		const departure = event({ type: 'm.room.member', state_key: '@bob:remote.example.org', content: { membership: 'leave' } });

		it('reads the room again when they were in its call', async () => {
			memberships.findOne.mockResolvedValue({ _id: 'membership1' } as any);

			await handleMatrixRTCEvent(departure);

			expect(memberships.findOne).toHaveBeenCalledWith(
				{ mrid: MRID, userId: '@bob:remote.example.org', local: false },
				{ projection: { _id: 1 } },
			);
			expect(syncFederatedSession).toHaveBeenCalledTimes(1);
		});

		it('ignores it when they were not', async () => {
			memberships.findOne.mockResolvedValue(null);

			await handleMatrixRTCEvent(departure);

			expect(syncFederatedSession).not.toHaveBeenCalled();
		});
	});

	it('reads the room once for every burst of events that arrives while it is being read', async () => {
		let release: () => void = () => undefined;
		sdk.getLatestRoomState.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					release = () => resolve(stateOf() as any);
				}),
		);

		const first = handleMatrixRTCEvent(event());
		await new Promise(process.nextTick);
		const burst = [handleMatrixRTCEvent(event()), handleMatrixRTCEvent(event()), handleMatrixRTCEvent(event())];
		await new Promise(process.nextTick);
		release();
		await Promise.all([first, ...burst]);

		expect(sdk.getLatestRoomState).toHaveBeenCalledTimes(2);
	});
});

describe('rings and declines from other servers', () => {
	const users = jest.mocked(Users);
	const ringFromFederation = jest.mocked(VideoConf.ringFromFederation);
	const declineCall = jest.mocked(VideoConf.declineCall);

	const ringContent = (overrides: Record<string, unknown> = {}) => ({
		'slot_id': 'm.call#ROOM',
		'm.mentions': { user_ids: ['@alice:rc.example.com'] },
		'notification_type': 'ring',
		'm.relates_to': { rel_type: 'm.reference', event_id: '$bob_membership' },
		'sender_ts': NOW - 1000,
		'lifetime': 90_000,
		'msc4354_sticky_key': 'm.call#ROOM',
		...overrides,
	});

	const ring = (content = ringContent()) =>
		({
			event_id: '$ring',
			event: {
				type: 'org.matrix.msc4075.rtc.notification',
				room_id: MRID,
				sender: '@bob:remote.example.org',
				origin_server_ts: NOW - 1000,
				content,
			},
		}) as any;

	const bobMembership = { _id: 'm-bob', uid: 'bob', callId: 'call1', userId: '@bob:remote.example.org' };

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
		configureMatrixRTC({ enabled: true, profile: 'compatibility' });
		sdk.getConfig.mockReturnValue('rc.example.com' as any);
		rooms.findOneFederatedByMrid.mockResolvedValue(room as any);
		memberships.findOne.mockResolvedValue(bobMembership as any);
		users.find.mockReturnValue(cursorOf([{ _id: 'alice', username: 'alice' }]));
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('rings the users here it mentions, in the conference of the membership it relates to', async () => {
		await handleMatrixRTCEvent(ring());

		expect(memberships.findOne).toHaveBeenCalledWith({
			mrid: MRID,
			eventId: '$bob_membership',
			userId: '@bob:remote.example.org',
			local: false,
		});
		expect(users.find.mock.calls[0][0]).toEqual({ $or: [{ username: { $in: ['alice'] } }] });
		expect(ringFromFederation).toHaveBeenCalledWith('call1', 'bob', ['alice']);
	});

	it('remembers who the ring rang, so their decline can relate to it', async () => {
		await handleMatrixRTCEvent(ring());

		expect(memberships.setNotificationById).toHaveBeenCalledWith('m-bob', { eventId: '$ring', userIds: ['@alice:rc.example.com'] });
	});

	it('rings everyone here in a direct message rung as a whole, as Element rings one', async () => {
		rooms.findOneFederatedByMrid.mockResolvedValue({ ...room, t: 'd', uids: ['alice', 'bob'] } as any);
		users.find.mockReturnValue(
			cursorOf([
				{ _id: 'alice', username: 'alice' },
				{ _id: 'bob', username: '@bob:remote.example.org', federated: true, federation: { version: 1, mui: '@bob:remote.example.org' } },
			]),
		);

		await handleMatrixRTCEvent(ring(ringContent({ 'm.mentions': { user_ids: [], room: true } })));

		expect(users.find.mock.calls[0][0]).toEqual({ $or: [{ username: { $in: [] } }, { _id: { $in: ['alice', 'bob'] } }] });
		expect(ringFromFederation).toHaveBeenCalledWith('call1', 'bob', ['alice']);
	});

	it('finds the conference of a caller whose membership is not attached to one yet', async () => {
		memberships.findOne.mockResolvedValue({ ...bobMembership, callId: undefined } as any);
		syncFederatedSession.mockResolvedValue('call2');

		await handleMatrixRTCEvent(ring());

		expect(syncFederatedSession).toHaveBeenCalledWith('room1', { mrid: MRID, slotId: 'm.call#ROOM' });
		expect(ringFromFederation).toHaveBeenCalledWith('call2', 'bob', ['alice']);
	});

	it.each([
		['a ring past its lifetime', ringContent({ sender_ts: NOW - 90_001 })],
		['a mere notification', ringContent({ notification_type: 'notification' })],
		['a ring in another slot', ringContent({ slot_id: 'm.call#other' })],
		['a ring that mentions nobody here', ringContent({ 'm.mentions': { user_ids: ['@carol:remote.example.org'] } })],
	])('rings nobody for %s', async (_, content) => {
		users.find.mockReturnValue(cursorOf([]));

		await handleMatrixRTCEvent(ring(content));

		expect(ringFromFederation).not.toHaveBeenCalled();
	});

	it('rings nobody for a caller who is not in the call', async () => {
		memberships.findOne.mockResolvedValue(null);

		await handleMatrixRTCEvent(ring());

		expect(ringFromFederation).not.toHaveBeenCalled();
	});

	describe('declines', () => {
		const decline = (sender = '@bob:remote.example.org') =>
			({
				event_id: '$decline',
				event: {
					type: 'org.matrix.msc4310.rtc.decline',
					room_id: MRID,
					sender,
					origin_server_ts: NOW,
					content: { 'm.relates_to': { rel_type: 'm.reference', event_id: '$our_ring' }, 'msc4354_sticky_key': '$our_ring' },
				},
			}) as any;

		it('records the decline of someone this server rang', async () => {
			memberships.findOneByNotificationEventId.mockResolvedValue({
				local: true,
				callId: 'call1',
				notification: { eventId: '$our_ring', userIds: ['@bob:remote.example.org'] },
			} as any);

			await handleMatrixRTCEvent(decline());

			expect(memberships.findOneByNotificationEventId).toHaveBeenCalledWith('$our_ring');
			expect(declineCall).toHaveBeenCalledWith('uid-of-@bob:remote.example.org', 'call1');
		});

		it('ignores a decline by someone the ring did not ring', async () => {
			memberships.findOneByNotificationEventId.mockResolvedValue({
				local: true,
				callId: 'call1',
				notification: { eventId: '$our_ring', userIds: ['@carol:remote.example.org'] },
			} as any);

			await handleMatrixRTCEvent(decline());

			expect(declineCall).not.toHaveBeenCalled();
		});

		it('ignores a decline of a ring this server did not send', async () => {
			memberships.findOneByNotificationEventId.mockResolvedValue(null);

			await handleMatrixRTCEvent(decline());

			expect(declineCall).not.toHaveBeenCalled();
		});
	});
});
