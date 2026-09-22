import type { DDPSubscription } from '@rocket.chat/streamer';
import WebSocket from 'ws';

import { Server } from './Server';
import { createStreamAdapter } from './Streamer';
import { preframe } from './codec';

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

const Stream = createStreamAdapter(new Server());
const stream = new Stream('notify-all');

function makeSubscription({ readyState = WebSocket.OPEN as number, connectionId = 'c1' } = {}) {
	const client = {
		meteorClient: false,
		ws: { readyState, close: jest.fn() },
		sendFrames: jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined),
	};
	const subscription = { client, connection: { id: connectionId }, stop: jest.fn() };

	return { eventName: 'event', subscription } as unknown as DDPSubscription & { subscription: typeof subscription };
}

describe('Stream adapter fan-out', () => {
	const message = '{"msg":"changed","collection":"stream-notify-all"}';
	let consoleError: jest.SpyInstance;
	let consoleWarn: jest.SpyInstance;

	beforeEach(() => {
		stream.retransmitToSelf = false;
		stream.allowEmit('all');
		consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
		consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
	});

	afterEach(() => {
		consoleError.mockRestore();
		consoleWarn.mockRestore();
	});

	it('frames the message once and writes it to every open subscriber', async () => {
		const first = makeSubscription();
		const second = makeSubscription({ connectionId: 'c2' });

		await stream.sendToManySubscriptions(new Set([first, second]), undefined, 'event', [], message);

		expect(first.subscription.client.sendFrames).toHaveBeenCalledWith(preframe(message));
		expect(second.subscription.client.sendFrames).toHaveBeenCalledWith(preframe(message));
		expect(first.subscription.client.sendFrames.mock.calls[0][0]).toBe(second.subscription.client.sendFrames.mock.calls[0][0]);
	});

	it('stops and closes a subscription whose socket is no longer open instead of writing to it', async () => {
		const closed = makeSubscription({ readyState: WebSocket.CLOSING });

		await stream.sendToManySubscriptions(new Set([closed]), undefined, 'event', [], message);

		expect(closed.subscription.stop).toHaveBeenCalledTimes(1);
		expect(closed.subscription.client.ws.close).toHaveBeenCalledTimes(1);
		expect(closed.subscription.client.sendFrames).not.toHaveBeenCalled();
	});

	it('skips the originating connection unless the stream retransmits to self', async () => {
		const origin = makeSubscription();
		const other = makeSubscription({ connectionId: 'c2' });

		await stream.sendToManySubscriptions(new Set([origin, other]), origin.subscription.connection, 'event', [], message);

		expect(origin.subscription.client.sendFrames).not.toHaveBeenCalled();
		expect(other.subscription.client.sendFrames).toHaveBeenCalledTimes(1);

		stream.retransmitToSelf = true;
		await stream.sendToManySubscriptions(new Set([origin]), origin.subscription.connection, 'event', [], message);

		expect(origin.subscription.client.sendFrames).toHaveBeenCalledTimes(1);
	});

	it('skips subscribers the emit rules deny', async () => {
		stream.allowEmit(async function (this: { connection: { id: string } }) {
			return this.connection.id === 'allowed';
		});
		const denied = makeSubscription();
		const allowed = makeSubscription({ connectionId: 'allowed' });

		await stream.sendToManySubscriptions(new Set([denied, allowed]), undefined, 'event', [], message);

		expect(denied.subscription.client.sendFrames).not.toHaveBeenCalled();
		expect(allowed.subscription.client.sendFrames).toHaveBeenCalledTimes(1);
	});

	describe('when the socket rejects the write', () => {
		const destroyed = Object.assign(new Error('write after destroy'), { code: 'ERR_STREAM_DESTROYED' });

		it('stops and closes a destroyed stream whose socket is no longer open', async () => {
			const failing = makeSubscription();
			failing.subscription.client.sendFrames.mockImplementation(async () => {
				failing.subscription.client.ws.readyState = WebSocket.CLOSED;
				throw destroyed;
			});

			await stream.sendToManySubscriptions(new Set([failing]), undefined, 'event', [], message);

			expect(consoleWarn).toHaveBeenCalledWith('Trying to send data to destroyed stream, closing connection.');
			expect(failing.subscription.stop).toHaveBeenCalledTimes(1);
			expect(failing.subscription.client.ws.close).toHaveBeenCalledTimes(1);
			expect(consoleError).toHaveBeenCalledWith('Error trying to send data to stream.', destroyed);
		});

		it('only logs a destroyed stream whose socket still reports open', async () => {
			const failing = makeSubscription();
			failing.subscription.client.sendFrames.mockRejectedValue(destroyed);

			await stream.sendToManySubscriptions(new Set([failing]), undefined, 'event', [], message);

			expect(consoleWarn).toHaveBeenCalledTimes(1);
			expect(failing.subscription.stop).not.toHaveBeenCalled();
			expect(failing.subscription.client.ws.close).not.toHaveBeenCalled();
		});

		it('logs any other error and carries on with the next subscriber', async () => {
			const failure = new Error('boom');
			const failing = makeSubscription();
			failing.subscription.client.sendFrames.mockRejectedValue(failure);
			const next = makeSubscription({ connectionId: 'c2' });

			await stream.sendToManySubscriptions(new Set([failing, next]), undefined, 'event', [], message);

			expect(consoleWarn).not.toHaveBeenCalled();
			expect(consoleError).toHaveBeenCalledWith('Error trying to send data to stream.', failure);
			expect(failing.subscription.stop).not.toHaveBeenCalled();
			expect(next.subscription.client.sendFrames).toHaveBeenCalledTimes(1);
		});
	});
});
