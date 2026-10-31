import type { E2EESearchRecentCursor } from '@rocket.chat/desktop-api';

import { createFakeSearchIndexBackend } from './fakeSearchIndexBackend';

const doc = (id: string) => ({
	id,
	rid: 'r',
	uid: 'u',
	username: 'alice',
	ts: 1000,
	updatedAt: 1000,
	kind: 'text' as const,
	body: 'needle',
});

describe('development memory backend', () => {
	it('visits 205 tied IDs in binary order and keeps filters on every page', async () => {
		const backend = createFakeSearchIndexBackend();
		await backend.open({ userId: 'u' });
		const ids = [...Array.from({ length: 203 }, (_, n) => `m${String(n).padStart(3, '0')}`), '', '\u{10000}'];
		await backend.upsert([...ids.map(doc), { ...doc('other'), rid: 'other' }]);
		let cursor: E2EESearchRecentCursor | undefined;
		const visited: string[] = [];
		do {
			const page = await backend.searchRecentPage!({ text: 'needle', rid: 'r', limit: 100, cursor });
			visited.push(...page.hits.map(({ id }) => id));
			cursor = page.nextCursor;
		} while (cursor && visited.length < 1000);
		expect(visited).toEqual(ids.sort((a, b) => Buffer.compare(Buffer.from(b), Buffer.from(a))));
		await expect(backend.searchRecentPage!({ text: 'needle', cursor: { ts: NaN, id: 'm' } })).rejects.toThrow('cursor');
	});

	it('isolates listener failures after applying a mutation', async () => {
		const backend = createFakeSearchIndexBackend();
		await backend.open({ userId: 'u' });
		const recordChange = jest.fn();
		const reportError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		backend.onIndexEvent!(() => {
			throw new Error('listener failed');
		});
		backend.onIndexEvent!(recordChange);

		await expect(backend.upsert([doc('m')])).resolves.toBeUndefined();
		await expect(backend.stats()).resolves.toMatchObject({ docs: 1 });
		expect(recordChange).toHaveBeenCalledTimes(1);
		expect(reportError).toHaveBeenCalledWith('E2EE search index listener failed', expect.any(Error));
		reportError.mockRestore();
	});

	it('retains only the same user across close and scopes wipe to its owner', async () => {
		const backend = createFakeSearchIndexBackend();
		await backend.open({ userId: 'a' });
		await backend.upsert([doc('m')]);
		const listener = jest.fn();
		backend.onIndexEvent!(listener);
		await backend.close!();
		await expect(backend.search({ text: 'needle' })).rejects.toThrow('not open');
		await backend.open({ userId: 'a' });
		await backend.wipe({ userId: 'b' });
		await expect(backend.stats()).resolves.toMatchObject({ docs: 1 });
		await backend.upsert([doc('n')]);
		expect(listener).not.toHaveBeenCalled();
		await backend.open({ userId: 'b' });
		await expect(backend.stats()).resolves.toMatchObject({ docs: 0 });
	});
});
