import { ExchangeError } from '../errors';
import { MAILBOX_CONCURRENCY, runExchangeSync } from './runExchangeSync';
import type { MailboxSyncOutcome } from './syncMailbox';

const syncMailbox = jest.fn();
const applyDeferredSideEffects = jest.fn();
const getExchangeProvider = jest.fn();
const isServerSyncEnabled = jest.fn();
const candidates = jest.fn();

jest.mock('./syncMailbox', () => ({ syncMailbox: (...args: unknown[]) => syncMailbox(...args) }));
jest.mock('./applyDeferredSideEffects', () => ({
	applyDeferredSideEffects: (...args: unknown[]) => applyDeferredSideEffects(...args),
}));
jest.mock('./resolveMailboxes', () => ({ iterateMailboxCandidates: () => candidates() }));
jest.mock('../ExchangeProviderRegistry', () => ({
	getExchangeProvider: () => getExchangeProvider(),
	getSyncWindow: () => ({ start: new Date('2026-09-07T00:00:00Z'), end: new Date('2026-09-09T00:00:00Z') }),
	isServerSyncEnabled: () => isServerSyncEnabled(),
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

const from = (items: { uid: string; mailbox?: string }[]) =>
	async function* () {
		yield* items;
	};

const dirtyArg = (): Map<string, boolean> => applyDeferredSideEffects.mock.calls[0][0];

const deferred = () => {
	let resolve: () => void = () => undefined;
	const promise = new Promise<void>((r) => {
		resolve = r;
	});
	return { promise, resolve };
};

describe('runExchangeSync', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		isServerSyncEnabled.mockReturnValue(true);
		getExchangeProvider.mockReturnValue({ id: 'ews' });
		syncMailbox.mockResolvedValue(outcome());
		applyDeferredSideEffects.mockResolvedValue(undefined);
		candidates.mockImplementation(from([{ uid: 'a', mailbox: 'a@corp.example' }]));
	});

	it('counts a user with no resolvable mailbox as skipped and syncs the rest', async () => {
		candidates.mockImplementation(from([{ uid: 'a' }, { uid: 'b', mailbox: 'b@corp.example' }]));

		const summary = await runExchangeSync();

		expect(summary).toMatchObject({ skipped: 1, mailboxes: 1 });
		expect(syncMailbox).toHaveBeenCalledTimes(1);
	});

	it('adds up the counters of every mailbox', async () => {
		candidates.mockImplementation(
			from([
				{ uid: 'a', mailbox: 'a@x' },
				{ uid: 'b', mailbox: 'b@x' },
			]),
		);
		syncMailbox
			.mockResolvedValueOnce(outcome({ upserted: 2, deleted: 1 }))
			.mockResolvedValueOnce(outcome({ upserted: 3, pruned: 4, failed: true }));

		const summary = await runExchangeSync();

		expect(summary).toMatchObject({ upserted: 5, deleted: 1, pruned: 4, failed: 1 });
	});

	it('stops taking new mailboxes once one fails fatally', async () => {
		candidates.mockImplementation(from(Array.from({ length: 20 }, (_, i) => ({ uid: `u${i}`, mailbox: `u${i}@x` }))));
		syncMailbox.mockResolvedValueOnce(outcome({ failed: true, fatal: true }));

		const summary = await runExchangeSync();

		expect(summary.aborted).toBe(true);
		expect(syncMailbox.mock.calls.length).toBe(1);
	});

	it('marks a user dirty only when something changed', async () => {
		candidates.mockImplementation(
			from([
				{ uid: 'a', mailbox: 'a@x' },
				{ uid: 'b', mailbox: 'b@x' },
			]),
		);
		syncMailbox.mockResolvedValueOnce(outcome({ changed: true })).mockResolvedValueOnce(outcome({ changed: false }));

		await runExchangeSync();

		expect([...dirtyArg().keys()]).toEqual(['a']);
	});

	it('keeps the removal gate on for a user whose later mailbox reported no removal', async () => {
		candidates.mockImplementation(
			from([
				{ uid: 'a', mailbox: 'one@x' },
				{ uid: 'a', mailbox: 'two@x' },
			]),
		);
		syncMailbox
			.mockResolvedValueOnce(outcome({ changed: true, removedEvents: true }))
			.mockResolvedValueOnce(outcome({ changed: true, removedEvents: false }));

		await runExchangeSync();

		expect(dirtyArg().get('a')).toBe(true);
	});

	it('does nothing when server sync is off', async () => {
		isServerSyncEnabled.mockReturnValue(false);

		const summary = await runExchangeSync();

		expect(summary.mailboxes).toBe(0);
		expect(getExchangeProvider).not.toHaveBeenCalled();
	});

	it('returns quietly when the provider was torn down between the tick and the run', async () => {
		getExchangeProvider.mockImplementation(() => {
			throw new ExchangeError('not-configured', 'gone');
		});

		await expect(runExchangeSync()).resolves.toMatchObject({ mailboxes: 0, failed: 0 });
	});

	it('propagates any other failure of the run itself', async () => {
		getExchangeProvider.mockImplementation(() => {
			throw new ExchangeError('host-not-allowed', 'nope');
		});

		await expect(runExchangeSync()).rejects.toMatchObject({ code: 'host-not-allowed' });
	});

	it('applies the deferred side effects for what committed before the run threw', async () => {
		candidates.mockImplementation(
			from([
				{ uid: 'a', mailbox: 'a@x' },
				{ uid: 'b', mailbox: 'b@x' },
			]),
		);
		syncMailbox.mockImplementation(async (_provider: unknown, uid: string) => {
			if (uid === 'b') {
				throw new Error('boom');
			}
			return outcome({ changed: true, removedEvents: true });
		});

		await expect(runExchangeSync()).rejects.toThrow('boom');
		expect(dirtyArg().get('a')).toBe(true);
	});

	it('keeps at most the configured number of mailboxes in flight at once', async () => {
		candidates.mockImplementation(from(Array.from({ length: MAILBOX_CONCURRENCY + 1 }, (_, i) => ({ uid: `u${i}`, mailbox: `u${i}@x` }))));

		const gate = deferred();
		let started = 0;
		syncMailbox.mockImplementation(async () => {
			started++;
			await gate.promise;
			return outcome();
		});

		const run = runExchangeSync();
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(started).toBe(MAILBOX_CONCURRENCY);

		gate.resolve();
		await run;
		expect(started).toBe(MAILBOX_CONCURRENCY + 1);
	});

	it('skips a run while the previous one is still going', async () => {
		const gate = deferred();
		syncMailbox.mockImplementation(async () => {
			await gate.promise;
			return outcome({ upserted: 1 });
		});

		const first = runExchangeSync();
		const second = await runExchangeSync();

		expect(second).toMatchObject({ mailboxes: 0, upserted: 0 });

		gate.resolve();
		await expect(first).resolves.toMatchObject({ upserted: 1 });
	});
});
