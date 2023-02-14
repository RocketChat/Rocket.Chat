import { jws } from 'jsrsasign';

const HEADER = {
	typ: 'JWT',
	alg: 'HS256',
};

export const generateJWT = (payload, secret) => {
	const tokenPayload = {
		iat: jws.IntDate.get('now'),
		nbf: jws.IntDate.get('now'),
		exp: jws.IntDate.get('now + 1hour'),
		aud: 'RocketChat',
		context: payload,
	};

	const header = JSON.stringify(HEADER);

	return jws.JWS.sign(HEADER.alg, header, JSON.stringify(tokenPayload), { rstr: secret });
};

export const isValidJWT = (jwt, secret) => {
	try {
		return jws.JWS.verify(jwt, secret, HEADER);
	} catch (error) {
		return false;
	}
};
