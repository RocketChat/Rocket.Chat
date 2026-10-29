import { createSharedSqlRunner } from './sharedSqlRunner';
import type { SqlRunner } from './workerSqlRunner';

const channels: SilentChannel[] = [];

class SilentChannel {
	onmessage: ((event: MessageEvent) => void) | null = null;

	postMessage = jest.fn();

	close = jest.fn();

	constructor() {
		channels.push(this);
	}
}

// `granted` false: another tab holds the leader lock and never answers. `granted` true: this tab is the leader.
const useLocks = (granted: boolean) => {
	Object.defineProperty(navigator, 'locks', {
		configurable: true,
		value: {
			request: (_name: string, _options: unknown, callback: () => Promise<void>) =>
				granted ? Promise.resolve().then(callback) : new Promise(() => undefined),
		},
	});
};

// Another tab holds the leader lock until `grant` runs: then that tab closed, and this tab becomes the leader.
const useLeaderHandover = () => {
	let grant: (() => void) | undefined;
	Object.defineProperty(navigator, 'locks', {
		configurable: true,
		value: {
			request: (_name: string, _options: unknown, callback: () => Promise<void>) =>
				new Promise<void>((resolve) => {
					grant = () => resolve(callback());
				}),
		},
	});
	return () => grant?.();
};

const outcomeOf = (call: Promise<unknown>) => {
	const outcome: { error?: string; settled: boolean } = { settled: false };
	call.then(
		() => {
			outcome.settled = true;
		},
		(error: Error) => {
			outcome.settled = true;
			outcome.error = error.message;
		},
	);
	return outcome;
};

const stalledRunner = (): SqlRunner => {
	const never = () => new Promise<never>(() => undefined);
	return { open: never, exec: never, batch: never, flush: never, wipe: never, close: never };
};

const SCHEMA = 'CREATE TABLE IF NOT EXISTS t (n INTEGER)';

const memoryRunner = () => ({
	open: jest.fn<ReturnType<SqlRunner['open']>, Parameters<SqlRunner['open']>>(async () => ({ persistent: false, restored: false })),
	exec: jest.fn<ReturnType<SqlRunner['exec']>, Parameters<SqlRunner['exec']>>(async () => [{ n: 1 }]),
	batch: jest.fn<ReturnType<SqlRunner['batch']>, Parameters<SqlRunner['batch']>>(async () => undefined),
	flush: jest.fn<ReturnType<SqlRunner['flush']>, Parameters<SqlRunner['flush']>>(async () => undefined),
	wipe: jest.fn<ReturnType<SqlRunner['wipe']>, Parameters<SqlRunner['wipe']>>(async () => undefined),
	close: jest.fn<ReturnType<SqlRunner['close']>, Parameters<SqlRunner['close']>>(async () => undefined),
});

describe('createSharedSqlRunner', () => {
	const { BroadcastChannel } = globalThis;

	beforeEach(() => {
		jest.useFakeTimers();
		globalThis.BroadcastChannel = SilentChannel as unknown as typeof BroadcastChannel;
	});

	afterEach(() => {
		channels.length = 0;
		jest.useRealTimers();
		globalThis.BroadcastChannel = BroadcastChannel;
		delete (navigator as { locks?: unknown }).locks;
	});

	it('fails a call to the leader tab that gets no answer in 30 s', async () => {
		useLocks(false);
		const createLocal = jest.fn(stalledRunner);
		const outcome = outcomeOf(createSharedSqlRunner('rc-e2ee-search:test', createLocal).exec({ sql: 'SELECT 1' }));

		await jest.advanceTimersByTimeAsync(29_999);
		expect(outcome.settled).toBe(false);

		await jest.advanceTimersByTimeAsync(1);
		expect(outcome).toEqual({ settled: true, error: 'E2EE search index did not answer the exec call in 30 s' });
		expect(createLocal).not.toHaveBeenCalled();
	});

	it('fails a call in the leader tab when its own worker does not answer in 30 s', async () => {
		useLocks(true);
		const runner = createSharedSqlRunner('rc-e2ee-search:test', stalledRunner);
		const outcome = outcomeOf(runner.open('scope', {} as CryptoKey));

		await jest.advanceTimersByTimeAsync(30_000);
		expect(runner.isLeader()).toBe(true);
		expect(outcome).toEqual({ settled: true, error: 'E2EE search index did not answer the open call in 30 s' });
	});

	it('runs no SQL for a tab that opened no index, also while the worker of the leader tab has one open', async () => {
		useLocks(true);
		const local = memoryRunner();
		const runner = createSharedSqlRunner('rc-e2ee-search:test', () => local);

		await expect(runner.exec({ sql: 'SELECT 1' })).rejects.toThrow('E2EE search index is not open');
		await expect(runner.batch([{ sql: 'DELETE FROM docs' }])).rejects.toThrow('E2EE search index is not open');
		await expect(runner.flush()).rejects.toThrow('E2EE search index is not open');
		expect(local.exec).not.toHaveBeenCalled();
		expect(local.batch).not.toHaveBeenCalled();
		expect(local.flush).not.toHaveBeenCalled();
	});

	it('creates the tables when this tab becomes the leader and opens the index in its own worker', async () => {
		const grant = useLeaderHandover();
		const local = memoryRunner();
		const runner = createSharedSqlRunner('rc-e2ee-search:test', () => local);
		const key = {} as CryptoKey;

		const opened = runner.open('scope', key, SCHEMA);
		// The leader tab answers the open with its own worker.
		const [channel] = channels;
		const [{ from, id }] = channel.postMessage.mock.calls[0];
		channel.onmessage?.({ data: { kind: 'reply', to: from, id, rows: [{ persistent: false, restored: false }] } } as MessageEvent);
		await expect(opened).resolves.toEqual({ persistent: false, restored: false });
		expect(local.open).not.toHaveBeenCalled();

		grant();
		await expect(runner.exec({ sql: 'SELECT n FROM t' })).resolves.toEqual([{ n: 1 }]);
		expect(runner.isLeader()).toBe(true);
		expect(local.open).toHaveBeenCalledWith('scope', key, SCHEMA);
		expect(local.open.mock.invocationCallOrder[0]).toBeLessThan(local.exec.mock.invocationCallOrder[0]);
	});

	it('opens the index again after a failed open, not the database that the failed open closed', async () => {
		useLocks(true);
		const local = memoryRunner();
		const runner = createSharedSqlRunner('rc-e2ee-search:test', () => local);
		const key = {} as CryptoKey;
		await runner.open('scope', key, SCHEMA);

		local.open.mockRejectedValueOnce(new Error('the storage failed'));
		await expect(runner.open('scope', key, SCHEMA)).rejects.toThrow('the storage failed');
		await expect(runner.exec({ sql: 'SELECT n FROM t' })).resolves.toEqual([{ n: 1 }]);
		expect(local.open).toHaveBeenCalledTimes(3);
	});
});
