import type { IMessage } from '@rocket.chat/core-typings';
import { E2EE_SEARCH_LIMITS } from '@rocket.chat/desktop-api';
import type { E2EESearchDoc, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { createSearchIndexCrawler } from './searchIndexCrawler';
import { createSearchIndexWriter } from './searchIndexWriter';
import { createMemorySearchIndexBackend } from '../../../tests/mocks/client/memorySearchIndexBackend';

const createBackend = () =>
	({ upsert: jest.fn(async () => undefined), remove: jest.fn(async () => undefined) }) as unknown as jest.Mocked<ISearchIndexBackend>;
const message = (id: string, overrides: Partial<IMessage> & Record<string, unknown> = {}): IMessage =>
	({
		_id: id,
		rid: 'room1',
		t: 'e2e',
		e2e: 'done',
		msg: `secret words ${id}`,
		u: { _id: 'u1', username: 'alice' },
		ts: new Date('2026-10-26T12:00:00Z'),
		_updatedAt: new Date('2026-10-26T12:00:00Z'),
		...overrides,
	}) as IMessage;
const deferred = () => {
	let resolve!: () => void;
	const promise = new Promise<void>((done) => {
		resolve = done;
	});
	return { promise, resolve };
};
const ids = (backend: jest.Mocked<ISearchIndexBackend>) => backend.upsert.mock.calls.flatMap(([docs]) => docs.map((doc) => doc.id));

describe('createSearchIndexWriter', () => {
	beforeEach(() => jest.useFakeTimers());
	afterEach(() => jest.useRealTimers());

	it('batches a delay window and keeps the last version without changing messages', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend });
		const original = message('m1');
		const before = JSON.stringify(original);
		writer.index(original);
		writer.index(message('m1', { msg: 'edited' }));
		writer.index(message('m2'));
		expect(backend.upsert).not.toHaveBeenCalled();
		await jest.advanceTimersByTimeAsync(500);
		expect(backend.upsert).toHaveBeenCalledTimes(1);
		expect(ids(backend)).toEqual(['m1', 'm2']);
		expect(backend.upsert.mock.calls[0][0][0].body).toBe('edited');
		expect(JSON.stringify(original)).toBe(before);
	});

	it('flush sends the queue immediately', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend });
		writer.index(message('m1'));
		await writer.flush();
		expect(ids(backend)).toEqual(['m1']);
	});

	it.each([
		{ olderBody: 'old history', flushFirst: false },
		{ olderBody: '', flushFirst: false },
		{ olderBody: 'old history', flushFirst: true },
		{ olderBody: '', flushFirst: true },
	])('rejects stale decrypts with body "$olderBody", flushFirst=$flushFirst', async ({ olderBody, flushFirst }) => {
		const backend = createMemorySearchIndexBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend });
		const historyDecrypt = writer.bindToOpenIndex();
		writer.index(message('edited', { msg: 'new live edit', _updatedAt: new Date('2026-10-26T12:01:00Z') }));
		if (flushFirst) await writer.flush();
		historyDecrypt(message('edited', { msg: olderBody }));
		await writer.flush();
		expect(backend.documents.get('edited')?.body).toBe('new live edit');
		writer.dispose();
	});

	it.each(['old history', ''])('preserves a newer live write when an older crawler page decrypts to "%s"', async (olderBody) => {
		const backend = createMemorySearchIndexBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend });
		const started = deferred();
		const release = deferred();
		const crawler = createSearchIndexCrawler({
			backend,
			writer,
			syncMessages: async () => ({ updated: [message('edited', { msg: olderBody })], deleted: [] }),
			decryptMessage: async (encrypted) => {
				const index = writer.bindToOpenIndex();
				started.resolve();
				await release.promise;
				index(encrypted);
				return encrypted;
			},
		});
		const page = crawler.backfillRoomPage('room1');
		await started.promise;
		writer.index(message('edited', { msg: 'new live edit', _updatedAt: new Date('2026-10-26T12:01:00Z') }));
		await writer.flush();
		release.resolve();
		await page;
		expect(backend.documents.get('edited')?.body).toBe('new live edit');
		writer.dispose();
	});

	it('retains empty-edit revisions across flushes without weakening deletion tombstones', async () => {
		const backend = createMemorySearchIndexBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend });
		writer.index(message('edited', { msg: '', _updatedAt: new Date('2026-10-26T12:01:00Z') }));
		await writer.flush();
		writer.index(message('edited'));
		await writer.flush();
		expect(backend.documents.has('edited')).toBe(false);
		writer.index(message('edited', { _updatedAt: new Date('2026-10-26T12:02:00Z') }));
		await writer.flush();
		expect(backend.documents.has('edited')).toBe(true);
		writer.index(message('edited', { t: 'rm' }));
		writer.index(message('edited', { _updatedAt: new Date('2026-10-26T12:03:00Z') }));
		await writer.flush();
		expect(backend.documents.has('edited')).toBe(false);
		writer.dispose();
	});

	it('scopes accepted revisions to each open backend', async () => {
		const first = createMemorySearchIndexBackend();
		const second = createMemorySearchIndexBackend();
		let active: ISearchIndexBackend = first;
		const writer = createSearchIndexWriter({ getBackend: () => active });
		writer.index(message('edited', { msg: 'new edit', _updatedAt: new Date('2026-10-26T12:01:00Z') }));
		await writer.flush();
		active = second;
		writer.index(message('edited'));
		await writer.flush();
		expect(second.documents.get('edited')?.body).toBe('secret words edited');
		writer.dispose();
	});

	it('does not retain work before open or send queued work after close', async () => {
		const backend = createBackend();
		let active: ISearchIndexBackend | undefined;
		const writer = createSearchIndexWriter({ getBackend: () => active });
		writer.index(message('before'));
		active = backend;
		await writer.flush();
		writer.index(message('after'));
		active = undefined;
		await writer.flush();
		expect(backend.upsert).not.toHaveBeenCalled();
	});

	it('does not transfer queued documents to another backend', async () => {
		const first = createBackend();
		const second = createBackend();
		let active: ISearchIndexBackend = first;
		const writer = createSearchIndexWriter({ getBackend: () => active });
		writer.index(message('first'));
		active = second;
		writer.index(message('second'));
		await writer.flush();
		expect(first.upsert).not.toHaveBeenCalled();
		expect(ids(second)).toEqual(['second']);
	});

	it('drops delayed decrypt results after a session change and before open', async () => {
		const first = createBackend();
		const second = createBackend();
		let active: ISearchIndexBackend | undefined;
		const writer = createSearchIndexWriter({ getBackend: () => active });
		const beforeOpen = writer.bindToOpenIndex();
		active = first;
		const oldDecrypt = writer.bindToOpenIndex();
		const gate = deferred();
		const decrypt = gate.promise.then(() => oldDecrypt(message('old')));
		active = second;
		gate.resolve();
		await decrypt;
		beforeOpen(message('before-open'));
		writer.bindToOpenIndex()(message('current'));
		await writer.flush();
		expect(first.upsert).not.toHaveBeenCalled();
		expect(ids(second)).toEqual(['current']);
	});

	it('uses shared document-count, body and aggregate batch bounds', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend });
		const max = E2EE_SEARCH_LIMITS.maxBatchDocuments;
		for (let i = 0; i < max * 2 + 1; i++) writer.index(message(`m${i}`));
		await writer.flush();
		expect(backend.upsert.mock.calls.map(([docs]) => docs.length)).toEqual([max, max, 1]);
		backend.upsert.mockClear();
		const perBatch = Math.floor(E2EE_SEARCH_LIMITS.maxBatchBodyCodeUnits / E2EE_SEARCH_LIMITS.maxDocumentBodyCodeUnits);
		for (let i = 0; i < perBatch * 2 + 1; i++) {
			writer.index(message(`big${i}`, { msg: 'x'.repeat(E2EE_SEARCH_LIMITS.maxDocumentBodyCodeUnits + 10) }));
		}
		await writer.flush();
		expect(backend.upsert.mock.calls.map(([docs]) => docs.length)).toEqual([perBatch, perBatch, 1]);
		for (const [docs] of backend.upsert.mock.calls) {
			expect(docs.reduce((sum, doc) => sum + doc.body.length, 0)).toBeLessThanOrEqual(E2EE_SEARCH_LIMITS.maxBatchBodyCodeUnits);
			expect(docs.every((doc) => doc.body.length === E2EE_SEARCH_LIMITS.maxDocumentBodyCodeUnits)).toBe(true);
		}
	});

	it('drops unreadable messages but removes empty edits without permanent tombstones', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend });
		writer.index(message('pending', { e2e: 'pending' }));
		writer.index(message('failed', { decryptFailed: true }));
		writer.index(message('plain', { t: undefined }));
		writer.index(message('empty', { msg: '' }));
		await writer.flush();
		expect(backend.remove).toHaveBeenCalledWith(['empty']);
		expect(backend.remove).toHaveBeenCalledTimes(1);
		writer.index(message('empty', { msg: 'new edit' }));
		await writer.flush();
		expect(ids(backend)).toEqual(['empty']);
	});

	it.each(['backfill', 'catch-up'] as const)('keeps the %s checkpoint when an empty-edit removal fails', async (phase) => {
		const backend = createMemorySearchIndexBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend });
		writer.index(message('edited'));
		await writer.flush();
		const before = { lastUpdate: 1, backfillDone: phase === 'catch-up' };
		await backend.setRoomState('room1', before);
		const emptyEdit = message('edited', { msg: '', _updatedAt: new Date('2026-10-26T12:01:00Z') });
		const syncMessages = jest.fn(async () => ({ updated: [emptyEdit], deleted: [] }));
		const crawler = createSearchIndexCrawler({
			backend,
			writer,
			syncMessages,
			decryptMessage: async (decrypted) => {
				writer.index(decrypted);
				return decrypted;
			},
		});
		const readPage = () => (phase === 'backfill' ? crawler.backfillRoomPage('room1') : crawler.catchUpRoomPage('room1'));
		jest.spyOn(backend, 'remove').mockRejectedValueOnce(new Error('empty edit remove failed'));

		await expect(readPage()).rejects.toThrow('empty edit remove failed');
		expect(await backend.getRoomState('room1')).toEqual(before);
		expect(backend.documents.get('edited')?.body).toBe('secret words edited');
		await readPage();
		expect(backend.documents.has('edited')).toBe(false);
		expect(syncMessages).toHaveBeenCalledTimes(2);
		writer.dispose();
	});

	it('does not report an old backend empty-edit removal failure to the next backend', async () => {
		const first = createBackend();
		const second = createBackend();
		let active: ISearchIndexBackend = first;
		const writer = createSearchIndexWriter({ getBackend: () => active });
		first.remove.mockRejectedValueOnce(new Error('old remove failed'));
		writer.index(message('empty', { msg: '' }));
		await writer.flush();
		active = second;
		await expect(writer.flush({ throwOnError: true })).resolves.toBeUndefined();
	});

	it('preserves deletion placeholders and rejects late decrypts', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend });
		const lateDecrypt = writer.bindToOpenIndex();
		writer.index(message('deleted'));
		writer.index(message('deleted', { t: 'rm' }));
		writer.index(message('deleted', { t: 'rm' }));
		lateDecrypt(message('deleted'));
		await writer.flush();
		expect(backend.remove).toHaveBeenCalledTimes(1);
		expect(backend.remove).toHaveBeenCalledWith(['deleted']);
		expect(backend.upsert).not.toHaveBeenCalled();
	});

	it('keeps tombstones beyond the old eviction window and scopes them to the backend', async () => {
		const first = createBackend();
		const second = createBackend();
		let active: ISearchIndexBackend = first;
		const writer = createSearchIndexWriter({ getBackend: () => active });
		await writer.remove(Array.from({ length: 5001 }, (_, i) => `m${i}`));
		writer.index(message('m0'));
		await writer.flush();
		expect(first.upsert).not.toHaveBeenCalled();
		active = second;
		writer.index(message('m0'));
		await writer.flush();
		expect(ids(second)).toEqual(['m0']);
	});

	it('orders removes after in-flight upserts and copies remove input', async () => {
		const backend = createBackend();
		const gate = deferred();
		backend.upsert.mockImplementationOnce(() => gate.promise);
		const writer = createSearchIndexWriter({ getBackend: () => backend });
		writer.index(message('m1'));
		const flushing = writer.flush();
		await Promise.resolve();
		const deleted = ['m1'];
		const removing = writer.remove(deleted);
		deleted[0] = 'other';
		expect(backend.remove).not.toHaveBeenCalled();
		gate.resolve();
		await Promise.all([flushing, removing]);
		expect(backend.remove).toHaveBeenCalledWith(['m1']);
		expect(backend.upsert.mock.invocationCallOrder[0]).toBeLessThan(backend.remove.mock.invocationCallOrder[0]);
	});

	it('drops deletion races from flush snapshots and rejected batch retries', async () => {
		const backend = createBackend();
		const gate = deferred();
		backend.upsert.mockImplementationOnce(async () => {
			await gate.promise;
			throw new Error('rejected');
		});
		const writer = createSearchIndexWriter({ getBackend: () => backend });
		writer.index(message('blocker'));
		const first = writer.flush();
		await Promise.resolve();
		writer.index(message('deleted'));
		const second = writer.flush();
		const removing = writer.remove(['blocker', 'deleted']);
		gate.resolve();
		await Promise.all([first, second, removing]);
		expect(ids(backend)).toEqual(['blocker']);
		expect(backend.remove).toHaveBeenCalledWith(['blocker', 'deleted']);
	});

	it('checks room subscriptions at decrypt completion and before a queued write', async () => {
		const backend = createBackend();
		let subscribed = true;
		const writer = createSearchIndexWriter({ getBackend: () => backend, isRoomSubscribed: () => subscribed });
		const lateDecrypt = writer.bindToOpenIndex();
		writer.index(message('queued'));
		subscribed = false;
		lateDecrypt(message('late'));
		await writer.flush();
		expect(backend.upsert).not.toHaveBeenCalled();
	});

	it('does not retry writes or notify the new session after backend replacement', async () => {
		const first = createBackend();
		const second = createBackend();
		const gate = deferred();
		first.upsert.mockImplementationOnce(async () => {
			await gate.promise;
			throw new Error('old failure');
		});
		let active: ISearchIndexBackend = first;
		const onError = jest.fn();
		const writer = createSearchIndexWriter({ getBackend: () => active, onError });
		const listener = jest.fn();
		writer.subscribe(listener);
		writer.index(message('first'));
		const flushing = writer.flush({ throwOnError: true });
		await Promise.resolve();
		active = second;
		gate.resolve();
		await expect(flushing).resolves.toBeUndefined();
		expect(first.upsert).toHaveBeenCalledTimes(1);
		expect(second.upsert).not.toHaveBeenCalled();
		expect(onError).not.toHaveBeenCalled();
		expect(listener).not.toHaveBeenCalled();
	});

	it('splits rejected batches, retries reduced bodies and reports failures without plaintext', async () => {
		const backend = createBackend();
		const accepted: E2EESearchDoc[] = [];
		backend.upsert.mockImplementation(async (docs) => {
			if (docs.some((doc) => doc.id === 'bad')) throw new Error('invalid document');
			accepted.push(...docs);
		});
		const onWarn = jest.fn();
		const onError = jest.fn();
		const writer = createSearchIndexWriter({ getBackend: () => backend, onWarn, onError });
		writer.index(message('good'));
		writer.index(message('bad'));
		await jest.advanceTimersByTimeAsync(500);
		expect(accepted.map((doc) => doc.id)).toEqual(['good']);
		expect(backend.upsert.mock.calls.map(([docs]) => docs.length)).toEqual([2, 1, 1, 1]);
		expect(onError).toHaveBeenCalledTimes(1);
		expect(onWarn.mock.calls.flat().join(' ')).not.toContain('secret words');
		await expect(writer.flush({ throwOnError: true })).rejects.toThrow('invalid document');
		await expect(writer.flush({ throwOnError: true })).resolves.toBeUndefined();
	});

	it('accepts a reduced body when a single-document retry succeeds', async () => {
		const backend = createBackend();
		backend.upsert.mockRejectedValueOnce(new Error('too long'));
		const writer = createSearchIndexWriter({ getBackend: () => backend });
		writer.index(message('m', { msg: 'a'.repeat(20) }));
		await writer.flush({ throwOnError: true });
		expect(backend.upsert.mock.calls[1][0][0].body).toHaveLength(10);
	});

	it('reports only failures of the current backend', async () => {
		const first = createBackend();
		first.upsert.mockRejectedValue(new Error('first'));
		const second = createBackend();
		second.upsert.mockRejectedValue(new Error('second'));
		let active: ISearchIndexBackend = first;
		const writer = createSearchIndexWriter({ getBackend: () => active });
		writer.index(message('first'));
		await writer.flush();
		active = second;
		await expect(writer.flush({ throwOnError: true })).resolves.toBeUndefined();
		writer.index(message('second'));
		await writer.flush();
		await expect(writer.flush({ throwOnError: true })).rejects.toThrow('second');
	});

	it('chunks removes using the shared bound and supports retryable errors', async () => {
		const backend = createBackend();
		const onError = jest.fn();
		const writer = createSearchIndexWriter({ getBackend: () => backend, onError });
		const max = E2EE_SEARCH_LIMITS.maxBatchDocuments;
		await writer.remove(Array.from({ length: max + 1 }, (_, i) => `m${i}`));
		expect(backend.remove.mock.calls.map(([batch]) => batch.length)).toEqual([max, 1]);
		backend.remove.mockRejectedValue(new Error('remove failed'));
		await expect(writer.remove(['m'], { throwOnError: true })).rejects.toThrow('remove failed');
		await expect(writer.remove(['m'])).resolves.toBeUndefined();
		expect(onError).toHaveBeenCalledTimes(2);
	});

	it('notifies subscribers after mutations and makes dispose terminal', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend });
		const listener = jest.fn();
		const unsubscribe = writer.subscribe(listener);
		writer.index(message('m'));
		await writer.flush();
		await writer.remove(['m']);
		expect(listener).toHaveBeenCalledTimes(2);
		expect(writer.getVersion()).toBe(2);
		unsubscribe();
		const late = writer.bindToOpenIndex();
		writer.index(message('queued'));
		writer.dispose();
		late(message('late'));
		writer.index(message('after'));
		await writer.remove(['after']);
		await writer.flush();
		expect(ids(backend)).toEqual(['m']);
		expect(backend.remove).toHaveBeenCalledTimes(1);
	});
});
