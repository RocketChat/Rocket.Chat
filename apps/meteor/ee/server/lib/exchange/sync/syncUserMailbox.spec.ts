import { ExchangeError } from '../errors';
import type { MailboxSyncOutcome } from './syncMailbox';
import { syncUserMailbox } from './syncUserMailbox';

const findOneById = jest.fn();
const syncMailbox = jest.fn();
const applyDeferredSideEffects = jest.fn();
const resolveMailbox = jest.fn();
const getExchangeProvider = jest.fn();

jest.mock('@rocket.chat/models', () => ({ Users: { findOneById: (...args: unknown[]) => findOneById(...args) } }));
jest.mock('./syncMailbox', () => ({ syncMailbox: (...args: unknown[]) => syncMailbox(...args) }));
jest.mock('./applyDeferredSideEffects', () => ({
	applyDeferredSideEffects: (...args: unknown[]) => applyDeferredSideEffects(...args),
}));
jest.mock('./resolveMailboxes', () => ({ resolveMailbox: (...args: unknown[]) => resolveMailbox(...args) }));
jest.mock('../ExchangeProviderRegistry', () => ({
	getExchangeProvider: () => getExchangeProvider(),
	getSyncWindow: () => ({ start: new Date('2026-09-07T00:00:00Z'), end: new Date('2026-09-09T00:00:00Z') }),
}));

const outcome = (over: Partial<MailboxSyncOutcome> = {}): MailboxSyncOutcome => ({
	upserted: 0,
	modified: 0,
	deleted: 0,
	pruned: 0,
	changed: false,
	removedEvents: false,
	failed: false,
	fatal: false,
	...over,
});

const verified = { _id: 'uid', emails: [{ address: 'user@corp.example', verified: true }] };

describe('syncUserMailbox', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		resolveMailbox.mockReturnValue('user@corp.example');
		getExchangeProvider.mockReturnValue({ id: 'ews' });
		findOneById.mockResolvedValue(verified);
		syncMailbox.mockResolvedValue(outcome());
		applyDeferredSideEffects.mockResolvedValue(undefined);
	});

	it('syncs the mailbox resolved for the user', async () => {
		resolveMailbox.mockReturnValue('real@corp.example');

		await syncUserMailbox('uid');

		expect(syncMailbox).toHaveBeenCalledWith({ id: 'ews' }, 'uid', 'real@corp.example', expect.anything());
	});

	it('rethrows the failure instead of reporting a sync of zero events', async () => {
		const err = new ExchangeError('mailbox-not-found', 'nope');
		syncMailbox.mockResolvedValue(outcome({ failed: true, error: err }));

		await expect(syncUserMailbox('uid')).rejects.toBe(err);
	});

	it('still applies the side effects of work that committed before the failure', async () => {
		syncMailbox.mockResolvedValue(outcome({ failed: true, changed: true, removedEvents: true, error: new Error('boom') }));

		await expect(syncUserMailbox('uid')).rejects.toThrow('boom');
		expect(applyDeferredSideEffects).toHaveBeenCalledWith(new Map([['uid', true]]));
	});

	it('leaves the side effects alone when nothing changed', async () => {
		await syncUserMailbox('uid');

		expect(applyDeferredSideEffects).toHaveBeenCalledWith(new Map());
	});

	it('asks the user to verify their email rather than blaming the mailbox', async () => {
		findOneById.mockResolvedValue({ _id: 'uid', emails: [{ address: 'user@corp.example', verified: false }] });
		resolveMailbox.mockReturnValue(undefined);

		await expect(syncUserMailbox('uid')).rejects.toMatchObject({ code: 'email-not-verified' });
		expect(syncMailbox).not.toHaveBeenCalled();
	});

	it('reports a missing mailbox for a user that no longer exists', async () => {
		findOneById.mockResolvedValue(null);

		await expect(syncUserMailbox('uid')).rejects.toMatchObject({ code: 'mailbox-not-found' });
	});

	it('refuses a second sync while one is already running for the same user', async () => {
		let release: () => void = () => undefined;
		const parked = new Promise<void>((resolve) => {
			release = resolve;
		});
		syncMailbox.mockImplementation(async () => {
			await parked;
			return outcome();
		});

		const first = syncUserMailbox('uid');

		await expect(syncUserMailbox('uid')).rejects.toMatchObject({ code: 'rate-limited' });

		release();
		await first;
	});

	it('releases the guard after a failure, so a retry is not locked out', async () => {
		syncMailbox.mockResolvedValueOnce(outcome({ failed: true, error: new Error('boom') }));

		await expect(syncUserMailbox('uid')).rejects.toThrow('boom');
		await expect(syncUserMailbox('uid')).resolves.toMatchObject({ failed: false });
	});
});
