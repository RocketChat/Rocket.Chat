import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { KJUR } from 'jsrsasign';
import NodeRSA from 'node-rsa';

async function isValidAppleJWT(identityToken: string, header: any): Promise<boolean> {
	const request = await fetch('https://appleid.apple.com/auth/keys', {
		method: 'GET',
		// SECURITY: Hardcoded URL, no SSRF protection needed
		ignoreSsrfValidation: true,
	});
	const applePublicKeys = ((await request.json()) as { keys: { kid: string; e: string; n: string }[] }).keys;
	const { kid } = header;

	const key = applePublicKeys.find((k: any) => k.kid === kid);
	if (!key) {
		return false;
	}

	const pubKey = new NodeRSA();
	pubKey.importKey({ n: Buffer.from(key.n, 'base64'), e: Buffer.from(key.e, 'base64') }, 'components-public');
	const userKey = pubKey.exportKey('public');

	try {
		return KJUR.jws.JWS.verify(identityToken, userKey, ['RS256']);
	} catch {
		return false;
	}
}

export async function handlePassportIdentityToken(identityToken: string): Promise<Record<string, any>> {
	const decodedToken = KJUR.jws.JWS.parse(identityToken);

	if (!(await isValidAppleJWT(identityToken, decodedToken.headerObj))) {
		throw new Error('identityToken is not a valid JWT');
	}

	if (!decodedToken.payloadObj) {
		throw new Error('identityToken does not have a payload');
	}

	const { iss, sub, exp } = decodedToken.payloadObj as any;

	if (iss !== 'https://appleid.apple.com') {
		throw new Error('Invalid token issuer');
	}

	if (exp && exp < Math.floor(Date.now() / 1000)) {
		throw new Error('identityToken has expired');
	}

	const serviceData = {
		id: sub,
		...decodedToken.payloadObj,
	};

	return serviceData;
}
