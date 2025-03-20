import { SignJWT, importPKCS8, jwtVerify, importSPKI, generateKeyPair, exportSPKI, exportPKCS8 } from 'jose';
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

export async function getPairs(): Promise<[string, string]> {
	if (process.env.NODE_ENV !== 'test') {
		throw new Error('This function should only be used in tests');
	}
	const { publicKey, privateKey } = await generateKeyPair('RS256');
	const spki = await exportSPKI(publicKey);
	const pkcs8 = await exportPKCS8(privateKey);

	return [spki, pkcs8];
}
