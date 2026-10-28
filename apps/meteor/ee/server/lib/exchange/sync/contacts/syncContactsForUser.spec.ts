import { syncContactsForUser } from './syncContactsForUser';
import type { UserContactSyncOutcome } from './syncUserContacts';

const findOneById = jest.fn();
const syncUserContacts = jest.fn();
const resolveMailbox = jest.fn();
const getExchangeProvider = jest.fn();
const settingsGet = jest.fn();

jest.mock('@rocket.chat/models', () => ({ Users: { findOneById: (...args: unknown[]) => findOneById(...args) } }));
jest.mock('./syncUserContacts', () => ({ syncUserContacts: (...args: unknown[]) => syncUserContacts(...args) }));
jest.mock('../resolveMailboxes', () => ({ resolveMailbox: (...args: unknown[]) => resolveMailbox(...args) }));
jest.mock('../../ExchangeProviderRegistry', () => ({ getExchangeProvider: () => getExchangeProvider() }));
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

const verified = { _id: 'uid', emails: [{ address: 'user@corp.example', verified: true }] };

const deferred = () => {
	let resolve: (value: UserContactSyncOutcome) => void = () => undefined;
	const promise = new Promise<UserContactSyncOutcome>((r) => {
		resolve = r;
	});

	return { promise, resolve };
};

describe('syncContactsForUser', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		resolveMailbox.mockReturnValue('user@corp.example');
		getExchangeProvider.mockReturnValue({ id: 'ews' });
		findOneById.mockResolvedValue(verified);
		syncUserContacts.mockResolvedValue(outcome());
		settingsGet.mockReturnValue('AR');
	});

	it('syncs the mailbox resolved for the user, with the configured region', async () => {
		await syncContactsForUser('uid');

		expect(syncUserContacts).toHaveBeenCalledWith({ id: 'ews' }, 'uid', 'user@corp.example', 'AR');
	});

	it('falls back to no region rather than passing undefined down', async () => {
		settingsGet.mockReturnValue(undefined);

		await syncContactsForUser('uid');

		expect(syncUserContacts).toHaveBeenCalledWith({ id: 'ews' }, 'uid', 'user@corp.example', '');
	});

	describe('when there is no mailbox to sync', () => {
		it('tells an unverified address apart from a user that is not there', async () => {
			resolveMailbox.mockReturnValue(undefined);

			await expect(syncContactsForUser('uid')).rejects.toMatchObject({ code: 'email-not-verified' });
			expect(syncUserContacts).not.toHaveBeenCalled();
		});

		it('reports a user that no longer exists as a missing mailbox', async () => {
			findOneById.mockResolvedValue(null);

			await expect(syncContactsForUser('uid')).rejects.toMatchObject({ code: 'mailbox-not-found' });
			expect(resolveMailbox).not.toHaveBeenCalled();
		});
	});

	describe('one sync per mailbox at a time', () => {
		it('refuses a second run for the same user while the first is still going', async () => {
			const first = deferred();
			syncUserContacts.mockReturnValueOnce(first.promise);

			const running = syncContactsForUser('uid');

			await expect(syncContactsForUser('uid')).rejects.toMatchObject({ code: 'rate-limited' });

			first.resolve(outcome());
			await running;
			expect(syncUserContacts).toHaveBeenCalledTimes(1);
		});

		it('lets another user through, since the lock is on the mailbox and not on the feature', async () => {
			const first = deferred();
			syncUserContacts.mockReturnValueOnce(first.promise);

			const running = syncContactsForUser('uid');

			await expect(syncContactsForUser('other')).resolves.toBeDefined();

			first.resolve(outcome());
			await running;
		});

		it('releases the lock after a failed run, so a retry is not locked out by it', async () => {
			syncUserContacts.mockRejectedValueOnce(new Error('transport died'));

			await expect(syncContactsForUser('uid')).rejects.toThrow('transport died');
			await expect(syncContactsForUser('uid')).resolves.toBeDefined();
		});

		it('releases the lock when the mailbox could not be resolved either', async () => {
			resolveMailbox.mockReturnValueOnce(undefined);

			await expect(syncContactsForUser('uid')).rejects.toMatchObject({ code: 'email-not-verified' });
			await expect(syncContactsForUser('uid')).resolves.toBeDefined();
		});
	});
});
