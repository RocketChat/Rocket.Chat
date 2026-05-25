type DigestAuthHeader = {
	schema: 'Digest';
	realm: string;
	nonce: string;
	qop?: string[];
	opaque?: string;
	algorithm?: string;
};

export function parseDigestHeader(authHeader: string): DigestAuthHeader {
	if (!authHeader?.toLowerCase().startsWith('digest')) {
		throw new Error('Unsupported Auth Schema');
	}

	const realm = getValue(authHeader, 'realm');
	const nonce = getValue(authHeader, 'nonce');

	if (!realm || !nonce) {
		throw new Error('Failed to parse Digest Header');
	}

	const qop = getValue(authHeader, 'qop')
		?.split(',')
		.map((qop) => qop.trim());
	const algorithm = authHeader.match(/algorithm="?([^",\s]+)"?/)?.[1];
	const opaque = getValue(authHeader, 'opaque');

	return {
		schema: 'Digest',
		realm,
		nonce,
		...(qop?.length && { qop }),
		...(opaque && { opaque }),
		...(algorithm && { algorithm }),
	};
}

function getValue(authHeader: string, name: string): string | undefined {
	const regexp = new RegExp(`${name}="([^"]+)"`);
	return authHeader.match(regexp)?.[1];
}
