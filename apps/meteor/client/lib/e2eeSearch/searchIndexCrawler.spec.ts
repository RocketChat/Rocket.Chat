import type { IMessage } from '@rocket.chat/core-typings';

import { createFakeSearchIndexBackend } from './fakeSearchIndexBackend';
import { createSearchIndexCrawler } from './searchIndexCrawler';
import type { SyncMessagesPage, SyncMessagesParams } from './searchIndexCrawler';
import { createSyncMessagesServerMock } from '../../../tests/mocks/client/syncMessagesServerMock';
import type { SyncMessagesServerMock } from '../../../tests/mocks/client/syncMessagesServerMock';

const NOW = Date.parse('2026-10-26T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

const encrypted = (id: string, updatedAt: number, overrides: Partial<IMessage> = {}): IMessage =>
	({
		_id: id,
		rid: 'room1',
		t: 'e2e',
		e2e: 'pending',
		msg: `ciphertext ${id}`,
		u: { _id: 'u1', username: 'alice' },
		ts: new Date(updatedAt),
		_updatedAt: new Date(updatedAt),
		...overrides,
	}) as IMessage;

type SetupOptions = {
	pages?: SyncMessagesPage[];
	maxAgeMs?: number;
	undecryptable?: Set<string>;
	maxPending?: number;
	maxBackfillMessagesPerRoom?: number;
};

const setup = async ({
	pages = [],
	maxAgeMs,
	undecryptable = new Set<string>(),
	maxPending,
	maxBackfillMessagesPerRoom,
}: SetupOptions = {}) => {
	const backend = createFakeSearchIndexBackend();
	await backend.open({ userId: 'u1' });

	const calls: SyncMessagesParams[] = [];
	const syncMessages = jest.fn(async (params: SyncMessagesParams) => {
		calls.push(params);
		const page = pages.shift();
		if (!page) throw new Error('no more pages');
		return page;
	});
	const decryptMessage = jest.fn(async (message: IMessage) =>
		undecryptable.has(message._id) ? message : ({ ...message, e2e: 'done' } as IMessage),
	);
	const writer = { remove: jest.fn(async (_ids: string[]) => undefined), flush: jest.fn(async () => undefined) };

	const crawler = createSearchIndexCrawler({
		backend,
		syncMessages,
		decryptMessage,
		writer,
		now: () => NOW,
		pageSize: 2,
		maxAgeMs,
		maxPending,
		maxBackfillMessagesPerRoom,
	});

	return { backend, crawler, calls, decryptMessage, writer, undecryptable };
};

describe('createSearchIndexCrawler', () => {
	describe('backfillRoomPage', () => {
		it('asks for the newest page first, with a compound cursor at the start time', async () => {
			const { crawler, calls } = await setup({
				pages: [
					{
						updated: [encrypted('m3', NOW - 1000), encrypted('m2', NOW - 2000)],
						deleted: [],
						cursor: { next: null, previous: `${NOW - 2000}` },
					},
				],
			});

			await crawler.backfillRoomPage('room1');

			expect(calls).toEqual([{ roomId: 'room1', type: 'UPDATED', count: 2, previous: `${NOW}_` }]);
		});

		it('decrypts each message of the page through the E2E path, then flushes the writer', async () => {
			const { crawler, decryptMessage, writer } = await setup({
				pages: [
					{
						updated: [encrypted('m3', NOW - 1000), encrypted('m2', NOW - 2000)],
						deleted: [],
						cursor: { next: null, previous: `${NOW - 2000}` },
					},
				],
			});

			const result = await crawler.backfillRoomPage('room1');

			expect(decryptMessage.mock.calls.map(([message]) => message._id)).toEqual(['m3', 'm2']);
			expect(writer.flush).toHaveBeenCalledTimes(1);
			expect(result).toEqual({ done: false, indexed: 2 });
		});

		it('saves the cursor after each page, and the next page starts from it (a restart resumes there)', async () => {
			const { crawler, calls, backend } = await setup({
				pages: [
					{
						updated: [encrypted('m3', NOW - 1000), encrypted('m2', NOW - 2000)],
						deleted: [],
						cursor: { next: null, previous: `${NOW - 2000}` },
					},
					{ updated: [encrypted('m1', NOW - 3000)], deleted: [], cursor: { next: null, previous: null } },
				],
			});

			await crawler.backfillRoomPage('room1');
			expect(await backend.getRoomState('room1')).toMatchObject({ backfillCursor: `${NOW - 2000}`, backfillDone: false });

			const result = await crawler.backfillRoomPage('room1');

			expect(calls[1]).toEqual({ roomId: 'room1', type: 'UPDATED', count: 2, previous: `${NOW - 2000}_` });
			expect(result).toEqual({ done: true, indexed: 1 });
			expect(await backend.getRoomState('room1')).toMatchObject({ backfillDone: true });
		});

		it('saves the compound cursor that the server returns as it is, and sends it back unchanged', async () => {
			const { crawler, calls, backend } = await setup({
				pages: [
					{
						updated: [encrypted('m3', NOW - 1000), encrypted('m2', NOW - 2000)],
						deleted: [],
						cursor: { next: `${NOW - 1000}_m3`, previous: `${NOW - 2000}_m2` },
					},
					{ updated: [encrypted('m1', NOW - 2000)], deleted: [], cursor: { next: null, previous: null } },
				],
			});

			await crawler.backfillRoomPage('room1');
			expect(await backend.getRoomState('room1')).toMatchObject({ backfillCursor: `${NOW - 2000}_m2`, backfillDone: false });

			await crawler.backfillRoomPage('room1');
			expect(calls[1]).toEqual({ roomId: 'room1', type: 'UPDATED', count: 2, previous: `${NOW - 2000}_m2` });
		});

		it.each([
			['a string', `${NOW - 2000}`],
			['a number', NOW - 2000],
		])('continues from a saved cursor of the old format (%s), with the same time as a compound cursor', async (_label, saved) => {
			const { crawler, calls, backend } = await setup({
				pages: [{ updated: [encrypted('m1', NOW - 3000)], deleted: [], cursor: { next: null, previous: null } }],
			});
			await backend.setRoomState('room1', { lastUpdate: NOW - 1000, backfillCursor: saved as string, backfillDone: false });

			expect(await crawler.backfillRoomPage('room1')).toEqual({ done: true, indexed: 1 });
			expect(calls).toEqual([{ roomId: 'room1', type: 'UPDATED', count: 2, previous: `${NOW - 2000}_` }]);
		});

		it('sets lastUpdate from the newest message of the first page, so the catch-up starts where the backfill started', async () => {
			const { crawler, backend } = await setup({
				pages: [
					{
						updated: [encrypted('m3', NOW - 1000), encrypted('m2', NOW - 2000)],
						deleted: [],
						cursor: { next: null, previous: `${NOW - 2000}` },
					},
				],
			});

			await crawler.backfillRoomPage('room1');

			expect((await backend.getRoomState('room1'))?.lastUpdate).toBe(NOW - 1000);
		});

		it('sets lastUpdate to 0 when the room has no messages, so the catch-up does not depend on the client clock', async () => {
			const { crawler, backend } = await setup({ pages: [{ updated: [], deleted: [], cursor: { next: null, previous: null } }] });

			const result = await crawler.backfillRoomPage('room1');

			expect(result).toEqual({ done: true, indexed: 0 });
			expect(await backend.getRoomState('room1')).toEqual({ lastUpdate: 0, backfillDone: true });
		});

		it('does not call the server for a room whose backfill is done', async () => {
			const { crawler, calls, backend } = await setup();
			await backend.setRoomState('room1', { lastUpdate: NOW, backfillDone: true });

			expect(await crawler.backfillRoomPage('room1')).toEqual({ done: true, indexed: 0 });
			expect(calls).toHaveLength(0);
		});

		it('stops at the depth limit', async () => {
			const { crawler, backend } = await setup({
				maxAgeMs: 30 * DAY,
				pages: [
					{
						updated: [encrypted('m2', NOW - 10 * DAY), encrypted('m1', NOW - 40 * DAY)],
						deleted: [],
						cursor: { next: null, previous: `${NOW - 40 * DAY}` },
					},
				],
			});

			expect(await crawler.backfillRoomPage('room1')).toEqual({ done: true, indexed: 1 });
			expect(await backend.getRoomState('room1')).toMatchObject({ backfillDone: true });
		});

		it('stops the backfill of a room at the message limit, and asks only for the messages left under it', async () => {
			const { crawler, calls, backend } = await setup({
				maxBackfillMessagesPerRoom: 3,
				pages: [
					{
						updated: [encrypted('m4', NOW - 1000), encrypted('m3', NOW - 2000)],
						deleted: [],
						cursor: { next: null, previous: `${NOW - 2000}` },
					},
					{ updated: [encrypted('m2', NOW - 3000)], deleted: [], cursor: { next: null, previous: `${NOW - 3000}` } },
					{ updated: [encrypted('m5', NOW + 1000)], deleted: [], cursor: { next: null, previous: null } },
				],
			});

			expect(await crawler.backfillRoomPage('room1')).toEqual({ done: false, indexed: 2 });
			expect(await crawler.backfillRoomPage('room1')).toEqual({ done: true, indexed: 1 });
			expect(await crawler.backfillRoomPage('room1')).toEqual({ done: true, indexed: 0 });
			expect(await backend.getRoomState('room1')).toMatchObject({ backfillDone: true });

			// The catch-up of new messages has no limit: it asks for full pages.
			await crawler.catchUpRoomPage('room1');
			expect(calls.map(({ type, count }) => [type, count])).toEqual([
				['UPDATED', 2],
				['UPDATED', 1],
				['UPDATED', 2],
			]);
		});

		it('has no message limit by default', async () => {
			const { crawler, calls } = await setup({
				pages: [
					{
						updated: [encrypted('m4', NOW - 1000), encrypted('m3', NOW - 2000)],
						deleted: [],
						cursor: { next: null, previous: `${NOW - 2000}` },
					},
					{
						updated: [encrypted('m2', NOW - 3000), encrypted('m1', NOW - 4000)],
						deleted: [],
						cursor: { next: null, previous: `${NOW - 4000}` },
					},
				],
			});

			expect(await crawler.backfillRoomPage('room1')).toEqual({ done: false, indexed: 2 });
			expect(await crawler.backfillRoomPage('room1')).toEqual({ done: false, indexed: 2 });
			expect(calls.map(({ count }) => count)).toEqual([2, 2]);
		});

		it('applies the depth limit to the send time: an old message edited recently is not indexed', async () => {
			const { crawler, decryptMessage } = await setup({
				maxAgeMs: 30 * DAY,
				pages: [
					{
						updated: [encrypted('old-edited', NOW - 1000, { ts: new Date(NOW - 400 * DAY) }), encrypted('recent', NOW - 2000)],
						deleted: [],
						cursor: { next: null, previous: `${NOW - 2000}` },
					},
				],
			});

			expect(await crawler.backfillRoomPage('room1')).toEqual({ done: false, indexed: 1 });
			expect(decryptMessage.mock.calls.map(([message]) => message._id)).toEqual(['recent']);
		});

		it('keeps a message that it cannot decrypt (missing room key) in the pending set of its room', async () => {
			const { crawler } = await setup({
				undecryptable: new Set(['m2']),
				pages: [
					{
						updated: [encrypted('m3', NOW - 1000), encrypted('m2', NOW - 2000)],
						deleted: [],
						cursor: { next: null, previous: `${NOW - 2000}` },
					},
				],
			});

			const result = await crawler.backfillRoomPage('room1');

			expect(result).toEqual({ done: false, indexed: 1 });
			expect(crawler.getPendingDecrypt('room1').map((message) => message._id)).toEqual(['m2']);
		});

		it('does not count a plain (not encrypted) message as indexed', async () => {
			const { crawler } = await setup({
				pages: [
					{
						updated: [encrypted('m3', NOW - 1000), encrypted('sys', NOW - 2000, { t: 'uj', msg: 'alice' })],
						deleted: [],
						cursor: { next: null, previous: `${NOW - 2000}` },
					},
				],
			});

			expect(await crawler.backfillRoomPage('room1')).toEqual({ done: false, indexed: 1 });
			expect(crawler.getPendingDecrypt('room1')).toEqual([]);
		});
	});

	describe('catchUpRoomPage', () => {
		const noMore = { next: null, previous: null };

		it('does nothing for a room that the backfill has not started', async () => {
			const { crawler, calls } = await setup();

			expect(await crawler.catchUpRoomPage('room1')).toEqual({ done: true, indexed: 0, removed: 0 });
			expect(calls).toHaveLength(0);
		});

		it('pages the updated messages from the start of the lastUpdate millisecond, then the deleted ones', async () => {
			const { crawler, calls, backend, writer, decryptMessage } = await setup({
				pages: [
					{ updated: [encrypted('m4', NOW + 5000)], deleted: [], cursor: noMore },
					{ updated: [], deleted: [{ _id: 'm2', _deletedAt: new Date(NOW + 7000).toISOString() }], cursor: noMore },
				],
			});
			await backend.setRoomState('room1', { lastUpdate: NOW, backfillCursor: 'c1', backfillDone: false });

			expect(await crawler.catchUpRoomPage('room1')).toEqual({ done: false, indexed: 1, removed: 0 });
			expect(await crawler.catchUpRoomPage('room1')).toEqual({ done: true, indexed: 0, removed: 1 });

			expect(calls).toEqual([
				{ roomId: 'room1', type: 'UPDATED', count: 2, next: `${NOW}_` },
				{ roomId: 'room1', type: 'DELETED', count: 2, next: `${NOW}_` },
			]);
			expect(decryptMessage.mock.calls.map(([message]) => message._id)).toEqual(['m4']);
			expect(writer.flush).toHaveBeenCalled();
			expect(writer.remove).toHaveBeenCalledWith(['m2']);
		});

		it('moves lastUpdate to the newest update only after the last page, and keeps the backfill state', async () => {
			const { crawler, backend } = await setup({
				pages: [
					{ updated: [encrypted('m4', NOW + 5000)], deleted: [], cursor: noMore },
					{ updated: [], deleted: [{ _id: 'm2', _deletedAt: new Date(NOW + 7000).toISOString() }], cursor: noMore },
				],
			});
			await backend.setRoomState('room1', { lastUpdate: NOW, backfillCursor: 'c1', backfillDone: false });

			await crawler.catchUpRoomPage('room1');
			expect((await backend.getRoomState('room1'))?.lastUpdate).toBe(NOW);

			await crawler.catchUpRoomPage('room1');
			expect(await backend.getRoomState('room1')).toEqual({ lastUpdate: NOW + 5000, backfillCursor: 'c1', backfillDone: false });
		});

		it('follows the next cursor that the server returns, as it is, until the server returns none', async () => {
			const { crawler, calls, backend } = await setup({
				pages: [
					{
						updated: [encrypted('m4', NOW + 1000), encrypted('m5', NOW + 2000)],
						deleted: [],
						cursor: { next: `${NOW + 2000}`, previous: `${NOW + 1000}` },
					},
					{ updated: [encrypted('m6', NOW + 3000)], deleted: [], cursor: noMore },
					{ updated: [], deleted: [], cursor: noMore },
				],
			});
			await backend.setRoomState('room1', { lastUpdate: NOW, backfillDone: true });

			await crawler.catchUpRoomPage('room1');
			await crawler.catchUpRoomPage('room1');
			expect(await crawler.catchUpRoomPage('room1')).toEqual({ done: true, indexed: 0, removed: 0 });

			expect(calls[1]).toEqual({ roomId: 'room1', type: 'UPDATED', count: 2, next: `${NOW + 2000}` });
			expect((await backend.getRoomState('room1'))?.lastUpdate).toBe(NOW + 3000);
		});

		it('keeps lastUpdate when nothing changed', async () => {
			const { crawler, backend } = await setup({
				pages: [
					{ updated: [], deleted: [], cursor: noMore },
					{ updated: [], deleted: [], cursor: noMore },
				],
			});
			await backend.setRoomState('room1', { lastUpdate: NOW, backfillDone: true });

			await crawler.catchUpRoomPage('room1');
			await crawler.catchUpRoomPage('room1');

			expect(await backend.getRoomState('room1')).toEqual({ lastUpdate: NOW, backfillDone: true });
		});

		it('does not move lastUpdate when the server call fails, so the next catch-up asks again', async () => {
			const { crawler, backend } = await setup({ pages: [] });
			await backend.setRoomState('room1', { lastUpdate: NOW, backfillDone: true });

			await expect(crawler.catchUpRoomPage('room1')).rejects.toThrow();
			expect(await backend.getRoomState('room1')).toEqual({ lastUpdate: NOW, backfillDone: true });
		});
	});

	describe('retryPendingDecrypt', () => {
		it('indexes the pending messages of the room when its key arrives, with no server call', async () => {
			const undecryptable = new Set(['m2']);
			const { crawler, calls, decryptMessage, writer } = await setup({
				undecryptable,
				pages: [
					{
						updated: [encrypted('m3', NOW - 1000), encrypted('m2', NOW - 2000)],
						deleted: [],
						cursor: { next: null, previous: `${NOW - 2000}` },
					},
				],
			});
			await crawler.backfillRoomPage('room1');
			undecryptable.clear();
			decryptMessage.mockClear();
			writer.flush.mockClear();

			expect(await crawler.retryPendingDecrypt('room1')).toEqual({ indexed: 1 });

			expect(calls).toHaveLength(1);
			expect(decryptMessage.mock.calls.map(([message]) => message._id)).toEqual(['m2']);
			expect(writer.flush).toHaveBeenCalledTimes(1);
			expect(crawler.getPendingDecrypt('room1')).toEqual([]);
		});

		it('keeps a message pending while its key is still missing', async () => {
			const { crawler } = await setup({
				undecryptable: new Set(['m2']),
				pages: [{ updated: [encrypted('m2', NOW - 2000)], deleted: [], cursor: { next: null, previous: null } }],
			});
			await crawler.backfillRoomPage('room1');

			expect(await crawler.retryPendingDecrypt('room1')).toEqual({ indexed: 0 });
			expect(crawler.getPendingDecrypt('room1').map((message) => message._id)).toEqual(['m2']);
		});

		it('keeps a message pending when the client decrypt reports a missing room key, and indexes it when the key arrives', async () => {
			const { crawler, decryptMessage } = await setup({
				pages: [{ updated: [encrypted('m2', NOW - 2000)], deleted: [], cursor: { next: null, previous: null } }],
			});
			// The client decrypt sets e2e 'done' even when the key is missing; the flag tells the two cases apart.
			decryptMessage.mockImplementation(
				async (message: IMessage) => ({ ...message, msg: 'placeholder', e2e: 'done', decryptFailed: true }) as IMessage,
			);
			await crawler.backfillRoomPage('room1');
			expect(crawler.getPendingDecrypt('room1').map((message) => message._id)).toEqual(['m2']);

			decryptMessage.mockImplementation(async (message: IMessage) => ({ ...message, e2e: 'done' }) as IMessage);
			expect(await crawler.retryPendingDecrypt('room1')).toEqual({ indexed: 1 });
			expect(crawler.getPendingDecrypt('room1')).toEqual([]);
		});
	});

	describe('addPendingDecrypt', () => {
		it('caps the pending set and drops the oldest entries first, so messages that never decrypt cannot grow memory without limit', async () => {
			const { crawler } = await setup({ maxPending: 3 });

			for (let i = 1; i <= 5; i++) crawler.addPendingDecrypt(encrypted(`m${i}`, NOW - 1000));

			expect(crawler.getPendingDecrypt('room1').map((message) => message._id)).toEqual(['m3', 'm4', 'm5']);
		});

		it('counts the cap across rooms', async () => {
			const { crawler } = await setup({ maxPending: 2 });

			crawler.addPendingDecrypt(encrypted('a1', NOW - 1000, { rid: 'roomA' }));
			crawler.addPendingDecrypt(encrypted('b1', NOW - 1000, { rid: 'roomB' }));
			crawler.addPendingDecrypt(encrypted('b2', NOW - 1000, { rid: 'roomB' }));

			expect(crawler.getPendingDecrypt('roomA')).toEqual([]);
			expect(crawler.getPendingDecrypt('roomB').map((message) => message._id)).toEqual(['b1', 'b2']);
		});

		it('keeps at most 5000 pending messages by default, across rooms, when 6000 never decrypt in a backfill', async () => {
			// 60 pages of 100 messages in two rooms, newest first, as a backfill of a room whose old key is lost.
			const pageOf = (rid: string, start: number) => ({
				updated: Array.from({ length: 100 }, (_, i) => encrypted(`${rid}-${start + i}`, NOW - (start + i) * 1000, { rid })),
				deleted: [],
				cursor: { next: null, previous: `${NOW - (start + 99) * 1000}` },
			});
			const pages = [
				...Array.from({ length: 30 }, (_, p) => pageOf('roomA', p * 100)),
				...Array.from({ length: 30 }, (_, p) => pageOf('roomB', p * 100)),
			];
			const undecryptable = new Set(pages.flatMap((page) => page.updated.map((message) => message._id)));
			const { crawler } = await setup({ pages, undecryptable });

			for (let p = 0; p < 30; p++) await crawler.backfillRoomPage('roomA');
			for (let p = 0; p < 30; p++) await crawler.backfillRoomPage('roomB');

			const pendingA = crawler.getPendingDecrypt('roomA').map((message) => message._id);
			const pendingB = crawler.getPendingDecrypt('roomB').map((message) => message._id);
			expect(pendingA.length + pendingB.length).toBe(5000);
			// The first 1000 kept (the newest of roomA) are dropped first.
			expect(pendingA).toHaveLength(2000);
			expect(pendingA[0]).toBe('roomA-1000');
			expect(pendingB).toHaveLength(3000);
			expect(pendingB.at(-1)).toBe('roomB-2999');
		});

		it('indexes a message added after the drop when its key arrives', async () => {
			const { crawler } = await setup({ maxPending: 2 });
			for (let i = 1; i <= 4; i++) crawler.addPendingDecrypt(encrypted(`m${i}`, NOW - 1000));

			expect(await crawler.retryPendingDecrypt('room1')).toEqual({ indexed: 2 });
			expect(crawler.getPendingDecrypt('room1')).toEqual([]);
		});

		it('keeps a live message that failed to decrypt pending in its room, and indexes it when the key arrives', async () => {
			const { crawler, calls, decryptMessage } = await setup();

			crawler.addPendingDecrypt(encrypted('m5', NOW - 1000));

			expect(crawler.getPendingDecrypt('room1').map((message) => message._id)).toEqual(['m5']);
			expect(await crawler.retryPendingDecrypt('room1')).toEqual({ indexed: 1 });
			expect(decryptMessage.mock.calls.map(([message]) => message._id)).toEqual(['m5']);
			expect(calls).toHaveLength(0);
			expect(crawler.getPendingDecrypt('room1')).toEqual([]);
		});
	});

	describe('forgetRoom', () => {
		it('drops the pending messages of the room', async () => {
			const { crawler } = await setup({
				undecryptable: new Set(['m2']),
				pages: [{ updated: [encrypted('m2', NOW - 2000)], deleted: [], cursor: { next: null, previous: null } }],
			});
			await crawler.backfillRoomPage('room1');

			crawler.forgetRoom('room1');

			expect(crawler.getPendingDecrypt('room1')).toEqual([]);
		});
	});

	describe.each([
		['a server with compound cursors', true],
		['an older server with time-only cursors', false],
	])('against the chat.syncMessages paging rules of %s', (_server, compoundCursors) => {
		const MINUTE = 60 * 1000;
		const ROOM = 'room1';

		const untilDone = async (step: () => Promise<{ done: boolean }>) => {
			for (let i = 0; i < 100; i++) {
				if ((await step()).done) return;
			}
			throw new Error('the crawler did not finish');
		};

		const crawlAgainst = async (server: SyncMessagesServerMock, clientClockOffsetMs: number) => {
			const backend = createFakeSearchIndexBackend();
			await backend.open({ userId: 'u1' });

			const indexed = new Map<string, number>();
			const crawler = createSearchIndexCrawler({
				backend,
				syncMessages: (params) => server.syncMessages(params),
				decryptMessage: async (message) => {
					indexed.set(message._id, new Date(message._updatedAt).getTime());
					return { ...message, e2e: 'done' } as IMessage;
				},
				writer: {
					remove: async (ids) => {
						ids.forEach((id) => indexed.delete(id));
					},
					flush: async () => undefined,
				},
				now: () => server.now() + clientClockOffsetMs,
				pageSize: 100,
			});

			return { crawler, indexed };
		};

		const withHistory = () => {
			const server = createSyncMessagesServerMock({ startAt: NOW, compoundCursors });
			for (let i = 0; i < 250; i++) server.addHistory(`h${i}`, ROOM, NOW - 30 * DAY + i * 60 * MINUTE);
			// Sent less than 10 minutes ago: newer than a client clock that is 10 minutes behind.
			for (let i = 0; i < 5; i++) server.addHistory(`recent${i}`, ROOM, NOW - 5 * MINUTE + i * 1000);
			return server;
		};

		describe.each([
			['10 minutes ahead', 10 * MINUTE],
			['10 minutes behind', -10 * MINUTE],
		])('first backfill with the client clock %s', (_label, offset) => {
			it('loses 0 messages, also the ones sent, edited and deleted while it runs', async () => {
				const server = withHistory();
				const { crawler, indexed } = await crawlAgainst(server, offset);

				await crawler.backfillRoomPage(ROOM);
				server.advance(MINUTE);
				server.send('during1', ROOM);
				server.edit('h10');
				server.remove('h20');
				await untilDone(() => crawler.backfillRoomPage(ROOM));

				server.advance(MINUTE);
				server.send('after1', ROOM);
				server.edit('h30');
				server.remove('during1');
				await untilDone(() => crawler.catchUpRoomPage(ROOM));

				expect(indexed).toEqual(server.liveVersions(ROOM));
			});

			it('loses 0 messages of a room that was empty at the first backfill', async () => {
				const server = createSyncMessagesServerMock({ startAt: NOW, compoundCursors });
				const { crawler, indexed } = await crawlAgainst(server, offset);

				await untilDone(() => crawler.backfillRoomPage(ROOM));
				server.advance(MINUTE);
				server.send('first', ROOM);
				await untilDone(() => crawler.catchUpRoomPage(ROOM));

				expect(indexed).toEqual(server.liveVersions(ROOM));
			});
		});

		it('keeps a message sent after the catch-up read the updates and before it read a later delete', async () => {
			const server = withHistory();
			const { crawler, indexed } = await crawlAgainst(server, 0);
			await untilDone(() => crawler.backfillRoomPage(ROOM));

			server.advance(MINUTE);
			await crawler.catchUpRoomPage(ROOM);
			server.send('late', ROOM);
			server.remove('h1');
			await untilDone(() => crawler.catchUpRoomPage(ROOM));
			await untilDone(() => crawler.catchUpRoomPage(ROOM));

			expect(indexed).toEqual(server.liveVersions(ROOM));
		});

		it('never sends a sync call without a cursor, also for a catch-up that spans many pages', async () => {
			const server = withHistory();
			const { crawler, indexed } = await crawlAgainst(server, 0);

			await untilDone(() => crawler.backfillRoomPage(ROOM));
			server.advance(DAY);
			for (let i = 0; i < 250; i++) server.send(`offline${i}`, ROOM);
			for (let i = 0; i < 150; i++) server.remove(`h${i}`);
			await untilDone(() => crawler.catchUpRoomPage(ROOM));

			expect(indexed).toEqual(server.liveVersions(ROOM));
			expect(server.calls.length).toBeGreaterThan(6);
			for (const call of server.calls) {
				expect(call).not.toHaveProperty('lastUpdate');
				expect(Boolean(call.next) !== Boolean(call.previous)).toBe(true);
				expect(call.count).toBe(100);
			}
		});
	});

	describe('against a server with compound cursors, with messages that share one millisecond', () => {
		const ROOM = 'room1';

		const untilDone = async (step: () => Promise<{ done: boolean }>) => {
			for (let i = 0; i < 100; i++) {
				if ((await step()).done) return;
			}
			throw new Error('the crawler did not finish');
		};

		const untilDoneCounting = async (step: () => Promise<{ done: boolean; indexed: number }>) => {
			let indexed = 0;
			for (let i = 0; i < 100; i++) {
				const result = await step();
				indexed += result.indexed;
				if (result.done) return indexed;
			}
			throw new Error('the crawler did not finish');
		};

		const crawlAgainst = async (server: SyncMessagesServerMock, { maxAgeMs }: { maxAgeMs?: number } = {}) => {
			const backend = createFakeSearchIndexBackend();
			await backend.open({ userId: 'u1' });

			const indexed = new Map<string, number>();
			const removedFromIndex: { ids: string[]; options?: { deleted?: boolean } }[] = [];
			const crawler = createSearchIndexCrawler({
				backend,
				syncMessages: (params) => server.syncMessages(params),
				decryptMessage: async (message) => {
					indexed.set(message._id, new Date(message._updatedAt).getTime());
					return { ...message, e2e: 'done' } as IMessage;
				},
				writer: {
					remove: async (ids, options) => {
						removedFromIndex.push({ ids, ...(options && { options }) });
						ids.forEach((id) => indexed.delete(id));
					},
					flush: async () => undefined,
				},
				now: () => server.now(),
				pageSize: 100,
				maxAgeMs,
			});

			return { backend, crawler, indexed, removedFromIndex };
		};

		it('loses 0 messages when a page boundary falls inside one millisecond', async () => {
			const server = createSyncMessagesServerMock({ startAt: NOW });
			for (let i = 0; i < 250; i++) server.addHistory(`same${String(i).padStart(3, '0')}`, ROOM, NOW - DAY);
			const { crawler, indexed } = await crawlAgainst(server);

			await untilDone(() => crawler.backfillRoomPage(ROOM));
			server.advance(1000);
			server.send('after', ROOM);
			for (let i = 0; i < 250; i++) server.sendInSameMillisecond(`burst${String(i).padStart(3, '0')}`, ROOM);
			await untilDone(() => crawler.catchUpRoomPage(ROOM));

			expect(indexed).toEqual(server.liveVersions(ROOM));
			expect(server.calls.slice(1).every((call) => (call.next ?? call.previous)?.includes('_'))).toBe(true);
		});

		it('starts the catch-up at the start of the lastUpdate millisecond, and does not count its messages as new', async () => {
			const server = createSyncMessagesServerMock({ startAt: NOW });
			server.addHistory('a', ROOM, NOW - DAY);
			server.addHistory('b', ROOM, NOW - DAY);
			const { crawler, indexed } = await crawlAgainst(server);
			await untilDone(() => crawler.backfillRoomPage(ROOM));

			server.advance(1000);
			const first = await untilDoneCounting(() => crawler.catchUpRoomPage(ROOM));
			const second = await untilDoneCounting(() => crawler.catchUpRoomPage(ROOM));

			const catchUpCalls = server.calls.filter((call) => call.next);
			expect(catchUpCalls.slice(0, 2).map(({ type, next }) => ({ type, next }))).toEqual([
				{ type: 'UPDATED', next: `${NOW - DAY}_` },
				{ type: 'DELETED', next: `${NOW - DAY}_` },
			]);
			expect([first, second]).toEqual([0, 0]);
			expect(indexed).toEqual(server.liveVersions(ROOM));
		});

		for (const [order, id] of [
			['before', 'a0'],
			['after', 'zz'],
		] as const) {
			it(`indexes a message written in the lastUpdate millisecond after the catch-up read it, when its _id sorts ${order} the read one`, async () => {
				const server = createSyncMessagesServerMock({ startAt: NOW });
				server.addHistory('h1', ROOM, NOW - DAY);
				const { crawler, indexed } = await crawlAgainst(server);
				await untilDone(() => crawler.backfillRoomPage(ROOM));

				server.advance(1000);
				server.send('m1', ROOM);
				await untilDone(() => crawler.catchUpRoomPage(ROOM));
				server.sendInSameMillisecond(id, ROOM);
				await untilDone(() => crawler.catchUpRoomPage(ROOM));

				expect(indexed.get(id)).toBe(server.now());
				expect(indexed).toEqual(server.liveVersions(ROOM));
			});
		}

		it('does not index an old message whose edit is lastUpdate when the depth limit excludes it', async () => {
			const server = createSyncMessagesServerMock({ startAt: NOW });
			server.addHistory('old', ROOM, NOW - 10 * DAY);
			server.addHistory('recent', ROOM, NOW - DAY);
			server.edit('old');
			server.advance(1000);
			const { backend, crawler, indexed } = await crawlAgainst(server, { maxAgeMs: 5 * DAY });
			await untilDone(() => crawler.backfillRoomPage(ROOM));
			expect((await backend.getRoomState(ROOM))?.lastUpdate).toBe(server.liveVersions(ROOM).get('old'));

			server.advance(1000);
			await untilDone(() => crawler.catchUpRoomPage(ROOM));

			expect([...indexed.keys()]).toEqual(['recent']);
		});

		it('removes a message from the index when its edit arrives after the message passed the depth limit', async () => {
			const server = createSyncMessagesServerMock({ startAt: NOW });
			server.addHistory('aging', ROOM, NOW - DAY);
			const { crawler, indexed, removedFromIndex } = await crawlAgainst(server, { maxAgeMs: 5 * DAY });
			await untilDone(() => crawler.backfillRoomPage(ROOM));
			expect(indexed.has('aging')).toBe(true);

			server.advance(10 * DAY);
			server.edit('aging');
			await untilDone(() => crawler.catchUpRoomPage(ROOM));

			expect(indexed.has('aging')).toBe(false);
			expect(removedFromIndex).toEqual([{ ids: ['aging'], options: { deleted: false } }]);
		});

		it('continues a backfill from a saved cursor of the old format and loses 0 messages', async () => {
			const server = createSyncMessagesServerMock({ startAt: NOW });
			for (let i = 0; i < 250; i++) server.addHistory(`h${String(i).padStart(3, '0')}`, ROOM, NOW - DAY - (i % 50));
			const { backend, crawler, indexed } = await crawlAgainst(server);
			// A page from before compound cursors indexed the messages from NOW - DAY - 9 on and saved a bare time.
			await backend.setRoomState(ROOM, { lastUpdate: NOW - DAY, backfillCursor: `${NOW - DAY - 9}`, backfillDone: false });
			for (const [id, at] of server.liveVersions(ROOM)) if (at >= NOW - DAY - 9) indexed.set(id, at);

			await untilDone(() => crawler.backfillRoomPage(ROOM));

			expect(indexed).toEqual(server.liveVersions(ROOM));
			expect(server.calls[0].previous).toBe(`${NOW - DAY - 9}_`);
		});
	});
});
