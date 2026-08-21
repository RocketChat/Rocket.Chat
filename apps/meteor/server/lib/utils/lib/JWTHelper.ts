import jsr from 'jsrsasign';

const HEADER = {
	typ: 'JWT',
	alg: 'HS256',
};

export const generateJWT = (payload: Record<string, any>, secret: string, options?: { aud?: string }): string => {
	const tokenPayload = {
		iat: jsr.KJUR.jws.IntDate.get('now'),
		nbf: jsr.KJUR.jws.IntDate.get('now'),
		exp: jsr.KJUR.jws.IntDate.get('now + 1hour'),
		aud: options?.aud || 'RocketChat',
		context: payload,
	};

	const header = JSON.stringify(HEADER);

	return jsr.KJUR.jws.JWS.sign(HEADER.alg, header, JSON.stringify(tokenPayload), { rstr: secret });
};

export const validateAndDecodeJWT = (jwt: string, secret: string, options?: { aud?: string }): Record<string, any> | null => {
	if (!jwt || !secret) {
		return null;
	}
	try {
		const isSignatureValid = jsr.KJUR.jws.JWS.verify(jwt, secret, [HEADER.alg]);
		if (!isSignatureValid) {
			return null;
		}

		const decoded = jsr.KJUR.jws.JWS.parse(jwt);
		if (!decoded?.payloadObj) {
			return null;
		}

		const payload = decoded.payloadObj as Record<string, any>;

		const now = Math.floor(Date.now() / 1000);
		if (typeof payload.exp === 'number' && now >= payload.exp) {
			return null;
		}

		if (typeof payload.nbf === 'number' && now < payload.nbf) {
			return null;
		}

		if (payload.aud !== (options?.aud || 'RocketChat')) {
			return null;
		}

		return payload.context || null;
	} catch (error) {
		return null;
	}
};
