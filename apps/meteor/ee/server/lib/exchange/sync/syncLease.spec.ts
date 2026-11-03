import { MongoServerError } from 'mongodb';

import { acquireSyncLease, whenSyncsIdle } from './syncLease';

const acquireLease = jest.fn();
const renewLease = jest.fn();
const releaseLease = jest.fn();
const countActiveLeases = jest.fn();
const sleep = jest.fn();

jest.mock('@rocket.chat/models', () => ({
	ExchangeSyncLease: {
		acquireLease: (...args: unknown[]) => acquireLease(...args),
		renewLease: (...args: unknown[]) => renewLease(...args),
		releaseLease: (...args: unknown[]) => releaseLease(...args),
		countActiveLeases: (...args: unknown[]) => countActiveLeases(...args),
	},
}));
jest.mock('../../../../../lib/utils/sleep', () => ({ sleep: (...args: unknown[]) => sleep(...args) }));
jest.mock('../logger', () => ({ logger: { warn: jest.fn() } }));

describe('acquireSyncLease', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
		renewLease.mockResolvedValue({ modifiedCount: 1 });
		releaseLease.mockResolvedValue({ deletedCount: 1 });
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('releases with the token it took the lease under', async () => {
		acquireLease.mockResolvedValue({ upsertedCount: 1, modifiedCount: 0 });

		const release = await acquireSyncLease('calendar', 'uid');
		await release?.();

		const [, , token, until, now] = acquireLease.mock.calls[0];
		expect(until.getTime()).toBeGreaterThan(now.getTime());
		expect(releaseLease).toHaveBeenCalledWith('calendar', 'uid', token);
	});

	it('stops renewing once released', async () => {
		acquireLease.mockResolvedValue({ upsertedCount: 1, modifiedCount: 0 });

		const release = await acquireSyncLease('calendar', 'uid');
		await release?.();
		await jest.advanceTimersByTimeAsync(20 * 60 * 1000);

		expect(renewLease).not.toHaveBeenCalled();
	});

	it('tries again at the next renewal when one fails', async () => {
		acquireLease.mockResolvedValue({ upsertedCount: 1, modifiedCount: 0 });
		renewLease.mockRejectedValueOnce(new Error('mongo is down'));

		const release = await acquireSyncLease('calendar', 'uid');
		await jest.advanceTimersByTimeAsync(7 * 60 * 1000);

		expect(renewLease).toHaveBeenCalledTimes(2);

		await release?.();
	});

	it('returns the release when the store reports it took over an expired lease', async () => {
		acquireLease.mockResolvedValue({ upsertedCount: 0, modifiedCount: 1 });

		await expect(acquireSyncLease('calendar', 'uid')).resolves.toBeInstanceOf(Function);
	});

	it('refuses while another sync holds the lease', async () => {
		acquireLease.mockRejectedValue(new MongoServerError({ code: 11000, message: 'E11000 duplicate key error' }));

		await expect(acquireSyncLease('calendar', 'uid')).resolves.toBeUndefined();
	});

	it('does not throw when the release fails, since the lease expires on its own', async () => {
		acquireLease.mockResolvedValue({ upsertedCount: 1, modifiedCount: 0 });
		releaseLease.mockRejectedValue(new Error('mongo is down'));

		const release = await acquireSyncLease('calendar', 'uid');

		await expect(release?.()).resolves.toBeUndefined();
	});
});

describe('whenSyncsIdle', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		sleep.mockResolvedValue(undefined);
	});

	it('waits until no instance holds a lease', async () => {
		countActiveLeases.mockResolvedValueOnce(2).mockResolvedValueOnce(1).mockResolvedValueOnce(0);

		await whenSyncsIdle('calendar', () => true);

		expect(countActiveLeases).toHaveBeenCalledTimes(3);
		expect(countActiveLeases).toHaveBeenCalledWith('calendar', expect.any(Date));
		expect(sleep).toHaveBeenCalledTimes(2);
	});
});
