import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { KJUR } from 'jsrsasign';
import NodeRSA from 'node-rsa';

async function isValidAppleJWT(identityToken: string, header: any): Promise<boolean> {
	const request = await fetch('https://appleid.apple.com/auth/keys', { method: 'GET' });
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

export async function handleIdentityToken(identityToken: string): Promise<{ id: string; email: string; name: string }> {
	const decodedToken = KJUR.jws.JWS.parse(identityToken);

	if (!(await isValidAppleJWT(identityToken, decodedToken.headerObj))) {
		throw new Error('identityToken is not a valid JWT');
	}

	if (!decodedToken.payloadObj) {
		throw new Error('identityToken does not have a payload');
	}

	const { iss, sub, email } = decodedToken.payloadObj as any;
	if (!iss) {
		throw new Error('Insufficient data in auth response token');
	}

	const serviceData = {
		id: sub,
		email,
		name: '',
	};

	return serviceData;
}
