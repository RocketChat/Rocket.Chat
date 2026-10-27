import { createPublicKey, verify } from 'node:crypto';

import { serverFetch as fetch } from '@rocket.chat/server-fetch';

type AppleJWK = {
	kty: string;
	kid: string;
	use: string;
	alg: string;
	n: string;
	e: string;
};

type AppleJWTPayload = {
	iss: string;
	sub: string;
	aud: string | string[];
	exp: number;
	iat: number;
	email?: string;
	email_verified?: string | boolean;
	is_private_email?: string | boolean;
};

const DEFAULT_APPLE_AUDIENCES = ['chat.rocket.ios'];

let cachedKeys: AppleJWK[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

async function getApplePublicKeys(forceRefresh = false): Promise<AppleJWK[]> {
	const now = Date.now();

	if (!forceRefresh && cachedKeys && now - lastFetchTime < CACHE_TTL_MS) {
		return cachedKeys;
	}

	try {
		const response = await fetch('https://appleid.apple.com/auth/keys', {
			method: 'GET',
			// SECURITY: Hardcoded URL, no SSRF protection needed
			ignoreSsrfValidation: true,
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch Apple keys: ${response.status} ${response.statusText}`);
		}

		const data = (await response.json()) as { keys: AppleJWK[] };
		cachedKeys = data.keys;
		lastFetchTime = now;

		return cachedKeys;
	} catch (error) {
		if (cachedKeys) {
			console.warn('Failed to refresh Apple public keys, using stale cache', error);
			return cachedKeys;
		}
		throw new Error('Could not retrieve Apple public keys', { cause: error });
	}
}

function decodeBase64Url(str: string): string {
	return Buffer.from(str, 'base64url').toString('utf8');
}

async function verifyAppleJWT(
	headerB64: string,
	payloadB64: string,
	signatureB64: string,
	clientId: string,
): Promise<AppleJWTPayload | null> {
	const header = JSON.parse(decodeBase64Url(headerB64));
	const payload = JSON.parse(decodeBase64Url(payloadB64)) as AppleJWTPayload;

	const nowInSeconds = Math.floor(Date.now() / 1000);

	if (payload.exp < nowInSeconds) {
		console.error('Apple JWT has expired');
		return null;
	}

	if (payload.iss !== 'https://appleid.apple.com') {
		console.error('Invalid issuer. Expected https://appleid.apple.com');
		return null;
	}

	const audArray = Array.isArray(payload.aud) ? payload.aud : [payload.aud];

	const configuredAudiences = clientId
		.split(',')
		.map((id) => id.trim())
		.filter(Boolean);

	const allowedAudiences = Array.from(new Set([...DEFAULT_APPLE_AUDIENCES, ...configuredAudiences]));

	const isAudienceValid = allowedAudiences.some((allowedAud) => audArray.includes(allowedAud));

	if (!isAudienceValid) {
		console.error(`Invalid audience. Expected one of: ${allowedAudiences.join(', ')}`);
		return null;
	}

	let applePublicKeys = await getApplePublicKeys();
	let keyData = applePublicKeys.find((k) => k.kid === header.kid);

	if (!keyData) {
		applePublicKeys = await getApplePublicKeys(true); // Force refresh
		keyData = applePublicKeys.find((k) => k.kid === header.kid);

		if (!keyData) {
			console.error('Matching Key ID (kid) not found in Apple JWKS');
			return null;
		}
	}

	try {
		const publicKey = createPublicKey({
			key: {
				kty: keyData.kty,
				n: keyData.n,
				e: keyData.e,
			},
			format: 'jwk',
		});

		const isSignatureValid = verify(
			'RSA-SHA256',
			Buffer.from(`${headerB64}.${payloadB64}`),
			publicKey,
			Buffer.from(signatureB64, 'base64url'),
		);

		return isSignatureValid ? payload : null;
	} catch (error) {
		console.error('Cryptographic signature verification failed:', error);
		return null;
	}
}

export async function handleIdentityToken(identityToken: string, clientId: string): Promise<Record<string, any>> {
	const parts = identityToken.split('.');

	if (parts.length !== 3) {
		throw new Error('Malformed identityToken: JWT must have 3 parts');
	}

	const [headerB64, payloadB64, signatureB64] = parts;

	const payload = await verifyAppleJWT(headerB64, payloadB64, signatureB64, clientId);

	if (!payload) {
		throw new Error('identityToken is not a valid Apple JWT or has expired');
	}

	if (!payload.sub) {
		throw new Error('Insufficient data: Missing subject (sub) in auth response token');
	}

	const serviceData = {
		id: payload.sub,
		...payload,
	};

	return serviceData;
}
