import WebSocket from 'ws';

import { fanOutText } from './Streamer';
import { MAX_BUFFERED_BYTES, WS_ERRORS } from './constants';

jest.mock('@rocket.chat/core-services', () => ({
	api: { broadcast: jest.fn() },
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockImplementation(() => ({ error: jest.fn(), warn: jest.fn(), info: jest.fn() })),
}));

jest.mock('./configureServer', () => ({
	server: {
		serialize: (obj: unknown) => JSON.stringify(obj),
		publish: jest.fn(),
		methods: jest.fn(),
	},
}));

type FakeSender = { sendFrame: jest.Mock };

const makeFakeWs = (overrides: Partial<{ readyState: number; bufferedAmount: number; sendError: Error }> = {}) => {
	const sender: FakeSender = {
		sendFrame: jest.fn((_frame, cb: (err?: unknown) => void) => cb(overrides.sendError)),
	};
	return {
		readyState: overrides.readyState ?? WebSocket.OPEN,
		bufferedAmount: overrides.bufferedAmount ?? 0,
		_sender: sender,
		send: jest.fn((_payload, cb: (err?: unknown) => void) => cb()),
		close: jest.fn(function (this: any) {
			this.readyState = WebSocket.CLOSED;
		}),
	};
};

const makeSubscription = (ws: ReturnType<typeof makeFakeWs>, meteorClient = false) => {
	const stop = jest.fn();
	const subscription = {
		client: { ws, meteorClient },
		connection: { id: `conn-${Math.random()}` },
		stop,
	};
	return { subscription, stop };
};

const baseOpts = {
	eventName: 'message',
	streamName: 'stream-room-messages',
	retransmitToSelf: false,
	origin: undefined,
	isEmitAllowed: jest.fn().mockResolvedValue(true),
};

describe('fanOutText', () => {
	beforeEach(() => {
		baseOpts.isEmitAllowed.mockClear();
		baseOpts.isEmitAllowed.mockResolvedValue(true);
	});

	it('writes one frame per subscriber via the private sender', async () => {
		const a = makeFakeWs();
		const b = makeFakeWs();
		const subA = makeSubscription(a);
		const subB = makeSubscription(b);
		const set = new Set([subA, subB]);

		await fanOutText(set as any, '{"x":1}', baseOpts);

		expect(a._sender.sendFrame).toHaveBeenCalledTimes(1);
		expect(b._sender.sendFrame).toHaveBeenCalledTimes(1);
		expect(subA.stop).not.toHaveBeenCalled();
		expect(subB.stop).not.toHaveBeenCalled();
	});

	it('skips subscribers whose WebSocket is not OPEN and stops their subscriptions', async () => {
		const dead = makeFakeWs({ readyState: WebSocket.CLOSED });
		const live = makeFakeWs();
		const subDead = makeSubscription(dead);
		const subLive = makeSubscription(live);
		const set = new Set([subDead, subLive]);

		await fanOutText(set as any, '{"x":1}', baseOpts);

		expect(dead._sender.sendFrame).not.toHaveBeenCalled();
		expect(subDead.stop).toHaveBeenCalled();
		expect(live._sender.sendFrame).toHaveBeenCalledTimes(1);
		expect(subLive.stop).not.toHaveBeenCalled();
	});

	it('drops the frame and closes the socket with 1013 when the subscriber is over the buffer threshold', async () => {
		const slow = makeFakeWs({ bufferedAmount: MAX_BUFFERED_BYTES + 1 });
		const sub = makeSubscription(slow);
		const set = new Set([sub]);

		await fanOutText(set as any, '{"x":1}', baseOpts);

		expect(slow.close).toHaveBeenCalledWith(WS_ERRORS.SLOW_CONSUMER, expect.any(String));
		expect(slow._sender.sendFrame).not.toHaveBeenCalled();
		expect(sub.stop).toHaveBeenCalled();
	});

	it('skips the originating connection when retransmitToSelf is false', async () => {
		const ws = makeFakeWs();
		const sub = makeSubscription(ws);
		const set = new Set([sub]);

		await fanOutText(set as any, '{"x":1}', { ...baseOpts, origin: sub.subscription.connection });

		expect(ws._sender.sendFrame).not.toHaveBeenCalled();
		expect(sub.stop).not.toHaveBeenCalled();
	});

	it('still delivers to the originating connection when retransmitToSelf is true', async () => {
		const ws = makeFakeWs();
		const sub = makeSubscription(ws);
		const set = new Set([sub]);

		await fanOutText(set as any, '{"x":1}', { ...baseOpts, retransmitToSelf: true, origin: sub.subscription.connection });

		expect(ws._sender.sendFrame).toHaveBeenCalledTimes(1);
	});

	it('skips subscribers when isEmitAllowed returns false', async () => {
		const ws = makeFakeWs();
		const sub = makeSubscription(ws);
		const set = new Set([sub]);
		const isEmitAllowed = jest.fn().mockResolvedValue(false);

		await fanOutText(set as any, '{"x":1}', { ...baseOpts, isEmitAllowed });

		expect(isEmitAllowed).toHaveBeenCalledTimes(1);
		expect(ws._sender.sendFrame).not.toHaveBeenCalled();
	});

	it('uses the meteor SockJS array wrapper for meteor clients', async () => {
		const meteorWs = makeFakeWs();
		const normalWs = makeFakeWs();
		const meteorSub = makeSubscription(meteorWs, true);
		const normalSub = makeSubscription(normalWs, false);
		const set = new Set([meteorSub, normalSub]);

		await fanOutText(set as any, '{"x":1}', baseOpts);

		const meteorFrame = meteorWs._sender.sendFrame.mock.calls[0][0];
		const normalFrame = normalWs._sender.sendFrame.mock.calls[0][0];

		// The meteor variant wraps the message inside `a[...]` so the encoded buffer is
		// strictly larger than the plain payload variant.
		expect(Buffer.concat(meteorFrame).length).toBeGreaterThan(Buffer.concat(normalFrame).length);
	});
});
