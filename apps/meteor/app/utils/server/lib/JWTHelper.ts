import jsr from 'jsrsasign';

const HEADER = {
	typ: 'JWT',
	alg: 'HS256',
};

export const generateJWT = (payload: Record<string, any>, secret: string): string => {
	const tokenPayload = {
		iat: jsr.KJUR.jws.IntDate.get('now'),
		nbf: jsr.KJUR.jws.IntDate.get('now'),
		exp: jsr.KJUR.jws.IntDate.get('now + 1hour'),
		aud: 'RocketChat',
		context: payload,
	};

	const header = JSON.stringify(HEADER);

	return jsr.KJUR.jws.JWS.sign(HEADER.alg, header, JSON.stringify(tokenPayload), { rstr: secret });
};

export const isValidJWT = (jwt: string, secret: string): boolean => {
	try {
		return jsr.KJUR.jws.JWS.verify(jwt, secret, [HEADER.alg]);
	} catch (error) {
		return false;
	}
};
