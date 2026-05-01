import WebSocket from 'ws';

import { MAX_BUFFERED_BYTES, WS_ERRORS } from '../constants';
import { buildTextFrame, sendRawFrame } from './RawSender';

type FakeSender = { sendFrame: jest.Mock };

const makeWs = (overrides: Partial<{ readyState: number; bufferedAmount: number; sender: FakeSender }> = {}) => {
	const sender: FakeSender = overrides.sender ?? {
		sendFrame: jest.fn((_frame, cb: (err?: unknown) => void) => cb()),
	};
	return {
		readyState: overrides.readyState ?? WebSocket.OPEN,
		bufferedAmount: overrides.bufferedAmount ?? 0,
		_sender: sender,
		send: jest.fn((_payload, cb: (err?: unknown) => void) => cb()),
		close: jest.fn(),
	};
};

describe('buildTextFrame', () => {
	it('produces a non-empty buffer array for a JSON-like payload', () => {
		const frame = buildTextFrame('{"msg":"ping"}');
		expect(frame.length).toBeGreaterThan(0);
		expect(Buffer.concat(frame).length).toBeGreaterThan(0);
	});
});

describe('sendRawFrame', () => {
	const frame = buildTextFrame('hello');

	it('returns "closed" and does not send when the socket is not OPEN', async () => {
		const ws = makeWs({ readyState: WebSocket.CLOSED });
		const outcome = await sendRawFrame(ws as unknown as WebSocket, frame);
		expect(outcome).toBe('closed');
		expect(ws._sender.sendFrame).not.toHaveBeenCalled();
		expect(ws.send).not.toHaveBeenCalled();
	});

	it('closes the socket with code 1013 and returns "slow-consumer" when bufferedAmount is over the threshold', async () => {
		const ws = makeWs({ bufferedAmount: MAX_BUFFERED_BYTES + 1 });
		const outcome = await sendRawFrame(ws as unknown as WebSocket, frame);
		expect(outcome).toBe('slow-consumer');
		expect(ws.close).toHaveBeenCalledWith(WS_ERRORS.SLOW_CONSUMER, expect.any(String));
		expect(ws._sender.sendFrame).not.toHaveBeenCalled();
	});

	it('writes the frame via the private sender and returns "sent" on success', async () => {
		const ws = makeWs();
		const outcome = await sendRawFrame(ws as unknown as WebSocket, frame);
		expect(outcome).toBe('sent');
		expect(ws._sender.sendFrame).toHaveBeenCalledWith(frame, expect.any(Function));
	});

	it('falls back to ws.send when the private sender is unavailable', async () => {
		const ws = makeWs();
		// Simulate an unknown ws version that no longer exposes `_sender.sendFrame`.
		(ws as any)._sender = undefined;
		const outcome = await sendRawFrame(ws as unknown as WebSocket, frame);
		expect(outcome).toBe('sent');
		expect(ws.send).toHaveBeenCalled();
	});

	it('propagates send errors as "error"', async () => {
		const ws = makeWs({
			sender: { sendFrame: jest.fn((_frame, cb: (err?: unknown) => void) => cb(new Error('boom'))) },
		});
		const outcome = await sendRawFrame(ws as unknown as WebSocket, frame);
		expect(outcome).toBe('error');
	});
});
