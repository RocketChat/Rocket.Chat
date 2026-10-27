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

httpServer.setTimeout(IDLE_SOCKET_TIMEOUT_MS);
httpServer.on('request', WebApp._timeoutAdjustmentRequestCallback);

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

httpServer.on('upgrade', (req, socket, head) => {
	WebApp.httpServer.emit('upgrade', req, socket, head);
});

WebApp.startListening = (_meteorHttpServer, listenOptions, cb) => {
	httpServer.listen(listenOptions, cb);
};
