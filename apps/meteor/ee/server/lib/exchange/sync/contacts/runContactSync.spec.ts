import { runContactSync } from './runContactSync';
import { acquireMailbox } from '../mailboxLock';
import type { UserContactSyncOutcome } from './syncUserContacts';
import { ExchangeError } from '../../errors';
import { MAILBOX_CONCURRENCY } from '../limits';

const syncUserContacts = jest.fn();
const getExchangeProvider = jest.fn();
const isServerSyncEnabled = jest.fn();
const iterateMailboxCandidates = jest.fn();
const hasFolderSyncedSince = jest.fn();
const settingsGet = jest.fn();

jest.mock('./syncUserContacts', () => ({ syncUserContacts: (...args: unknown[]) => syncUserContacts(...args) }));
jest.mock('../resolveMailboxes', () => ({ iterateMailboxCandidates: () => iterateMailboxCandidates() }));
jest.mock('../../ExchangeProviderRegistry', () => ({
	getExchangeProvider: () => getExchangeProvider(),
	isServerSyncEnabled: () => isServerSyncEnabled(),
}));
jest.mock('@rocket.chat/models', () => ({
	ExchangeContactSyncState: { hasFolderSyncedSince: (...args: unknown[]) => hasFolderSyncedSince(...args) },
}));
jest.mock('../../../../../../server/settings', () => ({ settings: { get: (key: string) => settingsGet(key) } }));

const outcome = (over: Partial<UserContactSyncOutcome> = {}): UserContactSyncOutcome => ({
	folders: 0,
	upserted: 0,
	modified: 0,
	deleted: 0,
	pruned: 0,
	failed: 0,
	fatal: false,
	...over,
});

const from = (items: { uid: string; mailbox?: string }[]) =>
	async function* () {
		yield* items;
	};

const settingsOf = (over: Record<string, unknown> = {}) => {
	const values: Record<string, unknown> = {
		Exchange_Contacts_Sync_Enabled: true,
		Exchange_Contacts_Default_Region: 'AR',
		Exchange_Contacts_Sync_Interval_Days: 1,
		...over,
	};
	settingsGet.mockImplementation((key: string) => values[key]);
};

const deferred = () => {
	let resolve: (value: UserContactSyncOutcome) => void = () => undefined;
	const promise = new Promise<UserContactSyncOutcome>((r) => {
		resolve = r;
	});

	return { promise, resolve };
};

describe('runContactSync', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		isServerSyncEnabled.mockReturnValue(true);
		getExchangeProvider.mockReturnValue({ id: 'ews' });
		syncUserContacts.mockResolvedValue(outcome());
		hasFolderSyncedSince.mockResolvedValue(false);
		iterateMailboxCandidates.mockImplementation(from([{ uid: 'a', mailbox: 'a@corp.example' }]));
		settingsOf();
	});

	describe('whether the run happens at all', () => {
		it('does nothing while the server does not own the sync', async () => {
			isServerSyncEnabled.mockReturnValue(false);

			await expect(runContactSync()).resolves.toMatchObject({ mailboxes: 0 });
			expect(iterateMailboxCandidates).not.toHaveBeenCalled();
		});

		it('does nothing while contact sync is off, even with the server sync on', async () => {
			settingsOf({ Exchange_Contacts_Sync_Enabled: false });

			await expect(runContactSync()).resolves.toMatchObject({ mailboxes: 0 });
			expect(iterateMailboxCandidates).not.toHaveBeenCalled();
		});

		it('stays quiet when the connection is not configured yet', async () => {
			getExchangeProvider.mockImplementation(() => {
				throw new ExchangeError('not-configured', 'no credentials');
			});

			await expect(runContactSync()).resolves.toMatchObject({ mailboxes: 0 });
		});

		it('lets any other failure out, so a broken run is not read as an empty one', async () => {
			getExchangeProvider.mockImplementation(() => {
				throw new ExchangeError('host-not-allowed', 'blocked');
			});

			await expect(runContactSync()).rejects.toMatchObject({ code: 'host-not-allowed' });
		});

		it('skips a second run while the first is still going', async () => {
			const first = deferred();
			syncUserContacts.mockReturnValueOnce(first.promise);

			const running = runContactSync();

			await expect(runContactSync()).resolves.toMatchObject({ mailboxes: 0 });

			first.resolve(outcome());
			await running;
			expect(syncUserContacts).toHaveBeenCalledTimes(1);
		});
	});

	describe('choosing the mailboxes', () => {
		it('counts a user with no resolvable mailbox as skipped and syncs the rest', async () => {
			iterateMailboxCandidates.mockImplementation(from([{ uid: 'a' }, { uid: 'b', mailbox: 'b@corp.example' }]));

			const summary = await runContactSync();

			expect(summary).toMatchObject({ skipped: 1, mailboxes: 1 });
			expect(syncUserContacts).toHaveBeenCalledTimes(1);
		});

		it('leaves a mailbox alone until its interval has gone by', async () => {
			iterateMailboxCandidates.mockImplementation(
				from([
					{ uid: 'a', mailbox: 'a@corp.example' },
					{ uid: 'b', mailbox: 'b@corp.example' },
				]),
			);
			hasFolderSyncedSince.mockResolvedValueOnce(true);

			const summary = await runContactSync();

			expect(summary).toMatchObject({ notDue: 1, mailboxes: 1 });
		});

		it('leaves a mailbox alone while an on-demand sync holds it', async () => {
			iterateMailboxCandidates.mockImplementation(
				from([
					{ uid: 'a', mailbox: 'a@corp.example' },
					{ uid: 'b', mailbox: 'b@corp.example' },
				]),
			);

			const release = acquireMailbox('contacts', 'a');

			try {
				const summary = await runContactSync();

				expect(syncUserContacts).toHaveBeenCalledTimes(1);
				expect(syncUserContacts.mock.calls[0][2]).toBe('b@corp.example');
				expect(summary).toMatchObject({ mailboxes: 1, skipped: 1 });
			} finally {
				release?.();
			}
		});

		it('takes the calendar lock as a separate one, so neither sync waits for the other', async () => {
			const release = acquireMailbox('calendar', 'a');

			try {
				const summary = await runContactSync();

				expect(summary).toMatchObject({ mailboxes: 1, skipped: 0 });
			} finally {
				release?.();
			}
		});

		it('releases the mailbox once the run is over, so the next one is not locked out', async () => {
			await runContactSync();

			const release = acquireMailbox('contacts', 'a');

			expect(release).toBeDefined();
			release?.();
		});

		it('passes the configured region down to every mailbox', async () => {
			await runContactSync();

			expect(syncUserContacts).toHaveBeenCalledWith({ id: 'ews' }, 'a', 'a@corp.example', 'AR');
		});

		it('falls back to no region rather than passing undefined down', async () => {
			settingsOf({ Exchange_Contacts_Default_Region: undefined });

			await runContactSync();

			expect(syncUserContacts).toHaveBeenCalledWith({ id: 'ews' }, 'a', 'a@corp.example', '');
		});

		it('never has more mailboxes open than the concurrency allows', async () => {
			const mailboxes = Array.from({ length: MAILBOX_CONCURRENCY + 3 }, (_, i) => ({ uid: `u${i}`, mailbox: `u${i}@corp.example` }));
			iterateMailboxCandidates.mockImplementation(from(mailboxes));

			let open = 0;
			let peak = 0;
			syncUserContacts.mockImplementation(async () => {
				open++;
				peak = Math.max(peak, open);
				await Promise.resolve();
				open--;

				return outcome();
			});

			await runContactSync();

			expect(peak).toBeLessThanOrEqual(MAILBOX_CONCURRENCY);
			expect(syncUserContacts).toHaveBeenCalledTimes(mailboxes.length);
		});
	});

	describe('adding up the run', () => {
		it('adds up the counters of every mailbox', async () => {
			iterateMailboxCandidates.mockImplementation(
				from([
					{ uid: 'a', mailbox: 'a@corp.example' },
					{ uid: 'b', mailbox: 'b@corp.example' },
				]),
			);
			syncUserContacts
				.mockResolvedValueOnce(outcome({ folders: 2, upserted: 3, pruned: 1 }))
				.mockResolvedValueOnce(outcome({ folders: 1, modified: 4, deleted: 2, failed: 1 }));

			const summary = await runContactSync();

			expect(summary).toMatchObject({
				mailboxes: 2,
				folders: 3,
				upserted: 3,
				modified: 4,
				deleted: 2,
				pruned: 1,
				failed: 1,
				aborted: false,
			});
		});

		it('stops opening mailboxes once one failed in a way the next would fail too', async () => {
			iterateMailboxCandidates.mockImplementation(
				from([
					{ uid: 'a', mailbox: 'a@corp.example' },
					{ uid: 'b', mailbox: 'b@corp.example' },
				]),
			);
			syncUserContacts.mockResolvedValueOnce(outcome({ fatal: true, failed: 1 }));

			const summary = await runContactSync();

			expect(summary.aborted).toBe(true);
			expect(syncUserContacts.mock.calls.length).toEqual(1);
		});
	});
});
