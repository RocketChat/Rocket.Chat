import { Buffer } from 'node:buffer';

import { E2EE_SEARCH_LIMITS } from '@rocket.chat/desktop-api';
import type { E2EESearchHit, E2EESearchOpenResult, E2EESearchRecentQuery, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { MAX_LOCAL_SEARCH_LIMIT, searchLocalIndex } from './searchLocalIndex';

const openResult: E2EESearchOpenResult = {
	schemaVersion: 1,
	encryptedAtRest: true,
	capabilities: { recentCursor: 1, lifecycleEvents: 1, close: 1 },
};
const params = { openResult, searchText: 'needle', rid: 'r1', limit: 10 };
const hit = (id: string, fields: Partial<E2EESearchHit> = {}): E2EESearchHit => ({
	id,
	rid: 'r1',
	ts: 1000,
	snippet: id,
	uid: 'u1',
	username: 'alice',
	...fields,
});

const createBackend = (hits: E2EESearchHit[] = []) => {
	const sorted = [...hits].sort((a, b) => b.ts - a.ts || Buffer.compare(Buffer.from(b.id), Buffer.from(a.id)));
	return {
		open: jest.fn(),
		search: jest.fn(),
		onIndexEvent: jest.fn(() => () => undefined),
		close: jest.fn(async () => undefined),
		searchRecentPage: jest.fn(async ({ rid, uid, from, to, cursor, limit = E2EE_SEARCH_LIMITS.defaultResults }: E2EESearchRecentQuery) => {
			const matching = sorted.filter(
				(doc) =>
					(rid === undefined || doc.rid === rid) &&
					(uid === undefined || doc.uid === uid) &&
					(from === undefined || doc.ts >= from) &&
					(to === undefined || doc.ts <= to) &&
					(!cursor || doc.ts < cursor.ts || (doc.ts === cursor.ts && Buffer.compare(Buffer.from(doc.id), Buffer.from(cursor.id)) < 0)),
			);
			const page = matching.slice(0, limit);
			const last = page.at(-1);
			return { hits: page, ...(matching.length > limit && last ? { nextCursor: { ts: last.ts, id: last.id } } : {}) };
		}),
	} as unknown as jest.Mocked<ISearchIndexBackend> & {
		searchRecentPage: jest.MockedFunction<NonNullable<ISearchIndexBackend['searchRecentPage']>>;
	};
};
const tiedHits = (count: number) => Array.from({ length: count }, (_, i) => hit(`m${String(count - i).padStart(4, '0')}`));

describe('searchLocalIndex', () => {
	it('uses the compound-page method with trimmed text and never calls legacy search or open', async () => {
		const backend = createBackend([hit('m1')]);
		await expect(searchLocalIndex(backend, { ...params, searchText: '  needle ' })).resolves.toEqual([hit('m1')]);
		expect(backend.searchRecentPage).toHaveBeenCalledWith({ text: 'needle', rid: 'r1', limit: 10 });
		expect(backend.search).not.toHaveBeenCalled();
		expect(backend.open).not.toHaveBeenCalled();
	});

	it('does not query empty input', async () => {
		const backend = createBackend();
		await expect(searchLocalIndex(backend, { ...params, searchText: ' \n ' })).resolves.toEqual([]);
		expect(backend.searchRecentPage).not.toHaveBeenCalled();
	});

	it('visits all 307 timestamp ties exactly once through binary ID cursors', async () => {
		const docs = tiedHits(307);
		const backend = createBackend(docs);
		const hits = await searchLocalIndex(backend, { ...params, limit: 500 });
		expect(hits).toEqual(docs);
		expect(new Set(hits.map(({ id }) => id)).size).toBe(307);
		expect(backend.searchRecentPage.mock.calls.map(([query]) => query.cursor)).toEqual([
			undefined,
			{ ts: 1000, id: docs[99].id },
			{ ts: 1000, id: docs[199].id },
			{ ts: 1000, id: docs[299].id },
		]);
		expect(backend.search).not.toHaveBeenCalled();
	});

	it('accepts UTF-8 binary ID order when UTF-16 string order differs', async () => {
		const docs = [hit('\u{1F600}'), hit(String.fromCodePoint(0xe000)), hit('z')];
		const backend = createBackend(docs);

		await expect(searchLocalIndex(backend, params)).resolves.toEqual(docs);
	});

	it('continues across a non-BMP cursor into BMP private-use IDs', async () => {
		const docs = [
			...Array.from({ length: E2EE_SEARCH_LIMITS.maxResults - 1 }, (_, i) => hit(`\u{1F600}${String(999 - i)}`)),
			hit('\u{1F600}'),
			hit(String.fromCodePoint(0xe000)),
			hit('z'),
		];
		const backend = createBackend(docs);

		await expect(searchLocalIndex(backend, { ...params, limit: docs.length })).resolves.toEqual(docs);
		expect(backend.searchRecentPage.mock.calls[1][0].cursor).toEqual({ ts: 1000, id: '\u{1F600}' });
		expect(backend.searchRecentPage).toHaveBeenCalledTimes(2);
	});

	it('continues past full pages rejected by author filters without skipping tied matches', async () => {
		const docs = tiedHits(350).map((doc, i) => (i >= 220 && i < 240 ? { ...doc, uid: 'bob', username: 'Bob' } : doc));
		const backend = createBackend(docs);
		const found = await searchLocalIndex(backend, { ...params, searchText: 'needle from:bob', limit: 20 });
		expect(found).toEqual(docs.slice(220, 240));
		expect(backend.searchRecentPage).toHaveBeenCalledTimes(3);
		expect(
			backend.searchRecentPage.mock.calls.every(([query]) => query.limit === E2EE_SEARCH_LIMITS.maxResults && query.uid === undefined),
		).toBe(true);
	});

	it('preserves text, room, author and date bounds on every page and resets cursors for changed filters', async () => {
		const ts = Date.UTC(2026, 9, 26, 12);
		const docs = tiedHits(230).map((doc) => ({ ...doc, ts }));
		const backend = createBackend(docs);
		const resolveUid = () => 'u1';
		await searchLocalIndex(backend, { ...params, searchText: 'needle from:alice on:26.10.2026', resolveUid, limit: 230 });
		for (const [query] of backend.searchRecentPage.mock.calls) {
			expect(query).toMatchObject({ text: 'needle', rid: 'r1', uid: 'u1', from: Date.UTC(2026, 9, 26), to: Date.UTC(2026, 9, 27) - 1 });
		}
		await searchLocalIndex(backend, { ...params, searchText: 'other from:me before:01-01-2025', self: { uid: 'u2' } });
		expect(backend.searchRecentPage.mock.calls.at(-1)?.[0]).toEqual({
			text: 'other',
			rid: 'r1',
			uid: 'u2',
			to: Date.UTC(2025, 0, 1),
			limit: 10,
		});
	});

	it('reads timestamp changes and a partial final page', async () => {
		const docs = Array.from({ length: 230 }, (_, i) => hit(`m${i}`, { ts: 1000 - i }));
		const backend = createBackend(docs);
		await expect(searchLocalIndex(backend, { ...params, limit: 300 })).resolves.toEqual(docs);
		expect(backend.searchRecentPage).toHaveBeenCalledTimes(3);
	});

	it('clamps finite client limits and uses only shared backend page bounds', async () => {
		const backend = createBackend(tiedHits(MAX_LOCAL_SEARCH_LIMIT + 50));
		await expect(searchLocalIndex(backend, { ...params, limit: MAX_LOCAL_SEARCH_LIMIT + 500 })).resolves.toHaveLength(
			MAX_LOCAL_SEARCH_LIMIT,
		);
		expect(backend.searchRecentPage.mock.calls.every(([query]) => query.limit! <= E2EE_SEARCH_LIMITS.maxResults)).toBe(true);
		backend.searchRecentPage.mockClear();
		await searchLocalIndex(backend, { ...params, limit: 0 });
		await searchLocalIndex(backend, { ...params, limit: -5 });
		await searchLocalIndex(backend, { ...params, limit: 2.9 });
		expect(backend.searchRecentPage.mock.calls.map(([query]) => query.limit)).toEqual([1, 1, 2]);
	});

	it.each([NaN, Infinity, -Infinity])('rejects a non-finite client limit %p', async (limit) => {
		const backend = createBackend();
		await expect(searchLocalIndex(backend, { ...params, limit })).rejects.toThrow('Invalid local search limit');
		expect(backend.searchRecentPage).not.toHaveBeenCalled();
	});

	it('rejects an empty room ID', async () => {
		await expect(searchLocalIndex(createBackend(), { ...params, rid: '' })).rejects.toThrow('room ID');
	});

	it('applies known authors, the self alias and date-only queries', async () => {
		const backend = createBackend();
		const resolveUid = jest.fn(() => 'u-bob');
		await searchLocalIndex(backend, { ...params, searchText: 'invoice from:Bob', resolveUid });
		expect(resolveUid).toHaveBeenCalledWith('bob');
		expect(backend.searchRecentPage.mock.calls.at(-1)?.[0]).toMatchObject({ text: 'invoice', uid: 'u-bob' });
		await searchLocalIndex(backend, { ...params, searchText: 'from:me', self: { uid: 'self' } });
		expect(backend.searchRecentPage.mock.calls.at(-1)?.[0]).toMatchObject({ text: '', uid: 'self' });
		await searchLocalIndex(backend, { ...params, searchText: 'on:5.6.2024', utcOffset: -3 });
		expect(backend.searchRecentPage.mock.calls.at(-1)?.[0]).toMatchObject({
			text: '',
			from: Date.UTC(2024, 5, 5, 3),
			to: Date.UTC(2024, 5, 6, 3) - 1,
		});
	});

	it('combines resolved and unresolved authors and does not treat from:Me as self', async () => {
		const docs = [
			hit('z', { uid: 'bob', username: 'bob' }),
			hit('y', { uid: 'self', username: 'jean' }),
			hit('x', { username: 'Carol' }),
			hit('w'),
		];
		const backend = createBackend(docs);
		await expect(
			searchLocalIndex(backend, {
				...params,
				searchText: 'from:bob from:me from:carol',
				self: { uid: 'self' },
				resolveUid: (name) => (name === 'bob' ? 'bob' : undefined),
			}),
		).resolves.toEqual(docs.slice(0, 3));
		await expect(searchLocalIndex(backend, { ...params, searchText: 'from:Me', self: { uid: 'self' } })).resolves.toEqual([]);
	});

	it('drops out-of-room hits and continues with the backend cursor', async () => {
		const backend = createBackend();
		backend.searchRecentPage.mockResolvedValueOnce({ hits: [hit('z', { rid: 'other' })], nextCursor: { ts: 1000, id: 'z' } });
		backend.searchRecentPage.mockResolvedValueOnce({ hits: [hit('y')] });
		await expect(searchLocalIndex(backend, { ...params, limit: 1 })).resolves.toEqual([hit('y')]);
		expect(backend.searchRecentPage.mock.calls[1][0]).toMatchObject({ rid: 'r1', cursor: { ts: 1000, id: 'z' } });
	});

	it('stops at an empty page without a cursor', async () => {
		const backend = createBackend();
		await expect(searchLocalIndex(backend, params)).resolves.toEqual([]);
		expect(backend.searchRecentPage).toHaveBeenCalledTimes(1);
	});

	it.each([
		{ hits: [], nextCursor: { ts: 1000, id: 'z' } },
		{ hits: [hit('z')], nextCursor: { ts: 1000, id: 'y' } },
		{ hits: [hit('z')], nextCursor: { ts: NaN, id: 'z' } },
		{ hits: [hit('z')], nextCursor: { ts: 1000, id: '' } },
	])('rejects an invalid continuation without timestamp fallback: %j', async (page) => {
		const backend = createBackend();
		backend.searchRecentPage.mockResolvedValueOnce(page);
		await expect(searchLocalIndex(backend, params)).rejects.toThrow('continuation cursor');
		expect(backend.searchRecentPage).toHaveBeenCalledTimes(1);
		expect(backend.search).not.toHaveBeenCalled();
	});

	it('rejects a repeated cursor page instead of looping', async () => {
		const backend = createBackend();
		backend.searchRecentPage.mockResolvedValue({ hits: [hit('z')], nextCursor: { ts: 1000, id: 'z' } });
		await expect(searchLocalIndex(backend, params)).rejects.toThrow('page order');
		expect(backend.searchRecentPage).toHaveBeenCalledTimes(2);
	});

	it('rejects out-of-order and oversized pages', async () => {
		const backend = createBackend();
		backend.searchRecentPage.mockResolvedValueOnce({ hits: [hit('a'), hit('z')] });
		await expect(searchLocalIndex(backend, params)).rejects.toThrow('page order');
		backend.searchRecentPage.mockResolvedValueOnce({ hits: tiedHits(11) });
		await expect(searchLocalIndex(backend, params)).rejects.toThrow('page limit');
	});

	it('stops before and after an asynchronous page when aborted', async () => {
		const backend = createBackend(tiedHits(300));
		const controller = new AbortController();
		controller.abort();
		await expect(searchLocalIndex(backend, { ...params, signal: controller.signal })).rejects.toThrow();
		expect(backend.searchRecentPage).not.toHaveBeenCalled();
		const pending = new AbortController();
		backend.searchRecentPage.mockImplementationOnce(async () => {
			pending.abort();
			return { hits: [hit('z')] };
		});
		await expect(searchLocalIndex(backend, { ...params, signal: pending.signal })).rejects.toThrow();
		expect(backend.searchRecentPage).toHaveBeenCalledTimes(1);
	});

	it.each(['legacy', 'locked', 'partial', 'missingPage', 'missingEvents', 'missingClose'])(
		'fails safely for %s backends without legacy search or storage creation',
		async (kind) => {
			const backend = createBackend();
			let result = openResult;
			if (kind === 'legacy') result = { schemaVersion: 1, encryptedAtRest: true };
			if (kind === 'locked') result = { ...openResult, locked: true };
			if (kind === 'partial')
				result = {
					...openResult,
					capabilities: { ...openResult.capabilities!, close: 0 } as unknown as E2EESearchOpenResult['capabilities'],
				};
			if (kind === 'missingPage') delete (backend as ISearchIndexBackend).searchRecentPage;
			if (kind === 'missingEvents') delete backend.onIndexEvent;
			if (kind === 'missingClose') delete backend.close;
			await expect(searchLocalIndex(backend, { ...params, openResult: result })).rejects.toThrow('required capabilities');
			expect(backend.search).not.toHaveBeenCalled();
			expect(backend.open).not.toHaveBeenCalled();
		},
	);

	it('propagates backend rejection without calling legacy search', async () => {
		const backend = createBackend();
		backend.searchRecentPage.mockRejectedValueOnce(new Error('closed'));
		await expect(searchLocalIndex(backend, params)).rejects.toThrow('closed');
		expect(backend.search).not.toHaveBeenCalled();
	});
});
