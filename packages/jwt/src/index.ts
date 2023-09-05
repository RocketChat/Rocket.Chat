import { SignJWT, importPKCS8, jwtVerify, importSPKI } from 'jose';
import type { JWTPayload } from 'jose';

export async function sign(keyObject: object, pkcs8: string, alg = 'RS256') {
	const privateKey = await importPKCS8(pkcs8, alg);

	const token = await new SignJWT(keyObject as JWTPayload).setProtectedHeader({ alg, typ: 'JWT' }).sign(privateKey);

	return token;
}

export async function verify(jwt: string, spki: string, alg = 'RS256') {
	const publicKey = await importSPKI(spki, alg);

	const { payload, protectedHeader } = await jwtVerify(jwt, publicKey, {});

	return [payload, protectedHeader];
}
