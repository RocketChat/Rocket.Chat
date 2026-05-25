import { randomBytes } from 'node:crypto';

import { getHashAlgorithm } from './algorithms';
import { parseDigestHeader } from './parseDigestHeader';
import { logger } from '../logger';

export function buildDigestResponse({
	uri,
	method,
	username,
	password,
	authHeader,
}: {
	uri: string;
	method: string;
	username: string;
	password: string;
	authHeader: string;
}): string {
	const { realm, nonce, qop: qops, opaque, algorithm = 'MD5' } = parseDigestHeader(authHeader);

	const qop = qops?.includes('auth') ? 'auth' : qops?.[0];

	const hashFn = getHashAlgorithm(algorithm);
	if (!hashFn) {
		logger.warn({ msg: 'Digest Auth Algorithm not supported', algorithm });
		throw new Error('Algorithm not supported');
	}

	if (qop && qop !== 'auth') {
		logger.warn({ msg: 'Unsupported qop', qop });
		throw new Error('Qop not supported');
	}

	// We don't do multiple auth attempts for the same request, so we don't need to keep track of cnonce usage
	const nc = '00000001';
	const cnonce = randomBytes(8).toString('hex');

	const userHash = hashFn(`${username}:${realm}:${password}`);
	const ha1 = algorithm.endsWith('-sess') ? hashFn(`${userHash}:${nonce}:${cnonce}`) : userHash;
	const ha2 = hashFn(`${method}:${uri}`);

	const responseString = qop ? `${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}` : `${ha1}:${nonce}:${ha2}`;
	const response = hashFn(responseString);

	const quote = (value?: string): string => (value ? `"${value}"` : '');

	const values = Object.entries({
		username: quote(username),
		realm: quote(realm),
		nonce: quote(nonce),
		uri: quote(uri),
		algorithm,
		...(qop && {
			qop,
			nc,
			cnonce: quote(cnonce),
		}),
		response: quote(response),
		opaque: quote(opaque),
	});

	const digestValues = values
		.map(([key, value]) => (value ? `${key}=${value}` : ''))
		.filter(Boolean)
		.join(', ');

	return `Digest ${digestValues}`;
}
