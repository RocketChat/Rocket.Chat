import type { E2EESearchDoc, ISearchIndexBackend } from '@rocket.chat/desktop-api';

// The test functions of the runner that runs the suite: Jest in Node, or Playwright for a backend that runs in Chrome.
export type SearchIndexBackendContractRunner = {
	describe: (name: string, body: () => void) => void;
	it: (name: string, body: () => Promise<void>) => void;
	expect: typeof expect;
};

const doc = (overrides: Partial<E2EESearchDoc> & Pick<E2EESearchDoc, 'id' | 'body'>): E2EESearchDoc => ({
	rid: 'r1',
	uid: 'u1',
	username: 'alice',
	ts: 1000,
	updatedAt: 1000,
	kind: 'text',
	...overrides,
});

const ids = async (backend: ISearchIndexBackend, query: Parameters<ISearchIndexBackend['search']>[0]) =>
	(await backend.search(query)).map((hit) => hit.id);

/**
 * The behavior that every E2EE search index backend shares with the desktop index. Each backend runs it, so the
 * web client gets the same hits from each one.
 */
export const describeSearchIndexBackendContract = (
	name: string,
	createBackend: () => Promise<ISearchIndexBackend>,
	{ describe, it, expect }: SearchIndexBackendContractRunner,
): void => {
	const openBackend = async () => {
		const backend = await createBackend();
		await backend.open({ userId: 'u1' });
		return backend;
	};

	describe(name, () => {
		it('rejects every call before open', async () => {
			const backend = await createBackend();

			await expect(backend.upsert([doc({ id: 'm1', body: 'needle' })])).rejects.toThrow('E2EE search index is not open');
			await expect(backend.remove(['m1'])).rejects.toThrow('E2EE search index is not open');
			await expect(backend.removeRoom('r1')).rejects.toThrow('E2EE search index is not open');
			await expect(backend.search({ text: 'needle' })).rejects.toThrow('E2EE search index is not open');
			await expect(backend.getRoomState('r1')).rejects.toThrow('E2EE search index is not open');
			await expect(backend.setRoomState('r1', { backfillDone: true })).rejects.toThrow('E2EE search index is not open');
			await expect(backend.stats()).rejects.toThrow('E2EE search index is not open');
		});

		it('opens as a memory-only index', async () => {
			await expect((await createBackend()).open({ userId: 'u1' })).resolves.toEqual({ schemaVersion: 1, encryptedAtRest: false });
		});

		it('finds a message by a word prefix, with no case or diacritic difference', async () => {
			const backend = await openBackend();
			await backend.upsert([doc({ id: 'm1', body: 'Meet at the Café near the station' }), doc({ id: 'm2', body: 'cafe au lait' })]);

			await expect(ids(backend, { text: 'stat' })).resolves.toEqual(['m1']);
			await expect(ids(backend, { text: 'CAFÉ', order: 'recent' })).resolves.toEqual(expect.arrayContaining(['m1', 'm2']));
			await expect(ids(backend, { text: 'cafe' })).resolves.toHaveLength(2);
			await expect(ids(backend, { text: 'ação' })).resolves.toEqual([]);
		});

		it('matches only messages that have every word of the query', async () => {
			const backend = await openBackend();
			await backend.upsert([doc({ id: 'm1', body: 'red apple' }), doc({ id: 'm2', body: 'green apple' })]);

			await expect(ids(backend, { text: 'apple red' })).resolves.toEqual(['m1']);
		});

		it('treats query operators and quotes as plain words', async () => {
			const backend = await openBackend();
			await backend.upsert([doc({ id: 'm1', body: 'needle' }), doc({ id: 'm2', body: 'haystack' })]);

			await expect(ids(backend, { text: '"needle"* NOT' })).resolves.toEqual([]);
			await expect(ids(backend, { text: '"needle"*' })).resolves.toEqual(['m1']);
		});

		it('returns no hits for a query with no words', async () => {
			const backend = await openBackend();
			await backend.upsert([doc({ id: 'm1', body: 'needle' })]);

			await expect(backend.search({ text: '  ?!*  ' })).resolves.toEqual([]);
		});

		it('lists the newest messages of the filters for an empty text, like the desktop index', async () => {
			const backend = await openBackend();
			await backend.upsert([
				doc({ id: 'm1', body: 'one', rid: 'r1', uid: 'u1', ts: 100 }),
				doc({ id: 'm2', body: 'two', rid: 'r2', uid: 'u1', ts: 200 }),
				doc({ id: 'm3', body: 'three', rid: 'r1', uid: 'u2', ts: 300 }),
				doc({ id: 'm4', body: 'four', rid: 'r1', uid: 'u1', ts: 400 }),
			]);

			await expect(ids(backend, { text: '', rid: 'r1', uid: 'u1' })).resolves.toEqual(['m4', 'm1']);
			await expect(ids(backend, { text: ' ', from: 150, to: 350, limit: 1 })).resolves.toEqual(['m3']);
			await expect(backend.search({ text: '' })).resolves.toEqual([]);
			await expect(backend.search({ text: '?!', rid: 'r1' })).resolves.toEqual([]);
		});

		it('gives a filter-only hit the escaped start of the body, with no marks', async () => {
			const backend = await openBackend();
			const long = `<b>"Tom" & 'Ana'</b> ${'word '.repeat(30)}`;
			await backend.upsert([doc({ id: 'm1', body: long }), doc({ id: 'm2', body: 'short <i>', ts: 2000 })]);

			const [short, first] = await backend.search({ text: '', rid: 'r1' });

			expect(short.snippet).toBe('short &lt;i&gt;');
			expect(first.snippet).toMatch(/^&lt;b&gt;&quot;Tom&quot; &amp; &#39;Ana&#39;&lt;\/b&gt; word /);
			expect(first.snippet.endsWith('…')).toBe(true);
			expect(first.snippet).not.toContain('<mark>');
		});

		it('filters by room, sender and date range', async () => {
			const backend = await openBackend();
			await backend.upsert([
				doc({ id: 'm1', body: 'needle', rid: 'r1', uid: 'u1', ts: 100 }),
				doc({ id: 'm2', body: 'needle', rid: 'r2', uid: 'u1', ts: 200 }),
				doc({ id: 'm3', body: 'needle', rid: 'r1', uid: 'u2', ts: 300 }),
			]);

			await expect(ids(backend, { text: 'needle', rid: 'r1', order: 'recent' })).resolves.toEqual(['m3', 'm1']);
			await expect(ids(backend, { text: 'needle', uid: 'u1', order: 'recent' })).resolves.toEqual(['m2', 'm1']);
			await expect(ids(backend, { text: 'needle', from: 150, to: 250 })).resolves.toEqual(['m2']);
		});

		it('orders recent hits newest first and caps the limit', async () => {
			const backend = await openBackend();
			await backend.upsert(Array.from({ length: 120 }, (_, index) => doc({ id: `m${index}`, body: 'needle', ts: index })));

			const recent = await ids(backend, { text: 'needle', order: 'recent', limit: 3 });
			expect(recent).toEqual(['m119', 'm118', 'm117']);
			await expect(backend.search({ text: 'needle' })).resolves.toHaveLength(50);
			await expect(backend.search({ text: 'needle', limit: 1000 })).resolves.toHaveLength(100);
			await expect(backend.search({ text: 'needle', limit: 0 })).resolves.toHaveLength(1);
		});

		it('replaces an edited message and forgets removed ones', async () => {
			const backend = await openBackend();
			await backend.upsert([doc({ id: 'm1', body: 'first text', rid: 'r1' }), doc({ id: 'm2', body: 'needle', rid: 'r2' })]);
			await backend.setRoomState('r2', { backfillDone: true });

			await backend.upsert([doc({ id: 'm1', body: 'edited text' })]);
			await expect(ids(backend, { text: 'first' })).resolves.toEqual([]);
			await expect(ids(backend, { text: 'edited' })).resolves.toEqual(['m1']);

			await backend.remove(['m1']);
			await expect(ids(backend, { text: 'edited' })).resolves.toEqual([]);

			await backend.removeRoom('r2');
			await expect(ids(backend, { text: 'needle' })).resolves.toEqual([]);
			await expect(backend.getRoomState('r2')).resolves.toBeUndefined();
		});

		it('returns the author and an HTML snippet that escapes the text and marks only the matches', async () => {
			const backend = await openBackend();
			await backend.upsert([doc({ id: 'm1', body: '<img src=x onerror=alert(1)> Needles & "café"', tmid: 't1' })]);

			const [hit] = await backend.search({ text: 'needle cafe' });

			expect(hit).toEqual({
				id: 'm1',
				rid: 'r1',
				tmid: 't1',
				uid: 'u1',
				username: 'alice',
				ts: 1000,
				snippet: '&lt;img src=x onerror=alert(1)&gt; <mark>Needles</mark> &amp; &quot;<mark>café</mark>&quot;',
			});
		});

		it('omits tmid for a message outside a thread', async () => {
			const backend = await openBackend();
			await backend.upsert([doc({ id: 'm1', body: 'needle' })]);

			const [hit] = await backend.search({ text: 'needle' });

			expect(hit).not.toHaveProperty('tmid');
		});

		it('keeps room state and counts docs, bytes and rooms', async () => {
			const backend = await openBackend();
			await backend.upsert([doc({ id: 'm1', body: 'café', rid: 'r1' }), doc({ id: 'm2', body: 'abc', rid: 'r2' })]);
			await backend.setRoomState('r1', { lastUpdate: 5, backfillCursor: 'c1', backfillDone: false });

			await expect(backend.getRoomState('r1')).resolves.toEqual({ lastUpdate: 5, backfillCursor: 'c1', backfillDone: false });
			await expect(backend.getRoomState('r9')).resolves.toBeUndefined();
			await expect(backend.stats()).resolves.toEqual({ docs: 2, bytes: 8, rooms: 2 });
		});

		it('wipes every message and room state', async () => {
			const backend = await openBackend();
			await backend.upsert([doc({ id: 'm1', body: 'needle' })]);
			await backend.setRoomState('r1', { backfillDone: true });

			await backend.wipe();
			await backend.open({ userId: 'u1' });

			await expect(backend.stats()).resolves.toEqual({ docs: 0, bytes: 0, rooms: 0 });
			await expect(backend.getRoomState('r1')).resolves.toBeUndefined();
		});

		it('closes the index on a wipe, like the desktop app ends its session', async () => {
			const backend = await openBackend();

			await backend.wipe();

			await expect(backend.stats()).rejects.toThrow('E2EE search index is not open');
		});

		it('closes the index without deleting it, so the same user finds the messages again after the next open', async () => {
			const backend = await openBackend();
			await backend.upsert([doc({ id: 'm1', body: 'needle' })]);

			await backend.close?.();

			await expect(backend.stats()).rejects.toThrow('E2EE search index is not open');
			await backend.open({ userId: 'u1' });
			await expect(ids(backend, { text: 'needle' })).resolves.toEqual(['m1']);
		});

		it('lists each room that has documents or a room state, once', async () => {
			const backend = await openBackend();
			await backend.upsert([
				doc({ id: 'm1', rid: 'r2', body: 'a' }),
				doc({ id: 'm2', rid: 'r1', body: 'b' }),
				doc({ id: 'm3', rid: 'r1', body: 'c' }),
			]);
			await backend.setRoomState('r3', { backfillDone: true });

			await expect(backend.listRooms?.()).resolves.toEqual(['r1', 'r2', 'r3']);

			await backend.removeRoom('r3');
			await expect(backend.listRooms?.()).resolves.toEqual(['r1', 'r2']);
		});

		it('drops the index of another user on open', async () => {
			const backend = await openBackend();
			await backend.upsert([doc({ id: 'm1', body: 'needle' })]);

			await backend.open({ userId: 'u2' });

			await expect(ids(backend, { text: 'needle' })).resolves.toEqual([]);
		});
	});
};
