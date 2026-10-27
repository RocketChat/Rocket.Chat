import type { E2EESearchHit, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { searchLocalIndex } from './searchLocalIndex';

const createBackend = (hits: E2EESearchHit[] = []) =>
	({
		search: jest.fn(async () => hits),
	}) as unknown as jest.Mocked<ISearchIndexBackend>;

const hit = (id: string, rid: string): E2EESearchHit => ({ id, rid, ts: 1, snippet: `<mark>${id}</mark>` });

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
			from: new Date(2025, 1, 2).getTime(),
			to: new Date(2025, 2, 10).getTime(),
		});
	});

	it('limits on: to that one day', async () => {
		const backend = createBackend();

		await searchLocalIndex(backend, { searchText: 'on:5.6.2024 invoice', rid: 'r1', limit: 10 });

		expect(backend.search.mock.calls[0][0]).toMatchObject({
			text: 'invoice',
			from: new Date(2024, 5, 5).getTime(),
			to: new Date(2024, 5, 6).getTime() - 1,
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

	it('searches the room with an empty text when the text has only filters (LSE2EE-74)', async () => {
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
			from: new Date(2025, 0, 2).getTime(),
		});
	});

	it('searches with an empty text for a date filter alone', async () => {
		const backend = createBackend();

		await searchLocalIndex(backend, { searchText: 'before:01-01-2025', rid: 'r1', limit: 10 });

		expect(backend.search).toHaveBeenCalledWith({ text: '', rid: 'r1', order: 'recent', limit: 10, to: new Date(2025, 0, 1).getTime() });
	});
});
