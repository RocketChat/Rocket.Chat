import { UserStatus } from '@rocket.chat/core-typings';

import { Presence } from './presence';

const mockSubscribe = jest.fn();

jest.mock('meteor/meteor', () => ({
	DDPCommon: {
		parseDDP: jest.fn((msg: string) => JSON.parse(msg)),
		stringifyDDP: jest.fn((msg: unknown) => JSON.stringify(msg)),
	},
}));

jest.mock('../meteor/connection', () => ({
	subscribeRaw: (...args: unknown[]) => mockSubscribe(...args),
}));

const mockGet = jest.fn();

jest.mock('../../client/lib/SDKClient', () => ({
	sdk: {
		rest: {
			get: (...args: unknown[]) => mockGet(...args),
		},
	},
}));

describe('Presence fallback status', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		Presence.store.clear();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('should use DISABLED as fallback when status is set to disabled', async () => {
		mockGet.mockResolvedValue({ users: [] });
		Presence.setStatus('disabled');

		Presence.listen('user1', jest.fn());
		await jest.advanceTimersByTimeAsync(500);

		expect(Presence.store.get('user1')?.status).toBe(UserStatus.DISABLED);
	});

	it('should use OFFLINE as fallback when status is set to enabled', async () => {
		mockGet.mockResolvedValue({ users: [] });
		Presence.setStatus('enabled');

		Presence.listen('user1', jest.fn());
		await jest.advanceTimersByTimeAsync(500);

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
		jest.clearAllMocks();
		jest.useFakeTimers();
		jest.isolateModules(() => {
			({ Presence: presence } = jest.requireActual<typeof import('./presence')>('./presence'));
		});
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('should subscribe again to every displayed user and show their refetched presence', async () => {
		respondWith({ user1: UserStatus.ONLINE, user2: UserStatus.ONLINE });
		presence.listen('user1', jest.fn());
		await jest.advanceTimersByTimeAsync(500);
		const handler = jest.fn();
		presence.listen('user2', handler);
		await jest.advanceTimersByTimeAsync(500);
		mockSubscribe.mockClear();

		respondWith({ user1: UserStatus.ONLINE, user2: UserStatus.AWAY });
		presence.resync();
		await jest.advanceTimersByTimeAsync(500);

		expect(mockSubscribe).toHaveBeenCalledTimes(1);
		expect(mockSubscribe).toHaveBeenCalledWith('stream-user-presence', '', { added: expect.arrayContaining(['user1', 'user2']) });
		expect(handler).toHaveBeenLastCalledWith({ _id: 'user2', status: UserStatus.AWAY });
	});
});
