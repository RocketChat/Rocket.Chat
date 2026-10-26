import type { IMessage } from '@rocket.chat/core-typings';
import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { createSearchIndexWriter } from './searchIndexWriter';
import { MAX_SEARCH_DOC_BODY_LENGTH } from './toSearchDoc';

const methods = ['open', 'upsert', 'remove', 'removeRoom', 'search', 'getRoomState', 'setRoomState', 'stats', 'wipe'] as const;

const createBackend = () =>
	Object.fromEntries(methods.map((method) => [method, jest.fn(async () => undefined)])) as unknown as jest.Mocked<ISearchIndexBackend>;

const message = (id: string, overrides: Partial<IMessage> = {}): IMessage =>
	({
		_id: id,
		rid: 'room1',
		t: 'e2e',
		e2e: 'done',
		msg: `secret words ${id}`,
		u: { _id: 'u1', username: 'alice' },
		ts: new Date('2026-10-26T12:00:00Z'),
		_updatedAt: new Date('2026-10-26T12:00:00Z'),
		...overrides,
	}) as IMessage;

const DELAY = 500;

describe('createSearchIndexWriter', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('sends the decrypted messages of one delay window in one upsert call', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		writer.index(message('m1'));
		writer.index(message('m2'));
		expect(backend.upsert).not.toHaveBeenCalled();

		await jest.advanceTimersByTimeAsync(DELAY);

		expect(backend.upsert).toHaveBeenCalledTimes(1);
		expect(backend.upsert.mock.calls[0][0].map((doc) => doc.id)).toEqual(['m1', 'm2']);
		expect(backend.upsert.mock.calls[0][0][0]).toMatchObject({ rid: 'room1', uid: 'u1', body: 'secret words m1' });
	});

	it('sends nothing for a message that is not a decrypted E2EE message', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		writer.index(message('plain', { t: undefined }));
		writer.index(message('pending', { e2e: 'pending' }));
		await jest.advanceTimersByTimeAsync(DELAY);

		expect(backend.upsert).not.toHaveBeenCalled();
	});

	it('sends nothing and keeps nothing when no index is open', async () => {
		const backend = createBackend();
		let active: ISearchIndexBackend | undefined;
		const writer = createSearchIndexWriter({ getBackend: () => active, delayMs: DELAY });

		writer.index(message('before-open'));
		active = backend;
		await jest.advanceTimersByTimeAsync(DELAY);

		expect(backend.upsert).not.toHaveBeenCalled();
	});

	it('drops the queued documents when the index closes before the flush (logout)', async () => {
		const backend = createBackend();
		let active: ISearchIndexBackend | undefined = backend;
		const writer = createSearchIndexWriter({ getBackend: () => active, delayMs: DELAY });

		writer.index(message('m1'));
		active = undefined;
		await jest.advanceTimersByTimeAsync(DELAY);

		expect(backend.upsert).not.toHaveBeenCalled();
	});

	it('does not send the documents queued for one user to the index of the next user', async () => {
		const first = createBackend();
		const second = createBackend();
		let active: ISearchIndexBackend | undefined = first;
		const writer = createSearchIndexWriter({ getBackend: () => active, delayMs: DELAY });

		writer.index(message('of-first-user'));
		active = second;
		writer.index(message('of-second-user'));
		await jest.advanceTimersByTimeAsync(DELAY);

		expect(first.upsert).not.toHaveBeenCalled();
		expect(second.upsert).toHaveBeenCalledTimes(1);
		expect(second.upsert.mock.calls[0][0].map((doc) => doc.id)).toEqual(['of-second-user']);
	});

	it('keeps only the last version of a message that changes in one window', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		writer.index(message('m1', { msg: 'first text' }));
		writer.index(message('m1', { msg: 'edited text' }));
		await jest.advanceTimersByTimeAsync(DELAY);

		expect(backend.upsert).toHaveBeenCalledTimes(1);
		expect(backend.upsert.mock.calls[0][0]).toHaveLength(1);
		expect(backend.upsert.mock.calls[0][0][0].body).toBe('edited text');
	});

	it('splits a large window into calls of at most 500 documents', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		for (let i = 0; i < 1201; i++) writer.index(message(`m${i}`));
		await jest.advanceTimersByTimeAsync(DELAY);

		const sizes = backend.upsert.mock.calls.map(([docs]) => docs.length);
		expect(sizes).toEqual([500, 500, 201]);
	});

	it('splits a window so that no call has more than 2 MiB of body characters', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		for (let i = 0; i < 70; i++) writer.index(message(`big${i}`, { msg: 'x'.repeat(MAX_SEARCH_DOC_BODY_LENGTH) }));
		await jest.advanceTimersByTimeAsync(DELAY);

		const totals = backend.upsert.mock.calls.map(([docs]) => docs.reduce((sum, doc) => sum + doc.body.length, 0));
		expect(totals.every((total) => total <= 2 * 1024 * 1024)).toBe(true);
		expect(backend.upsert.mock.calls.flatMap(([docs]) => docs)).toHaveLength(70);
	});

	it('reports a failed upsert and keeps working for the next window', async () => {
		const backend = createBackend();
		const onError = jest.fn();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY, onError });
		backend.upsert.mockRejectedValueOnce(new Error('index is full'));

		writer.index(message('m1'));
		await jest.advanceTimersByTimeAsync(DELAY);
		writer.index(message('m2'));
		await jest.advanceTimersByTimeAsync(DELAY);

		expect(onError).toHaveBeenCalledTimes(1);
		expect(backend.upsert).toHaveBeenCalledTimes(2);
		expect(backend.upsert.mock.calls[1][0].map((doc) => doc.id)).toEqual(['m2']);
	});

	it('does not change the message that it indexes', () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });
		const original = message('m1');
		const copy = { ...original, u: { ...original.u } };

		writer.index(original);

		expect(original).toEqual(copy);
	});

	it('flush sends the queue at once', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		writer.index(message('m1'));
		await writer.flush();

		expect(backend.upsert).toHaveBeenCalledTimes(1);
	});
});
