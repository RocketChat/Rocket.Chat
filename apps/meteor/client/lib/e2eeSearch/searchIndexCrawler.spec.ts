import type { IMessage } from '@rocket.chat/core-typings';

import { createFakeSearchIndexBackend } from './fakeSearchIndexBackend';
import { createSearchIndexCrawler } from './searchIndexCrawler';
import type { SyncMessagesPage, SyncMessagesParams } from './searchIndexCrawler';

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

type SetupOptions = { pages?: SyncMessagesPage[]; maxAgeMs?: number; undecryptable?: Set<string> };

const setup = async ({ pages = [], maxAgeMs, undecryptable = new Set<string>() }: SetupOptions = {}) => {
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
	});

	return { backend, crawler, calls, decryptMessage, writer };
};

describe('createSearchIndexCrawler', () => {
	describe('backfillRoomPage', () => {
		it('asks for the newest page first, with a cursor at the start time', async () => {
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

			expect(calls).toEqual([{ roomId: 'room1', type: 'UPDATED', count: 2, previous: `${NOW}` }]);
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

			expect(calls[1]).toEqual({ roomId: 'room1', type: 'UPDATED', count: 2, previous: `${NOW - 2000}` });
			expect(result).toEqual({ done: true, indexed: 1 });
			expect(await backend.getRoomState('room1')).toMatchObject({ backfillDone: true });
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

		it('sets lastUpdate to the start time when the room has no messages, and marks it done', async () => {
			const { crawler, backend } = await setup({ pages: [{ updated: [], deleted: [], cursor: { next: null, previous: null } }] });

			const result = await crawler.backfillRoomPage('room1');

			expect(result).toEqual({ done: true, indexed: 0 });
			expect(await backend.getRoomState('room1')).toEqual({ lastUpdate: NOW, backfillDone: true });
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

			expect(await crawler.backfillRoomPage('room1')).toEqual({ done: true, indexed: 2 });
			expect(await backend.getRoomState('room1')).toMatchObject({ backfillDone: true });
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

	describe('catchUpRoom', () => {
		it('does nothing for a room that the backfill has not started', async () => {
			const { crawler, calls } = await setup();

			expect(await crawler.catchUpRoom('room1')).toEqual({ indexed: 0, removed: 0 });
			expect(calls).toHaveLength(0);
		});

		it('asks for the changes since lastUpdate, removes the deleted ids and indexes the updated messages', async () => {
			const { crawler, calls, backend, writer, decryptMessage } = await setup({
				pages: [
					{
						updated: [encrypted('m4', NOW + 5000)],
						deleted: [{ _id: 'm2', _deletedAt: new Date(NOW + 7000).toISOString() }],
					},
				],
			});
			await backend.setRoomState('room1', { lastUpdate: NOW, backfillCursor: 'c1', backfillDone: false });

			const result = await crawler.catchUpRoom('room1');

			expect(calls).toEqual([{ roomId: 'room1', lastUpdate: new Date(NOW).toISOString() }]);
			expect(writer.remove).toHaveBeenCalledWith(['m2']);
			expect(decryptMessage.mock.calls.map(([message]) => message._id)).toEqual(['m4']);
			expect(writer.flush).toHaveBeenCalled();
			expect(result).toEqual({ indexed: 1, removed: 1 });
			expect(await backend.getRoomState('room1')).toEqual({ lastUpdate: NOW + 7000, backfillCursor: 'c1', backfillDone: false });
		});

		it('keeps lastUpdate when nothing changed', async () => {
			const { crawler, backend } = await setup({ pages: [{ updated: [], deleted: [] }] });
			await backend.setRoomState('room1', { lastUpdate: NOW, backfillDone: true });

			await crawler.catchUpRoom('room1');

			expect(await backend.getRoomState('room1')).toEqual({ lastUpdate: NOW, backfillDone: true });
		});

		it('does not move lastUpdate when the server call fails, so the next catch-up asks again', async () => {
			const { crawler, backend } = await setup({ pages: [] });
			await backend.setRoomState('room1', { lastUpdate: NOW, backfillDone: true });

			await expect(crawler.catchUpRoom('room1')).rejects.toThrow();
			expect(await backend.getRoomState('room1')).toEqual({ lastUpdate: NOW, backfillDone: true });
		});
	});
});
