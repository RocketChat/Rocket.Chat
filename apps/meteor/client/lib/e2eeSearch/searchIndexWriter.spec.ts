import type { IMessage } from '@rocket.chat/core-typings';
import type { E2EESearchDoc, ISearchIndexBackend } from '@rocket.chat/desktop-api';

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

	it('drops a message of a room that the user left, also when its decrypt ends after the leave (a quote or a late live message)', async () => {
		const backend = createBackend();
		const subscribed = new Set(['room1', 'room2']);
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY, isRoomSubscribed: (rid) => subscribed.has(rid) });

		subscribed.delete('room2');
		writer.index(message('m1'));
		writer.index(message('quoted', { rid: 'room2' }));
		await jest.advanceTimersByTimeAsync(DELAY);

		expect(backend.upsert).toHaveBeenCalledTimes(1);
		expect(backend.upsert.mock.calls[0][0].map((doc) => [doc.id, doc.rid])).toEqual([['m1', 'room1']]);
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

	it('reports a document that the index rejects also with its body cut, and keeps working for the next window', async () => {
		const backend = createBackend();
		const onError = jest.fn();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY, onError });
		backend.upsert.mockRejectedValueOnce(new Error('index is full')).mockRejectedValueOnce(new Error('index is full'));

		writer.index(message('m1'));
		await jest.advanceTimersByTimeAsync(DELAY);
		writer.index(message('m2'));
		await jest.advanceTimersByTimeAsync(DELAY);

		expect(onError).toHaveBeenCalledTimes(1);
		expect(backend.upsert).toHaveBeenCalledTimes(3);
		expect(backend.upsert.mock.calls[2][0].map((doc) => doc.id)).toEqual(['m2']);
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

describe('createSearchIndexWriter with a rejected batch', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	const rejecting = (isRejected: (doc: E2EESearchDoc) => boolean) => {
		const backend = createBackend();
		const accepted: E2EESearchDoc[] = [];
		backend.upsert.mockImplementation(async (docs) => {
			if (docs.some(isRejected)) throw new Error('docs are not valid');
			accepted.push(...docs);
		});
		return { backend, accepted };
	};

	it('splits a rejected batch in halves and retries each half, down to single documents', async () => {
		const { backend, accepted } = rejecting((doc) => doc.id === 'm3');
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		for (let i = 0; i < 8; i++) writer.index(message(`m${i}`));
		await writer.flush();

		expect(accepted.map((doc) => doc.id).sort()).toEqual(['m0', 'm1', 'm2', 'm4', 'm5', 'm6', 'm7']);
		expect(backend.upsert.mock.calls.map(([docs]) => docs.length)).toEqual([8, 4, 2, 2, 1, 1, 1, 4]);
	});

	it('cuts the body of a single rejected document and retries it once', async () => {
		const { backend, accepted } = rejecting((doc) => doc.body.length > 20);
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		writer.index(message('m1', { msg: 'first words then many more words' }));
		await writer.flush();

		expect(accepted).toHaveLength(1);
		expect(accepted[0]).toMatchObject({ id: 'm1', body: 'first words then' });
		expect(backend.upsert).toHaveBeenCalledTimes(2);
	});

	it('reports a document that is still rejected with its body cut, logs it by id without its text, and indexes the others', async () => {
		const { backend, accepted } = rejecting((doc) => doc.id === 'bad');
		const onError = jest.fn();
		const onWarn = jest.fn();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY, onError, onWarn });

		writer.index(message('ok'));
		writer.index(message('bad'));
		await writer.flush();

		expect(accepted.map((doc) => doc.id)).toEqual(['ok']);
		expect(backend.upsert.mock.calls.filter(([docs]) => docs.length === 1 && docs[0].id === 'bad')).toHaveLength(2);
		expect(onError).toHaveBeenCalledTimes(1);
		const warnings = onWarn.mock.calls.map(([text]) => text).join('\n');
		expect(warnings).toMatch(/2 documents/);
		expect(warnings).toMatch(/bad/);
		expect(warnings).not.toMatch(/secret words/);
	});

	it('rejects a flush with throwOnError when a document is not indexed, also one that a timed flush sent, and reports it once', async () => {
		const { backend } = rejecting((doc) => doc.id === 'bad');
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		writer.index(message('bad'));
		await jest.advanceTimersByTimeAsync(DELAY);
		writer.index(message('ok'));

		await expect(writer.flush({ throwOnError: true })).rejects.toThrow('docs are not valid');
		await expect(writer.flush({ throwOnError: true })).resolves.toBeUndefined();
	});

	it('resolves a flush with throwOnError when the index took every document, and a plain flush when it did not', async () => {
		const { backend } = rejecting((doc) => doc.id === 'bad');
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		writer.index(message('ok'));
		await expect(writer.flush({ throwOnError: true })).resolves.toBeUndefined();
		writer.index(message('bad'));
		await expect(writer.flush()).resolves.toBeUndefined();
	});

	it('stops the retries when the index closes', async () => {
		let open = true;
		const backend = createBackend();
		backend.upsert.mockImplementation(async () => {
			open = false;
			throw new Error('index is not open');
		});
		const writer = createSearchIndexWriter({ getBackend: () => (open ? backend : undefined), delayMs: DELAY });

		writer.index(message('m1'));
		writer.index(message('m2'));
		await writer.flush();

		expect(backend.upsert).toHaveBeenCalledTimes(1);
	});
});

describe('createSearchIndexWriter remove', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('removes a deleted message from the index', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		await writer.remove(['m1']);

		expect(backend.remove).toHaveBeenCalledWith(['m1']);
	});

	it('drops a queued document of a message that is deleted before the flush', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		writer.index(message('m1'));
		writer.index(message('m2'));
		await writer.remove(['m1']);
		await jest.advanceTimersByTimeAsync(DELAY);

		expect(backend.upsert.mock.calls.flatMap(([docs]) => docs.map((doc) => doc.id))).toEqual(['m2']);
		expect(backend.remove).toHaveBeenCalledWith(['m1']);
	});

	it('sends the remove after an upsert of the same message that is in flight', async () => {
		const backend = createBackend();
		const order: string[] = [];
		let finishUpsert: () => void = () => undefined;
		backend.upsert.mockImplementationOnce(
			() =>
				new Promise<void>((resolve) => {
					finishUpsert = () => {
						order.push('upsert');
						resolve();
					};
				}),
		);
		backend.remove.mockImplementation(async () => {
			order.push('remove');
		});
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		writer.index(message('m1'));
		await jest.advanceTimersByTimeAsync(DELAY);
		const removed = writer.remove(['m1']);
		await jest.advanceTimersByTimeAsync(0);
		finishUpsert();
		await removed;

		expect(order).toEqual(['upsert', 'remove']);
	});

	it('does not index again a message that was deleted (a decrypt that ends after the delete)', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		await writer.remove(['m1']);
		writer.index(message('m1'));
		await jest.advanceTimersByTimeAsync(DELAY);

		expect(backend.upsert).not.toHaveBeenCalled();
	});

	it('removes a message that arrives as a deletion placeholder, once, and does not index its old text again', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		writer.index(message('m1'));
		await jest.advanceTimersByTimeAsync(DELAY);
		const placeholder = message('m1', { t: 'rm', msg: '', e2e: undefined });
		writer.index(placeholder);
		writer.index(placeholder);
		await writer.flush();
		writer.index(message('m1'));
		await jest.advanceTimersByTimeAsync(DELAY);

		expect(backend.remove.mock.calls).toEqual([[['m1']]]);
		expect(backend.upsert).toHaveBeenCalledTimes(1);
	});

	it('drops a queued document of a message that becomes a deletion placeholder before the flush', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		writer.index(message('m1'));
		writer.index(message('m1', { t: 'rm', msg: '' }));
		await jest.advanceTimersByTimeAsync(DELAY);

		expect(backend.upsert).not.toHaveBeenCalled();
		expect(backend.remove).toHaveBeenCalledWith(['m1']);
	});

	it('removes the old document of a message that an edit left with no text, and indexes it again after a new edit', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		writer.index(message('m1'));
		await jest.advanceTimersByTimeAsync(DELAY);
		writer.index(message('m1', { msg: '  ' }));
		await writer.flush();
		writer.index(message('m1', { msg: 'new words' }));
		await jest.advanceTimersByTimeAsync(DELAY);

		expect(backend.remove).toHaveBeenCalledWith(['m1']);
		expect(backend.upsert.mock.calls.map(([docs]) => docs.map((doc) => doc.body))).toEqual([['secret words m1'], ['new words']]);
	});

	it('does not remove a message that failed to decrypt or is not decrypted yet', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		writer.index(message('m1', { e2e: 'pending', msg: '' }));
		writer.index(message('m2', { msg: '', decryptFailed: true } as Partial<IMessage>));
		await writer.flush();

		expect(backend.remove).not.toHaveBeenCalled();
	});

	it('indexes again a message whose document was only dropped (not deleted)', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		await writer.remove(['m1'], { deleted: false });
		writer.index(message('m1'));
		await jest.advanceTimersByTimeAsync(DELAY);

		expect(backend.remove).toHaveBeenCalledWith(['m1']);
		expect(backend.upsert.mock.calls.flatMap(([docs]) => docs.map((doc) => doc.id))).toEqual(['m1']);
	});

	it('sends no remove when no index is open', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => undefined, delayMs: DELAY });

		await writer.remove(['m1']);

		expect(backend.remove).not.toHaveBeenCalled();
	});

	it('splits a large remove into calls of at most 500 ids', async () => {
		const backend = createBackend();
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

		await writer.remove(Array.from({ length: 1201 }, (_, i) => `m${i}`));

		expect(backend.remove.mock.calls.map(([ids]) => ids.length)).toEqual([500, 500, 201]);
	});

	it('reports a failed remove', async () => {
		const backend = createBackend();
		const onError = jest.fn();
		backend.remove.mockRejectedValueOnce(new Error('closed'));
		const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY, onError });

		await writer.remove(['m1']);

		expect(onError).toHaveBeenCalledTimes(1);
	});
	describe('bindToOpenIndex', () => {
		it('drops a message whose decrypt started for an index that closed before it ended, when another index is open', async () => {
			const first = createBackend();
			const second = createBackend();
			let current: ISearchIndexBackend | undefined = first;
			const writer = createSearchIndexWriter({ getBackend: () => current, delayMs: DELAY });

			const indexDecrypted = writer.bindToOpenIndex();
			current = second;
			indexDecrypted(message('of-the-first-user'));
			writer.index(message('of-the-second-user'));
			await jest.advanceTimersByTimeAsync(DELAY);

			expect(first.upsert).not.toHaveBeenCalled();
			expect(second.upsert).toHaveBeenCalledTimes(1);
			expect(second.upsert.mock.calls[0][0].map((doc) => doc.id)).toEqual(['of-the-second-user']);
		});

		it('drops a message whose decrypt started while no index was open', async () => {
			const backend = createBackend();
			let current: ISearchIndexBackend | undefined;
			const writer = createSearchIndexWriter({ getBackend: () => current, delayMs: DELAY });

			const indexDecrypted = writer.bindToOpenIndex();
			current = backend;
			indexDecrypted(message('m1'));
			await jest.advanceTimersByTimeAsync(DELAY);

			expect(backend.upsert).not.toHaveBeenCalled();
		});

		it('indexes the message when the same index is still open', async () => {
			const backend = createBackend();
			const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });

			writer.bindToOpenIndex()(message('m1'));
			await jest.advanceTimersByTimeAsync(DELAY);

			expect(backend.upsert.mock.calls[0][0].map((doc) => doc.id)).toEqual(['m1']);
		});
	});

	describe('changes', () => {
		it('tells the subscribers after an upsert and after a remove, and counts the changes', async () => {
			const backend = createBackend();
			const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY });
			const listener = jest.fn();
			const unsubscribe = writer.subscribe(listener);

			writer.index(message('m1'));
			await writer.flush();
			expect(listener).toHaveBeenCalledTimes(1);
			expect(writer.getVersion()).toBe(1);
			await writer.remove(['m1']);

			expect(listener).toHaveBeenCalledTimes(2);
			expect(writer.getVersion()).toBe(2);
			unsubscribe();
			writer.index(message('m2'));
			await writer.flush();
			expect(listener).toHaveBeenCalledTimes(2);
		});
	});

	describe('remove with throwOnError', () => {
		it('rejects when the index rejected the remove, and resolves without it', async () => {
			const backend = createBackend();
			backend.remove.mockRejectedValue(new Error('remove failed'));
			const onError = jest.fn();
			const writer = createSearchIndexWriter({ getBackend: () => backend, delayMs: DELAY, onError });

			await expect(writer.remove(['m1'], { throwOnError: true })).rejects.toThrow('remove failed');
			await expect(writer.remove(['m2'])).resolves.toBeUndefined();
			expect(onError).toHaveBeenCalledTimes(2);
		});
	});
});
