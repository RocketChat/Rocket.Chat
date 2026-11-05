import { Streamer } from './streamer.module';
import type { IPublication, Rule } from './types';

class TestStreamer extends Streamer<any> {
	registerPublication(): void {
		// no-op for unit test subclass
	}

	registerMethod(): void {
		// no-op for unit test subclass
	}

	changedPayload(): string {
		return 'payload';
	}
}

type TestSubscription = {
	entry: any;
	connection: Record<string, unknown>;
	send: jest.Mock;
};

const makeSubscription = (connectionId: string): TestSubscription => {
	const send = jest.fn();
	const connection = { id: connectionId };

	return {
		connection,
		send,
		entry: {
			eventName: 'event',
			subscription: {
				connection,
				_session: {
					socket: { send },
				},
			},
		},
	};
};

describe('Streamer.sendToManySubscriptions', () => {
	let streamer: TestStreamer;
	let streamerNameSeed = 0;

	beforeEach(() => {
		streamer = new TestStreamer(`streamer-test-${streamerNameSeed++}`);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('waits for async permission checks before resolving', async () => {
		const sub = makeSubscription('conn-1');

		const isEmitAllowed = jest.spyOn(streamer, 'isEmitAllowed').mockResolvedValue(true);

		const sendPromise = streamer.sendToManySubscriptions(new Set([sub.entry]), undefined, 'event', [], 'test-msg');

		expect(sub.send).not.toHaveBeenCalled();

		await sendPromise;

		expect(isEmitAllowed).toHaveBeenCalledTimes(1);
		expect(isEmitAllowed).toHaveBeenCalledWith(sub.entry.subscription, 'event');
		expect(sub.send).toHaveBeenCalledTimes(1);
		expect(sub.send).toHaveBeenCalledWith('test-msg');
	});

	it('skips origin subscription and sends only to allowed subscriptions', async () => {
		const originSub = makeSubscription('origin');
		const allowedSub = makeSubscription('allowed');
		const deniedSub = makeSubscription('denied');

		jest.spyOn(streamer, 'isEmitAllowed').mockResolvedValueOnce(true).mockResolvedValueOnce(false);

		await streamer.sendToManySubscriptions(
			new Set([originSub.entry, allowedSub.entry, deniedSub.entry]),
			originSub.connection as any,
			'event',
			[],
			'test-msg',
		);

		expect(originSub.send).not.toHaveBeenCalled();
		expect(allowedSub.send).toHaveBeenCalledTimes(1);
		expect(allowedSub.send).toHaveBeenCalledWith('test-msg');
		expect(deniedSub.send).not.toHaveBeenCalled();
	});

	it('continues dispatching to other subscribers when a permission check rejects', async () => {
		const failingSub = makeSubscription('failing');
		const successSub = makeSubscription('success');
		const error = new Error('boom');

		const isEmitAllowed = jest.spyOn(streamer, 'isEmitAllowed').mockRejectedValueOnce(error).mockResolvedValueOnce(true);

		await streamer.sendToManySubscriptions(new Set([failingSub.entry, successSub.entry]), undefined, 'event-name', [], 'test-msg');

		expect(isEmitAllowed).toHaveBeenCalledTimes(2);
		expect(isEmitAllowed).toHaveBeenNthCalledWith(1, failingSub.entry.subscription, 'event-name');
		expect(isEmitAllowed).toHaveBeenNthCalledWith(2, successSub.entry.subscription, 'event-name');
		expect(failingSub.send).not.toHaveBeenCalled();
		expect(successSub.send).toHaveBeenCalledTimes(1);
		expect(successSub.send).toHaveBeenCalledWith('test-msg');
	});

	it('shares asynchronous preparation while retaining recipient scope and transform metadata', async () => {
		const first = makeSubscription('first');
		const second = makeSubscription('second');
		const rule = jest.fn(async function (this: IPublication) {
			return { connectionId: this.connection.id };
		});
		let finishPreparation!: (rule: Rule) => void;
		const prepare = jest.fn(
			() =>
				new Promise<Rule>((resolve) => {
					finishPreparation = resolve;
				}),
		);
		streamer.allowEmitWithPreparation(prepare);
		const transform = jest.fn((_stream, _sub, _event, _args, allowed) => allowed.connectionId);

		const delivery = streamer.sendToManySubscriptions(new Set([first.entry, second.entry]), undefined, 'event', ['argument'], transform);
		expect(prepare).toHaveBeenCalledTimes(1);
		expect(first.send).not.toHaveBeenCalled();
		finishPreparation(rule);
		await delivery;

		expect(prepare).toHaveBeenCalledWith('event', 'argument');
		expect(rule).toHaveBeenCalledTimes(2);
		expect(rule).toHaveBeenCalledWith('event', 'argument');
		expect(first.send).toHaveBeenCalledWith('first');
		expect(second.send).toHaveBeenCalledWith('second');
	});

	it('does not share preparation between concurrent deliveries', async () => {
		const sub = makeSubscription('recipient');
		const prepare = jest.fn(
			async (_event: string, allowed: boolean): Promise<Rule> =>
				async () =>
					allowed,
		);
		streamer.allowEmitWithPreparation(prepare);

		await Promise.all([
			streamer.sendToManySubscriptions(new Set([sub.entry]), undefined, 'event', [true], 'allowed'),
			streamer.sendToManySubscriptions(new Set([sub.entry]), undefined, 'event', [false], 'denied'),
		]);

		expect(prepare).toHaveBeenCalledTimes(2);
		expect(sub.send).toHaveBeenCalledTimes(1);
		expect(sub.send).toHaveBeenCalledWith('allowed');
	});

	it('preserves named emit rules without invoking default preparation', async () => {
		const sub = makeSubscription('recipient');
		const prepare = jest.fn();
		const namedRule = jest.fn(async () => true);
		streamer.allowEmitWithPreparation(prepare);
		streamer.allowEmit('event', namedRule);

		await streamer.sendToManySubscriptions(new Set([sub.entry]), undefined, 'event', ['argument'], 'message');

		expect(prepare).not.toHaveBeenCalled();
		expect(namedRule).toHaveBeenCalledWith('event', 'argument');
		expect(sub.send).toHaveBeenCalledWith('message');
	});

	it('fails closed for all recipients when preparation rejects', async () => {
		const first = makeSubscription('first');
		const second = makeSubscription('second');
		const prepare = jest.fn().mockRejectedValue(new Error('lookup failed'));
		streamer.allowEmitWithPreparation(prepare);

		await streamer.sendToManySubscriptions(new Set([first.entry, second.entry]), undefined, 'event', [], 'message');

		expect(prepare).toHaveBeenCalledTimes(1);
		expect(first.send).not.toHaveBeenCalled();
		expect(second.send).not.toHaveBeenCalled();
	});

	it('does not prepare events with no eligible recipients', async () => {
		const origin = makeSubscription('origin');
		const prepare = jest.fn();
		streamer.allowEmitWithPreparation(prepare);

		await streamer.sendToManySubscriptions(new Set(), undefined, 'event', [], 'message');
		await streamer.sendToManySubscriptions(new Set([origin.entry]), origin.connection, 'event', [], 'message');

		expect(prepare).not.toHaveBeenCalled();
	});
});
