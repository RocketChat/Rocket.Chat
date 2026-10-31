import { createWorkerSqlRunner } from './workerSqlRunner';

const workers: FakeWorker[] = [];

class FakeWorker {
	onmessage: ((event: MessageEvent) => void) | null = null;

	onerror: ((event: ErrorEvent) => void) | null = null;

	postMessage = jest.fn();

	terminate = jest.fn();

	constructor() {
		workers.push(this);
	}

	reply(data: { rows?: unknown[]; error?: string }) {
		this.replyTo(this.postMessage.mock.calls.length - 1, data);
	}

	// Answers the message that this worker got at `index`.
	replyTo(index: number, data: { rows?: unknown[]; error?: string }) {
		const { id } = this.postMessage.mock.calls[index][0];
		this.onmessage?.({ data: { id, ...data } } as MessageEvent);
	}

	ops() {
		return this.postMessage.mock.calls.map(([request]) => request.op);
	}

	fail(message: string) {
		this.onerror?.({ message, preventDefault: jest.fn() } as unknown as ErrorEvent);
	}
}

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createWorkerSqlRunner', () => {
	beforeEach(() => {
		(window as { Worker?: unknown }).Worker = FakeWorker;
	});

	afterEach(() => {
		workers.length = 0;
		delete (window as { Worker?: unknown }).Worker;
	});

	it('runs the schema after an open that is not locked', async () => {
		const runner = createWorkerSqlRunner('/worker.mjs');
		const opened = runner.open('scope', {} as CryptoKey, 'CREATE TABLE IF NOT EXISTS t (n)');
		const [worker] = workers;
		worker.reply({ rows: [{ persistent: true, restored: false }] });
		await flushMicrotasks();

		expect(worker.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ op: 'exec', sql: 'CREATE TABLE IF NOT EXISTS t (n)' }));
		worker.reply({ rows: [] });
		await expect(opened).resolves.toEqual({ persistent: true, restored: false });
	});

	it('runs no schema after a locked open', async () => {
		const runner = createWorkerSqlRunner('/worker.mjs');
		const opened = runner.open('scope', undefined, 'CREATE TABLE IF NOT EXISTS t (n)');
		const [worker] = workers;
		worker.reply({ rows: [{ persistent: false, restored: false, locked: true }] });

		await expect(opened).resolves.toEqual({ persistent: false, restored: false, locked: true });
		expect(worker.postMessage).toHaveBeenCalledTimes(1);
	});

	it('fails the waiting calls when the worker fails, and starts a new worker for the next call', async () => {
		const runner = createWorkerSqlRunner('/worker.mjs');
		const listed = runner.exec({ sql: 'SELECT 1' });
		const saved = runner.flush();
		const [failed] = workers;
		expect(failed.ops()).toEqual(['exec', 'flush']);
		failed.fail('the module did not load');

		await expect(listed).rejects.toThrow('E2EE search worker failed: the module did not load');
		await expect(saved).rejects.toThrow('E2EE search worker failed: the module did not load');
		expect(failed.terminate).toHaveBeenCalled();

		const again = runner.open('scope', {} as CryptoKey);
		expect(workers).toHaveLength(2);
		workers[1].reply({ rows: [{ persistent: true, restored: true }] });
		await expect(again).resolves.toEqual({ persistent: true, restored: true });

		// A late error of the worker that is already replaced fails nothing.
		const search = runner.exec({ sql: 'SELECT 1' });
		failed.fail('late');
		workers[1].reply({ rows: [{ n: 1 }] });
		await expect(search).resolves.toEqual([{ n: 1 }]);
	});

	it('opens the index again in the worker that replaces a failed one, before the next SQL', async () => {
		const runner = createWorkerSqlRunner('/worker.mjs');
		const key = {} as CryptoKey;
		const opened = runner.open('scope', key, 'CREATE TABLE IF NOT EXISTS t (n)');
		const [failed] = workers;
		failed.reply({ rows: [{ persistent: true, restored: false }] });
		await flushMicrotasks();
		failed.reply({ rows: [] });
		await opened;

		failed.fail('out of memory');
		const search = runner.exec({ sql: 'SELECT n FROM t' });
		await flushMicrotasks();
		const replacement = workers[1];
		expect(replacement.postMessage).toHaveBeenCalledTimes(1);
		replacement.replyTo(0, { rows: [{ persistent: true, restored: true }] });
		await flushMicrotasks();
		replacement.replyTo(1, { rows: [] });
		await flushMicrotasks();
		expect(replacement.postMessage.mock.calls.map(([request]) => request)).toEqual([
			expect.objectContaining({ op: 'open', scopeId: 'scope', wrapKey: key }),
			expect.objectContaining({ op: 'exec', sql: 'CREATE TABLE IF NOT EXISTS t (n)' }),
			expect.objectContaining({ op: 'exec', sql: 'SELECT n FROM t' }),
		]);
		replacement.replyTo(2, { rows: [{ n: 1 }] });
		await expect(search).resolves.toEqual([{ n: 1 }]);
	});

	it('signals scope-bound loss on worker failure and waits for recovery before SQL', async () => {
		const runner = createWorkerSqlRunner('/worker.mjs');
		const events = jest.fn();
		runner.onIndexEvent!(events);
		const opening = runner.open('scope', {} as CryptoKey);
		workers[0].reply({ rows: [{ persistent: false, restored: false }] });
		await opening;
		workers[0].fail('out of memory');
		expect(events).toHaveBeenCalledWith({ scopeId: 'scope', type: 'lost' });
		const sql = runner.exec({ sql: 'SELECT 1' });
		await flushMicrotasks();
		expect(workers[1].ops()).toEqual(['open']);
		workers[1].reply({ error: 'Recovery refused' });
		await expect(sql).rejects.toThrow('Recovery refused');
		expect(workers[1].ops()).toEqual(['open']);
	});

	it('does not open a closed index again in the worker that replaces a failed one', async () => {
		const runner = createWorkerSqlRunner('/worker.mjs');
		const opened = runner.open('scope', {} as CryptoKey);
		const [failed] = workers;
		failed.reply({ rows: [{ persistent: true, restored: false }] });
		await opened;
		const closed = runner.close('scope');
		await flushMicrotasks();
		expect(failed.ops()).toEqual(['open', 'close']);
		failed.reply({ rows: [] });
		await closed;

		failed.fail('out of memory');
		const search = runner.exec({ sql: 'SELECT 1' });
		expect(workers[1].ops()).toEqual(['exec']);
		workers[1].reply({ error: 'E2EE search index is not open' });
		await expect(search).rejects.toThrow('E2EE search index is not open');
	});

	it('opens another scope after delayed crash recovery is cancelled', async () => {
		jest.useFakeTimers();
		try {
			const runner = createWorkerSqlRunner('/worker.mjs');
			const opened = runner.open('a', {} as CryptoKey);
			workers[0].reply({ rows: [{ persistent: true, restored: true }] });
			await opened;
			await jest.advanceTimersByTimeAsync(0);
			workers[0].fail('out of memory');

			const search = runner.exec({ sql: 'SELECT n FROM t' });
			const rejectedSearch = expect(search).rejects.toThrow('E2EE search index is closed');
			const recovery = workers[1];
			expect(recovery.ops()).toEqual(['open']);
			const key = {} as CryptoKey;
			const opening = runner.open('b', key, 'CREATE TABLE IF NOT EXISTS t (n)');
			expect(recovery.ops()).toEqual(['open']);

			recovery.reply({ rows: [{ persistent: true, restored: true }] });
			await rejectedSearch;
			await jest.advanceTimersByTimeAsync(0);
			expect(recovery.terminate).toHaveBeenCalledTimes(1);
			expect(workers).toHaveLength(3);
			const replacement = workers[2];
			expect(replacement.postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ op: 'open', scopeId: 'b', wrapKey: key }));
			replacement.reply({ rows: [{ persistent: true, restored: true }] });
			await jest.advanceTimersByTimeAsync(0);
			expect(replacement.ops()).toEqual(['open', 'exec']);
			replacement.reply({ rows: [] });
			await expect(opening).resolves.toEqual({ persistent: true, restored: true });

			const listed = runner.exec({ sql: 'SELECT n FROM t' });
			replacement.reply({ rows: [{ n: 2 }] });
			await expect(listed).resolves.toEqual([{ n: 2 }]);
			expect(jest.getTimerCount()).toBe(0);
		} finally {
			jest.useRealTimers();
		}
	});

	it('rejects SQL waiting when close terminates the worker and clears every timer', async () => {
		jest.useFakeTimers();
		try {
			const runner = createWorkerSqlRunner('/worker.mjs');
			const opened = runner.open('scope', {} as CryptoKey);
			const [worker] = workers;
			worker.reply({ rows: [{ persistent: true, restored: true }] });
			await opened;
			await jest.advanceTimersByTimeAsync(0);
			const beforeClose = runner.exec({ sql: 'SELECT 1' });
			const rejectedBefore = expect(beforeClose).rejects.toThrow('E2EE search index is closed');
			const closed = runner.close('scope');
			const afterClose = runner.exec({ sql: 'SELECT 2' });
			const rejectedAfter = expect(afterClose).rejects.toThrow('E2EE search index is closed');
			expect(worker.ops()).toEqual(['open', 'exec', 'close', 'exec']);
			expect(jest.getTimerCount()).toBe(3);
			worker.replyTo(2, { rows: [] });
			await closed;
			await rejectedBefore;
			await rejectedAfter;
			expect(worker.terminate).toHaveBeenCalledTimes(1);
			expect(jest.getTimerCount()).toBe(0);
			worker.replyTo(3, { rows: [{ n: 2 }] });
			expect(jest.getTimerCount()).toBe(0);
		} finally {
			jest.useRealTimers();
		}
	});

	it('sends no other call between an open and its schema', async () => {
		const runner = createWorkerSqlRunner('/worker.mjs');
		const opened = runner.open('scope', {} as CryptoKey, 'CREATE TABLE IF NOT EXISTS t (n)');
		const write = runner.batch([{ sql: 'INSERT INTO t VALUES (1)' }]);
		const [worker] = workers;
		expect(worker.ops()).toEqual(['open']);

		worker.reply({ rows: [{ persistent: true, restored: false }] });
		await flushMicrotasks();
		expect(worker.ops()).toEqual(['open', 'exec']);
		worker.reply({ rows: [] });
		await opened;
		await flushMicrotasks();
		expect(worker.ops()).toEqual(['open', 'exec', 'batch']);
		worker.reply({ rows: [] });
		await expect(write).resolves.toBeUndefined();
	});

	it('fails a call that the worker does not answer in 30 s, and ignores a late answer', async () => {
		jest.useFakeTimers();
		try {
			const runner = createWorkerSqlRunner('/worker.mjs');
			const outcome = { settled: false, error: undefined as string | undefined };
			runner.exec({ sql: 'SELECT 1' }).then(
				() => {
					outcome.settled = true;
				},
				(error: Error) => {
					outcome.settled = true;
					outcome.error = error.message;
				},
			);

			await jest.advanceTimersByTimeAsync(29_999);
			expect(outcome.settled).toBe(false);
			await jest.advanceTimersByTimeAsync(1);
			expect(outcome).toEqual({ settled: true, error: 'E2EE search worker did not answer the exec call in 30 s' });

			workers[0].reply({ rows: [{ n: 1 }] });
			await jest.advanceTimersByTimeAsync(0);
			expect(outcome.error).toBe('E2EE search worker did not answer the exec call in 30 s');
		} finally {
			jest.useRealTimers();
		}
	});
});
