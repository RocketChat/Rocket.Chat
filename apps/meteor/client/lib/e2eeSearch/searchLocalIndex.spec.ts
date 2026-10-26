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
