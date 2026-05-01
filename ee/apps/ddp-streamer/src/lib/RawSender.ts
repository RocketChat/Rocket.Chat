import WebSocket from 'ws';

import { MAX_BUFFERED_BYTES, WS_ERRORS, WS_ERRORS_MESSAGES } from '../constants';

// Pre-built text frame options used for fan-out. We always send a single fragment, no
// compression, no masking (server-side), and the buffer is treated as the payload.
const TEXT_FRAME_OPTIONS = {
	fin: true,
	rsv1: false,
	opcode: 1,
	mask: false,
	readOnly: false,
} as const;

// `ws@8.x` exposes `_sender.sendFrame` as the lowest-cost path for fan-out: we build the
// frame once for the whole subscription set and write it directly to each socket. This is a
// private API, so it stays encapsulated here so the rest of the codebase doesn't have to
// reach into `ws` internals.
type WsWithSender = WebSocket & {
	_sender: { sendFrame: (frame: Buffer | Buffer[], cb?: (err: unknown) => void) => void };
};

/**
 * Build a pre-encoded WebSocket text frame from a UTF-8 payload. The result can be passed to
 * `RawSender.send` repeatedly — once per subscriber — without re-paying the cost of frame
 * construction.
 */
export function buildTextFrame(payload: string | Buffer): Buffer[] {
	const buf = typeof payload === 'string' ? Buffer.from(payload) : payload;
	return WebSocket.Sender.frame(buf, TEXT_FRAME_OPTIONS);
}

export type SendOutcome = 'sent' | 'closed' | 'slow-consumer' | 'error';

/**
 * Send a pre-built frame to a single WebSocket. Returns the outcome so callers can update
 * metrics or remove the subscription set entry.
 *
 * Behavior:
 * - If the socket is not OPEN, returns `closed` and asks the caller to clean up.
 * - If the socket's send buffer is past `MAX_BUFFERED_BYTES`, the socket is closed with
 *   1013 (Try Again Later) and `slow-consumer` is returned. We choose dropping the frame
 *   over inflating the streamer pod's heap.
 * - On success, returns `sent`.
 */
export function sendRawFrame(ws: WebSocket, frame: Buffer[]): Promise<SendOutcome> {
	if (ws.readyState !== WebSocket.OPEN) {
		return Promise.resolve('closed');
	}

	if (ws.bufferedAmount > MAX_BUFFERED_BYTES) {
		try {
			ws.close(WS_ERRORS.SLOW_CONSUMER, WS_ERRORS_MESSAGES.SLOW_CONSUMER);
		} catch {
			// already closing — ignore
		}
		return Promise.resolve('slow-consumer');
	}

	const sender = (ws as WsWithSender)._sender;
	if (!sender?.sendFrame) {
		// `ws` removed or renamed the private API — fall back to the public path.
		return new Promise<SendOutcome>((resolve) => {
			ws.send(frame, (err) => {
				if (err) {
					resolve('error');
					return;
				}
				resolve('sent');
			});
		});
	}

	return new Promise<SendOutcome>((resolve) => {
		sender.sendFrame(frame, (err) => {
			if (err) {
				resolve('error');
				return;
			}
			resolve('sent');
		});
	});
}
