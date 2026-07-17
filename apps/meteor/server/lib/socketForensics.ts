import type { Server, ServerResponse } from 'http';
import { Socket } from 'net';

const log = (event: string, data: Record<string, unknown>): void => {
	console.error(`[socket-forensics] ${event}`, JSON.stringify({ time: new Date().toISOString(), ...data }));
};

const isInFlight = (res: ServerResponse): boolean => res.headersSent && !res.writableFinished;

const responseOf = (socket: Socket): ServerResponse | undefined => (socket as unknown as { _httpMessage?: ServerResponse })._httpMessage;

const connectedAt = new WeakMap<Socket, number>();

const ageOf = (socket: Socket): number | undefined => {
	const start = connectedAt.get(socket);
	return start === undefined ? undefined : Date.now() - start;
};

export const attachSocketForensics = (server: Server): void => {
	server.on('connection', (socket) => {
		connectedAt.set(socket, Date.now());

		socket.on('timeout', () => {
			if (socket.bytesWritten === 0) {
				return;
			}
			const res = responseOf(socket);
			log('socket-timeout', {
				ageMs: ageOf(socket),
				bytesWritten: socket.bytesWritten,
				pendingBytes: socket.writableLength,
				inFlightUrl: res && isInFlight(res) ? res.req?.url : undefined,
			});
		});
	});

	server.on('request', (req, res) => {
		res.on('error', (error: Error) => {
			log('response-error', { method: req.method, url: req.url, message: error.message, stack: error.stack });
		});

		res.on('close', () => {
			if (!isInFlight(res)) {
				return;
			}
			log('response-truncated', {
				method: req.method,
				url: req.url,
				statusCode: res.statusCode,
				bytesWritten: res.socket?.bytesWritten,
				pendingBytes: res.socket?.writableLength,
				ageMs: res.socket ? ageOf(res.socket) : undefined,
				requestDestroyed: req.destroyed,
			});
		});
	});
};

const patchInFlightTeardown = (method: 'end' | 'destroy'): (() => void) => {
	const original = Socket.prototype[method];

	Socket.prototype[method] = function (this: Socket, ...args: unknown[]) {
		const res = responseOf(this);
		if (res && isInFlight(res)) {
			log(`socket-${method}-mid-response`, {
				method: res.req?.method,
				url: res.req?.url,
				statusCode: res.statusCode,
				bytesWritten: this.bytesWritten,
				pendingBytes: this.writableLength,
				ageMs: ageOf(this),
				error: args[0] instanceof Error ? { message: args[0].message, stack: args[0].stack } : undefined,
				callerStack: new Error(`${method} call site`).stack,
			});
		}
		return (original as (...a: unknown[]) => unknown).apply(this, args);
	} as never;

	return () => {
		Socket.prototype[method] = original as never;
	};
};

export const patchSocketDestroy = (): (() => void) => patchInFlightTeardown('destroy');

export const patchSocketEnd = (): (() => void) => patchInFlightTeardown('end');
