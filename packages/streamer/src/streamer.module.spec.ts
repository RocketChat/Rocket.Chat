import { Streamer } from './streamer.module';

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
});
