import { MongoServerError } from 'mongodb';

import { syncCalendarForUser } from './syncCalendarForUser';
import type { CalendarSyncOutcome } from './syncCalendarWindow';
import { ExchangeError } from '../../errors';

const findOneById = jest.fn();
const syncCalendarWindow = jest.fn();
const applyDeferredSideEffects = jest.fn();
const resolveMailbox = jest.fn();
const getExchangeProvider = jest.fn();
const acquireLease = jest.fn();
const releaseLease = jest.fn();
const leases = new Map<string, string>();

jest.mock('@rocket.chat/models', () => ({
	Users: { findOneById: (...args: unknown[]) => findOneById(...args) },
	ExchangeSyncLease: {
		acquireLease: (...args: unknown[]) => acquireLease(...args),
		releaseLease: (...args: unknown[]) => releaseLease(...args),
	},
}));
jest.mock('./syncCalendarWindow', () => ({ syncCalendarWindow: (...args: unknown[]) => syncCalendarWindow(...args) }));
jest.mock('./applyDeferredSideEffects', () => ({
	applyDeferredSideEffects: (...args: unknown[]) => applyDeferredSideEffects(...args),
}));
jest.mock('../resolveMailboxes', () => ({ resolveMailbox: (...args: unknown[]) => resolveMailbox(...args) }));
jest.mock('../../ExchangeProviderRegistry', () => ({
	getExchangeProvider: () => getExchangeProvider(),
	getCalendarSyncWindow: () => ({ start: new Date('2026-09-07T00:00:00Z'), end: new Date('2026-09-09T00:00:00Z') }),
}));

const outcome = (over: Partial<CalendarSyncOutcome> = {}): CalendarSyncOutcome => ({
	upserted: 0,
	modified: 0,
	deleted: 0,
	pruned: 0,
	changed: false,
	failed: false,
	fatal: false,
	...over,
});

const verified = { _id: 'uid', emails: [{ address: 'user@corp.example', verified: true }] };

describe('syncCalendarForUser', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		resolveMailbox.mockReturnValue('user@corp.example');
		getExchangeProvider.mockReturnValue({ id: 'ews' });
		findOneById.mockResolvedValue(verified);
		syncCalendarWindow.mockResolvedValue(outcome());
		applyDeferredSideEffects.mockResolvedValue(undefined);
		leases.clear();
		acquireLease.mockImplementation(async (_scope: string, uid: string, token: string) => {
			if (leases.has(uid)) {
				throw new MongoServerError({ code: 11000, message: 'E11000 duplicate key error' });
			}
			leases.set(uid, token);
			return { upsertedCount: 1, modifiedCount: 0 };
		});
		releaseLease.mockImplementation(async (_scope: string, uid: string, token: string) => {
			if (leases.get(uid) !== token) {
				return { deletedCount: 0 };
			}
			leases.delete(uid);
			return { deletedCount: 1 };
		});
	});

	it('refuses while another sync holds the lease', async () => {
		leases.set('uid', 'held-elsewhere');

		await expect(syncCalendarForUser('uid')).rejects.toMatchObject({ code: 'rate-limited' });
		expect(syncCalendarWindow).not.toHaveBeenCalled();
		expect(leases.get('uid')).toBe('held-elsewhere');
	});

	it('releases the lease once the sync is over, failed or not', async () => {
		syncCalendarWindow.mockResolvedValue(outcome({ failed: true, error: new Error('boom') }));

		await expect(syncCalendarForUser('uid')).rejects.toThrow('boom');
		expect(releaseLease).toHaveBeenCalledWith('calendar', 'uid', acquireLease.mock.calls[0][2]);
	});

	it('syncs the mailbox resolved for the user', async () => {
		resolveMailbox.mockReturnValue('real@corp.example');

		await syncCalendarForUser('uid');

		expect(syncCalendarWindow).toHaveBeenCalledWith({ id: 'ews' }, 'uid', 'real@corp.example', expect.anything());
	});

	it('rethrows the failure instead of reporting a sync of zero events', async () => {
		const err = new ExchangeError('mailbox-not-found', 'nope');
		syncCalendarWindow.mockResolvedValue(outcome({ failed: true, error: err }));

		await expect(syncCalendarForUser('uid')).rejects.toBe(err);
	});

	it('still applies the side effects of work that committed before the failure', async () => {
		syncCalendarWindow.mockResolvedValue(outcome({ failed: true, changed: true, error: new Error('boom') }));

		await expect(syncCalendarForUser('uid')).rejects.toThrow('boom');
		expect(applyDeferredSideEffects).toHaveBeenCalledWith(new Set(['uid']));
	});

	it('leaves the side effects alone when nothing changed', async () => {
		await syncCalendarForUser('uid');

		expect(applyDeferredSideEffects).toHaveBeenCalledWith(new Set());
	});

	it('asks the user to verify their email rather than blaming the mailbox', async () => {
		findOneById.mockResolvedValue({ _id: 'uid', emails: [{ address: 'user@corp.example', verified: false }] });
		resolveMailbox.mockReturnValue(undefined);

		await expect(syncCalendarForUser('uid')).rejects.toMatchObject({ code: 'email-not-verified' });
		expect(syncCalendarWindow).not.toHaveBeenCalled();
		expect(acquireLease).not.toHaveBeenCalled();
	});

	it('reports a missing mailbox for a user that no longer exists', async () => {
		findOneById.mockResolvedValue(null);

		await expect(syncCalendarForUser('uid')).rejects.toMatchObject({ code: 'mailbox-not-found' });
		expect(acquireLease).not.toHaveBeenCalled();
	});

	it('refuses a second sync while one is already running for the same user', async () => {
		let release: () => void = () => undefined;
		const parked = new Promise<void>((resolve) => {
			release = resolve;
		});
		syncCalendarWindow.mockImplementation(async () => {
			await parked;
			return outcome();
		});

		const first = syncCalendarForUser('uid');

		await expect(syncCalendarForUser('uid')).rejects.toMatchObject({ code: 'rate-limited' });

		release();
		await first;
	});

	it('releases the guard after a failure, so a retry is not locked out', async () => {
		syncCalendarWindow.mockResolvedValueOnce(outcome({ failed: true, error: new Error('boom') }));

		await expect(syncCalendarForUser('uid')).rejects.toThrow('boom');
		await expect(syncCalendarForUser('uid')).resolves.toMatchObject({ failed: false });
	});
});
