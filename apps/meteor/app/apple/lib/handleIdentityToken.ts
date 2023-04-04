import { KJUR } from 'jsrsasign';
import { HTTP } from 'meteor/http';
import NodeRSA from 'node-rsa';

function isValidAppleJWT(identityToken: string, header: any): boolean {
	const applePublicKeys = HTTP.get('https://appleid.apple.com/auth/keys').data.keys as any;
	const { kid } = header;

	const key = applePublicKeys.find((k: any) => k.kid === kid);

	const pubKey = new NodeRSA();
	pubKey.importKey({ n: Buffer.from(key.n, 'base64'), e: Buffer.from(key.e, 'base64') }, 'components-public');
	const userKey = pubKey.exportKey('public');

	try {
		return KJUR.jws.JWS.verify(identityToken, userKey, ['RS256']);
	} catch {
		return false;
	}
}

export function handleIdentityToken(identityToken: string): { id: string; email: string; name: string } {
	const decodedToken = KJUR.jws.JWS.parse(identityToken);

	if (!isValidAppleJWT(identityToken, decodedToken.headerObj)) {
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
