import { createFakeSearchIndexBackend } from './fakeSearchIndexBackend';
import { describeSearchIndexBackendContract } from './searchIndexBackendContract';

describeSearchIndexBackendContract('createFakeSearchIndexBackend', async () => createFakeSearchIndexBackend(), { describe, it, expect });

describe('createFakeSearchIndexBackend after close', () => {
	it('does not show the documents of the user who closed it to the next user', async () => {
		const backend = createFakeSearchIndexBackend();
		await backend.open({ userId: 'u1' });
		await backend.upsert([{ id: 'm1', rid: 'r1', uid: 'u1', username: 'alice', ts: 1, updatedAt: 1, kind: 'text', body: 'needle' }]);

		await backend.close?.();
		await backend.open({ userId: 'u2' });

		await expect(backend.search({ text: 'needle' })).resolves.toEqual([]);
		await expect(backend.stats()).resolves.toEqual({ docs: 0, bytes: 0, rooms: 0 });
	});

	it('keeps the documents for the same user after close', async () => {
		const backend = createFakeSearchIndexBackend();
		await backend.open({ userId: 'u1' });
		await backend.upsert([{ id: 'm1', rid: 'r1', uid: 'u1', username: 'alice', ts: 1, updatedAt: 1, kind: 'text', body: 'needle' }]);

		await backend.close?.();
		await backend.open({ userId: 'u1' });

		await expect(backend.stats()).resolves.toMatchObject({ docs: 1 });
	});
});

describe('createFakeSearchIndexBackend case folding', () => {
	it('finds a Greek word with a plain sigma by its capital form, which JavaScript lowercases to the final sigma', async () => {
		const backend = createFakeSearchIndexBackend();
		await backend.open({ userId: 'u1' });
		await backend.upsert([{ id: 'm1', rid: 'r1', uid: 'u1', username: 'alice', ts: 1, updatedAt: 1, kind: 'text', body: 'οσ' }]);

		await expect(backend.search({ text: 'ΟΣ' })).resolves.toMatchObject([{ id: 'm1' }]);
	});
});
