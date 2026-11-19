import type { IRoom, ISubscription } from '@rocket.chat/core-typings';

import { SubscriptionsCachedStore } from './SubscriptionsCachedStore';
import { Rooms, Subscriptions } from '../stores';

jest.mock('localforage', () => ({
	config: jest.fn(),
	getItem: jest.fn().mockResolvedValue(null),
	setItem: jest.fn().mockResolvedValue(undefined),
	removeItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../lib/SDKClient', () => ({
	sdk: {
		call: jest.fn(),
		stream: jest.fn(() => ({ stop: jest.fn() })),
	},
}));

jest.mock('../lib/sdk/ddpSdk', () => ({
	getDdpSdk: () => ({
		connection: { status: 'connected', on: jest.fn(() => () => undefined) },
		account: { onLogin: jest.fn(() => () => undefined), onLogout: jest.fn(() => () => undefined) },
	}),
}));

const buildSubscription = (overrides: Partial<ISubscription> = {}): ISubscription =>
	({
		_id: 'sub-id',
		rid: 'room-id',
		u: { _id: 'user-id', username: 'user' },
		name: 'General',
		fname: 'General Room',
		t: 'c',
		ts: new Date('2026-01-01T00:00:00Z'),
		ls: new Date('2026-01-01T00:00:00Z'),
		open: true,
		alert: false,
		unread: 0,
		userMentions: 0,
		groupMentions: 0,
		_updatedAt: new Date('2026-01-01T00:00:00Z'),
		...overrides,
	}) as ISubscription;

const mapThroughStore = async (subscription: ISubscription) => {
	await SubscriptionsCachedStore.upsertSubscription(subscription);
	return Subscriptions.use.getState().get(subscription._id);
};

describe('SubscriptionsCachedStore mapRecord', () => {
	beforeEach(() => {
		Rooms.use.getState().replaceAll([]);
		Subscriptions.use.getState().replaceAll([]);
	});

	it('fills room-derived fields with defaults when the room is not in the store', async () => {
		const subscription = buildSubscription();

		const mapped = await mapThroughStore(subscription);

		expect(mapped).toEqual({
			...subscription,
			lowerCaseName: 'general',
			lowerCaseFName: 'general room',
			encrypted: undefined,
			description: undefined,
			cl: undefined,
			topic: undefined,
			announcement: undefined,
			broadcast: undefined,
			archived: undefined,
			avatarETag: undefined,
			retention: undefined,
			lastMessage: undefined,
			teamId: undefined,
			teamMain: undefined,
			uids: undefined,
			usernames: undefined,
			usersCount: 0,
			v: undefined,
			transcriptRequest: undefined,
			servedBy: undefined,
			onHold: undefined,
			tags: undefined,
			closedAt: undefined,
			metrics: undefined,
			muted: undefined,
			waitingResponse: undefined,
			responseBy: undefined,
			priorityId: undefined,
			slaId: undefined,
			priorityWeight: 99,
			estimatedWaitingTimeQueue: 9999999,
			livechatData: undefined,
			departmentId: undefined,
			ts: subscription.ts,
			source: undefined,
			queuedAt: undefined,
			federated: undefined,
			xmppFederation: undefined,
			lm: subscription.ts,
		});
		expect(mapped).not.toHaveProperty('federation');
	});

	it('copies the room fields onto the subscription when the room is in the store', async () => {
		const room = {
			_id: 'room-id',
			t: 'l',
			ts: new Date('2025-06-01T00:00:00Z'),
			lm: new Date('2026-02-01T00:00:00Z'),
			encrypted: true,
			description: 'desc',
			cl: true,
			topic: 'topic',
			announcement: 'announcement',
			broadcast: true,
			archived: true,
			avatarETag: 'etag',
			retention: { enabled: true },
			lastMessage: { _id: 'msg-id', msg: 'hi' },
			teamId: 'team-id',
			teamMain: true,
			uids: ['u1'],
			usernames: ['user1'],
			usersCount: 7,
			v: { _id: 'visitor-id', token: 'token' },
			transcriptRequest: { email: 'a@b.c' },
			servedBy: { _id: 'agent-id' },
			onHold: true,
			tags: ['tag'],
			closedAt: new Date('2026-03-01T00:00:00Z'),
			metrics: { v: {} },
			muted: ['muted-user'],
			waitingResponse: true,
			responseBy: { _id: 'agent-id' },
			priorityId: 'priority-id',
			slaId: 'sla-id',
			priorityWeight: 3,
			estimatedWaitingTimeQueue: 120,
			livechatData: { field: 'value' },
			departmentId: 'dept-id',
			source: { type: 'widget' },
			queuedAt: new Date('2026-01-15T00:00:00Z'),
			federated: false,
			xmppFederation: { version: 1, role: 'host', origin: 'example.com' },
		} as unknown as IRoom;
		Rooms.use.getState().store(room);
		const subscription = buildSubscription();

		const mapped = await mapThroughStore(subscription);

		expect(mapped).toEqual({
			...subscription,
			lowerCaseName: 'general',
			lowerCaseFName: 'general room',
			encrypted: true,
			description: 'desc',
			cl: true,
			topic: 'topic',
			announcement: 'announcement',
			broadcast: true,
			archived: true,
			avatarETag: 'etag',
			retention: { enabled: true },
			lastMessage: { _id: 'msg-id', msg: 'hi' },
			teamId: 'team-id',
			teamMain: true,
			uids: ['u1'],
			usernames: ['user1'],
			usersCount: 7,
			v: { _id: 'visitor-id', token: 'token' },
			transcriptRequest: { email: 'a@b.c' },
			servedBy: { _id: 'agent-id' },
			onHold: true,
			tags: ['tag'],
			closedAt: new Date('2026-03-01T00:00:00Z'),
			metrics: { v: {} },
			muted: ['muted-user'],
			waitingResponse: true,
			responseBy: { _id: 'agent-id' },
			priorityId: 'priority-id',
			slaId: 'sla-id',
			priorityWeight: 3,
			estimatedWaitingTimeQueue: 120,
			livechatData: { field: 'value' },
			departmentId: 'dept-id',
			ts: new Date('2025-06-01T00:00:00Z'),
			source: { type: 'widget' },
			queuedAt: new Date('2026-01-15T00:00:00Z'),
			federated: false,
			xmppFederation: { version: 1, role: 'host', origin: 'example.com' },
			lm: new Date('2026-02-01T00:00:00Z'),
		});
	});

	it('turns a false broadcast into undefined and keeps a zero usersCount', async () => {
		Rooms.use.getState().store({ _id: 'room-id', t: 'c', broadcast: false, usersCount: 0 } as unknown as IRoom);

		const mapped = await mapThroughStore(buildSubscription());

		expect(mapped?.broadcast).toBeUndefined();
		expect(mapped?.usersCount).toBe(0);
	});

	it('falls back to the default priority weight and waiting time when the room has falsy values', async () => {
		Rooms.use.getState().store({ _id: 'room-id', t: 'l', priorityWeight: 0, estimatedWaitingTimeQueue: 0 } as unknown as IRoom);

		const mapped = await mapThroughStore(buildSubscription());

		expect(mapped?.priorityWeight).toBe(99);
		expect(mapped?.estimatedWaitingTimeQueue).toBe(9999999);
	});

	it('uses the subscription ts when the room has none', async () => {
		Rooms.use.getState().store({ _id: 'room-id', t: 'c' } as unknown as IRoom);
		const subscription = buildSubscription();

		const mapped = await mapThroughStore(subscription);

		expect(mapped?.ts).toEqual(subscription.ts);
	});

	it('lowercases fname for lowerCaseName when the subscription has a parent room', async () => {
		const mapped = await mapThroughStore(buildSubscription({ prid: 'parent-id', name: 'Discussion-Id', fname: 'My Discussion' }));

		expect(mapped?.lowerCaseName).toBe('my discussion');
		expect(mapped?.lowerCaseFName).toBe('my discussion');
	});

	it('uses name for both lowercased names when fname is missing', async () => {
		const mapped = await mapThroughStore(buildSubscription({ name: 'OnlyName', fname: undefined }));

		expect(mapped?.lowerCaseName).toBe('onlyname');
		expect(mapped?.lowerCaseFName).toBe('onlyname');
	});

	it('adds the federation field for native federated rooms', async () => {
		const federation = { mrid: '!room:example.com', origin: 'example.com' };
		Rooms.use.getState().store({ _id: 'room-id', t: 'c', federated: true, federation } as unknown as IRoom);

		const mapped = await mapThroughStore(buildSubscription());

		expect(mapped).toHaveProperty('federation', federation);
	});

	it('omits the federation field for federated rooms without federation data', async () => {
		Rooms.use.getState().store({ _id: 'room-id', t: 'c', federated: true } as unknown as IRoom);

		const mapped = await mapThroughStore(buildSubscription());

		expect(mapped).not.toHaveProperty('federation');
	});

	it('sets lm to the last read date when it is later than the last room update', async () => {
		Rooms.use.getState().store({ _id: 'room-id', t: 'c', lm: new Date('2026-02-01T00:00:00Z') } as unknown as IRoom);

		const mapped = await mapThroughStore(buildSubscription({ lr: new Date('2026-03-01T00:00:00Z') }));

		expect(mapped?.lm).toEqual(new Date('2026-03-01T00:00:00Z'));
	});

	it('sets lm to the last room update when it is later than the last read date', async () => {
		Rooms.use.getState().store({ _id: 'room-id', t: 'c', lm: new Date('2026-02-01T00:00:00Z') } as unknown as IRoom);

		const mapped = await mapThroughStore(buildSubscription({ lr: new Date('2026-01-15T00:00:00Z') }));

		expect(mapped?.lm).toEqual(new Date('2026-02-01T00:00:00Z'));
	});

	it('falls back to the room ts for lm when neither the room lm nor the subscription ts exist', async () => {
		Rooms.use.getState().store({ _id: 'room-id', t: 'c', ts: new Date('2025-06-01T00:00:00Z') } as unknown as IRoom);

		const mapped = await mapThroughStore(buildSubscription({ ts: undefined }));

		expect(mapped?.lm).toEqual(new Date('2025-06-01T00:00:00Z'));
	});

	it('uses the last read date for lm when there is no room update date at all', async () => {
		const mapped = await mapThroughStore(buildSubscription({ ts: undefined, lr: new Date('2026-03-01T00:00:00Z') }));

		expect(mapped?.lm).toEqual(new Date('2026-03-01T00:00:00Z'));
	});
});
