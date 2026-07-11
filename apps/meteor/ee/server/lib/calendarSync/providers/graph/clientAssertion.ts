import crypto from 'crypto';

import { CalendarSyncError } from '../../definition';

const base64url = (input: Buffer | string): string =>
	(typeof input === 'string' ? Buffer.from(input) : input).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

/** SHA-1 thumbprint (x5t) of the certificate, as Entra ID expects in the assertion header */
export function certificateThumbprint(certificatePem: string): string {
	const match = /-----BEGIN CERTIFICATE-----([A-Za-z0-9+/=\s]+)-----END CERTIFICATE-----/.exec(certificatePem);
	if (!match) {
		throw new CalendarSyncError('invalid-certificate', 'The configured value is not a PEM-encoded certificate');
	}
	const der = Buffer.from(match[1].replace(/\s+/g, ''), 'base64');
	return base64url(crypto.createHash('sha1').update(der).digest());
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
	const header = { alg: 'RS256', typ: 'JWT', x5t: certificateThumbprint(certificatePem) };
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
