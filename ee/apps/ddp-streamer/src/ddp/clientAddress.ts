import type { IncomingMessage } from 'http';

/**
 * Address of the client as reported by the nearest proxy we trust. Leading `x-forwarded-for` entries are
 * client-controlled, so the trusted one is `HTTP_FORWARDED_COUNT` hops from the end; with no configured hops the
 * socket address is used. Undefined when the header has fewer hops than configured.
 */
export const getClientAddress = (req: IncomingMessage): string | undefined => {
	const httpForwardedCount = parseInt(process.env.HTTP_FORWARDED_COUNT || '') || 0;

	if (httpForwardedCount === 0) {
		return req.socket.remoteAddress;
	}

	const forwardedFor =
		(req.headers['x-forwarded-for'] && Array.isArray(req.headers['x-forwarded-for'])
			? req.headers['x-forwarded-for'][0]
			: req.headers['x-forwarded-for']) || '';
	if (!forwardedFor) {
		return;
	}
	const forwardedForClean = forwardedFor
		.trim()
		.split(',')
		.map((ip) => ip.trim());

	if (httpForwardedCount < 0 || httpForwardedCount > forwardedForClean.length) {
		return;
	}

	return forwardedForClean[forwardedForClean.length - httpForwardedCount];
};
