import { createSharedSqlRunner } from './sharedSqlRunner';
import type { SqlRunner } from './workerSqlRunner';

const channels: SilentChannel[] = [];

// The real `setTimeout`: the key id comes from WebCrypto, which the fake timers do not wait for.
const realSetTimeout = globalThis.setTimeout;
const until = async (check: () => boolean) => {
	while (!check()) await new Promise((resolve) => realSetTimeout(resolve, 1));
};

const wrapKeyOf = (byte: number) => crypto.subtle.importKey('raw', new Uint8Array(32).fill(byte), 'HKDF', false, ['deriveKey']);

// Gives the calls of the tab with the channel `from` to the leader tab with the channel `to`, and the replies back,
// until `call` settles.
const relay = async (from: number, to: number, call: Promise<unknown>) => {
	const outcome = outcomeOf(call);
	channels[to].delivered ??= channels[to].postMessage.mock.calls.length;
	while (!outcome.settled) {
		const source = channels[from];
		const target = channels[to];
		const requests = source?.postMessage.mock.calls.slice(source.delivered ?? 0) ?? [];
		if (source) source.delivered = (source.delivered ?? 0) + requests.length;
		for (const [data] of requests) target.onmessage?.({ data } as MessageEvent);
		const replies = target.postMessage.mock.calls.slice(target.delivered);
		target.delivered = (target.delivered ?? 0) + replies.length;
		for (const [data] of replies) channels[from]?.onmessage?.({ data } as MessageEvent);
		await new Promise((resolve) => realSetTimeout(resolve, 1));
	}
	return call;
};

class SilentChannel {
	delivered: number | undefined;

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
		const outcome = outcomeOf(runner.open('scope', await wrapKeyOf(1)));

		await until(() => jest.getTimerCount() > 0);
		await jest.advanceTimersByTimeAsync(30_000);
		expect(runner.isLeader()).toBe(true);
		expect(outcome).toEqual({ settled: true, error: 'E2EE search index did not answer the open call in 30 s' });
	});

	it('runs no SQL for a tab that opened no index, also while the worker of the leader tab has one open', async () => {
		useLocks(true);
		const local = memoryRunner();
		const leader = createSharedSqlRunner('rc-e2ee-search:test', () => local);
		await leader.open('scope', await wrapKeyOf(1), SCHEMA);
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
		await leader.open('scope', await wrapKeyOf(1), SCHEMA);
		const [channel] = channels;

		const [{ request }] = channel.postMessage.mock.calls.find(([data]) => data.kind === 'request')!;
		const { keyId } = request;
		channel.onmessage?.({
			data: { kind: 'request', from: 'other-tab', id: 0, request: { op: 'close', scopeId: 'scope', keyId } },
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

	it.each(['scope', 'other'])('closes the unlocked local scope before a keyless open of %s without wiping it', async (scopeId) => {
		useLocks(true);
		const local = memoryRunner();
		const unsubscribe = jest.fn();
		const onIndexEvent = jest.fn(() => unsubscribe);
		const createLocal = jest.fn(() => ({ ...local, onIndexEvent }));
		const runner = createSharedSqlRunner('keyless', createLocal);
		const key = await wrapKeyOf(1);
		await runner.open('scope', key, SCHEMA);
		const [channel] = channels;

		await expect(runner.open(scopeId)).resolves.toEqual({ persistent: false, restored: false, locked: true });
		expect(local.close).toHaveBeenCalledTimes(1);
		expect(local.close).toHaveBeenCalledWith('scope');
		expect(local.wipe).not.toHaveBeenCalled();
		expect(unsubscribe).toHaveBeenCalledTimes(1);
		expect(channel.close).toHaveBeenCalledTimes(1);
		expect(runner.isLeader()).toBe(false);
		expect(jest.getTimerCount()).toBe(0);

		local.open.mockResolvedValueOnce({ persistent: true, restored: true });
		await expect(runner.open('scope', key, SCHEMA)).resolves.toEqual({ persistent: true, restored: true });
		expect(createLocal).toHaveBeenCalledTimes(2);
		expect(local.open).toHaveBeenLastCalledWith('scope', key, SCHEMA);
		expect(jest.getTimerCount()).toBe(0);
	});

	it('sends no call to the scope that this tab opened before, while the open of another scope fails', async () => {
		useLocks(false);
		const runner = createSharedSqlRunner('rc-e2ee-search:test', stalledRunner);
		const opened = runner.open('a', await wrapKeyOf(1), SCHEMA);
		await until(() => channels.length > 0);
		const [channel] = channels;
		const [{ from, id }] = channel.postMessage.mock.calls[0];
		channel.onmessage?.({ data: { kind: 'reply', to: from, id, rows: [{ persistent: false, restored: false }] } } as MessageEvent);
		await opened;

		const other = outcomeOf(runner.open('b', await wrapKeyOf(1), SCHEMA));
		await until(() => jest.getTimerCount() > 0);
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
		const key = await wrapKeyOf(1);

		const opened = runner.open('scope', key, SCHEMA);
		// The leader tab answers the open with its own worker.
		await until(() => channels.length > 0);
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

	it('signals index loss before SQL after memory-only leadership handover', async () => {
		const grant = useLeaderHandover();
		const local = memoryRunner();
		const runner = createSharedSqlRunner('memory-handover', () => local);
		const opened = runner.open('scope', await wrapKeyOf(1), SCHEMA);
		await until(() => channels.length > 0);
		const [channel] = channels;
		const [{ from, id }] = channel.postMessage.mock.calls[0];
		channel.onmessage?.({ data: { kind: 'reply', to: from, id, rows: [{ persistent: false, restored: false }] } } as MessageEvent);
		await opened;
		const events = jest.fn();
		runner.onIndexEvent!(events);
		grant();
		await runner.exec({ sql: 'SELECT n FROM t' });
		expect(events).toHaveBeenCalledWith({ scopeId: 'scope', type: 'lost' });
		expect(events.mock.invocationCallOrder[0]).toBeLessThan(local.exec.mock.invocationCallOrder[0]);
	});

	it('opens the index again after a failed open, not the database that the failed open closed', async () => {
		useLocks(true);
		const local = memoryRunner();
		const runner = createSharedSqlRunner('rc-e2ee-search:test', () => local);
		const key = await wrapKeyOf(1);
		await runner.open('scope', key, SCHEMA);

		local.open.mockRejectedValueOnce(new Error('the storage failed'));
		await expect(runner.open('scope', key, SCHEMA)).rejects.toThrow('the storage failed');
		await expect(runner.exec({ sql: 'SELECT n FROM t' })).resolves.toEqual([{ n: 1 }]);
		expect(local.open).toHaveBeenCalledTimes(3);
	});

	it('serves the index of the leader tab to another tab with the same wrap key', async () => {
		useLocks(true);
		const local = memoryRunner();
		const leader = createSharedSqlRunner('rc-e2ee-search:test', () => local);
		await leader.open('scope', await wrapKeyOf(1), SCHEMA);

		useLocks(false);
		const follower = createSharedSqlRunner('rc-e2ee-search:test', () => memoryRunner());
		await expect(relay(1, 0, follower.open('scope', await wrapKeyOf(1), SCHEMA))).resolves.toEqual({ persistent: false, restored: false });
		await expect(relay(1, 0, follower.exec({ sql: 'SELECT n FROM t' }))).resolves.toEqual([{ n: 1 }]);
		await relay(1, 0, follower.batch([{ sql: 'INSERT INTO t VALUES (2)' }]));
		await relay(1, 0, follower.flush());
		expect(local.open).toHaveBeenCalledTimes(2);
		expect(local.exec).toHaveBeenCalledTimes(1);
		expect(local.batch).toHaveBeenCalledTimes(1);
		expect(local.flush).toHaveBeenCalledTimes(1);
		expect(channels[0].postMessage.mock.calls.filter(([data]) => data.kind === 'reply')).toHaveLength(4);
		expect(jest.getTimerCount()).toBe(0);
	});

	it('filters channel events by scope and key and ignores an old channel after close', async () => {
		useLocks(false);
		const runner = createSharedSqlRunner('events', () => memoryRunner());
		const opening = runner.open('scope', await wrapKeyOf(1), SCHEMA);
		await until(() => channels.length > 0);
		const [channel] = channels;
		const [{ from, id, request }] = channel.postMessage.mock.calls[0];
		channel.onmessage?.({ data: { kind: 'reply', to: from, id, rows: [{ persistent: true, restored: true }] } } as MessageEvent);
		await opening;
		const events = jest.fn();
		runner.onIndexEvent!(events);
		channel.onmessage?.({ data: { kind: 'event', scopeId: 'scope', keyId: 'wrong', type: 'changed' } } as MessageEvent);
		channel.onmessage?.({ data: { kind: 'event', scopeId: 'other', keyId: request.keyId, type: 'changed' } } as MessageEvent);
		expect(events).not.toHaveBeenCalled();
		channel.onmessage?.({ data: { kind: 'event', scopeId: 'scope', keyId: request.keyId, type: 'changed' } } as MessageEvent);
		expect(events).toHaveBeenCalledTimes(1);
		const closed = runner.close('scope');
		const [{ id: closeId }] = channel.postMessage.mock.calls.at(-1)!;
		channel.onmessage?.({ data: { kind: 'reply', to: from, id: closeId, rows: [] } } as MessageEvent);
		await closed;
		channel.onmessage?.({ data: { kind: 'event', scopeId: 'scope', keyId: request.keyId, type: 'lost' } } as MessageEvent);
		expect(events).toHaveBeenCalledTimes(1);
	});

	it('gives no rows of the index of the leader tab to a tab with another wrap key', async () => {
		useLocks(true);
		const local = memoryRunner();
		const leader = createSharedSqlRunner('rc-e2ee-search:test', () => local);
		await leader.open('scope', await wrapKeyOf(1), SCHEMA);

		// After an E2EE key reset, the other tab has the new wrap key, and the leader tab still has the old one.
		useLocks(false);
		const follower = createSharedSqlRunner('rc-e2ee-search:test', () => memoryRunner());
		await expect(relay(1, 0, follower.open('scope', await wrapKeyOf(2), SCHEMA))).resolves.toEqual({
			persistent: false,
			restored: false,
			locked: true,
		});
		await expect(relay(1, 0, follower.exec({ sql: 'SELECT n FROM t' }))).rejects.toThrow('E2EE search index is not open');

		// A call that names the scope with the key id of another key does not reach the index either.
		const [openRequest] = channels[1].postMessage.mock.calls[0];
		channels[0].onmessage?.({
			data: {
				kind: 'request',
				from: 'other-tab',
				id: 9,
				request: { op: 'exec', scopeId: 'scope', keyId: openRequest.request.keyId, statement: { sql: 'SELECT n FROM t' } },
			},
		} as MessageEvent);
		await jest.advanceTimersByTimeAsync(0);
		expect(channels[0].postMessage).toHaveBeenLastCalledWith({
			kind: 'reply',
			to: 'other-tab',
			id: 9,
			error: 'E2EE search index is locked',
		});
		for (const keyId of [undefined, openRequest.request.keyId]) {
			channels[0].onmessage?.({
				data: { kind: 'request', from: 'other-tab', id: 10, request: { op: 'close', scopeId: 'scope', keyId } },
			} as MessageEvent);
			await jest.advanceTimersByTimeAsync(0);
		}
		await relay(1, 0, follower.close('scope'));
		expect(local.flush).not.toHaveBeenCalled();
		expect(local.close).not.toHaveBeenCalled();

		expect(local.open).toHaveBeenCalledTimes(1);
		expect(local.exec).not.toHaveBeenCalled();
		expect(local.wipe).not.toHaveBeenCalled();
		await expect(leader.exec({ sql: 'SELECT n FROM t' })).resolves.toEqual([{ n: 1 }]);
	});
});
