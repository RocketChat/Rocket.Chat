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
		const leader = createSharedSqlRunner('rc-e2ee-search:test', () => local);
		await leader.open('scope', {} as CryptoKey, SCHEMA);
		const [leaderChannel] = channels;

		useLocks(false);
		const follower = createSharedSqlRunner('rc-e2ee-search:test', () => memoryRunner());
		const calls = [follower.exec({ sql: 'SELECT 1' }), follower.batch([{ sql: 'DELETE FROM docs' }]), follower.flush()];
		const followerChannel = channels[1];
		for (const [data] of followerChannel.postMessage.mock.calls) leaderChannel.onmessage?.({ data } as MessageEvent);
		await jest.advanceTimersByTimeAsync(0);
		const replies = leaderChannel.postMessage.mock.calls.map(([data]) => data).filter((data) => data.kind === 'reply');
		for (const data of replies) followerChannel.onmessage?.({ data } as MessageEvent);

		for (const call of calls) await expect(call).rejects.toThrow('E2EE search index is not open');
		expect(replies).toHaveLength(3);
		expect(local.exec).not.toHaveBeenCalled();
		expect(local.batch).not.toHaveBeenCalled();
		expect(local.flush).not.toHaveBeenCalled();
	});

	it('saves the index of the leader tab, and does not close it, when another tab closes that scope', async () => {
		useLocks(true);
		const local = memoryRunner();
		const leader = createSharedSqlRunner('rc-e2ee-search:test', () => local);
		await leader.open('scope', {} as CryptoKey, SCHEMA);
		const [channel] = channels;

		channel.onmessage?.({
			data: { kind: 'request', from: 'other-tab', id: 0, request: { op: 'close', scopeId: 'scope' } },
		} as MessageEvent);
		await jest.advanceTimersByTimeAsync(0);
		expect(channel.postMessage).toHaveBeenLastCalledWith({ kind: 'reply', to: 'other-tab', id: 0, rows: [] });
		expect(local.flush).toHaveBeenCalledTimes(1);
		expect(local.close).not.toHaveBeenCalled();

		await expect(leader.exec({ sql: 'SELECT n FROM t' })).resolves.toEqual([{ n: 1 }]);
		expect(local.open).toHaveBeenCalledTimes(1);

		await leader.close('scope');
		expect(local.close).toHaveBeenCalledWith('scope');
	});

	it('sends no call to the scope that this tab opened before, while the open of another scope fails', async () => {
		useLocks(false);
		const runner = createSharedSqlRunner('rc-e2ee-search:test', stalledRunner);
		const opened = runner.open('a', {} as CryptoKey, SCHEMA);
		const [channel] = channels;
		const [{ from, id }] = channel.postMessage.mock.calls[0];
		channel.onmessage?.({ data: { kind: 'reply', to: from, id, rows: [{ persistent: false, restored: false }] } } as MessageEvent);
		await opened;

		const other = outcomeOf(runner.open('b', {} as CryptoKey, SCHEMA));
		await jest.advanceTimersByTimeAsync(30_000);
		expect(other).toEqual({ settled: true, error: 'E2EE search index did not answer the open call in 30 s' });

		void runner.exec({ sql: 'SELECT 1' }).catch(() => undefined);
		expect(channel.postMessage).toHaveBeenLastCalledWith(
			expect.objectContaining({ kind: 'request', request: { op: 'exec', scopeId: undefined, statement: { sql: 'SELECT 1' } } }),
		);
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
