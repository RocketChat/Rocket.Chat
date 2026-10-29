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
		const { id } = this.postMessage.mock.calls[this.postMessage.mock.calls.length - 1][0];
		this.onmessage?.({ data: { id, ...data } } as MessageEvent);
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
		const opened = runner.open('scope', {} as CryptoKey);
		const [failed] = workers;
		failed.fail('the module did not load');

		await expect(opened).rejects.toThrow('E2EE search worker failed: the module did not load');
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
});
