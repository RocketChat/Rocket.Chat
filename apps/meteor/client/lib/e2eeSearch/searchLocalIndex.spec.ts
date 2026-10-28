import type { E2EESearchHit, E2EESearchQuery, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { searchLocalIndex } from './searchLocalIndex';

const createBackend = (hits: E2EESearchHit[] = []) =>
	({
		search: jest.fn(async () => hits),
	}) as unknown as jest.Mocked<ISearchIndexBackend>;

const hit = (id: string, rid: string): E2EESearchHit => ({ id, rid, ts: 1, snippet: `<mark>${id}</mark>`, uid: 'u1', username: 'alice' });

describe('searchLocalIndex', () => {
	it('searches the room newest first with the trimmed text and the limit', async () => {
		const backend = createBackend([hit('m1', 'r1')]);

		await expect(searchLocalIndex(backend, { searchText: '  needle ', rid: 'r1', limit: 10 })).resolves.toEqual([hit('m1', 'r1')]);
		expect(backend.search).toHaveBeenCalledWith({ text: 'needle', rid: 'r1', order: 'recent', limit: 10 });
	});

	it('does not search for an empty text', async () => {
		const backend = createBackend([hit('m1', 'r1')]);

		await expect(searchLocalIndex(backend, { searchText: '   ', rid: 'r1', limit: 10 })).resolves.toEqual([]);
		expect(backend.search).not.toHaveBeenCalled();
	});

	it('drops the hits of other rooms', async () => {
		const backend = createBackend([hit('m1', 'r1'), hit('m2', 'r2')]);

		await expect(searchLocalIndex(backend, { searchText: 'm', rid: 'r1', limit: 10 })).resolves.toEqual([hit('m1', 'r1')]);
	});

	it('keeps the limit between 1 and 100', async () => {
		const backend = createBackend();

		await searchLocalIndex(backend, { searchText: 'a', rid: 'r1', limit: 500 });
		await searchLocalIndex(backend, { searchText: 'a', rid: 'r1', limit: 0 });

		expect(backend.search.mock.calls.map(([query]) => query.limit)).toEqual([100, 1]);
	});
});

describe('searchLocalIndex filters', () => {
	const authorHit = (id: string, uid: string, username: string): E2EESearchHit => ({ id, rid: 'r1', ts: 1, snippet: id, uid, username });

	it('sends the words without the filters, and the date range of after: and before:', async () => {
		const backend = createBackend();

		await searchLocalIndex(backend, { searchText: 'invoice after:01-02-2025 before:10/03/2025', rid: 'r1', limit: 10 });

		expect(backend.search).toHaveBeenCalledWith({
			text: 'invoice',
			rid: 'r1',
			order: 'recent',
			limit: 10,
			from: Date.UTC(2025, 1, 2),
			to: Date.UTC(2025, 2, 10),
		});
	});

	it('moves the day boundaries by the utcOffset of the user, like the server message search', async () => {
		const backend = createBackend();

		await searchLocalIndex(backend, { searchText: 'invoice on:5.6.2024', rid: 'r1', limit: 10, utcOffset: -3 });

		expect(backend.search.mock.calls[0][0]).toMatchObject({
			from: Date.UTC(2024, 5, 5) - 3 * 60 * 60 * 1000,
			to: Date.UTC(2024, 5, 6) - 3 * 60 * 60 * 1000 - 1,
		});
	});

	it('limits on: to that one day', async () => {
		const backend = createBackend();

		await searchLocalIndex(backend, { searchText: 'on:5.6.2024 invoice', rid: 'r1', limit: 10 });

		expect(backend.search.mock.calls[0][0]).toMatchObject({
			text: 'invoice',
			from: Date.UTC(2024, 5, 5),
			to: Date.UTC(2024, 5, 6) - 1,
		});
	});

	it('gives from:me to the index as the user id of the logged-in user', async () => {
		const backend = createBackend();

		await searchLocalIndex(backend, { searchText: 'invoice from:me', rid: 'r1', limit: 10, self: { uid: 'u-self' } });

		expect(backend.search.mock.calls[0][0]).toMatchObject({ text: 'invoice', uid: 'u-self', limit: 10 });
	});

	it('gives a known username to the index as its user id, case-insensitive', async () => {
		const backend = createBackend();
		const resolveUid = jest.fn((username: string) => (username === 'alice' ? 'u-alice' : undefined));

		await searchLocalIndex(backend, { searchText: 'invoice from:Alice', rid: 'r1', limit: 10, resolveUid });

		expect(resolveUid).toHaveBeenCalledWith('alice');
		expect(backend.search.mock.calls[0][0]).toMatchObject({ text: 'invoice', uid: 'u-alice' });
	});

	it('keeps only the hits of an unknown username, and asks the index for the most hits', async () => {
		const backend = createBackend([authorHit('m1', 'u-bob', 'Bob'), authorHit('m2', 'u-carol', 'carol'), hit('m3', 'r1')]);

		await expect(searchLocalIndex(backend, { searchText: 'invoice from:bob', rid: 'r1', limit: 10 })).resolves.toEqual([
			authorHit('m1', 'u-bob', 'Bob'),
		]);
		expect(backend.search.mock.calls[0][0]).not.toHaveProperty('uid');
		expect(backend.search.mock.calls[0][0].limit).toBe(100);
	});

	it('finds an old message of an unknown username behind more than 100 newer hits of other authors', async () => {
		const docs: E2EESearchHit[] = [
			...Array.from({ length: 250 }, (_, i) => ({ ...authorHit(`new${i}`, 'u-carol', 'carol'), ts: 1000 - Math.floor(i / 3) })),
			{ ...authorHit('old', 'u-bob', 'bob'), ts: 10 },
		];
		const backend = {
			search: jest.fn(async ({ to = Number.MAX_SAFE_INTEGER, limit = 50 }: E2EESearchQuery) =>
				docs.filter((doc) => doc.ts <= to).slice(0, limit),
			),
		} as unknown as jest.Mocked<ISearchIndexBackend>;

		await expect(searchLocalIndex(backend, { searchText: 'invoice from:bob', rid: 'r1', limit: 10 })).resolves.toEqual([
			{ ...authorHit('old', 'u-bob', 'bob'), ts: 10 },
		]);
		expect(backend.search.mock.calls.every(([query]) => query.limit === 100 && !('uid' in query))).toBe(true);
	});

	it('moves past a millisecond that holds more hits than one page', async () => {
		const docs: E2EESearchHit[] = [
			...Array.from({ length: 150 }, (_, i) => ({ ...authorHit(`same${i}`, 'u-carol', 'carol'), ts: 1000 })),
			{ ...authorHit('old', 'u-bob', 'bob'), ts: 10 },
		];
		const backend = {
			search: jest.fn(async ({ to = Number.MAX_SAFE_INTEGER, limit = 50 }: E2EESearchQuery) =>
				docs.filter((doc) => doc.ts <= to).slice(0, limit),
			),
		} as unknown as jest.Mocked<ISearchIndexBackend>;

		await expect(searchLocalIndex(backend, { searchText: 'from:bob', rid: 'r1', limit: 10 })).resolves.toEqual([
			{ ...authorHit('old', 'u-bob', 'bob'), ts: 10 },
		]);
		expect(backend.search).toHaveBeenCalledTimes(3);
	});

	it('stops paging when the index has no older hits, and keeps the date range of the text', async () => {
		const base = Date.UTC(2025, 5, 1);
		const pages = [
			Array.from({ length: 100 }, (_, i) => ({ ...authorHit(`a${i}`, 'u-carol', 'carol'), ts: base + 500 - i })),
			[{ ...authorHit('b', 'u-bob', 'bob'), ts: base + 300 }],
		];
		const backend = { search: jest.fn(async () => pages.shift() ?? []) } as unknown as jest.Mocked<ISearchIndexBackend>;

		await expect(searchLocalIndex(backend, { searchText: 'from:bob after:01-01-2025', rid: 'r1', limit: 10 })).resolves.toEqual([
			{ ...authorHit('b', 'u-bob', 'bob'), ts: base + 300 },
		]);
		expect(backend.search).toHaveBeenCalledTimes(2);
		expect(backend.search.mock.calls[1][0]).toMatchObject({ to: base + 401, from: Date.UTC(2025, 0, 2) });
	});

	it('keeps the hits of each author when the text has more than one from:', async () => {
		const backend = createBackend([authorHit('m1', 'u-bob', 'bob'), authorHit('m2', 'u-carol', 'carol'), authorHit('m3', 'u-dan', 'dan')]);

		const hits = await searchLocalIndex(backend, {
			searchText: 'invoice from:bob from:me',
			rid: 'r1',
			limit: 1,
			self: { uid: 'u-carol' },
			resolveUid: (username) => (username === 'bob' ? 'u-bob' : undefined),
		});

		expect(hits).toEqual([authorHit('m1', 'u-bob', 'bob')]);
	});

	it('searches the room with an empty text when the text has only filters', async () => {
		const backend = createBackend([authorHit('m2', 'u-self', 'me'), hit('m1', 'r2')]);

		await expect(
			searchLocalIndex(backend, { searchText: ' from:me after:01-01-2025 ', rid: 'r1', limit: 10, self: { uid: 'u-self' } }),
		).resolves.toEqual([authorHit('m2', 'u-self', 'me')]);
		expect(backend.search).toHaveBeenCalledWith({
			text: '',
			rid: 'r1',
			order: 'recent',
			limit: 10,
			uid: 'u-self',
			from: Date.UTC(2025, 0, 2),
		});
	});

	it('searches with an empty text for a date filter alone', async () => {
		const backend = createBackend();

		await searchLocalIndex(backend, { searchText: 'before:01-01-2025', rid: 'r1', limit: 10 });

		expect(backend.search).toHaveBeenCalledWith({ text: '', rid: 'r1', order: 'recent', limit: 10, to: Date.UTC(2025, 0, 1) });
	});
});
