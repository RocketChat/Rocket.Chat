import jsr from 'jsrsasign';

const HEADER = {
	typ: 'JWT',
	alg: 'HS256',
};

export const generateJWT = (payload: Record<string, any>, secret: string, expiresIn = 3600): string => {
	const now = jsr.KJUR.jws.IntDate.getNow();
	const tokenPayload = {
		iat: now,
		nbf: now,
		exp: now + expiresIn,
		aud: 'RocketChat',
		context: payload,
	};

	const header = JSON.stringify(HEADER);

	return jsr.KJUR.jws.JWS.sign(HEADER.alg, header, JSON.stringify(tokenPayload), { rstr: secret });
};

export const isValidJWT = (jwt: string, secret: string): boolean => {
	try {
		return jsr.KJUR.jws.JWS.verify(jwt, secret, [HEADER.alg]);
	} catch {
		return false;
	}
};

export const extractValidJWTPayload = (jwt: string, secret: string): Record<string, any> | null => {
	try {
		if (!isValidJWT(jwt, secret)) {
			return null;
		}

		const payload = jsr.KJUR.jws.JWS.readSafeJSONString(jsr.b64utoutf8(jwt.split('.')[1]));
		return payload;
	} catch {
		return null;
	}
};
