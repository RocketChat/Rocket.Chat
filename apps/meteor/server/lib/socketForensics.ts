import type { Server, ServerResponse } from 'http';
import { Socket } from 'net';

const log = (event: string, data: Record<string, unknown>): void => {
	console.error(`[socket-forensics] ${event}`, JSON.stringify(data));
};

const isInFlight = (res: ServerResponse): boolean => res.headersSent && !res.writableFinished;

export const attachSocketForensics = (server: Server): void => {
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
				requestDestroyed: req.destroyed,
			});
		});
	});
};

export const patchSocketDestroy = (): (() => void) => {
	const originalDestroy = Socket.prototype.destroy;

	Socket.prototype.destroy = function (this: Socket, error?: Error) {
		const res = (this as unknown as { _httpMessage?: ServerResponse })._httpMessage;
		if (res && isInFlight(res)) {
			log('socket-destroyed-mid-response', {
				method: res.req?.method,
				url: res.req?.url,
				statusCode: res.statusCode,
				bytesWritten: this.bytesWritten,
				error: error && { message: error.message, stack: error.stack },
				destroyerStack: new Error('destroy call site').stack,
			});
		}
		return originalDestroy.call(this, error);
	} as typeof Socket.prototype.destroy;

	return () => {
		Socket.prototype.destroy = originalDestroy;
	};
};
