import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';

import { RESPONSE_ALREADY_SENT, createMiddlewareSlot, createNodeServer, createRootApp } from '@rocket.chat/http-router';
import { WebApp } from 'meteor/webapp';

const IDLE_SOCKET_TIMEOUT_MS = 5_000;

/**
 * The root of every HTTP route the server answers. Requests no route claims are handed, untouched, to Meteor's webapp.
 */
export const httpApp = createRootApp();

const baseMiddlewares = createMiddlewareSlot();
httpApp.use(baseMiddlewares.middleware);

/**
 * Adds middlewares that run ahead of every route, including the routes registered before them.
 */
export const addBaseMiddlewares = baseMiddlewares.add;

httpApp.notFound((c) => {
	WebApp.httpServer.emit('request', c.env.incoming, c.env.outgoing);
	return RESPONSE_ALREADY_SENT;
});

/**
 * The server that owns the listening socket. Meteor still builds its own, but it never listens.
 */
export const httpServer = createNodeServer(httpApp);

// CI sets it above its proxy's idle timeout, so the proxy closes keep-alive connections before the server does (PR #41399)
const socketTimeout = parseInt(process.env.HTTP_SOCKET_TIMEOUT_MS ?? '', 10);
if (socketTimeout > 0) {
	httpServer.setTimeout(socketTimeout);
	httpServer.keepAliveTimeout = socketTimeout;
	httpServer.headersTimeout = socketTimeout + 1000;
} else {
	httpServer.setTimeout(IDLE_SOCKET_TIMEOUT_MS);
	httpServer.on('request', WebApp._timeoutAdjustmentRequestCallback);
}

// lets a load balancer tell a malformed request apart from a server dropping connections
httpServer.on('clientError', (err: NodeJS.ErrnoException, socket) => {
	if (socket.destroyed) {
		return;
	}
	if (err.message === 'Parse Error') {
		socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
		return;
	}
	socket.destroy(err);
});

type UpgradeHandler = (req: IncomingMessage, socket: Duplex, head: Buffer) => boolean;

const upgradeHandlers: UpgradeHandler[] = [];

/**
 * Lets `handler` take over protocol upgrades: it returns `true` for the ones it serves. The rest go to Meteor.
 */
export const addUpgradeHandler = (handler: UpgradeHandler): void => {
	upgradeHandlers.push(handler);
};

httpServer.on('upgrade', (req, socket, head) => {
	if (upgradeHandlers.some((handler) => handler(req, socket, head))) {
		return;
	}
	WebApp.httpServer.emit('upgrade', req, socket, head);
});

WebApp.startListening = (_meteorHttpServer, listenOptions, cb) => {
	httpServer.listen(listenOptions, cb);
};
