import type { IncomingMessage } from 'http';

// TODO why localhost not as 127.0.0.1?
// based on Meteor's implementation (link)
export const getClientAddress = (req: IncomingMessage): string | undefined => {
	// For the reported client address for a connection to be correct,
	// the developer must set the HTTP_FORWARDED_COUNT environment
	// variable to an integer representing the number of hops they
	// expect in the `x-forwarded-for` header. E.g., set to "1" if the
	// server is behind one proxy.
	//
	// This could be computed once at startup instead of every time.
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

	// Typically the first value in the `x-forwarded-for` header is
	// the original IP address of the client connecting to the first
	// proxy.  However, the end user can easily spoof the header, in
	// which case the first value(s) will be the fake IP address from
	// the user pretending to be a proxy reporting the original IP
	// address value.  By counting HTTP_FORWARDED_COUNT back from the
	// end of the list, we ensure that we get the IP address being
	// reported by *our* first proxy.

	if (httpForwardedCount < 0 || httpForwardedCount > forwardedForClean.length) {
		return;
	}

	return forwardedForClean[forwardedForClean.length - httpForwardedCount];
};
