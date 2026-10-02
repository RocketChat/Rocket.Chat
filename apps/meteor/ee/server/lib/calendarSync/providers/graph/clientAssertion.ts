import crypto from 'crypto';

import { CalendarSyncError } from '../../definition';

const base64url = (input: Buffer | string): string =>
	(typeof input === 'string' ? Buffer.from(input) : input).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

const certificateDer = (certificatePem: string): Buffer => {
	const match = /-----BEGIN CERTIFICATE-----([A-Za-z0-9+/=\s]+)-----END CERTIFICATE-----/.exec(certificatePem);
	if (!match) {
		throw new CalendarSyncError('invalid-certificate', 'The configured value is not a PEM-encoded certificate');
	}

	return Buffer.from(match[1].replace(/\s+/g, ''), 'base64');
};

/** SHA-256 thumbprint (x5t#S256) of the certificate */
export function certificateThumbprintSha256(certificatePem: string): string {
	return base64url(crypto.createHash('sha256').update(certificateDer(certificatePem)).digest());
}

/**
 * Builds the signed JWT (client_assertion) for the OAuth 2.0 client credentials
 * flow with a certificate credential, per the Microsoft identity platform
 * certificate-credentials spec. RS256 over the app's private key; the private
 * key never leaves the process.
 */
export function buildClientAssertion({
	clientId,
	tokenUrl,
	certificatePem,
	privateKeyPem,
	now = Date.now(),
	jti = crypto.randomUUID(),
}: {
	clientId: string;
	tokenUrl: string;
	certificatePem: string;
	privateKeyPem: string;
	now?: number;
	jti?: string;
}): string {
	const header = {
		'alg': 'RS256',
		'typ': 'JWT',
		'x5t#S256': certificateThumbprintSha256(certificatePem),
	};
	const nowSeconds = Math.floor(now / 1000);
	const payload = {
		aud: tokenUrl,
		iss: clientId,
		sub: clientId,
		jti,
		nbf: nowSeconds - 60,
		iat: nowSeconds,
		exp: nowSeconds + 10 * 60,
	};

	const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;

	let signature: Buffer;
	try {
		signature = crypto.createSign('RSA-SHA256').update(signingInput).sign(privateKeyPem);
	} catch (error) {
		throw new CalendarSyncError('invalid-private-key', `Unable to sign the client assertion: ${(error as Error).message}`);
	}

	return `${signingInput}.${base64url(signature)}`;
}
