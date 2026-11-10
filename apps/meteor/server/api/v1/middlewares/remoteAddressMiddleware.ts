import type { IncomingMessage } from 'node:http';

import type { MiddlewareHandler } from 'hono';

type HttpBindings = {
	incoming: IncomingMessage;
};

const getHeader = (incoming: IncomingMessage, name: string): string | undefined => {
	const value = incoming.headers[name];
	return Array.isArray(value) ? value.join(', ') : value;
};

/**
 * The address of the client that sent `incoming`, trusting `HTTP_FORWARDED_COUNT` proxies in front of the server.
 */
export const getRemoteAddress = (incoming: IncomingMessage): string | undefined => {
	const forwardedFor = getHeader(incoming, 'x-forwarded-for');
	const socket = incoming.socket?.remoteAddress || incoming.connection?.remoteAddress;
	const remoteAddress = getHeader(incoming, 'x-real-ip') || socket;

	if (!socket) {
		return remoteAddress || forwardedFor;
	}

	const httpForwardedCount = parseInt(String(process.env.HTTP_FORWARDED_COUNT)) || 0;
	if (httpForwardedCount <= 0) {
		return remoteAddress;
	}

	if (!forwardedFor || typeof forwardedFor.valueOf() !== 'string') {
		return remoteAddress;
	}

	const forwardedForIPs = forwardedFor.split(',').map((ip) => ip.trim());
	if (httpForwardedCount > forwardedForIPs.length) {
		return remoteAddress;
	}
	return forwardedForIPs[forwardedForIPs.length - httpForwardedCount];
};

export const remoteAddressMiddleware: MiddlewareHandler = async function (c, next) {
	const bindings = (c.env?.server ? c.env.server : c.env) as HttpBindings;
	c.set('remoteAddress', getRemoteAddress(bindings.incoming));
	return next();
};
