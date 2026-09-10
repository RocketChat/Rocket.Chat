import type { IExchangeProvider } from '../definition/IExchangeProvider';
import type { DateRange, ExchangeEvent, ExchangeEventUpsert, Page } from '../definition/types';
import type { ExchangeErrorCode } from '../errors';
import { ExchangeError } from '../errors';
import { MAX_PAGES, syncMailbox } from './syncMailbox';

const importMany = jest.fn();
const deleteImported = jest.fn();
const pruneImportedWindow = jest.fn();

const findOneByUserId = jest.fn();
const saveCursor = jest.fn();
const setLastError = jest.fn();
const clearCursorByUserId = jest.fn();

jest.mock('@rocket.chat/core-services', () => ({
	Calendar: {
		importMany: (...args: unknown[]) => importMany(...args),
		deleteImported: (...args: unknown[]) => deleteImported(...args),
		pruneImportedWindow: (...args: unknown[]) => pruneImportedWindow(...args),
	},
}));

jest.mock('@rocket.chat/models', () => ({
	ExchangeSyncState: {
		findOneByUserId: (...args: unknown[]) => findOneByUserId(...args),
		saveCursor: (...args: unknown[]) => saveCursor(...args),
		setLastError: (...args: unknown[]) => setLastError(...args),
		clearCursorByUserId: (...args: unknown[]) => clearCursorByUserId(...args),
	},
}));

const UID = 'uid';
const MAILBOX = 'user@corp.example';

// Day anchored, which is what `getSyncWindow` produces
const timeWindow: DateRange = { start: new Date('2026-09-07T00:00:00Z'), end: new Date('2026-09-09T00:00:00Z') };

const upsert = (externalId: string, over: Partial<ExchangeEventUpsert> = {}): ExchangeEventUpsert => ({
	kind: 'upsert',
	externalId,
	subject: externalId,
	description: '',
	startTime: new Date('2026-09-07T10:00:00Z'),
	endTime: new Date('2026-09-07T11:00:00Z'),
	isCancelled: false,
	busy: true,
	...over,
});

const deletion = (externalId: string): ExchangeEvent => ({ kind: 'deleted', externalId });

const page = (items: ExchangeEvent[], over: Partial<Page<ExchangeEvent>> = {}): Page<ExchangeEvent> => ({
	items,
	hasMore: false,
	isCompleteForWindow: false,
	...over,
});

const capabilities = (cursorIsWindowScoped = true) => ({
	supportsDelta: true,
	supportsWebhooks: false,
	supportsContacts: false,
	cursorIsWindowScoped,
});

const providerReturning = (...pages: Page<ExchangeEvent>[]): IExchangeProvider => {
	const queue = [...pages];

	return {
		id: 'ews',
		capabilities: capabilities(),
		testConnection: jest.fn(),
		listEvents: jest.fn(async () => queue.shift() ?? page([])),
	} as unknown as IExchangeProvider;
};

const batch = (over: Record<string, unknown> = {}) => ({
	changed: false,
	upserted: 0,
	modified: 0,
	deleted: 0,
	skipped: 0,
	...over,
});

const importedExternalIds = (): string[] => (importMany.mock.calls[0][0] as { externalId: string }[]).map(({ externalId }) => externalId);

describe('syncMailbox', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		findOneByUserId.mockResolvedValue(null);
		importMany.mockResolvedValue(batch());
		deleteImported.mockResolvedValue(batch());
		pruneImportedWindow.mockResolvedValue(batch());
		saveCursor.mockResolvedValue(undefined);
		setLastError.mockResolvedValue(undefined);
		clearCursorByUserId.mockResolvedValue(undefined);
	});

	describe('resolving upserts against removals', () => {
		it('lets a later upsert win over an earlier deletion of the same event', async () => {
			const provider = providerReturning(page([deletion('A')], { hasMore: true, cursor: 'c1' }), page([upsert('A')]));

			await syncMailbox(provider, UID, MAILBOX, timeWindow);

			expect(importedExternalIds()).toEqual(['A']);
			expect(deleteImported).not.toHaveBeenCalled();
		});

		it('lets a later deletion win over an earlier upsert of the same event', async () => {
			const provider = providerReturning(page([upsert('A')], { hasMore: true, cursor: 'c1' }), page([deletion('A')]));

			await syncMailbox(provider, UID, MAILBOX, timeWindow);

			expect(importedExternalIds()).toEqual([]);
			expect(deleteImported).toHaveBeenCalledWith(UID, ['A'], timeWindow.start, { deferSideEffects: true });
		});

		it('treats a cancelled event as a removal rather than importing it', async () => {
			const provider = providerReturning(page([upsert('A', { isCancelled: true }), upsert('B')]));

			await syncMailbox(provider, UID, MAILBOX, timeWindow);

			expect(importedExternalIds()).toEqual(['B']);
			expect(deleteImported).toHaveBeenCalledWith(UID, ['A'], timeWindow.start, { deferSideEffects: true });
		});
	});

	describe('deciding what may be pruned', () => {
		it('never prunes when no page claimed to be complete', async () => {
			const provider = providerReturning(page([upsert('A')]));

			await syncMailbox(provider, UID, MAILBOX, timeWindow);

			expect(pruneImportedWindow).not.toHaveBeenCalled();
		});

		it('prunes against the newest complete page, not the union of every page', async () => {
			// Each complete page is an independent snapshot, so B disappearing from the second one is a removal
			const provider = providerReturning(
				page([upsert('A'), upsert('B')], { hasMore: true, cursor: 'c1', isCompleteForWindow: true }),
				page([upsert('A')], { isCompleteForWindow: true }),
			);

			await syncMailbox(provider, UID, MAILBOX, timeWindow);

			expect(pruneImportedWindow).toHaveBeenCalledWith(UID, timeWindow, ['A'], { deferSideEffects: true });
		});

		it('prunes after the upserts landed, so it cannot remove what this run is reviving', async () => {
			const provider = providerReturning(page([upsert('A')], { isCompleteForWindow: true }));

			await syncMailbox(provider, UID, MAILBOX, timeWindow);

			expect(importMany.mock.invocationCallOrder[0]).toBeLessThan(pruneImportedWindow.mock.invocationCallOrder[0]);
		});
	});

	describe('reusing the stored cursor', () => {
		const stored = {
			cursor: 'saved',
			mailbox: MAILBOX,
			provider: 'ews',
			syncWindowDays: 2,
			windowStart: timeWindow.start,
		};

		const folderScopedProvider = (): IExchangeProvider =>
			({
				id: 'ews',
				capabilities: capabilities(false),
				testConnection: jest.fn(),
				listEvents: jest.fn(async () => page([])),
			}) as unknown as IExchangeProvider;

		it('resumes from the cursor when the whole identity matches', async () => {
			findOneByUserId.mockResolvedValue(stored);
			const provider = providerReturning(page([]));

			await syncMailbox(provider, UID, MAILBOX, timeWindow);

			expect(provider.listEvents).toHaveBeenCalledWith(MAILBOX, timeWindow, stored.cursor);
		});

		it.each([
			['the mailbox changed', { mailbox: 'other@corp.example' }],
			['the provider changed', { provider: 'graph' }],
			['the window length changed', { syncWindowDays: 5 }],
			['the window start moved', { windowStart: new Date('2026-09-06T00:00:00Z') }],
			['there is no cursor', { cursor: undefined }],
		])('starts over when %s', async (_label, difference) => {
			findOneByUserId.mockResolvedValue({ ...stored, ...difference });
			const provider = providerReturning(page([]));

			await syncMailbox(provider, UID, MAILBOX, timeWindow);

			expect(provider.listEvents).toHaveBeenCalledWith(MAILBOX, timeWindow, undefined);
		});

		it('keeps a cursor that is not scoped to the window when the window moves', async () => {
			findOneByUserId.mockResolvedValue({ ...stored, windowStart: new Date('2026-09-06T00:00:00Z') });
			const provider = folderScopedProvider();

			await syncMailbox(provider, UID, MAILBOX, timeWindow);

			expect(provider.listEvents).toHaveBeenCalledWith(MAILBOX, timeWindow, stored.cursor);
		});

		it('stores the identity of the window it just read, not the one it resumed from', async () => {
			const provider = providerReturning(page([], { cursor: 'fresh' }));

			await syncMailbox(provider, UID, MAILBOX, timeWindow);

			expect(saveCursor).toHaveBeenCalledWith(
				UID,
				{ mailbox: stored.mailbox, provider: stored.provider, syncWindowDays: stored.syncWindowDays, windowStart: stored.windowStart },
				'fresh',
				expect.any(Date),
			);
		});
	});

	describe('when the provider fails', () => {
		const failingProvider = (err: unknown): IExchangeProvider =>
			({
				id: 'ews',
				capabilities: capabilities(),
				testConnection: jest.fn(),
				listEvents: jest.fn(async () => {
					throw err;
				}),
			}) as unknown as IExchangeProvider;

		it('reports the failure and carries the error for a caller that needs to rethrow it', async () => {
			const err = new ExchangeError('mailbox-not-found', 'nope');

			const outcome = await syncMailbox(failingProvider(err), UID, MAILBOX, timeWindow);

			expect(outcome).toMatchObject({ failed: true, fatal: false, error: err, upserted: 0 });
		});

		it.each([
			['not-configured', true],
			['host-not-allowed', true],
			['authentication-failed', true],
			['rate-limited', true],
			['mailbox-not-found', false],
			['unexpected-response', false],
		])('marks %s as fatal=%s, which is what stops the whole run', async (code, fatal) => {
			const outcome = await syncMailbox(failingProvider(new ExchangeError(code as ExchangeErrorCode, 'x')), UID, MAILBOX, timeWindow);

			expect(outcome.fatal).toBe(fatal);
		});

		it('drops the cursor when Exchange rejected the stored sync state', async () => {
			await syncMailbox(failingProvider(new ExchangeError('sync-state-invalid', 'x')), UID, MAILBOX, timeWindow);

			expect(clearCursorByUserId).toHaveBeenCalledWith(UID);
		});

		it('keeps the cursor for any other failure, so a transient error does not force a full resync', async () => {
			await syncMailbox(failingProvider(new ExchangeError('connection-failed', 'x')), UID, MAILBOX, timeWindow);

			expect(clearCursorByUserId).not.toHaveBeenCalled();
		});

		it('still reports work that committed before the failure, so its presence is not lost', async () => {
			importMany.mockResolvedValue(batch({ changed: true, upserted: 1 }));
			deleteImported.mockRejectedValue(new ExchangeError('unexpected-response', 'x'));

			const provider = providerReturning(page([upsert('A'), deletion('B')]));
			const outcome = await syncMailbox(provider, UID, MAILBOX, timeWindow);

			expect(outcome).toMatchObject({ failed: true, changed: true });
		});
	});

	it('stops paging rather than following a provider that never says it is done', async () => {
		const pages: Page<ExchangeEvent>[] = Array.from({ length: MAX_PAGES }, () => page([], { hasMore: true, cursor: 'endless' }));

		const provider = providerReturning(...pages);
		await syncMailbox(provider, UID, MAILBOX, timeWindow);

		expect(provider.listEvents).toHaveBeenCalledTimes(MAX_PAGES);
	});

	it('reports removedEvents when the prune removed something, which is what may end a busy claim', async () => {
		pruneImportedWindow.mockResolvedValue(batch({ changed: true, deleted: 2 }));
		const provider = providerReturning(page([upsert('A')], { isCompleteForWindow: true }));

		const outcome = await syncMailbox(provider, UID, MAILBOX, timeWindow);

		expect(outcome).toMatchObject({ pruned: 2, removedEvents: true, changed: true });
	});
});
