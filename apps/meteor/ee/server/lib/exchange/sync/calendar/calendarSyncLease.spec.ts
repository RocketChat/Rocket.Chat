import { MongoServerError } from 'mongodb';

import { acquireCalendarSyncLease, whenCalendarSyncsIdle } from './calendarSyncLease';

const acquireSyncLease = jest.fn();
const renewSyncLease = jest.fn();
const releaseSyncLease = jest.fn();
const countActiveSyncLeases = jest.fn();
const sleep = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	ExchangeCalendarSyncState: {
		acquireSyncLease: (...args: unknown[]) => acquireSyncLease(...args),
		renewSyncLease: (...args: unknown[]) => renewSyncLease(...args),
		releaseSyncLease: (...args: unknown[]) => releaseSyncLease(...args),
		countActiveSyncLeases: (...args: unknown[]) => countActiveSyncLeases(...args),
	},
}));
jest.mock('../../../../../../lib/utils/sleep', () => ({ sleep: (...args: unknown[]) => sleep(...args) }));
jest.mock('../../logger', () => ({ logger: { warn: jest.fn() } }));

describe('acquireCalendarSyncLease', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		renewSyncLease.mockResolvedValue({ modifiedCount: 1 });
		releaseSyncLease.mockResolvedValue({ modifiedCount: 1 });
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('releases with the token it took the lease under', async () => {
		acquireSyncLease.mockResolvedValue({ upsertedCount: 1, modifiedCount: 0 });

		const release = await acquireCalendarSyncLease('uid');
		await release?.();

		const [, token, until, now] = acquireSyncLease.mock.calls[0];
		expect(until.getTime()).toBeGreaterThan(now.getTime());
		expect(releaseSyncLease).toHaveBeenCalledWith('uid', token);
	});

	it('stops renewing once released', async () => {
		acquireSyncLease.mockResolvedValue({ upsertedCount: 1, modifiedCount: 0 });

		const release = await acquireCalendarSyncLease('uid');
		await release?.();
		await jest.advanceTimersByTimeAsync(20 * 60 * 1000);

		expect(renewSyncLease).not.toHaveBeenCalled();
	});

	it('tries again at the next renewal when one fails', async () => {
		acquireSyncLease.mockResolvedValue({ upsertedCount: 1, modifiedCount: 0 });
		renewSyncLease.mockRejectedValueOnce(new Error('mongo is down'));

		const release = await acquireCalendarSyncLease('uid');
		await jest.advanceTimersByTimeAsync(7 * 60 * 1000);

		expect(renewSyncLease).toHaveBeenCalledTimes(2);

		await release?.();
	});

	it('returns the release when the store reports it took over an expired lease', async () => {
		acquireSyncLease.mockResolvedValue({ upsertedCount: 0, modifiedCount: 1 });

		await expect(acquireCalendarSyncLease('uid')).resolves.toBeInstanceOf(Function);
	});

	it('refuses while another sync holds the lease', async () => {
		acquireSyncLease.mockRejectedValue(new MongoServerError({ code: 11000, message: 'E11000 duplicate key error' }));

		await expect(acquireCalendarSyncLease('uid')).resolves.toBeUndefined();
	});

	it('does not throw when the release fails, since the lease expires on its own', async () => {
		acquireSyncLease.mockResolvedValue({ upsertedCount: 1, modifiedCount: 0 });
		releaseSyncLease.mockRejectedValue(new Error('mongo is down'));

		const release = await acquireCalendarSyncLease('uid');

		await expect(release?.()).resolves.toBeUndefined();
	});
});

describe('whenCalendarSyncsIdle', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		sleep.mockResolvedValue(undefined);
	});

	it('waits until no instance holds a lease', async () => {
		countActiveSyncLeases.mockResolvedValueOnce(2).mockResolvedValueOnce(1).mockResolvedValueOnce(0);

		await whenCalendarSyncsIdle(() => true);

		expect(countActiveSyncLeases).toHaveBeenCalledTimes(3);
		expect(sleep).toHaveBeenCalledTimes(2);
	});
});
