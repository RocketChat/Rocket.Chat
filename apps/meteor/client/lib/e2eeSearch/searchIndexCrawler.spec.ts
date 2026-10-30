import type { IMessage } from '@rocket.chat/core-typings';

import { createSearchIndexCrawler, DEFAULT_PAGE_SIZE } from './searchIndexCrawler';
import type { SyncMessagesPage, SyncMessagesParams } from './searchIndexCrawler';
import { createSearchIndexWriter } from './searchIndexWriter';
import { createMemorySearchIndexBackend } from '../../../tests/mocks/client/memorySearchIndexBackend';
import { createSyncMessagesServerMock } from '../../../tests/mocks/client/syncMessagesServerMock';

const NOW = Date.parse('2026-10-26T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const encrypted = (id: string, updatedAt: number, fields: Partial<IMessage> = {}): IMessage =>
	({
		_id: id,
		rid: 'room1',
		t: 'e2e',
		e2e: 'pending',
		msg: `ciphertext ${id}`,
		u: { _id: 'u1', username: 'alice' },
		ts: new Date(updatedAt),
		_updatedAt: new Date(updatedAt),
		...fields,
	}) as IMessage;
const page = (updated: IMessage[] = [], previous: string | null = null, next: string | null = null): SyncMessagesPage => ({
	updated,
	deleted: [],
	cursor: { next, previous },
});
const setup = (
	options: {
		pages?: SyncMessagesPage[];
		pageSize?: number;
		maxAgeMs?: number;
		maxBackfillMessagesPerRoom?: number;
		maxPending?: number;
	} = {},
) => {
	const backend = createMemorySearchIndexBackend();
	const pages = options.pages ?? [];
	const syncMessages = jest.fn(async (_params: SyncMessagesParams): Promise<SyncMessagesPage> => {
		const result = pages.shift();
		if (!result) throw new Error('No more test pages');
		return result;
	});
	const missing = new Set<string>();
	const writer = createSearchIndexWriter({ getBackend: () => backend });
	const decryptMessage = jest.fn(async (message: IMessage) => {
		if (missing.has(message._id)) return { ...message, e2e: 'done', decryptFailed: true } as IMessage;
		const decrypted = { ...message, msg: `decrypted ${message._id}`, e2e: 'done' } as IMessage;
		writer.index(decrypted);
		return decrypted;
	});
	const crawler = createSearchIndexCrawler({ backend, syncMessages, decryptMessage, writer, now: () => NOW, ...options });
	return { backend, syncMessages, decryptMessage, writer, crawler, missing };
};
const catchUp = async (crawler: ReturnType<typeof createSearchIndexCrawler>) => {
	for (let i = 0; i < 100; i++) {
		if ((await crawler.catchUpRoomPage('room1')).done) return;
	}
	throw new Error('Catch-up did not finish');
};

describe('createSearchIndexCrawler', () => {
	it('defaults to 100 messages and a compound cursor before the current time', async () => {
		const { crawler, syncMessages } = setup({ pages: [page()] });
		await crawler.backfillRoomPage('room1');
		expect(DEFAULT_PAGE_SIZE).toBe(100);
		expect(syncMessages).toHaveBeenCalledWith({ roomId: 'room1', type: 'UPDATED', count: 100, previous: `${NOW}_` });
	});

	it('flushes real writer documents before saving a backfill checkpoint', async () => {
		const { crawler, writer, backend } = setup({ pages: [page([encrypted('m', NOW - 1)], `${NOW - 1}_m`)] });
		let release!: () => void;
		const originalFlush = writer.flush;
		jest.spyOn(writer, 'flush').mockImplementationOnce(async (options) => {
			await new Promise<void>((resolve) => {
				release = resolve;
			});
			await originalFlush(options);
		});
		const saved = jest.spyOn(backend, 'setRoomState');
		const pending = crawler.backfillRoomPage('room1');
		for (let i = 0; i < 10; i++) await Promise.resolve();
		expect(saved).not.toHaveBeenCalled();
		expect(backend.documents.size).toBe(0);
		release();
		await expect(pending).resolves.toEqual({ done: false, indexed: 1 });
		expect(backend.documents.get('m')?.body).toBe('decrypted m');
		expect(await backend.getRoomState('room1')).toEqual({ lastUpdate: NOW - 1, backfillCursor: `${NOW - 1}_m`, backfillDone: false });
	});

	it('sends saved compound cursors unchanged and resumes after a crawler restart', async () => {
		const { crawler, backend, writer, decryptMessage, syncMessages } = setup({
			pages: [page([encrypted('m2', NOW - 1)], `${NOW - 1}_m2`), page([encrypted('m1', NOW - 2)])],
		});
		await crawler.backfillRoomPage('room1');
		const restarted = createSearchIndexCrawler({ backend, writer, decryptMessage, syncMessages });
		await restarted.backfillRoomPage('room1');
		expect(syncMessages.mock.calls[1][0].previous).toBe(`${NOW - 1}_m2`);
		expect(await backend.getRoomState('room1')).toEqual({ lastUpdate: NOW - 1, backfillDone: true });
	});

	it('upgrades a legacy saved backfill timestamp without discarding its boundary', async () => {
		const { crawler, backend, syncMessages } = setup({ pages: [page()] });
		await backend.setRoomState('room1', { backfillDone: false, backfillCursor: `${NOW - 10}` });
		await crawler.backfillRoomPage('room1');
		expect(syncMessages.mock.calls[0][0].previous).toBe(`${NOW - 10}_`);
	});

	it('uses zero for an empty room and sends no request once backfill is complete', async () => {
		const { crawler, backend, syncMessages } = setup({ pages: [page()] });
		await crawler.backfillRoomPage('room1');
		expect(await backend.getRoomState('room1')).toEqual({ lastUpdate: 0, backfillDone: true });
		await expect(crawler.backfillRoomPage('room1')).resolves.toEqual({ done: true, indexed: 0 });
		expect(syncMessages).toHaveBeenCalledTimes(1);
	});

	it('limits by send time without indexing a recently edited old message', async () => {
		const { crawler, backend } = setup({
			maxAgeMs: DAY,
			pages: [page([encrypted('old', NOW - 1, { ts: new Date(NOW - 2 * DAY) }), encrypted('new', NOW - 2)])],
		});
		await expect(crawler.backfillRoomPage('room1')).resolves.toEqual({ done: true, indexed: 1 });
		expect([...backend.documents.keys()]).toEqual(['new']);
	});

	it('stops on update times older than the depth limit', async () => {
		const { crawler, backend } = setup({ maxAgeMs: DAY, pages: [page([encrypted('old', NOW - 2 * DAY)], `${NOW - 2 * DAY}_old`)] });
		await expect(crawler.backfillRoomPage('room1')).resolves.toEqual({ done: true, indexed: 0 });
		expect((await backend.getRoomState('room1'))?.backfillDone).toBe(true);
	});

	it('applies an optional backfill count without imposing a default cap', async () => {
		const limited = setup({
			pageSize: 2,
			maxBackfillMessagesPerRoom: 3,
			pages: [page([encrypted('m3', NOW - 1), encrypted('m2', NOW - 2)], 'cursor1'), page([encrypted('m1', NOW - 3)], 'cursor2')],
		});
		await limited.crawler.backfillRoomPage('room1');
		await expect(limited.crawler.backfillRoomPage('room1')).resolves.toMatchObject({ done: true });
		expect(limited.syncMessages.mock.calls.map(([query]) => query.count)).toEqual([2, 1]);
		const unlimited = setup({ pages: [page([encrypted('m', NOW - 1)], 'cursor')] });
		await expect(unlimited.crawler.backfillRoomPage('room1')).resolves.toMatchObject({ done: false });
	});

	it('does not save progress or consume the count when writes or state saves fail', async () => {
		const samePage = () => page([encrypted('m', NOW - 1)], `${NOW - 1}_m`);
		const { crawler, backend, writer, syncMessages } = setup({
			pages: [samePage(), samePage(), samePage()],
			maxBackfillMessagesPerRoom: 2,
		});
		jest.spyOn(writer, 'flush').mockRejectedValueOnce(new Error('flush failed'));
		await expect(crawler.backfillRoomPage('room1')).rejects.toThrow('flush failed');
		expect(await backend.getRoomState('room1')).toBeUndefined();
		jest.spyOn(backend, 'setRoomState').mockRejectedValueOnce(new Error('state failed'));
		await expect(crawler.backfillRoomPage('room1')).rejects.toThrow('state failed');
		await expect(crawler.backfillRoomPage('room1')).resolves.toEqual({ done: false, indexed: 1 });
		expect(syncMessages.mock.calls.map(([query]) => query.count)).toEqual([2, 2, 2]);
	});

	it('removes hidden deletion placeholders during backfill without decrypting them', async () => {
		const { crawler, backend, writer, decryptMessage } = setup({ pages: [page([encrypted('gone', NOW - 1, { t: 'rm' })])] });
		writer.index({ ...encrypted('gone', NOW - 2), e2e: 'done' });
		await writer.flush();
		crawler.addPendingDecrypt(encrypted('gone', NOW - 2));
		await expect(crawler.backfillRoomPage('room1')).resolves.toEqual({ done: true, indexed: 0 });
		expect(backend.documents.has('gone')).toBe(false);
		expect(crawler.getPendingDecrypt('room1')).toEqual([]);
		expect(decryptMessage).not.toHaveBeenCalled();
	});

	it('does not advance past a hidden deletion whose remove failed', async () => {
		const { crawler, backend } = setup({ pages: [page([encrypted('gone', NOW - 1, { t: 'rm' })])] });
		jest.spyOn(backend, 'remove').mockRejectedValueOnce(new Error('remove failed'));
		await expect(crawler.backfillRoomPage('room1')).rejects.toThrow('remove failed');
		expect(await backend.getRoomState('room1')).toBeUndefined();
	});

	it('does not count plain messages as indexed', async () => {
		const { crawler, backend } = setup({ pages: [page([encrypted('plain', NOW - 1, { t: undefined })])] });
		await expect(crawler.backfillRoomPage('room1')).resolves.toEqual({ done: true, indexed: 0 });
		expect(backend.documents.size).toBe(0);
	});

	it('waits for a missing key without advancing and retries when the key arrives', async () => {
		const samePage = () => page([encrypted('m', NOW - 1)]);
		const { crawler, backend, missing } = setup({ pages: [samePage(), samePage()] });
		missing.add('m');
		await expect(crawler.backfillRoomPage('room1', { waitForKey: true })).resolves.toEqual({
			done: false,
			indexed: 0,
			waitingForKey: true,
		});
		expect(await backend.getRoomState('room1')).toBeUndefined();
		expect(crawler.getPendingDecrypt('room1').map(({ _id }) => _id)).toEqual(['m']);
		missing.clear();
		await expect(crawler.backfillRoomPage('room1', { waitForKey: true })).resolves.toEqual({ done: true, indexed: 1 });
		expect(crawler.getPendingDecrypt('room1')).toEqual([]);
	});

	it('advances a partially decrypted page and keeps failed messages pending', async () => {
		const { crawler, backend, missing } = setup({ pages: [page([encrypted('good', NOW - 1), encrypted('bad', NOW - 2)])] });
		missing.add('bad');
		await expect(crawler.backfillRoomPage('room1', { waitForKey: true })).resolves.toEqual({ done: true, indexed: 1 });
		expect(backend.documents.has('good')).toBe(true);
		expect(crawler.getPendingDecrypt('room1').map(({ _id }) => _id)).toEqual(['bad']);
	});

	it('preserves newer pending versions added while the writer flushes', async () => {
		const { crawler, writer } = setup({ pages: [page([encrypted('m', NOW - 2)])] });
		jest.spyOn(writer, 'flush').mockImplementationOnce(async () => {
			crawler.addPendingDecrypt(encrypted('m', NOW - 1));
		});
		await crawler.backfillRoomPage('room1');
		expect(crawler.getPendingDecrypt('room1')[0]._updatedAt.getTime()).toBe(NOW - 1);
		writer.dispose();
	});

	it('keeps pending messages after a failed retry flush and drops them after success', async () => {
		const { crawler, writer, syncMessages } = setup();
		crawler.addPendingDecrypt(encrypted('m', NOW - 1));
		jest.spyOn(writer, 'flush').mockRejectedValueOnce(new Error('flush failed'));
		await expect(crawler.retryPendingDecrypt('room1')).rejects.toThrow('flush failed');
		expect(crawler.getPendingDecrypt('room1')).toHaveLength(1);
		await expect(crawler.retryPendingDecrypt('room1')).resolves.toEqual({ indexed: 1 });
		expect(crawler.getPendingDecrypt('room1')).toEqual([]);
		expect(syncMessages).not.toHaveBeenCalled();
	});

	it('caps pending messages across rooms and forgets only the requested room', () => {
		const { crawler } = setup({ maxPending: 2 });
		crawler.addPendingDecrypt(encrypted('a', NOW));
		crawler.addPendingDecrypt(encrypted('b', NOW, { rid: 'room2' }));
		crawler.addPendingDecrypt(encrypted('c', NOW));
		expect(crawler.getPendingDecrypt('room1').map(({ _id }) => _id)).toEqual(['c']);
		crawler.forgetRoom('room1');
		expect(crawler.getPendingDecrypt('room1')).toEqual([]);
		expect(crawler.getPendingDecrypt('room2').map(({ _id }) => _id)).toEqual(['b']);
	});

	it('keeps the default pending bound of 5000', () => {
		const { crawler } = setup();
		for (let i = 0; i < 5001; i++) crawler.addPendingDecrypt(encrypted(`m${i}`, NOW));
		expect(crawler.getPendingDecrypt('room1')).toHaveLength(5000);
		expect(crawler.getPendingDecrypt('room1')[0]._id).toBe('m1');
	});

	it('does nothing during catch-up before backfill has established a checkpoint', async () => {
		const { crawler, syncMessages } = setup();
		await expect(crawler.catchUpRoomPage('room1')).resolves.toEqual({ done: true, indexed: 0, removed: 0 });
		expect(syncMessages).not.toHaveBeenCalled();
	});

	it('replays the checkpoint millisecond, then pages deletions before advancing lastUpdate', async () => {
		const { crawler, backend, syncMessages } = setup({
			pages: [
				page([encrypted('same', NOW), encrypted('new', NOW + 1)], null, `${NOW + 1}_new`),
				page([], null, null),
				{ updated: [], deleted: [{ _id: 'same', _deletedAt: new Date(NOW + 100) }], cursor: { next: null, previous: null } },
			],
		});
		await backend.setRoomState('room1', { lastUpdate: NOW, backfillDone: true });
		await expect(crawler.catchUpRoomPage('room1')).resolves.toEqual({ done: false, indexed: 1, removed: 0 });
		expect((await backend.getRoomState('room1'))?.lastUpdate).toBe(NOW);
		await crawler.catchUpRoomPage('room1');
		await expect(crawler.catchUpRoomPage('room1')).resolves.toEqual({ done: true, indexed: 0, removed: 1 });
		expect(syncMessages.mock.calls.map(([query]) => [query.type, query.next])).toEqual([
			['UPDATED', `${NOW}_`],
			['UPDATED', `${NOW + 1}_new`],
			['DELETED', `${NOW}_`],
		]);
		expect((await backend.getRoomState('room1'))?.lastUpdate).toBe(NOW + 1);
		expect([...backend.documents.keys()]).toEqual(['new']);
	});

	it('retries the same catch-up cursor after sync, flush or deletion failure', async () => {
		const { crawler, backend, writer, syncMessages } = setup({
			pages: [
				page([encrypted('new', NOW + 1)]),
				page([encrypted('new', NOW + 1)]),
				{ updated: [], deleted: [{ _id: 'gone', _deletedAt: new Date(NOW + 2) }] },
				{ updated: [], deleted: [{ _id: 'gone', _deletedAt: new Date(NOW + 2) }] },
			],
		});
		await backend.setRoomState('room1', { lastUpdate: NOW, backfillDone: true });
		syncMessages.mockRejectedValueOnce(new Error('sync failed'));
		await expect(crawler.catchUpRoomPage('room1')).rejects.toThrow('sync failed');
		jest.spyOn(writer, 'flush').mockRejectedValueOnce(new Error('flush failed'));
		await expect(crawler.catchUpRoomPage('room1')).rejects.toThrow('flush failed');
		await crawler.catchUpRoomPage('room1');
		jest.spyOn(backend, 'remove').mockRejectedValueOnce(new Error('delete failed'));
		await expect(crawler.catchUpRoomPage('room1')).rejects.toThrow('delete failed');
		expect((await backend.getRoomState('room1'))?.lastUpdate).toBe(NOW);
		await crawler.catchUpRoomPage('room1');
		expect(syncMessages.mock.calls.slice(0, 3).every(([query]) => query.next === `${NOW}_`)).toBe(true);
		expect(syncMessages.mock.calls[3][0]).toEqual(syncMessages.mock.calls[4][0]);
		expect((await backend.getRoomState('room1'))?.lastUpdate).toBe(NOW + 1);
	});

	it('removes hidden rm updates and aged edits during catch-up', async () => {
		const { crawler, backend, writer } = setup({
			maxAgeMs: DAY,
			pages: [page([encrypted('hidden', NOW + 1, { t: 'rm' }), encrypted('aged', NOW + 2, { ts: new Date(NOW - 2 * DAY) })]), page()],
		});
		for (const id of ['hidden', 'aged']) writer.index({ ...encrypted(id, NOW - 1), e2e: 'done' });
		await writer.flush();
		await backend.setRoomState('room1', { lastUpdate: NOW, backfillDone: true });
		await catchUp(crawler);
		expect(backend.documents.size).toBe(0);
		writer.index({ ...encrypted('hidden', NOW + 3), e2e: 'done' });
		writer.index({ ...encrypted('aged', NOW + 3), e2e: 'done' });
		await writer.flush();
		expect([...backend.documents.keys()]).toEqual(['aged']);
	});

	it('keeps the catch-up cursor when every encrypted message waits for a key', async () => {
		const { crawler, backend, missing, syncMessages } = setup({
			pages: [page([encrypted('m', NOW + 1)]), page([encrypted('m', NOW + 1)])],
		});
		await backend.setRoomState('room1', { lastUpdate: NOW, backfillDone: true });
		missing.add('m');
		await expect(crawler.catchUpRoomPage('room1', { waitForKey: true })).resolves.toMatchObject({ waitingForKey: true });
		missing.clear();
		await crawler.catchUpRoomPage('room1', { waitForKey: true });
		expect(syncMessages.mock.calls[0][0]).toEqual(syncMessages.mock.calls[1][0]);
	});

	it.each([true, false])('preserves unique-timestamp history, concurrent writes and restarts with compound=%p', async (compoundCursors) => {
		const server = createSyncMessagesServerMock({ startAt: NOW, compoundCursors });
		for (let i = 0; i < 35; i++) server.addHistory(`m${i}`, 'room1', NOW - 100 + i);
		const { backend, writer, decryptMessage } = setup();
		const makeCrawler = () =>
			createSearchIndexCrawler({ backend, writer, decryptMessage, syncMessages: server.syncMessages, now: server.now, pageSize: 7 });
		let crawler = makeCrawler();
		await crawler.backfillRoomPage('room1');
		server.send('live', 'room1');
		server.edit('m3');
		server.remove('m10');
		crawler = makeCrawler();
		for (let i = 0; i < 20; i++) if ((await crawler.backfillRoomPage('room1')).done) break;
		await catchUp(crawler);
		expect(new Map([...backend.documents].map(([id, doc]) => [id, doc.updatedAt]))).toEqual(server.liveVersions('room1'));
		expect(server.calls.every((query) => !!query.next !== !!query.previous)).toBe(true);
	});

	it('visits 307 timestamp ties, including Unicode IDs, with opaque compound sync cursors', async () => {
		const server = createSyncMessagesServerMock({ startAt: NOW });
		for (let i = 0; i < 305; i++) server.addHistory(`m_${i}`, 'room1', NOW - 1);
		server.addHistory('\u{1F600}', 'room1', NOW - 1);
		server.addHistory(String.fromCodePoint(0xe000), 'room1', NOW - 1);
		const { backend, writer, decryptMessage } = setup();
		const crawler = createSearchIndexCrawler({ backend, writer, decryptMessage, syncMessages: server.syncMessages, now: server.now });
		for (let i = 0; i < 10; i++) if ((await crawler.backfillRoomPage('room1')).done) break;
		expect(backend.documents.size).toBe(307);
		expect(decryptMessage).toHaveBeenCalledTimes(307);
		expect(new Set(decryptMessage.mock.calls.map(([message]) => message._id)).size).toBe(307);
	});

	it.each(['a', 'z'])('finds an ID %s added inside the saved checkpoint millisecond', async (id) => {
		const server = createSyncMessagesServerMock({ startAt: NOW });
		server.sendInSameMillisecond('m', 'room1');
		server.advance(1);
		const { backend, writer, decryptMessage } = setup();
		const crawler = createSearchIndexCrawler({ backend, writer, decryptMessage, syncMessages: server.syncMessages, now: server.now });
		await crawler.backfillRoomPage('room1');
		server.advance(-1);
		server.sendInSameMillisecond(id, 'room1');
		await catchUp(crawler);
		expect([...backend.documents.keys()].sort()).toEqual(['m', id].sort());
	});
});
