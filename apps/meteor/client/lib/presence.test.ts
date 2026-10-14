import { afterEach, beforeEach, describe, it } from 'node:test';

import { UserStatus } from '@rocket.chat/core-typings';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const mockSubscribe = fn();

const mockGet = fn<FunctionLike>();

const loadPresence = () =>
	proxyquire.noCallThru().load<typeof import('./presence')>('./presence', {
		'../meteor/connection': { subscribeRaw: (...args: unknown[]) => mockSubscribe(...args) },
		'./SDKClient': { sdk: { rest: { get: (...args: unknown[]) => mockGet(...args) } } },
	}).Presence;

const Presence = loadPresence();

let clock: sinon.SinonFakeTimers;

describe('Presence fallback status', () => {
	beforeEach(() => {
		mockSubscribe.mockClear();
		mockGet.mockClear();
		clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
		Presence.store.clear();
	});

	afterEach(() => {
		clock.restore();
	});

	it('should use DISABLED as fallback when status is set to disabled', async () => {
		mockGet.mockResolvedValue({ users: [] });
		Presence.setStatus('disabled');

		Presence.listen('user1', fn());
		await clock.tickAsync(500);

		expect(Presence.store.get('user1')?.status).toBe(UserStatus.DISABLED);
	});

	it('should use OFFLINE as fallback when status is set to enabled', async () => {
		mockGet.mockResolvedValue({ users: [] });
		Presence.setStatus('enabled');

		Presence.listen('user1', fn());
		await clock.tickAsync(500);

		expect(Presence.store.get('user1')?.status).toBe(UserStatus.OFFLINE);
	});
});

describe('Presence resync', () => {
	let presence: typeof Presence;

	const respondWith = (statuses: Record<string, UserStatus>) =>
		mockGet.mockImplementation(async (_path: string, { ids }: { ids: string[] }) => ({
			users: ids.filter((_id) => statuses[_id]).map((_id) => ({ _id, status: statuses[_id] })),
		}));

	beforeEach(() => {
		mockSubscribe.mockClear();
		mockGet.mockClear();
		clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
		presence = loadPresence();
	});

	afterEach(() => {
		clock.restore();
	});

	it('should subscribe again to every displayed user and show their refetched presence', async () => {
		respondWith({ user1: UserStatus.ONLINE, user2: UserStatus.ONLINE });
		presence.listen('user1', fn());
		await clock.tickAsync(500);
		const handler = fn();
		presence.listen('user2', handler);
		await clock.tickAsync(500);
		mockSubscribe.mockClear();

		respondWith({ user1: UserStatus.ONLINE, user2: UserStatus.AWAY });
		presence.resync();
		await clock.tickAsync(500);

		expect(mockSubscribe).toHaveBeenCalledTimes(1);
		expect(mockSubscribe).toHaveBeenCalledWith('stream-user-presence', '', { added: expect.arrayContaining(['user1', 'user2']) });
		expect(handler).toHaveBeenLastCalledWith({ _id: 'user2', status: UserStatus.AWAY });
	});
});
