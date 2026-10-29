import { createSharedSqlRunner } from './sharedSqlRunner';
import type { SqlRunner } from './workerSqlRunner';

class SilentChannel {
	onmessage: ((event: MessageEvent) => void) | null = null;

	postMessage = jest.fn();

	close = jest.fn();
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

describe('createSharedSqlRunner', () => {
	const { BroadcastChannel } = globalThis;

	beforeEach(() => {
		jest.useFakeTimers();
		globalThis.BroadcastChannel = SilentChannel as unknown as typeof BroadcastChannel;
	});

	afterEach(() => {
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
		const outcome = outcomeOf(runner.flush());

		await jest.advanceTimersByTimeAsync(30_000);
		expect(runner.isLeader()).toBe(true);
		expect(outcome).toEqual({ settled: true, error: 'E2EE search index did not answer the flush call in 30 s' });
	});
});
